/**
 * A track's device chain, as an audio graph.
 *
 * The timeline's playback is hand-scheduled `AudioBufferSourceNode`s on a
 * plain `AudioContext` — see `story-timeline.tsx` — and that stays true. Tone
 * is used here only for the factory devices themselves, because a compressor,
 * a gate and a lookahead limiter are real DSP that is not worth re-deriving,
 * and Tone's are already written against the same Web Audio primitives. Tone
 * has no autotune, so that one is assembled here out of its pitch shifter and
 * an analyser — see `createAutotune`. Its Transport is deliberately never
 * touched: this file schedules nothing, it just builds a chain and lets
 * someone else push audio through it.
 *
 * The seam is `LaneChain.input`, a native `GainNode`. Clips connect to it and
 * never learn what is inside, which is what lets a device be added or removed
 * mid-playback without re-scheduling a single source.
 *
 * Signal flow per lane:
 *
 *     clip gain ─┐
 *     clip gain ─┼─▶ input ─▶ [device] ─▶ [device] ─▶ lane fader ─▶ out
 *     clip gain ─┘
 *
 * Devices sit *before* the fader, as inserts do everywhere else: a gate should
 * hear the take, not your monitoring level.
 */

import * as Tone from "tone";

import { DEVICES } from "@/lib/devices";
import type { DeviceSpec } from "@/lib/devices";
import { detectPitch, hzToMidi, snapToScale } from "@/lib/pitch";

/**
 * How long a dial has to stop moving before an expensive parameter is written.
 *
 * Long enough that a sweep costs one rebuild instead of sixty, short enough
 * that letting go and listening feels immediate. The card's own reading
 * updates on every frame regardless — only the audio waits.
 */
const SETTLE_MS = 180;

/**
 * Samples the autotune device measures at a time.
 *
 * A power of two because the analyser insists, and this one because the
 * detector needs a couple of periods of the lowest note it claims to find:
 * 2048 frames is ~43 ms at 48 kHz, which covers a low male voice with room to
 * spare. Larger would track a bass better and lag the correction behind the
 * syllable; smaller loses the bottom of the range entirely.
 */
const ANALYSIS_SIZE = 2048;

/**
 * How far the autotune's correction has to move before it is written to the
 * pitch shifter, in semitones.
 *
 * One cent — comfortably under what anyone can hear, so nothing musical is
 * lost by holding still, and enough to stop a steady note rewriting the same
 * value forever. See the write site for why that rewrite is not free.
 */
const PITCH_WRITE_DEADBAND = 0.01;

/** Anything Tone gives us back. Its parameter objects are structurally alike
 *  enough that one setter covers every device; the cast is contained to
 *  `setParam` rather than spread over a per-device switch. */
type ToneNode = Tone.ToneAudioNode;

function createDevice(spec: DeviceSpec): ToneNode {
  const p = spec.params;
  switch (spec.kind) {
    case "compressor":
      return new Tone.Compressor({
        threshold: p.threshold,
        ratio: p.ratio,
        attack: p.attack,
        release: p.release,
      });
    case "eq":
      return new Tone.EQ3({
        low: p.low,
        mid: p.mid,
        high: p.high,
        lowFrequency: p.lowFrequency,
        highFrequency: p.highFrequency,
      });
    case "reverb":
      return new Tone.Reverb({ decay: p.decay, preDelay: p.preDelay, wet: p.wet });
    case "delay":
      return new Tone.FeedbackDelay({
        delayTime: p.delayTime,
        feedback: p.feedback,
        wet: p.wet,
      });
    case "distortion":
      // Oversampling is not a knob: without it the curve aliases audibly, and
      // nobody has ever wanted the aliased version on purpose.
      return new Tone.Distortion({ distortion: p.distortion, wet: p.wet, oversample: "2x" });
    case "gate":
      return new Tone.Gate({ threshold: p.threshold, smoothing: p.smoothing });
    case "limiter":
      return new Tone.Limiter({ threshold: p.threshold });
    case "autotune":
      return createAutotune(p);
  }
}

/**
 * The one device here that is a control loop rather than a node.
 *
 * Tone has no autotune, and there is no single Web Audio node that is one: the
 * effect is a measurement feeding a correction. So this reads the signal
 * arriving at a `PitchShift`, works out how far the sung note is from the
 * nearest note of the chosen scale, and writes that distance onto the
 * shifter's `pitch` — sixty times a second, off the same clock as the screen.
 *
 * Two things follow from that, and both are why this function exists instead
 * of another line in the switch above:
 *
 * - **It is analysed pre-shift, not post.** Tapping the output would mean
 *   measuring audio this loop has already corrected and correcting it again,
 *   which is a feedback controller with no damping — it oscillates. The tap is
 *   on `input`, so the loop always sees what the singer actually did.
 * - **Its parameters live on the node as plain numbers.** `setParam` writes
 *   any numeric property straight through, so key/scale/retune/amount are read
 *   fresh inside the loop on every frame, and turning a dial mid-phrase is
 *   heard immediately without rebuilding the chain.
 *
 * The correction itself is granular pitch shifting, so pushed hard it has the
 * artefacts granular pitch shifting has. That is the same reason the famous
 * version of this effect sounds the way it does.
 */
