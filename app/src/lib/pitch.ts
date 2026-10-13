/**
 * Monophonic pitch detection, and the scale maths the autotune device needs on
 * top of it.
 *
 * Split out from `device-chain.ts` because none of this is audio *graph* — it
 * is arithmetic over a block of samples, it has no Tone or Web Audio in it at
 * all, and that makes it the one part of the device that can be reasoned about
 * (and tested) without a running AudioContext.
 *
 * The detector is normalized autocorrelation rather than YIN or CREPE. The
 * honest reason is scope: CREPE is a neural net and a model download, YIN is a
 * meaningfully better estimator that still wants a worklet to run off the main
 * thread, and what this device actually needs is "which of twelve notes is the
 * singer nearest, sixty times a second". Autocorrelation answers that on a
 * clean vocal, which is the signal an autotune is pointed at.
 */

/** Below this there is nothing to tune — a gap between phrases, or the room.
 *  Chasing a pitch through silence is how autotune ends up warbling at noise. */
const SILENCE_RMS = 0.01;

/** The search window, as periods. A voice below this is almost certainly the
 *  detector locking onto a rumble rather than a note being sung. */
const MIN_HZ = 60;
const MAX_HZ = 1600;

/**
 * How confident the winning lag has to be, as a fraction of the zero-lag
 * energy.
 *
 * Unvoiced consonants — an "s", a "t" — are noise with no period in them at
 * all, and autocorrelation will still hand back its best guess. Refusing a
 * weak peak is what stops the shifter lurching a fifth on every sibilant.
 */
const MIN_CLARITY = 0.8;

/**
 * How close to the best score a shorter lag has to come to be preferred over
 * it — see the two-pass search in `detectPitch`.
 *
 * Too low and a harmonic gets mistaken for the fundamental, sending the note
 * an octave *up*; too high and the octave-down errors it exists to prevent
 * come back. The usual published value, and it behaves.
 */
const OCTAVE_TOLERANCE = 0.9;

/**
 * The fundamental of `buf`, in Hz, or `null` when there isn't one.
 *
 * Null is a real answer and callers must handle it rather than substituting a
 * zero: "nothing is being sung right now" is the correct state to leave the
 * pitch shifter alone in, and the difference between that and "sung very low"
 * is the difference between a held note and a slide to the floor.
 */
export function detectPitch(buf: Float32Array, sampleRate: number): number | null {
  const n = buf.length;

  let sumSquares = 0;
  for (let i = 0; i < n; i += 1) sumSquares += buf[i]! * buf[i]!;
  const rms = Math.sqrt(sumSquares / n);
  if (rms < SILENCE_RMS) return null;

  const minLag = Math.floor(sampleRate / MAX_HZ);
  const maxLag = Math.min(Math.floor(sampleRate / MIN_HZ), Math.floor(n / 2));
  if (maxLag <= minLag) return null;

  // Normalized cross-correlation: the overlap divided by the energy of *both*
  // windows being overlapped, which puts every lag on a -1..1 scale regardless
  // of how many samples it had to work with.
  //
  // Normalizing against only the lagged window (or not at all) looks like it
  // ought to work and does not: the overlap shrinks by one term per sample of
  // lag, so the raw score falls away with lag on its own, every long lag loses
  // to every short one, and the detector reports the top of its search range
  // for anything sung near the bottom of it. A bass note coming back as a
  // whistle is that bug, not a bad estimate.
  const scores = new Float32Array(maxLag + 1);
  let bestScore = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let headEnergy = 0;
    let lagEnergy = 0;
    for (let i = 0; i < n - lag; i += 1) {
      correlation += buf[i]! * buf[i + lag]!;
      headEnergy += buf[i]! * buf[i]!;
      lagEnergy += buf[i + lag]! * buf[i + lag]!;
    }
    if (headEnergy <= 0 || lagEnergy <= 0) continue;
    const score = correlation / Math.sqrt(headEnergy * lagEnergy);
    scores[lag] = score;
    if (score > bestScore) bestScore = score;
  }
  if (bestScore < MIN_CLARITY) return null;

  // Take the *shortest* lag that is nearly as good as the best one, not the
  // best one itself — YIN's absolute-threshold step, and the whole reason this
  // is a two-pass search.
  //
  // A periodic signal repeats at twice its period and three times its period
  // just as exactly as it does at its period, so those lags all score ~1.0 and
  // which of them wins outright comes down to float noise. Trusting the global
  // maximum therefore reports a note one or two octaves too low at random,
  // which is the single most audible way a pitch detector can be wrong. The
  // true fundamental is always the shortest of that set.
  const acceptable = bestScore * OCTAVE_TOLERANCE;
  let bestLag = -1;
  for (let lag = minLag + 1; lag < maxLag; lag += 1) {
    if (
      scores[lag]! >= acceptable &&
      scores[lag]! >= scores[lag - 1]! &&
      scores[lag]! >= scores[lag + 1]!
    ) {
      bestLag = lag;
      break;
    }
  }
  if (bestLag < 0) return null;

  // Parabolic interpolation around the winning lag. Without it the estimate is
  // quantised to whole samples, which near the top of a soprano's range is
  // most of a semitone — and an autotune that cannot tell A from A# is not
  // doing the one thing it exists to do.
  const refined = interpolateLag(buf, n, bestLag, minLag, maxLag);
  const hz = sampleRate / refined;
  return hz >= MIN_HZ && hz <= MAX_HZ ? hz : null;
}

