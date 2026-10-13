# Installing

Soundbox's base install contains no model runtimes at all — no torch, no GPU
Python wheel to match to your hardware. Every model runs through
[audio.cpp](AUDIOCPP.md), a native binary with its own CUDA/HIP/Metal/Vulkan/
CPU backends, selected automatically at install time. Above it there is no
Python at all: the server is TypeScript on Node — Fastify, with the MCP
server mounted in the same process.

## Requirements

- **Node 22.12+** and `git` — everything you need for the server, the web app,
  the CLI and the MCP server. The repo's `.nvmrc` says `22`, so `nvm use`
  picks a matching version.
- **For the desktop shell only** (`npm run desktop` / `npm run desktop:build`):
  **Rust** (stable toolchain, installed with [rustup](https://rustup.rs)) and
  the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for
  your OS — on Windows, Microsoft C++ Build Tools and WebView2 (preinstalled
  on Windows 11); on macOS, Xcode Command Line Tools; on Linux,
  `webkit2gtk` 4.1 and the other system packages listed on that page. See
  [DESKTOP.md](DESKTOP.md).
- Optional: `ffmpeg` on `PATH` for MP3 export.

## Running the `soundbox` CLI from a clone

The CLI is not published to npm, so every `soundbox …` command on this page
runs from your checkout. After `npm install` at the repo root, either build
once and use the linked binary:

```bash
npm run build          # builds the app and the server into server/dist
npx soundbox --help    # from the repo root; npm links the bin there
```

or skip the build and run the TypeScript source directly:

```bash
npx tsx server/src/cli.ts --help
```

Both take the same subcommands. `npx soundbox` with no subcommand starts the
server; `npm run dev` does that too, plus the Vite dev server for the UI.

## Step 1: the audio.cpp runtime

```bash
soundbox model install audiocpp
```

Downloads and verifies a prebuilt `audiocpp_cli` for your platform. Check what
landed with `soundbox model status audiocpp`. To point at a binary you built
or downloaded yourself instead, set `SOUNDBOX_AUDIOCPP_BIN`.

Verify with `GET /api/health` — `device` reflects whatever backend the binary
picked.

## How the native binaries are managed

Soundbox ships no native binaries and vendors none. There are three, all
fetched from upstream GitHub releases on demand and cached under your data
directory:

| Binary | Upstream | What it is | When it's fetched |
|---|---|---|---|
| `audiocpp_cli` | [`0xShug0/audio.cpp`](https://github.com/0xShug0/audio.cpp) | the audio inference runtime | `soundbox model install audiocpp` |
| `llama-server` | [`ggml-org/llama.cpp`](https://github.com/ggml-org/llama.cpp) | the optional prompt assistant | `soundbox model install llm`, and only when the prompt assistant is set to *managed* |
| `sd-server` | [`leejet/stable-diffusion.cpp`](https://github.com/leejet/stable-diffusion.cpp) | the optional artwork generator | when you turn artwork on in the setup wizard or Settings → Generation (`POST /api/image/engine/install`) |

Nothing is downloaded until you ask for it, and nothing is installed
system-wide — this is a per-user cache, so uninstalling is still deleting a
folder.

```
<data dir>/bin/audiocpp/<version>/    audiocpp_cli, plus any companion runtime libraries
<data dir>/bin/llama/<version>/       llama-server, same layout
<data dir>/bin/sd/<version>/          sd-server, same layout
```

All three live beside `models/`, not inside it, so runtimes and weights are cleared
independently: deleting every model you have downloaded should not cost you the
engine, and reinstalling the engine should not cost you 40GB of weights. Each
version gets its own directory and the most recently installed one wins, so an
upgrade never half-overwrites the copy you are running.

Downloads are checksum-verified before anything is unpacked: against GitHub's
own SHA-256 digest for the asset, and against the release's checksum manifest
when it publishes one. An asset that neither covers is refused rather than
installed unverified. If you need to install such a release anyway, set
`SOUNDBOX_ALLOW_UNVERIFIED_BINARIES=1` for that run — or download the binary
yourself and point the environment override below at it.

### Resolution order

When Soundbox needs one of these binaries it checks, in order:

1. the environment override — `SOUNDBOX_AUDIOCPP_BIN`,
   `SOUNDBOX_LLAMA_SERVER_BIN` or `SOUNDBOX_SD_SERVER_BIN`, an absolute path to
   a binary of yours;
2. the managed install under `<data dir>/bin/`;
3. `PATH`;
4. on macOS, `/opt/homebrew/bin` and `/usr/local/bin` directly — a server
   spawned by a desktop launcher often inherits a `PATH` with no Homebrew in
   it, even though `brew install` put the binary exactly where a `PATH` lookup
   should have found it.

The managed install is checked before `PATH` deliberately: someone who just ran
the installer should get what they installed, not a stray system-wide copy.

The backend is detected per machine (Metal on Apple silicon, CUDA where
`nvidia-smi` answers, Vulkan or CPU otherwise) and decides which release asset
is downloaded. Override the detection with `SOUNDBOX_AUDIOCPP_BACKEND`,
`SOUNDBOX_LLAMA_SERVER_BACKEND` or `SOUNDBOX_SD_SERVER_BACKEND`, or pin the download itself with `--backend`
and `--version` on `install`. See
[AUDIOCPP.md](AUDIOCPP.md#choosing-a-backend).

### Checking and installing

```bash
soundbox model status audiocpp                 # version, backend, resolved path
soundbox model install audiocpp
soundbox model install audiocpp --backend cuda --version 0.6.1

soundbox model status llm
soundbox model install llm                     # engine plus the default model
soundbox model install llm --engine-only       # engine only, no weights
```

`status` tells you whether the binary is ours or yours: a managed install
reports its version, a bring-your-own one reports `external (env)` or
`external (PATH)`. We do not report a version for a binary we did not install —
inferring one from a directory name would be a guess presented as fact.
`soundbox model status llm` also lists the prompt-assistant models and whether
each is downloaded.

For the bring-your-own routes in detail — prebuilt packages, the Homebrew tap,
building from source — see
[AUDIOCPP.md](AUDIOCPP.md#using-a-binary-you-already-have).

## Step 2: models

```bash
soundbox list                                            # the catalog
soundbox pull audiocpp-stable-audio-3-sfx                 # download weights
soundbox run  audiocpp-stable-audio-3-sfx "glass breaking" --out test.wav
```

or use the Models page in the app — same catalog, same downloads. No account
is needed for the audio models; see Step 3 for the one download that does.

Downloads are what actually lands on disk: each model is an audio.cpp package
of GGUF files (the catalog entry's `weights_glob` names them), not a whole
Hugging Face repo, so nothing is fetched that the runtime will not load.

The catalogue has two tiers. **Listed** models appear in the picker and are
ready to download. **Extras** are catalogued but hidden until you enable them
in Settings, under "Enable more models" on the Models page — they run through
the same code path, and enabling one adds it to the picker immediately.

Every model shows its licence before you download it. Open weights and
permission to sell what they make are separate questions, and some of these
models answer the second one with no.

## Step 3: gated models

The audio models come from audio.cpp's GGUF repo
(`audio-cpp/audio.cpp-gguf`), which is not gated — their licences still apply,
but there is nothing to sign. The optional artwork model, Stable Diffusion 3.5
Medium, is gated on Hugging Face, as is any custom catalog entry pointing at a
gated repo. Soundbox cannot accept the terms for you.

1. Sign in to Hugging Face and accept the licence on the model page
   (`huggingface.co/stabilityai/stable-diffusion-3.5-medium`).
2. Create a **read** token at <https://huggingface.co/settings/tokens>.
3. Paste it into Settings in the app (or set `HF_TOKEN` in your environment).

The token is stored in `~/.soundbox/settings.json` and is never returned by the
API — `GET /api/settings` reports only the boolean `hf_token_set`.

## Optional extras

There is nothing left to install here. Loudness normalisation used to be a
Python extra (`pyloudnorm`); it is now an EBU R 128 meter written in
TypeScript in `server/src/audio/dsp.ts`, so it is simply on. When metering
fails on a pathological input the code falls back to peak normalisation and
says so in the log rather than refusing the file.

MP3 export needs `ffmpeg` on `PATH`. Without it, `/files/{id}.wav?format=mp3`
returns 501 and WAV still works.

## Where things go

```
~/.soundbox/
  soundbox.db     library index
  sounds/         generated WAVs (move this one on its own from Settings)
  cache/          mp3 transcodes
  models/         model weights (HF cache lives here)
  bin/audiocpp/   the audio.cpp runtime, one directory per version
  bin/llama/      the prompt-assistant engine, same layout
  bin/sd/         the artwork engine, same layout
  soundbox-<port>.log   the server log (rotated)
  settings.json   settings, including the HF token
```

Uninstalling is deleting that folder. Override the location with
`SOUNDBOX_DATA_DIR` or `soundbox --data-dir`. Moving the folder is safe —
already-downloaded weights are picked up in the new place and an interrupted
download resumes rather than restarting.

The sounds folder is the one piece that moves on its own: Settings → Storage
→ **Sounds folder** points new and existing audio at any path you like, so
the library can live on a big or backed-up disk while the weights stay put.
**Browse** opens a folder picker over the filesystem of the machine running
the server, which is the one that matters — and a folder that does not
exist yet is a fine answer, it gets created on save.

## Windows notes

**Keep the data directory path short.** The Hugging Face cache layout adds
about 130 characters to whatever `SOUNDBOX_DATA_DIR` is, and Windows caps
paths at 260 unless long paths are enabled. Past that limit a download dies
partway through with *"The system cannot find the path specified"* — which
sends you looking for a missing directory that is actually there. Soundbox
recognises this and tells you so, but the fix is one of:

- use a short data dir: `set SOUNDBOX_DATA_DIR=C:\soundbox` (the default
  `%USERPROFILE%\.soundbox` is short enough for a normal username), or
- enable long paths once, in an **admin** PowerShell, then reboot:

  ```powershell
  New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force
  ```

Files already downloaded are kept; move the folder and the download completes.


## Troubleshooting

**Where the logs are.** Every run writes a rotating log file to
`<data_dir>/soundbox-<port>.log` (3 x 10MB, so `.1`/`.2` may exist too)
alongside the console output — `soundbox --data-dir` or `SOUNDBOX_DATA_DIR`
control where that is, and the server prints the exact path at startup. Every
job-related line is tagged with its job id, so
`grep <job-id> soundbox-17494.log` reconstructs the whole story of one generation.
If you'd rather not shell in, `GET /api/logs?lines=200` returns the tail of
the same file as JSON.

**A job sits in "Queued" for a long time (looks stuck, but isn't).** The job
queue is a strict single-worker FIFO — the GPU can only do one generation at
a time, so everything behind the current job genuinely waits its turn. `GET
/api/jobs/{id}` (and the app's job panel) reports `queue_position` and a
rough `eta_s` for queued jobs. Check what's currently `running` via `GET
/api/jobs` (or the log file) before assuming something is wrong.

**A sound plays but you hear nothing, and the clock stays at 0.0s** — the
output device your browser is using has stopped consuming audio. A wireless
headset that is powered off or out of range is the usual cause: the endpoint
stays "present" in Windows, so `play()` succeeds, the button flips to Pause,
and no error is raised anywhere — the position simply never advances. Soundbox
detects this and says so. Go to **Settings → Playback device**, pick another
output, and hit **Play test tone** to confirm.

**The UI loads but the Models page is empty / everything 502s** — the backend
is not running. Vite is serving the frontend on 5174 but its proxy target on
17494 is dead. `npm run dev` from the repo root starts both; if you started
Vite alone (`npm run dev:ui`), start the backend separately.

**`soundbox model status audiocpp` says not installed** — run
`soundbox model install audiocpp`, or set `SOUNDBOX_AUDIOCPP_BIN` to a binary
you built or downloaded yourself.

**A model says Installed but Load fails** — the download was interrupted and
the cache is partial. Hit Download again; it resumes. (Soundbox writes a
completion marker at the end of a download and won't call a model installed
without it, so this should be rare.)

**CUDA out of memory** — only one model is resident at a time, but a long clip
can still exhaust a small card. Shorten the clip, or unload it.

**Downloads fail with 401/403** — a gated repo whose terms you have not accepted,
or a missing token. See step 3.

**MCP client can't connect** — the endpoint is `http://127.0.0.1:17494/mcp` with
no trailing slash. If you bound a non-loopback host with `--host`, also set
`SOUNDBOX_ALLOWED_HOSTS=your.host:port` (the exact `Host` header clients send),
or the MCP endpoint's DNS-rebinding check answers 403.

## Environment variables

Server-side variables are read by the process running `soundbox` (or
`npm run dev`, or the desktop shell, which passes its environment through).

| Variable | Read by | What it does |
|---|---|---|
| `SOUNDBOX_DATA_DIR` | server | Install root. Default `~/.soundbox`; `--data-dir` does the same per run. |
| `SOUNDBOX_AUDIOCPP_BIN` | server | Absolute path to an `audiocpp_cli` of yours; nothing is downloaded. |
| `SOUNDBOX_LLAMA_SERVER_BIN` | server | Same, for `llama-server`. |
| `SOUNDBOX_SD_SERVER_BIN` | server | Same, for `sd-server`. |
| `SOUNDBOX_AUDIOCPP_BACKEND` | server | Force the audio.cpp backend instead of auto-detecting (`cuda`, `hip`, `metal`, `vulkan`, `cpu`). |
| `SOUNDBOX_LLAMA_SERVER_BACKEND` | server | Same, for the `llama-server` download. |
| `SOUNDBOX_SD_SERVER_BACKEND` | server | Same, for the `sd-server` download. |
| `SOUNDBOX_ALLOW_UNVERIFIED_BINARIES` | server | `1` installs an engine archive that no published SHA-256 covers. Off by default; a checksum *mismatch* is refused regardless. |
| `SOUNDBOX_ALLOWED_HOSTS` | server | Comma-separated `host` or `host:port`. Adds trusted browser origins (CORS and the MCP `Origin` check) and exact `Host` values the MCP endpoint accepts. See [SECURITY.md](https://github.com/Gadurp1/soundbox/blob/main/SECURITY.md). |
| `PORT` | server, Vite | The Vite dev server's port (default 5174); the server also trusts it as a dev origin. |
| `HF_TOKEN` / `HUGGING_FACE_HUB_TOKEN` | server | Hugging Face token for gated models, used when none is saved in Settings. |
| `HF_HOME` | server | Hugging Face cache location. Left alone if set; otherwise Soundbox points it at `<data dir>/models`. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | server | OpenTelemetry collector for MCP call traces and metrics. Wins over the Settings value. |
| `SOUNDBOX_URL` | stdio MCP bridge | Where the running server is. Default `http://127.0.0.1:17494`. |
| `SOUNDBOX_PORT` | `npm run dev`, Vite | Port `scripts/dev.mjs` starts the server on, and the port Vite proxies `/api`, `/mcp`, `/files` and `/artwork` to. Default 17494. The `soundbox` CLI itself takes `--port`. |
| `SOUNDBOX_NODE` | desktop shell | Node interpreter to run the built server with, if `node` is not on `PATH`. |
| `SOUNDBOX_PROJECT_ROOT` | desktop shell | Path to the checkout, if the shell cannot find it from its own location. |
| `VITE_MOCK` | app build | `1` runs the UI against the in-browser fake backend (`npm run dev:mock` sets it). |
| `VITE_REPO_URL` | app build | Repository URL used in the app's links. Default `https://github.com/Gadurp1/soundbox`. |
| `VITE_SITE_ORIGIN` | app and site builds | Absolute origin for canonical URLs and the site's RSS feed. |

The server sets `SOUNDBOX_LOG_FILE` for its own use; you do not need to.