function createAutotune(p: Record<string, number>): ToneNode {
  const shifter = new Tone.PitchShift({
    pitch: 0,
    // Short enough that correction lands within a syllable rather than after
    // it; long enough to have a low fundamental's period to work with.
    windowSize: 0.1,
  });
  const holder = shifter as unknown as Record<string, number>;
  holder.tuneKey = p.tuneKey ?? 0;
  holder.scale = p.scale ?? 0;
  holder.retune = p.retune ?? 0.08;
  holder.amount = p.amount ?? 1;

  const raw = Tone.getContext().rawContext as unknown as BaseAudioContext;
  const sampleRate = raw.sampleRate;

  // The analysis clock is the *audio* clock, not the display's.
  //
  // `requestAnimationFrame` is the obvious way to run a control loop and the
  // wrong one here: browsers stop serving frames to a page that is hidden,
  // minimised, or in a background tab, and audio keeps playing throughout. An
  // rAF-driven autotune therefore stops correcting the moment you look at
  // another window and silently resumes when you come back — the take renders
  // differently depending on whether anyone was watching.
  //
  // A ScriptProcessorNode is pulled by the graph itself, so it runs whenever
  // audio does. It is deprecated in favour of AudioWorklet, which would want a
  // separate module file loaded over `addModule` and a second copy of the
  // detector living inside it; that is a real cost for a node whose callback
  // does a few thousand multiply-adds. Worth revisiting if the detector grows.
  const processor = raw.createScriptProcessor(ANALYSIS_SIZE, 1, 1);
  // ScriptProcessors only fire while something downstream is pulling them, so
  // it needs a path to the destination — silenced, because this tap exists to
  // measure the signal rather than to contribute any of it.
  const sink = raw.createGain();
  sink.gain.value = 0;
  Tone.connect(shifter.input, processor);
  processor.connect(sink);
  sink.connect(raw.destination);

  /** The correction currently applied, in semitones. Kept here rather than
   *  read back off `shifter.pitch` so the smoothing is against what this loop
   *  last intended, not against a value something else may have written. */
  let applied = 0;
  /** What was last actually written to the shifter — see the deadband below. */
  let written = 0;
  // Exact, because the block size and sample rate are both known — no clock
  // deltas to measure and no frame to be late.
  const dt = ANALYSIS_SIZE / sampleRate;

  processor.onaudioprocess = (event: AudioProcessingEvent): void => {
    const hz = detectPitch(event.inputBuffer.getChannelData(0), sampleRate);
    // No note — a rest, or a consonant. Ease the correction out rather than
    // dropping it, so the shifter is already at rest for the next attack
    // instead of snapping to zero under a note that is still ringing.
    const target =
      hz === null
        ? 0
        : clampSemitones(
            (snapToScale(hzToMidi(hz), Math.round(holder.tuneKey), Math.round(holder.scale)) -
              hzToMidi(hz)) *
              holder.amount,
          );

    // One-pole glide toward the target. `retune` is the time constant, so the
    // dial reads as "how long until the note arrives" — and at zero the note
    // is simply there, which is the hard setting people reach for this device
    // to get.
    applied =
      holder.retune <= 0 ? target : applied + (target - applied) * (1 - Math.exp(-dt / holder.retune));

    // Write only when the correction has actually moved.
    //
    // `PitchShift.pitch` looks like a parameter and is a setter: assigning it
    // recomputes the grain rate and rewrites the two LFOs driving the delay
    // lines. Doing that on every block — even assigning the *same* value —
    // keeps restarting the granular scheduler, and the output drifts flat by
    // tens of cents while the loop is convinced it asked for nothing. A note
    // that is already in tune must cost zero writes, not a write of zero.
    if (Math.abs(applied - written) >= PITCH_WRITE_DEADBAND) {
      written = applied;
      shifter.pitch = applied;
    }
  };

  // Wrapping `dispose` rather than teaching the chain about analysis taps:
  // teardown already calls it on every device, and a processor left connected
  // to the destination would go on firing — and writing to a disposed shifter
  // — for the life of the context.
  const disposeShifter = shifter.dispose.bind(shifter);
  shifter.dispose = () => {
    processor.onaudioprocess = null;
    try {
      processor.disconnect();
      sink.disconnect();
    } catch {
      /* went with the context */
    }
    return disposeShifter();
  };

  return shifter;
}

/** Kept well inside `PitchShift`'s usable range: past an octave the grains
 *  are audible as a warble whatever the source, and a correction that large
 *  means the detector was wrong rather than the singer. */
function clampSemitones(semitones: number): number {
  return Math.max(-12, Math.min(12, semitones));
}

/**
 * Write one parameter onto a live device.
 *
 * Tone exposes three shapes for what a card calls "a knob": an `AudioParam`
 * wrapper with `.value`, a signal with the same interface, and a plain number
 * property whose setter rebuilds something internally (`Reverb.decay`
 * regenerates its impulse response). Ramping is used where it is available
 * because setting a live gain or threshold instantly clicks; the plain
 * properties cannot ramp by definition.
 */