/** Fit a parabola through the winning lag and its two neighbours and return
 *  its vertex — a fractional lag. Falls back to the integer lag at the edges
 *  of the search window, where there is no pair to fit through. */
function interpolateLag(
  buf: Float32Array,
  n: number,
  lag: number,
  minLag: number,
  maxLag: number,
): number {
  if (lag <= minLag || lag >= maxLag) return lag;
  const at = (l: number): number => {
    let sum = 0;
    for (let i = 0; i < n - l; i += 1) sum += buf[i]! * buf[i + l]!;
    return sum;
  };
  const prev = at(lag - 1);
  const here = at(lag);
  const next = at(lag + 1);
  const denominator = 2 * (2 * here - prev - next);
  if (denominator === 0) return lag;
  return lag + (next - prev) / denominator;
}

/* ------------------------------------------------------------------ scales */

/**
 * Semitone offsets from the root, by `scale` parameter value.
 *
 * Chromatic first because it is the identity: every note is in it, so the
 * device becomes a pitch *straightener* — it pulls a flat note onto the
 * nearest semitone without imposing a key. That is the setting you want when
 * you do not know the key, which is most of the time, so it is also the
 * default.
 */
export const SCALES: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // chromatic
  [0, 2, 4, 5, 7, 9, 11], // major
  [0, 2, 3, 5, 7, 8, 10], // natural minor
];

export const SCALE_NAMES = ["Chromatic", "Major", "Minor"];

export const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** MIDI note number, fractional. 69 is A440 by definition. */
export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

/**
 * The nearest note of `scale` in `key`, as a fractional-MIDI target.
 *
 * Searches the octave either side of the sung note rather than only the one it
 * falls in: a B sung slightly flat sits in the octave below the C it should
 * snap up to, and a scale lookup that never crosses an octave boundary would
 * drag it down a seventh instead.
 */
export function snapToScale(midi: number, key: number, scale: number): number {
  const degrees = SCALES[scale] ?? SCALES[0]!;
  const base = Math.floor(midi);
  let best = midi;
  let bestDistance = Infinity;
  for (let octave = -1; octave <= 1; octave += 1) {
    const root = base - ((((base - key) % 12) + 12) % 12) + octave * 12;
    for (const degree of degrees) {
      const candidate = root + degree;
      const distance = Math.abs(candidate - midi);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
  }
  return best;
}
