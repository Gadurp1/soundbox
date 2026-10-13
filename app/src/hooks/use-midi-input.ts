/**
 * A MIDI controller, if there is one.
 *
 * Web MIDI is asked for on a click rather than on mount. The browser shows a
 * permission prompt for it, and a panel that fires one the moment it opens is
 * a panel that gets denied by reflex — the button makes the request something
 * the user asked for.
 *
 * It is also not available everywhere: Chromium has it, WKWebView (which is
 * what the desktop build runs inside on macOS) does not, and Firefox needs it
 * turned on. So `unsupported` is a first-class state rather than an error, and
 * the panel that uses this hook always keeps a way to play notes without it.
 *
 * The hook deliberately owns no sound and no meaning. It reports what arrived;
 * what a press or a knob *does* — a live voice, a recording, a bound control —
 * belongs to the panel, which is also where the on-screen keyboard's presses
 * arrive, and those two have to be treated identically or a take plays back
 * differently depending on how it was entered.
 *
 * It reports more than notes, because a keyboard is not only keys. A
 * controller's knobs, wheels, pads and pedal are continuous controllers, and
 * dropping them on the floor (which this hook used to do) is what made half of
 * an M-Vave — or any other 25-key board — look broken rather than unmapped.
 * Turning a CC into an action is `lib/midi-mapping.ts`; getting it here is
 * this file's whole job.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type MidiAccessState = "unsupported" | "idle" | "connecting" | "granted" | "denied";

export interface MidiPort {
  id: string;
  name: string;
}

/**
 * One decoded message, in the form both the monitor and Learn want.
 *
 * Channel is 1-16 as printed on hardware rather than 0-15 as sent on the
 * wire: every number in this object is shown to someone at some point, and
 * two conventions for "which channel" is how a mapping ends up off by one.
 */
export interface MidiMessage {
  kind: "note-on" | "note-off" | "cc" | "bend" | "other";
  channel: number;
  /** Note number, or CC number. Meaningless for bend. */
  data1: number;
  /** Velocity, or CC value. Meaningless for bend. */
  data2: number;
  /** 0-1 for notes and CCs; -1 to 1 for bend. */
  value: number;
  portName: string;
}

export interface MidiInputHook {
  state: MidiAccessState;
  /** Why the connection failed, when it did. */
  error: string | null;
  /**
   * True when the browser has a *remembered* denial, which is the one failure
   * a retry cannot clear. Chrome rejects `requestMIDIAccess` instantly for an
   * origin the user has blocked, without prompting again, so a "Retry" button
   * is a button that cannot work — the panel needs to say where the setting
   * is instead.
   */
  blocked: boolean;
  inputs: MidiPort[];
  /** Which port is being listened to; null means every connected port. */
  inputId: string | null;
  setInputId: (id: string | null) => void;
  connect: () => Promise<void>;
}

export interface MidiInputHandlers {
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
  /** A continuous controller: knob, wheel, slider, pedal. `value` is 0-1. */
  onControl?: (control: number, value: number, channel: number) => void;
  /** Pitch bend, -1 to 1, centred at 0. */
  onBend?: (value: number) => void;
  /**
   * Every message, before anything else sees it. Return true to consume it.
   *
   * This is the seam the mapping needs and the typed handlers above cannot
   * give it. A bound pad must not also sound as a note, and a pad being
   * *learned* must not sound either — both are decisions that need the whole
   * message (channel included) and need to happen before `onNoteOn` runs.
   * Anything unconsumed carries on to the handlers, so an unmapped keyboard
   * behaves exactly as it did before any of this existed.
   */
  onAny?: (message: MidiMessage) => boolean;
}

/* ------------------------------------------------------------ the monitor */

/**
 * The last message, as a store of its own rather than hook state.
 *
 * A knob sweep is a hundred messages a second. Putting that in the panel's
 * state would re-render the keyboard, the take strip and the roll for every
 * one of them, to update one line of text. Components that want the monitor
 * subscribe to it directly and nothing else re-renders at all.
 *
 * Published on a 60ms gate with a trailing flush, so a sweep updates the
 * readout smoothly and the *final* value — the one you stopped on, which is
 * the one Learn binds — is never the one that got throttled away.
 */
let lastMessage: MidiMessage | null = null;
let publishedAt = 0;
let trailing: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function announce(): void {
  publishedAt = performance.now();
  for (const listener of listeners) listener();
}

function publish(message: MidiMessage): void {
  lastMessage = message;
  if (trailing !== null) clearTimeout(trailing);
  const since = performance.now() - publishedAt;
  if (since >= 60) {
    announce();
    return;
  }
  trailing = setTimeout(() => {
    trailing = null;
    announce();
  }, 60 - since);
}

