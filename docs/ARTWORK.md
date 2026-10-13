# Artwork

Cover art for music you generate, and avatars for saved voices. Off by default,
and nothing is downloaded until you turn it on.

Three of the four places artwork shows up need an image model. The fourth
doesn't, and it is worth saying why up front.

## Stem icons need nothing

When you split a track into stems, each stem gets its instrument's icon —
vocals, drums, bass, guitar, keys — in the stem list and in the library row.
Those are drawn by the app, not generated: the set of stem names a separator
emits is closed, so it is a lookup rather than a render. That makes them
instant, identical every time, and available to everyone, including the
majority who will leave artwork off. An unrecognised instrument gets a plain
note icon rather than an invented one.

Nothing in this document is required to get those.

## Turning artwork on

Settings → Artwork. Three modes, the same three the prompt assistant has:

| Mode | What it does |
| --- | --- |
| **Off** (default) | No artwork anywhere. |
| **Local** | Soundbox installs [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp)'s `sd-server` and a small checkpoint, and runs them for you. |
| **External** | Soundbox talks to an image server you already run. |

If you already have Automatic1111 or a compatible server listening, Soundbox
finds it and offers a one-click switch to External rather than steering you
into a second copy of Stable Diffusion. It probes 127.0.0.1 on 7860, 1234 and
8080 on every status fetch, with a 400 ms timeout.

### Local

The engine is one native binary, fetched from stable-diffusion.cpp's GitHub
releases and cached under `<data dir>/bin/sd/<version>/` — the same
managed-binary system as `audiocpp_cli` and `llama-server`, including the
`SOUNDBOX_SD_SERVER_BIN` override if you have your own build. See
[INSTALL.md](INSTALL.md).

Three models are offered:

| Model | Files | Size | Licence |
| --- | --- | --- | --- |
| SD-Turbo (Q8) | 1 | 2.0 GB | Stability AI Community — commercial below $1M revenue |
| SDXL-Turbo (Q8) | 1 | 4.1 GB | Stability AI **Non-Commercial** |
| Stable Diffusion 3.5 Medium | 4 | 11.6 GB | Stability AI Community |

The licence is shown before you download, not after. They are not the same, and
one of them means you cannot ship what it makes.

The first two are turbo-distilled — a cover is one to four steps rather than
twenty-eight — and are what the auto-cover switch is designed around. SD 3.5
Medium is the quality option: 1024px, 28 steps, and most of a 16 GB card. It
loads with `--clip-on-cpu` so its three text encoders stay off the GPU, which
is the difference between coexisting with a resident audio model and evicting
it.

Weights land in `<data dir>/models/image/<id>/`, a sibling of the audio and LLM
model directories, and delete independently of both.

### Models made of several files

SD 3.5 is not one checkpoint. It is a transformer plus three text encoders,
each passed to sd-server under its own flag:

```
-m sd3.5_medium.safetensors
--clip_l text_encoders/clip_l.safetensors
--clip_g text_encoders/clip_g.safetensors
--t5xxl text_encoders/t5xxl_fp8_e4m3fn.safetensors
```

So a catalog entry is a *list* of files, each with the flag it loads under.
That is data rather than code: a family needing a different flag, or an
upstream rename, is an edit to the catalog and not to argv-building logic.
Downloads skip files already present, so an interrupted 11.6 GB pull resumes at
file granularity rather than starting over.

The fp8 T5 is chosen over the fp16 deliberately — it halves 9.8 GB for an
encoder that mostly earns its keep on prompts containing text, which cover art
specifically avoids.

### Bring your own image model

Same file the audio side uses, `<data dir>/models/custom.json`, under an
`image_models` key:

```json
{
  "image_models": [
    {
      "id": "sd35-mine",
      "name": "SD 3.5 (my copy)",
      "files": [
        { "flag": "-m", "path": "D:/models/sd3.5_medium.safetensors" },
        { "flag": "--clip_l", "path": "D:/models/clip_l.safetensors" },
        { "flag": "--clip_g", "path": "D:/models/clip_g.safetensors" },
        { "flag": "--t5xxl", "path": "D:/models/t5xxl_fp8_e4m3fn.safetensors" }
      ],
      "resolution": 1024,
      "steps": 28,
      "cfg": 4.5,
      "extra_args": ["--sampling-method", "euler", "--clip-on-cpu"]
    }
  ]
}
```

