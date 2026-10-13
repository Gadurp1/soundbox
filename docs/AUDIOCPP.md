# audio.cpp

audio.cpp is the inference engine behind most of the models Soundbox runs. It
is a [ggml](https://github.com/ggerganov/ggml)-based C++ runtime that
implements 50+ audio model families behind a single CLI, with CUDA, HIP, Metal,
Vulkan and CPU backends — and **no Python in the inference path**.

That last part is the reason it matters. A model that runs through audio.cpp is
a catalogue entry: an id, a repo, a few defaults. A model that does not is a
Python stack with its own torch pin, which sooner or later cannot coexist with
the others and needs a sidecar process to keep the peace.

## Installing it

Soundbox manages the binary for you:

```bash
soundbox model install audiocpp   # download, verify, cache
soundbox model status audiocpp    # what is installed, and which backend
```

The installer picks a release asset for your OS and GPU, verifies its SHA-256
against GitHub's asset digest and the release's checksum manifest, and caches it
under
`<data dir>/bin/audiocpp/<version>/`. An asset with no published checksum is
refused unless you set `SOUNDBOX_ALLOW_UNVERIFIED_BINARIES=1`; a mismatch is
always refused. Override the choice if you need to:

```bash
soundbox model install audiocpp --backend cuda   # cuda | hip | metal | vulkan | cpu
soundbox model install audiocpp --version 0.6.1
```

From there the CLI works without the server or web app running:

```bash
soundbox list                                       # the catalogue, with download status
soundbox pull audiocpp-stable-audio-3-sfx
soundbox run  audiocpp-stable-audio-3-sfx "glass breaking on concrete" --out test.wav
```

`run` offers to pull a model you have not downloaded; pass `--yes` to skip the
prompt.

### Using a binary you already have

Prebuilt Windows CUDA and CPU packages are on the
[releases page](https://github.com/0xShug0/audio.cpp/releases). macOS has
`brew tap 0xShug0/audio-cpp && brew install audio-cpp`. On Linux, build with
`scripts/build_linux.sh --backend cuda --target audiocpp_cli`.

Point Soundbox at it, or put `audiocpp_cli` on your `PATH`:

```bash
SOUNDBOX_AUDIOCPP_BIN=/path/to/audiocpp_cli
```

`soundbox model status audiocpp` reports which one it resolved and how — a
managed install shows its version, a binary of yours shows `external (env)` or
`external (PATH)`. The same three routes, in the same order, apply to the
prompt-assistant engine via `SOUNDBOX_LLAMA_SERVER_BIN` (`soundbox model
status llm`); on macOS both also check the Homebrew prefixes directly,
because a desktop launcher's `PATH` frequently omits them.

### Choosing a backend

Soundbox infers a backend and falls back to CPU. If it guesses wrong — or you
want to compare — force one:

```bash
SOUNDBOX_AUDIOCPP_BACKEND=cuda   # cpu | cuda | vulkan | metal | hip | best
```

A generation that is far slower than you expected is almost always a CPU
fallback. `soundbox model status audiocpp` tells you which backend is live.

## Where weights go

```
<models dir>/audiocpp/<model-id>/
```

Not the Hugging Face cache. The GGUF repos hold every family audio.cpp
supports, and Soundbox only wants the files for the model you asked for —
downloading into the shared cache would pull far more than you asked for.

## The model catalogue

The catalogue lives in `audiocpp_models_catalog.json`. Adding or correcting a
model is a JSON edit: no new dependency, no new adapter, no new environment.

Models come in two tiers:

- **Listed** models appear in the model picker.
- **Extras** are catalogued but hidden until you opt in, via the Models page's
  "Enable more models" section or
  `PATCH /api/settings {"enabled_audiocpp_models": ["…"]}`. Enabling one adds
  it to `GET /api/models` immediately — no restart.

`GET /api/models/audiocpp/catalog` returns the whole catalogue, all tiers.

### Bring your own model

The shipped catalogue is data, not code — and it does not have to live in this
repo. Anything in `<data dir>/models/custom.json` is loaded alongside it, same
shape:

```json
{
  "models": [
    {
      "id": "my-ace-step-finetune",
      "name": "ACE-Step (my finetune)",
      "vendor": "me",
      "description": "Q8 quantisation of my own finetune.",
      "family": "ace_step",
      "category": "music",
      "weights_path": "/models/ace-step-mine-q8_0.gguf",
      "max_duration_s": 240,
      "sample_rate": 44100,
      "channels": 2,
      "vram_estimate_mb": 8000,
      "defaults": { "duration_s": 30, "steps": 27, "cfg": 4.0 },
      "supports": { "seed": true, "steps": true, "cfg": true, "lyrics": true },
      "license": { "name": "Apache-2.0", "commercial": "yes", "url": "https://…" }
    }
  ]
}
```

- `weights_path` is an **absolute** path to weights already on your disk — a
  file, or a directory for `weights_layout: "directory"`. Nothing is
  downloaded, and nothing is ever deleted: the file is yours, not Soundbox's.
- Or give `hf_repo` + `weights_glob` instead and it downloads like any shipped
  entry, into `<models dir>/audiocpp/<your id>/`.
- `family` must be one audio.cpp knows (`audiocpp_cli --list-loaders`). Every
  other field means what it means for a shipped entry — `defaults`,
  `supports`, `edit_routes`, `voice_ids`, `request_options` and the rest are
  documented above and read identically here.
- Omit `license` and the model is shown as **Unspecified / not commercial**.
  We have no basis to claim terms for weights on your disk, and a wrong
  permissive default is worse than an honest unknown.

Your entries are always on — writing one down is the opt-in, so there is no
second toggle in Settings — but never marked verified, since "verified" means
somebody ran it end-to-end through *this* adapter. They show in the app with
the same download/load flow as everything else, and `soundbox list` tags them
`[custom]`.

The file is re-read whenever it changes, so editing it while the server runs is
enough; no restart. A malformed file, or an entry missing `id`/`name`/`family`
or naming neither `weights_path` nor `hf_repo`, is skipped with a warning on
the server's console rather than taking the server down with it. An id that
matches a shipped model **replaces** it, which is the supported way to point an
existing model at your own quantisation.

Every entry declares its licence, and the UI shows it before you download.
"Open weights" and "you may sell what it makes" are separate claims, and some
of these models are non-commercial.

## Capabilities

Not every family does everything. The catalogue declares what each one
supports, and the app only offers what is declared.

| Capability          | Notes                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| Generation          | Duration, steps, guidance and seed are common across `gen` loaders        |
| Lyrics              | Lyrics-conditioned vocal models (ACE-Step). Some *require* lyrics — see below |
| Separation          | `htdemucs`, `bs_roformer`, `mel_band_roformer` split a mix into stems     |
| Extend              | Continue a clip past its end, with the original kept bit-for-bit         |
| Cover               | Re-render a clip in a new style, at the source's length                  |
| Repaint             | Regenerate a window inside a clip                                        |

Negative prompts are not available on this path: no family exposes a flag for
them, so Soundbox does not pretend to offer one.

### Lyrics

A lyrics-conditioned model takes the sung words separately from the prompt: the
prompt sets genre and production, the lyrics are what is sung. Some models —
MiniMax Music 3 among them — **refuse to run without lyrics at all**. For those,
Soundbox supplies an explicit `[instrumental]` marker when you give none, rather
than surfacing an error you can do nothing about.

### Separation

Separation is its own task mode rather than a variety of generation. Two
constraints are worth knowing because they produce confusing errors otherwise:

- The source is passed as the **audio input**, not as a reference input. The
  reference input exists for voice conversion and style transfer, and using it
  for plain separation fails with an unrelated-sounding contract error.
- **htdemucs requires exactly 44.1 kHz.** Anything else fails with a sample-rate
  mismatch, so Soundbox resamples the source to the model's rate before
  invoking it — a 48 kHz ACE-Step render being split is the common case.

htdemucs emits four stems: `vocals`, `drums`, `bass`, `other`.

### Audio-to-audio routes

Three of them, all on models that declare support:

| Route     | What you get                                                                  |
| --------- | ----------------------------------------------------------------------------- |
| `extend`  | The source unchanged, followed by new material up to the target length         |
| `cover`   | The clip re-rendered in the style of a new prompt, locked to the source's length |
| `repaint` | A window inside the clip regenerated, with a strength and a mode               |

`repaint` is what the sound editor's Repaint tool runs on a highlighted range
(`POST /api/repaint`, or `generate` with `edit: "repaint"`).

Extend is implemented as a repaint whose window starts past the end of the
source, which is why the original survives sample-for-sample rather than being
re-rendered. `cover` takes a strength that sets how closely it follows the
original.

The source is resampled to the model's rate first, as with separation.

## Adding a model

Most models are a single GGUF file, and a catalogue entry naming the repo and
the file pattern is enough. Two cases need more care.

### Package models

Some models ship a *directory* of components rather than one file — MiniMax
Music 3 has five (condition encoder, language model, transformer, RVQ depth
decoder, vocoder) plus config and tokenizer JSON. Handing the largest file to
the loader would silently drop the rest.

Two catalogue fields cover this, both defaulted so existing entries are
unaffected:

- `weights_layout: "file" | "directory"` — `"directory"` passes the whole
  weights directory to the loader.
- `weights_required: string[]` — every file that must be present. The model
  counts as downloaded only when all of them are, so a half-finished download
  reports "not downloaded" instead of failing deep inside ggml.
- `weights_root: string` — the repo-relative subdirectory that is the
  package's real root, for a package living under a prefix inside a shared
  repo. audio.cpp's own downloader strips the prefix (`strip_prefix` in the
  package spec); Soundbox preserves repo paths, so `--model` has to point at
  the subdirectory. MiniMax H3's `MiniMax-H3-Q4-GGUF/` prefix inside the
  shared registry repo is the case that needs it; MiniMax Music 3's dedicated
  repo does not.

`weights_glob` accepts a list, which is what keeps a download bounded: one of
these repos is 58 GB and the entry pulls 8.45 GB of it.

### Component filenames are not yours to choose

This is the part that costs an afternoon if you do not know it. For a package
model, the loader reads its component filenames from a package spec **compiled
into the binary**, and it checks those files exist *before it parses any
option*. Overriding a component path with a session or load option does not
work — the check has already failed.

So the catalogue entry has to mirror whatever package the installed binary
ships. Read it out of the binary rather than guessing; the spec is embedded as
plain JSON:

```bash
node -e "const d=require('fs').readFileSync('audiocpp_cli.exe','latin1'); const i=d.indexOf('minimax_music3_q4_0'); console.log(d.slice(i-3000,i+1500))"
```

Two traps in what you find there. The package's name says nothing about its
contents being uniform — a "q4_0" package can ship a q8_0 component. And the
per-component option defaults in the same spec can disagree with the package's
own file list. **Trust the `files` array**, not the name and not the defaults.

## How Soundbox drives it

- **Loading resolves paths; it does not fill VRAM.** Residency belongs to the
  child process, per generation.
- **Cancelling a job kills the child.** An orphaned process would hold a GPU
  that Soundbox believes is free, and the next job would contend for it.
- **A failed run surfaces the child's own last lines.** A ggml error you could
  act on is worthless if it is replaced with "generation failed".
- **The binary is never auto-installed as part of a model download.** It is a
  native binary; offering an in-app install would produce failures you cannot
  act on. `soundbox model install audiocpp` is explicit for that reason.

Adapter tests drive a fake CLI speaking the same protocol, so they cover the
integration without the real binary or real weights.