/** One status byte and its two data bytes, as something with a name. */
function decode(
  status: number,
  channel: number,
  data1: number,
  data2: number,
  portName: string,
): MidiMessage {
  switch (status) {
    case 0x90:
    case 0x80: {
      // A note-on at velocity zero is a note-off — most controllers send only
      // this form, so folding it here is what makes held notes ever end.
      const on = status === 0x90 && data2 > 0;
      return {
        kind: on ? "note-on" : "note-off",
        channel,
        data1,
        data2,
        value: data2 / 127,
        portName,
      };
    }
    case 0xb0:
      return { kind: "cc", channel, data1, data2, value: data2 / 127, portName };
    case 0xe0: {
      // 14-bit, little end first, centred at 0x2000. Split so the two halves
      // of the throw are each exactly 1.0 wide — dividing the whole span by
      // one number leaves the wheel unable to reach -1.
      const raw = (data2 << 7) | data1;
      const value = raw >= 0x2000 ? (raw - 0x2000) / 8191 : (raw - 0x2000) / 8192;
      return { kind: "bend", channel, data1, data2, value, portName };
    }
    default:
      return { kind: "other", channel, data1, data2, value: data2 / 127, portName };
  }
}

/** The most recent MIDI message from any port, or null before the first. */
export function useMidiMonitor(): MidiMessage | null {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => lastMessage,
    () => null,
  );
}

/* ---------------------------------------------------------------- the hook */

export function useMidiInput(handlers: MidiInputHandlers): MidiInputHook {
  const [state, setState] = useState<MidiAccessState>(() =>
    typeof navigator !== "undefined" && "requestMIDIAccess" in navigator ? "idle" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [inputs, setInputs] = useState<MidiPort[]>([]);
  const [inputId, setInputId] = useState<string | null>(null);

  const access = useRef<MIDIAccess | null>(null);
  /** The port filter, read inside the message handler. Kept in a ref so
   *  changing the picker does not mean rebinding every port's listener. */
  const filter = useRef<string | null>(null);
  filter.current = inputId;
  /** Handlers change identity on every render of the panel — the note list is
   *  in its closure. A ref keeps the listeners bound once. */
  const sink = useRef(handlers);
  sink.current = handlers;

  const onMessage = useCallback((event: MIDIMessageEvent) => {
    const port = event.target as MIDIInput | null;
    if (filter.current !== null && port?.id !== filter.current) return;

    const data = event.data;
    if (data === null || data.length < 2) return;
    const status = data[0]! & 0xf0;
    const channel = (data[0]! & 0x0f) + 1;
    const data1 = data[1]!;
    const data2 = data.length > 2 ? data[2]! : 0;
    const portName = port?.name ?? "MIDI input";

    const message = decode(status, channel, data1, data2, portName);

    // The monitor sees everything, including messages the mapping consumes
    // and messages nothing understands — being able to watch a pad that is
    // sending the "wrong" thing is most of what the monitor is for.
    publish(message);
    if (sink.current.onAny?.(message) === true) return;

    switch (message.kind) {
      case "note-on":
        sink.current.onNoteOn(message.data1, message.value);
        return;
      case "note-off":
        sink.current.onNoteOff(message.data1);
        return;
      case "cc":
        sink.current.onControl?.(message.data1, message.value, message.channel);
        return;
      case "bend":
        sink.current.onBend?.(message.value);
        return;
      default:
        // Program change, aftertouch, clock. Nothing acts on these yet.
        return;
    }
  }, []);

  /** Re-read the port list and make sure every one of them is bound. Ports
   *  come and go while the page is open — plugging a keyboard in after
   *  connecting is the normal case, not an exotic one. */
  const sync = useCallback(() => {
    const midi = access.current;
    if (midi === null) return;
    const ports: MidiPort[] = [];
    midi.inputs.forEach((input) => {
      ports.push({ id: input.id, name: input.name ?? "MIDI input" });
      input.onmidimessage = onMessage;
    });
    setInputs(ports);
    // A port that has been unplugged should not stay selected: the picker
    // would be naming a device that is not there and silently matching
    // nothing.
    setInputId((current) => (current && ports.some((p) => p.id === current) ? current : null));
  }, [onMessage]);

  const connect = useCallback(async () => {
    if (!("requestMIDIAccess" in navigator)) {
      setState("unsupported");
      return;
    }
    setState("connecting");
    setError(null);
    try {
      // No sysex: it is a separate, scarier permission and nothing here needs
      // it — notes and CCs are channel voice messages.
      const midi = await navigator.requestMIDIAccess({ sysex: false });
      access.current = midi;
      midi.onstatechange = () => sync();
      sync();
      setBlocked(false);
      setState("granted");
    } catch (cause) {
      // Tell a fresh dismissal apart from a remembered block. The permission
      // registry knows, and it is the difference between "try again" and
      // "you cannot try again from here".
      let remembered = false;
      try {
        const status = await navigator.permissions.query({
          name: "midi" as PermissionName,
        });
        remembered = status.state === "denied";
      } catch {
        // Firefox has no `midi` permission descriptor. Leaving this false
        // costs a retry button that might not work, which is the smaller of
        // the two wrong answers.
      }
      setBlocked(remembered);
      setState("denied");
      setError(
        remembered
          ? "This site is blocked from using MIDI devices."
          : cause instanceof Error
            ? cause.message
            : "This browser would not give access to MIDI devices.",
      );
    }
  }, [sync]);

  useEffect(
    () => () => {
      const midi = access.current;
      access.current = null;
      if (midi === null) return;
      // Leaving listeners on live ports keeps this hook's closures — and the
      // note list they were recording into — alive after the panel is gone.
      midi.onstatechange = null;
      midi.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
    },
    [],
  );

  return { state, error, blocked, inputs, inputId, setInputId, connect };
}