- An **absolute** `path` is a file already on your disk: nothing is downloaded,
  and nothing is ever deleted — Soundbox refuses to remove weights it did not
  fetch. A relative path needs an `hf_repo` to resolve against.
- `flag` is passed to sd-server verbatim, so anything it accepts works,
  including `--vae` and `--diffusion-model`.
- Omit `license` and the model shows as **Unspecified / not commercial**, the
  same honest unknown the audio catalog uses.
- An id matching a shipped model replaces it — the supported way to point an
  existing entry at your own copy.
- Re-read whenever the file changes; a malformed entry is skipped with a
  console warning rather than taking the server down.

One thing this is *not* a route to: a model in **diffusers format** — a
directory of `model_index.json`, `transformer/`, `text_encoder/`, `vae/`, the
layout the Python `diffusers` library downloads. sd-server wants single files.
The same weights are usually published in both layouts in the same repo, so the
fix is normally to fetch the single-file copies rather than to convert
anything.

### External

Set the base URL and pick the API it speaks. There is no de-facto standard for
image generation the way `/v1/chat/completions` is for chat, so this is a
choice rather than something detected from the URL:

- **Automatic1111** — `POST /sdapi/v1/txt2img`. Automatic1111, Forge, SD.Next,
  and stable-diffusion.cpp's own `sd-server`.
- **OpenAI-compatible** — `POST /v1/images/generations`. OpenAI, LocalAI, most
  proxies.

An API key is optional and write-only, like the Hugging Face token: the server
never echoes it back.

Soundbox always asks for the image inline as base64 (`response_format:
"b64_json"`). An endpoint that answers with a URL instead is refused rather than
followed — the point of pointing Soundbox at one host is that it doesn't then
fetch from another.

## What gets drawn

**Cover art** comes from what the track actually is: its generation prompt,
then its track name, then its tags. Lyrics are deliberately excluded — they are
words, and a model already inclined to write text on an album cover does not
need encouragement. The negative prompt leads with text, typography and
watermarks for the same reason.

**Voice avatars** come from the voice's *notes* field, falling back to its name.
So a voice annotated "gravelly old sea captain, mid-Atlantic accent" gets a
portrait of one, and a voice called "Voice 3" with no notes gets very little.
Filling in notes is the whole input. They render as stylised illustration rather
than photoreal portraits: a photographic face implies a real person who agreed
to be the face of a cloned voice, and there isn't one.

Prompts are built deterministically rather than through the prompt assistant, so
artwork works with the LLM off, and redrawing a cover gives you another take on
the same subject instead of a different subject.

## When it runs

By default, only when you ask: a **Draw cover** action on a music track, and an
**Avatar** action on a voice. There is a *Draw covers automatically* switch that
queues a cover after each music render.

It is off by default, and the reason is worth stating: the image model wants the
same VRAM the audio model is holding. Artwork is queued strictly after the
generation it decorates has finished and been saved, never between you and your
audio, and a failed render is logged rather than surfaced as a failed
generation. The engine is also stopped after the same idle period that unloads
audio models (`auto_unload_minutes`), so it isn't sitting on a gigabyte of VRAM
between covers.

## Where images live

```
<data dir>/artwork/<uuid>.png
```

Served at `/artwork/<file>`, referenced from a sound's `artwork` field and a
voice's `artwork` field. Derived and disposable: deleting the directory costs
you pictures and nothing else. Redrawing writes a new file and removes the old
one only once the new one exists, so a failed redraw leaves the cover you had.

## API

```
GET    /api/image/status                     engine, model, catalog, detected endpoints
POST   /api/image/engine/install             -> 202 { job_id }
POST   /api/image/models/{id}/download       -> 202 { job_id }
DELETE /api/image/models/{id}                -> 204
POST   /api/sounds/{id}/artwork              -> 200 Sound (with artwork set)
DELETE /api/sounds/{id}/artwork              -> 204
POST   /api/voices/{id}/artwork              -> 200 Voice
DELETE /api/voices/{id}/artwork              -> 204
```

`status.ready` is the single value the UI hides its draw actions behind — it
folds in the mode, whether the engine is installed and whether the checkpoint is
downloaded, so a button never appears that was always going to fail.
`status.detail` says which of those is missing, in words.

Installs are jobs because they are gigabytes; generation is synchronous because
a turbo render is seconds and a job per cover would bury the jobs people
actually watch.
