/**
 * The factory devices a track can be run through, as data.
 *
 * A device is a `kind` plus a flat bag of numbers, and every knob on screen is
 * generated from the descriptors below rather than hand-written per device.
 * That is the whole reason this file exists as data instead of a React
 * component per device: the rack, the audio graph and the stored JSON all read
 * the same table, so most devices are one entry here and nothing else.
 *
 * Most, not all. Autotune needs a pitch detector driving a shifter, which is a
 * control loop rather than a node — the table still describes its knobs, but
 * `device-chain.ts` has to build it by hand. It is the exception that says
 * where the data-driven approach stops.
 *
 * Values are stored in the unit the *device* thinks in — dB for thresholds,
 * seconds for times, 0..1 for mixes — never in slider positions, so a spec
 * means the same thing to `device-chain.ts` as it does to a human reading the
 * JSON.
 *
 * These are inserts on a track, not on the story: the whole point is that the
 * narration lane can be compressed while the music lane underneath it is
 * ducked and reverbed, which is a per-track decision.
 */

import { KEY_NAMES, SCALE_NAMES } from "@/lib/pitch";

export type DeviceKind =
  | "compressor"
  | "eq"
  | "reverb"
  | "delay"
  | "distortion"
  | "gate"
  | "limiter"
  | "autotune";

export interface DeviceSpec {
  /** Stable across re-renders and drags, so a card keeps its identity while
   *  its parameters change. Not meaningful to the audio graph. */
  id: string;
  kind: DeviceKind;
  /** Bypassed devices stay in the rack, and out of the signal path. Turning
   *  one off to hear what it was doing is the most common thing you do to a
   *  device, and it must not cost you its settings. */
  bypassed: boolean;
  params: Record<string, number>;
}

export interface ParamDescriptor {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Printed after the value. "" for ratios and other bare numbers. */
  unit: string;
  /** Dials for the parameters you sweep by feel, a slider for wet/dry — the
   *  one control everybody expects to be linear and horizontal. */
  control: "dial" | "slider";
  /** Times are stored in seconds and shown in milliseconds; without this a
   *  compressor attack reads "0.003 s", which is not a number anyone tunes. */
  displayScale?: number;
  displayUnit?: string;
  /** Skew the dial so the useful half of the range isn't crushed into the
   *  first few degrees. 1 is linear; 3 makes a 0.01–1 s delay usable. */
  curve?: number;
  /**
   * Writing this one rebuilds something rather than moving a value.
   *
   * A reverb's decay is the case that matters: changing it re-renders the
   * impulse response, which for a ten-second tail is an offline render of ten
   * seconds of stereo noise. Sixty of those a second — which is what dragging
   * the dial asks for — locks the main thread for about a second at a time and
   * grows the heap by megabytes a sweep. Marked here so the audio graph can
   * wait for the drag to settle before doing it; see `device-chain`.
   */
  expensive?: boolean;
  /**
   * Names for a parameter whose numbers are labels, not quantities.
   *
   * A key is one of twelve names and a scale one of three; stored as numbers
   * because a `DeviceSpec` is a flat bag of them, but "Key: 8" is not a
   * reading anyone can act on. Indexed by the raw value, so this only makes
   * sense on an integer-stepped parameter that starts at zero.
   */
  displayValues?: string[];
}

export interface DeviceDescriptor {
  name: string;
  /** One line in the "add a device" menu — what it is *for*, not what it is. */
  blurb: string;
  params: ParamDescriptor[];
}

