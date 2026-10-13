# The library

Everything Soundbox makes is saved. There is no "save" button and no unsaved
state: a generation writes a WAV to disk and a row to the database before you
hear it. The library is how you get back to it.

## What a sound carries

Every clip keeps what made it, which is the difference between a folder of WAVs
and something you can work from:

| Field                        | Why it is there                                              |
| ---------------------------- | ------------------------------------------------------------ |
| Prompt, negative prompt      | What you asked for, verbatim                                 |
| Model                        | Which one answered                                           |
| Seed, steps, CFG             | Enough to render it again                                    |
| Duration, sample rate, size  | Facts about the file on disk                                 |
| Peaks                        | 256 measured points, so every waveform draws without decoding |
| Source                       | `app`, `api` or `mcp` — who asked                            |
| Parent                       | Set on anything derived from another sound                   |

"Reuse this prompt" takes all of it back to the composer, which is the fastest
way to make a variation of something you liked three days ago.

## Finding things

- **Search** matches prompts and names.
- **Categories** — SFX, Music, Text to Speech — are separate lists, narrowed by
  the models in each category rather than filtered after the fact, so a music
  render never appears while you are browsing SFX.
- **Tags** are yours, free-form, and indexed.
- **Favourites** are a star, for the handful you keep coming back to.
- **Agent-made** sounds can be filtered on their own, which is how you find what
  something else made while you were not looking.

## Sessions and projects

Two different questions, so two different things:

- A **session** is a sitting. It is created on your first generation, titled
  from the prompt, and collects everything made in that run. Nothing files
  itself into a session; it just happens. It answers *what did I make on
  Tuesday*.
- A **project** is a folder you put things in on purpose. It answers *what is
  this track made of*.

A sound inherits its session's project, and can be moved to a project of its own
— the library shows when a project is inherited rather than set directly, so
"why is this here" always has an answer.

## Editing without destroying

Every tool that changes audio writes a **new sound** with `parent_id` pointing
at the original. Nothing you made is overwritten, ever.

On a sound's page there is a waveform you can drag a selection across, and a
toolbar that acts on the selection or the whole clip:

| Tool          | What it does                                                  |
| ------------- | ------------------------------------------------------------- |
| Trim          | Keep the selection, discard the rest                          |
| Normalize     | To a LUFS target                                              |
| Gain          | Up or down, in dB                                             |
| Reverse       | Backwards                                                     |
| High-pass, low-pass | Cut below or above a frequency                          |
| Pitch         | Semitones, without changing the length                        |
| Stretch       | Length, without changing the pitch                            |

Each Apply produces a new clip and takes you to it. The original stays exactly
where it was.

## Stems

If a separator model (HTDemucs) is installed, any sound can be **split into
stems** — vocals, drums, bass, other. The stems are ordinary library sounds with
their parent set, so they can be searched, tagged and arranged like anything
else.

Splitting asks which stems you actually want, and what happens to the others:

- **Scrap them** — the stems you did not pick are never written. A split for the
  drums alone leaves one new sound, not four.
- **Keep as one** — the rest is summed into a single `(rest)` sound: the
  original minus what you took out. The pieces still add back up to the take.

On a sound's page the stems appear beneath it as one synced player: they always
share the source's length and always start together, so it is a group transport
rather than an arrangement. To arrange them, open the sound in the studio — it
splits and lays one stem per lane.

## Where the files are

```
~/.soundbox/sounds/<id>.wav
```

Plain WAV, one per sound, named by id. The library's "reveal" opens your file
manager with the file selected. Downloads can be converted to mp3 on the way out
if you have ffmpeg installed; without it you get the WAV, and the app says so
rather than silently handing you the wrong thing.

Because the audio is files and the metadata is one SQLite file, backing up your
work is copying `~/.soundbox`. Deleting a sound from the library deletes the row
and the file — and only that file, never a derived clip that came from it.

## From the API

```bash
# Everything, newest first
curl 'http://127.0.0.1:17494/api/sounds?limit=20'

# Only sounds from these models, matching "rain"
curl 'http://127.0.0.1:17494/api/sounds?q=rain&models=audiocpp-stable-audio-3-small-music,audiocpp-ace-step'

# One sound, in full
curl 'http://127.0.0.1:17494/api/sounds/<id>'
```

The full surface is in the [API reference](./API.md).
