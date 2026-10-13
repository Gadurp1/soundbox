# Generating sound

Every sound in Soundbox is made the same way: a prompt, a model, a few
parameters, and a job you can watch. This page follows one all the way through,
then covers the parameters that actually change the result.

## The short version

1. Pick a model. Its licence and what it is good at are on the card.
2. Describe the sound — material, action, space.
3. Press generate. You get a job id; the app follows it.
4. The takes land in your library, each with the prompt and seed that made it.

Nothing is uploaded. The model runs on your machine, and the WAV is written to
`~/.soundbox/sounds` before you ever hear it.

## Writing a prompt

These models answer to **material, action and space**, not to adjectives about
mood:

> "scary sound" → nothing useful
>
> "heavy wooden door slamming shut in a cold stone corridor" → what you wanted

The pattern that works for sound effects is *what it is made of, what is
happening to it, and where you are standing*. For music, name instruments,
tempo and production rather than a vibe: "90 BPM boom bap, dusty Rhodes chords,
upright bass, vinyl crackle".

Three practical rules:

- **Write a sentence, not a keyword list.** Connecting words ("in", "against",
  "over", "while") are part of what the model reads. Keywords belong in the
  tags field, which is a different box for a different job.
- **One sound per prompt.** "A door slam and then footsteps" gives you a muddle;
  generate two clips and put them on a timeline.
- **Do not write BPM or key into a music caption** for models that take them as
  separate parameters — you are competing with the parameter.

If you would rather not write the descriptive version yourself, the **enhance**
button (`POST /api/enhance`) rewrites a rough prompt using guidance specific to
the model family you are about to run. It is a local LLM if you have one
configured; it is optional, and it tells you when it is unavailable rather than
silently doing nothing.

You have three ways to supply it, none of which involve trusting us with a
prompt: let Soundbox install `llama-server` and a small GGUF for you (Models
page, or `soundbox model install llm`); point it at a `llama-server` you
already built with `SOUNDBOX_LLAMA_SERVER_BIN`; or set the mode to *external*
and give it any OpenAI-compatible base URL — Ollama, LM Studio, vLLM, a hosted
endpoint. `soundbox model status llm` says which one is live.

Music tracks can also carry generated cover art, and saved voices generated
avatars — see [ARTWORK.md](ARTWORK.md). Both are off by default and neither is
needed for the instrument icons on separated stems, which the app draws itself.

## Parameters

| Parameter        | What it does                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| **Duration**     | Target length. Diffusion models treat this as a target, not a contract — the rendered length is shown next to the requested one, because they differ. |
| **Seed**         | The random start. Same seed + same prompt + same model = same audio. Lock it to iterate on wording, free it to explore. |
| **Steps**        | How many denoising steps. More is slower and usually cleaner, with diminishing returns; some models are tuned for very few and say so. |
| **CFG**          | How hard the model is pushed toward your prompt. Too high is brittle and artefact-ridden, too low wanders. |
| **Negative prompt** | What to steer away from, where the model supports it. |
| **Takes**        | How many variations to render in one go. Each is its own sound with its own seed. |

Takes are the important one for actual work: generate four, keep one, and the
other three stay in your library with the prompt that made them, so "the second
one was better" is recoverable.

## Lyrics and vocal music

A lyrics-conditioned model (ACE-Step) takes a second field. The prompt sets
genre, instrumentation and production; the lyrics are what gets sung:

```
[verse]
Game over, you have fallen
The screen goes dark again

[chorus]
Insert coin, insert coin
```

Section tags in brackets are structure, not words to sing. Leave the lyrics
empty and the same model renders an instrumental.

Whether a model supports this is a field on the model, not a guess — the UI
only shows the lyrics box for models that declare it.

## What happens after "generate"

```
POST /api/generate  { model, prompt, duration_s, seed, steps, cfg, variations }
  → { job_id }

GET /api/jobs/:id/events
  → queued        the request is in line
  → downloading   first run of a model it has to fetch weights
  → loading       weights into memory (or VRAM)
  → generating    the actual inference, with progress
  → encoding      peaks measured, loudness checked, file written
  → done          { sounds: [id, …] }
```

The model stays loaded after a run so the next generation skips `loading`; it
unloads on its own after an idle period you can set.

Post-processing happens in `encoding`, and it is deliberately small:

- **Peaks** are measured once and stored, so every waveform in the app draws
  from the same 256 numbers instead of decoding the file again.
- **Loudness** is normalised to your target LUFS if you set one.
- **Silence trimming** removes the padding models leave at the edges, if you
  have it on. Recordings and imports are never trimmed — that silence is
  someone breathing, not padding.

## Stems instead of a mix

**Split into tracks**, under the prompt, sends the render straight through the
separator and hands back the stems you picked rather than the mix. The job does
not report done until they exist, so a prompt in the studio lands as a lane per
stem rather than as one clip you then have to split.

The mix itself stays in the library as the stems' parent — nothing is thrown
away that you did not ask to throw away. Over the API it is one field:

```
POST /api/generate  { …, "separate": { "keep": ["drums", "bass"], "rest": "merge" } }
  → done  { sounds: [stem ids…], sources: [the mix] }
```

`keep: []` means every stem; `rest` is `"discard"` or `"merge"` — see
[the library's Stems section](./LIBRARY.md).

## Sessions

Every run in the composer belongs to a **session**, created on first generate
and titled from your prompt. It is a log of one sitting, not a folder you have
to file things into — which is what [projects](./LIBRARY.md) are for. The
distinction matters when you come back: a session answers "what did I make on
Tuesday", a project answers "what is this track made of".

## Doing it over the API

The same generation, without the UI:

```bash
curl -X POST http://127.0.0.1:17494/api/generate \
  -H 'content-type: application/json' \
  -d '{
    "model": "audiocpp-stable-audio-3-sfx",
    "prompt": "heavy wooden door slamming in a stone corridor",
    "duration_s": 6,
    "variations": 2
  }'
# → {"job_id":"…"}

curl -N http://127.0.0.1:17494/api/jobs/<job_id>/events
```

The full surface — every endpoint, every field — is in the
[API reference](./API.md). If you are driving Soundbox from an agent
rather than a script, use [MCP](./MCP.md) instead: it is the same operations
with schemas the model can read.

## When it goes wrong

**The output is silence, or almost.** Usually a prompt the model has nothing for
(an abstract noun), or too few steps. Try the enhance button and a known-good
example from one of the collection pages.

**It is much slower than you expect.** Check which backend audio.cpp picked —
falling back to CPU is the usual reason. [audio.cpp](./AUDIOCPP.md) covers
backend selection and how to force one.

**The length is wrong.** Expected. The rendered duration is shown next to the
requested one; trim on the timeline, or generate longer and cut.

**It fails on the first run only.** That is the weights download. The job phase
says `downloading`, and it is cached afterwards.