export const DEVICES: Record<DeviceKind, DeviceDescriptor> = {
  compressor: {
    name: "Compressor",
    blurb: "Evens out a take that swings between a whisper and a shout.",
    params: [
      { key: "threshold", label: "Thresh", min: -60, max: 0, step: 1, unit: "dB", control: "dial" },
      { key: "ratio", label: "Ratio", min: 1, max: 20, step: 0.5, unit: ":1", control: "dial" },
      {
        key: "attack",
        label: "Attack",
        min: 0.001,
        max: 0.3,
        step: 0.001,
        unit: "s",
        control: "dial",
        displayScale: 1000,
        displayUnit: "ms",
        curve: 2,
      },
      {
        key: "release",
        label: "Release",
        min: 0.01,
        max: 1,
        step: 0.01,
        unit: "s",
        control: "dial",
        displayScale: 1000,
        displayUnit: "ms",
        curve: 2,
      },
    ],
  },
  eq: {
    name: "EQ",
    blurb: "Three bands: lift the body, cut the mud, open the top.",
    params: [
      { key: "low", label: "Low", min: -24, max: 12, step: 0.5, unit: "dB", control: "dial" },
      { key: "mid", label: "Mid", min: -24, max: 12, step: 0.5, unit: "dB", control: "dial" },
      { key: "high", label: "High", min: -24, max: 12, step: 0.5, unit: "dB", control: "dial" },
      {
        key: "lowFrequency",
        label: "Lo × Mid",
        min: 80,
        max: 1000,
        step: 10,
        unit: "Hz",
        control: "dial",
        curve: 2,
      },
      {
        key: "highFrequency",
        label: "Mid × Hi",
        min: 1000,
        max: 10000,
        step: 100,
        unit: "Hz",
        control: "dial",
        curve: 2,
      },
    ],
  },
  reverb: {
    name: "Reverb",
    blurb: "Puts the line in a room instead of against a dry wall.",
    params: [
      {
        key: "decay",
        label: "Decay",
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
        control: "dial",
        curve: 2,
        expensive: true,
      },
      {
        key: "preDelay",
        label: "Pre",
        min: 0,
        max: 0.3,
        step: 0.005,
        unit: "s",
        control: "dial",
        displayScale: 1000,
        displayUnit: "ms",
        expensive: true,
      },
      { key: "wet", label: "Mix", min: 0, max: 1, step: 0.01, unit: "", control: "slider" },
    ],
  },
  delay: {
    name: "Delay",
    blurb: "Repeats, fed back on themselves. Depth for free, rhythm if you time it.",
    params: [
      {
        key: "delayTime",
        label: "Time",
        min: 0.01,
        max: 1,
        step: 0.01,
        unit: "s",
        control: "dial",
        displayScale: 1000,
        displayUnit: "ms",
        curve: 2,
      },
      {
        key: "feedback",
        label: "Feedback",
        min: 0,
        max: 0.95,
        step: 0.01,
        unit: "",
        control: "dial",
      },
      { key: "wet", label: "Mix", min: 0, max: 1, step: 0.01, unit: "", control: "slider" },
    ],
  },
  distortion: {
    name: "Distortion",
    blurb: "Grit, from a warm edge to a radio that has given up.",
    params: [
      { key: "distortion", label: "Drive", min: 0, max: 1, step: 0.01, unit: "", control: "dial" },
      { key: "wet", label: "Mix", min: 0, max: 1, step: 0.01, unit: "", control: "slider" },
    ],
  },
  gate: {
    name: "Gate",
    blurb: "Shuts the track between phrases, so room tone stops piling up.",
    params: [
      { key: "threshold", label: "Thresh", min: -80, max: 0, step: 1, unit: "dB", control: "dial" },
      {
        key: "smoothing",
        label: "Smooth",
        min: 0.01,
        max: 0.5,
        step: 0.005,
        unit: "s",
        control: "dial",
        displayScale: 1000,
        displayUnit: "ms",
      },
    ],
  },
  limiter: {
    name: "Limiter",
    blurb: "A ceiling nothing gets over. Last in the chain, or it is decoration.",
    params: [
      { key: "threshold", label: "Ceiling", min: -24, max: 0, step: 0.5, unit: "dB", control: "dial" },
    ],
  },
  autotune: {
    name: "Autotune",
    blurb: "Pulls a sung take onto the nearest note. Fast retune is the famous sound.",
    params: [
      {
        key: "tuneKey",
        label: "Key",
        min: 0,
        max: 11,
        step: 1,
        unit: "",
        control: "dial",
        displayValues: KEY_NAMES,
      },
      {
        key: "scale",
        label: "Scale",
        min: 0,
        max: 2,
        step: 1,
        unit: "",
        control: "dial",
        displayValues: SCALE_NAMES,
      },
      {
        // The knob that decides whether this is a repair or an effect. Long
        // and it chases the voice's own drift, so nothing sounds processed;
        // at the bottom of the range the note is simply *there* on the
        // attack, which is the T-Pain setting.
        key: "retune",
        label: "Retune",
        min: 0,
        max: 0.4,
        step: 0.005,
        unit: "s",
        control: "dial",
        displayScale: 1000,
        displayUnit: "ms",
        curve: 2,
      },
      { key: "amount", label: "Amount", min: 0, max: 1, step: 0.01, unit: "", control: "slider" },
    ],
  },
};