function setParam(node: ToneNode, key: string, value: number, at: number): void {
  const holder = node as unknown as Record<string, unknown>;
  const target = holder[key];
  if (target && typeof target === "object" && "value" in (target as object)) {
    const param = target as { value: number; rampTo?: (v: number, t: number, at?: number) => void };
    if (param.rampTo) param.rampTo(value, 0.02, at);
    else param.value = value;
    return;
  }
  if (typeof target === "number") {
    // Regenerating a reverb tail throws if the node is already disposed —
    // which happens when a dial is dragged as playback stops.
    try {
      holder[key] = value;
    } catch {
      /* device went away underneath the drag */
    }
  }
}

export interface LaneChain {
  /** What clips connect to. Stable for the life of the lane. */
  input: GainNode;
  /** Resolves once every device that has to build something before it can
   *  work has built it — in practice the reverb, which renders its own
   *  impulse response. Awaited before the transport starts so the first
   *  second of a story is not accidentally dry. */
  readonly ready: Promise<void>;
  /** Push new parameter values onto the running devices. Only safe when the
   *  chain's *shape* is unchanged — see `chainShapeChanged`. */
  update(specs: DeviceSpec[]): void;
  /** Tear the devices out and build them again, without disturbing `input` or
   *  anything connected to it. */
  rebuild(specs: DeviceSpec[]): void;
  dispose(): void;
}

/**
 * Build a lane's chain into an existing context.
 *
 * `Tone.setContext` is called with the timeline's own `AudioContext` rather
 * than letting Tone make one: two contexts would mean two clocks, and devices
 * running on a different clock from the clips feeding them is exactly the
 * drift the stem player already fights.
 */
export function createLaneChain(
  ctx: AudioContext,
  destination: AudioNode,
  specs: DeviceSpec[],
): LaneChain {
  if (Tone.getContext().rawContext !== ctx) Tone.setContext(ctx);

  const input = ctx.createGain();
  let nodes: { spec: DeviceSpec; node: ToneNode }[] = [];
  let ready: Promise<void> = Promise.resolve();
  /** Expensive writes waiting for their dial to settle, keyed by device id and
   *  parameter so two knobs on one device do not cancel each other. */
  const settling = new Map<string, ReturnType<typeof setTimeout>>();

  function wire(next: DeviceSpec[]): void {
    // Bypassed devices are left out of the graph entirely rather than set to
    // fully dry: a bypassed reverb still costs a convolution per block, and a
    // rack is somewhere people park things they are not using.
    const active = next.filter((s) => !s.bypassed);
    nodes = active.map((spec) => ({ spec, node: createDevice(spec) }));
    // Swallowed on purpose. A reverb disposed while it is still rendering its
    // impulse response — which is what happens when a device is removed a
    // moment after being added — rejects this promise, and `play()` awaits it
    // before scheduling a single clip. A rejection there would take the whole
    // transport down over a tail nobody is waiting for any more.
    ready = Promise.all(
      nodes.map(({ node }) =>
        node instanceof Tone.Reverb ? node.ready.catch(() => undefined) : Promise.resolve(),
      ),
    ).then(() => undefined);

    input.disconnect();
    if (nodes.length === 0) {
      input.connect(destination);
      return;
    }
    Tone.connect(input, nodes[0].node);
    for (let i = 0; i < nodes.length - 1; i += 1) nodes[i].node.connect(nodes[i + 1].node);
    Tone.connect(nodes[nodes.length - 1].node, destination);
  }

  function teardown(): void {
    // A pending write would land on a node that no longer exists.
    for (const timer of settling.values()) clearTimeout(timer);
    settling.clear();
    for (const { node } of nodes) {
      try {
        node.dispose();
      } catch {
        /* already gone with the context */
      }
    }
    nodes = [];
  }

  wire(specs);

  return {
    input,
    get ready() {
      return ready;
    },
    update(next) {
      const at = ctx.currentTime;
      const active = next.filter((s) => !s.bypassed);
      for (let i = 0; i < nodes.length && i < active.length; i += 1) {
        const spec = active[i];
        const node = nodes[i].node;
        const descriptors = DEVICES[spec.kind].params;
        for (const [key, value] of Object.entries(spec.params)) {
          // A parameter that rebuilds something waits for the drag to settle.
          // Without this, a reverb's decay re-renders its impulse response on
          // every pointermove — a second of blocked main thread per sweep, and
          // a page that stops responding while you are listening to it.
          if (descriptors.find((d) => d.key === key)?.expensive) {
            const token = `${spec.id}:${key}`;
            clearTimeout(settling.get(token));
            settling.set(
              token,
              setTimeout(() => {
                settling.delete(token);
                setParam(node, key, value, ctx.currentTime);
              }, SETTLE_MS),
            );
            continue;
          }
          setParam(node, key, value, at);
        }
      }
    },
    rebuild(next) {
      teardown();
      wire(next);
    },
    dispose() {
      teardown();
      input.disconnect();
    },
  };
}