/** The order they appear in the add menu — roughly the order they belong in a
 *  chain, so building one top to bottom lands somewhere sensible. */
export const DEVICE_ORDER: DeviceKind[] = [
  "gate",
  // Pitch before tone: it is the one device here that rewrites *what* the
  // note is rather than how it sounds, so everything below should be shaping
  // the corrected take rather than the take that needed correcting.
  "autotune",
  "eq",
  "compressor",
  "distortion",
  "delay",
  "reverb",
  "limiter",
];

/** Where each device starts. Chosen to be audible but not a statement — a
 *  device you have just added should do something, or you cannot tell it is
 *  on, and should not wreck the take, or you have to undo before you can
 *  listen. */
const DEFAULTS: Record<DeviceKind, Record<string, number>> = {
  compressor: { threshold: -24, ratio: 4, attack: 0.006, release: 0.15 },
  eq: { low: 0, mid: 0, high: 0, lowFrequency: 400, highFrequency: 2500 },
  reverb: { decay: 1.8, preDelay: 0.02, wet: 0.25 },
  delay: { delayTime: 0.25, feedback: 0.3, wet: 0.25 },
  distortion: { distortion: 0.3, wet: 0.5 },
  gate: { threshold: -45, smoothing: 0.06 },
  limiter: { threshold: -1 },
  // Chromatic, so it straightens without being told a key; a retune slow
  // enough to read as tuning rather than as an effect.
  autotune: { tuneKey: 0, scale: 0, retune: 0.08, amount: 1 },
};

/**
 * Keep a parameter bag inside the ranges the cards enforce.
 *
 * For values that did not come from a slider — the studio assistant asking
 * for "much wetter" and picking 3 for a 0–1 mix, say. A knob nudged past its
 * end should land at the end, not be thrown away: the intent ("as wet as it
 * goes") survives, and the rack never holds a number its own UI could not
 * produce. Keys this device does not have are dropped, since there is no
 * control behind them and nothing would ever read them back.
 */
export function clampDeviceParams(
  kind: DeviceKind,
  params: Record<string, number>,
): Record<string, number> {
  const descriptors = DEVICES[kind].params;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(params)) {
    const spec = descriptors.find((p) => p.key === key);
    if (!spec || !Number.isFinite(value)) continue;
    out[key] = Math.min(Math.max(value, spec.min), spec.max);
  }
  return out;
}

let counter = 0;

export function createDevice(kind: DeviceKind): DeviceSpec {
  counter += 1;
  return {
    id: `${kind}-${counter}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    bypassed: false,
    params: { ...DEFAULTS[kind] },
  };
}

/** Devices by lane. A lane with no entry has no devices, which is the same
 *  thing as an empty array and half the stored JSON. */
export type TrackDevices = Record<number, DeviceSpec[]>;

/** How a value reads on a card: scaled into its display unit, and rounded to
 *  a precision the step justifies rather than to whatever the float says. */
export function formatParam(param: ParamDescriptor, value: number): string {
  if (param.displayValues) {
    // Rounded because a dial's raw value is a float even on an integer step,
    // and clamped because a spec loaded from older JSON can name a scale that
    // no longer exists — better the first name than "undefined" on the card.
    const index = Math.round(value);
    return param.displayValues[index] ?? param.displayValues[0] ?? String(index);
  }
  const scale = param.displayScale ?? 1;
  const unit = param.displayUnit ?? param.unit;
  const shown = value * scale;
  const decimals = scale >= 1000 ? 0 : param.step >= 1 ? 0 : param.step >= 0.1 ? 1 : 2;
  return `${shown.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
}

/**
 * Whether two chains differ in a way the audio graph cannot absorb live.
 *
 * Parameter moves are ramped onto a running graph — that is the point of a
 * mixer. Adding, removing, reordering or bypassing a device changes the shape
 * of the graph and means rebuilding that lane's chain, so the two cases are
 * worth telling apart before doing the expensive one on every drag of a dial.
 */
export function chainShapeChanged(a: DeviceSpec[], b: DeviceSpec[]): boolean {
  if (a.length !== b.length) return true;
  return a.some((d, i) => d.id !== b[i].id || d.kind !== b[i].kind || d.bypassed !== b[i].bypassed);
}
