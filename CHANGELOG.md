# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Updates in the desktop app.** On launch, an installed copy checks for a
  newer release and offers to install it and restart. Models and projects are
  kept. Copies installed before this version need one manual download to get
  it.

### Fixed

- **GPU name and VRAM on NVIDIA.** `/api/health` reports the GPU's name and
  its total and free VRAM from `nvidia-smi`, for the first GPU in
  `CUDA_VISIBLE_DEVICES` or GPU 0, so the sidebar, Settings and onboarding show
  them instead of only "cuda". Other GPUs still report `null`. (#17)
- **`SOUNDBOX_ALLOWED_HOSTS` behind a reverse proxy.** The server's `Host`
  check now accepts the names in `SOUNDBOX_ALLOWED_HOSTS`, so `soundbox` on
  `127.0.0.1` behind Caddy or nginx no longer answers 403 "Forbidden host" to
  every request. Before, the variable only reached CORS and `/mcp`. A bare
  `host` matches any port and `host:port` only that port, the same in every
  check. (#22)
- **Dev mode from another machine.** `npm run dev` passes
  `SOUNDBOX_ALLOWED_HOSTS` to Vite's `server.allowedHosts`, and a new
  `SOUNDBOX_DEV_HOST` sets the address Vite listens on. Both are unset by
  default, which keeps the dev UI on localhost. (#22)

## [0.2.0] - 2026-10-23

### Added

- **Compare voices.** The Voice Lab reads one line in two to four voices side
  by side, so a cast can be chosen by ear.
- **A new look.** Graphite surfaces with a faint teal cast, teal kept for what
  is sounding, selected or focused, each sound's own envelope as its icon, and
  mono numerals for times, seeds and sizes. Applied through the shared
  components, in both themes.
- **MCP progress notifications.** Tools that wait on a job (`generate`,
  `speak`, `speak_story`, `separate`, `export_story` and the rest) send
  `notifications/progress` when the request carries a `progressToken`, so a
  client with a short tool-call timeout no longer drops a long music render.
- **Docker.** `docker compose up -d --build` runs the server and web UI
  headless with the audio.cpp runtime inside; CPU by default, CUDA with
  `docker-compose.cuda.yml`. See `docs/INSTALL.md#docker`.
- 19 opt-in catalog entries for models that audio.cpp 0.9.2 runs: MiDashengLM-Gen
  and ControlFoley (sound effects), ACE-Step 1.5 XL Turbo and SFT, HTDemucs
  6-stem, MeanVC2, and TTS from Chatterbox Turbo, Kokoro, CosyVoice 3, Maya1,
  BreezeTTS 2, FireRedTTS3, VoxCPM 1, KittenTTS, MagpieTTS, KugelAudio,
  Irodori v4.1 Anime and Soprano. MiDashengLM-Gen, HTDemucs 6-stem and
  Chatterbox Turbo were run end to end. See `docs/new-models-2026-10.md`.
- `duration_option` catalog field, for a `gen` family that takes its length
  under its own option name. A `gen` entry with `supports.steps` or
  `supports.cfg` false is no longer sent a step count or guidance scale.
- **Several clips per voice.** A cloned voice can hold up to five clips of the
  same speaker, added by upload or recording in the Voice Lab's Clips dialog or
  by `POST /api/voices/{id}/samples`. They are levelled and joined into the one
  reference the model reads.
- **Reference clip checks and tidying.** A clip under 1 s, over 60 s or almost
  silent is refused with a reason. "Tidy the clip" cuts silence off the ends and
  pulls back a clipping peak, without making the clip louder.
- **Per-voice history.** Each voice card shows how many sounds were read in it
  and opens them; `GET /api/sounds?voice_id=` and the MCP `list_sounds` tool
  filter by voice.
- **Voice export and import** as a `.soundbox-voice.json` file with the clips
  inside.

### Fixed

- A line cast to a cloned voice is read on the model that voice was made on
  when no model is passed, instead of whichever model happened to be ready.
  In a story with mixed voices, each line uses its own voice's model.
- After the audio.cpp server restarts, a model Soundbox thought was still
  loaded is reloaded instead of every request failing with "unknown model id".
- `soundbox model install audiocpp` handles audio.cpp 0.9.x releases. It
  fetches the `cudart` runtime package beside a CUDA build. It picks the CUDA
  build the driver supports, matches Linux's `ubuntu` assets, and skips the
  `lib`, config and Colab packages, which contain no CLI.

## [0.1.0] - 2026-10-07

Initial public release, MIT-licensed. Everything below is new.

### Added

- **Sound effects** from a text prompt, with duration, seed, steps, CFG and
  negative prompt exposed; every generation is saved with its parameters so it
  can be regenerated, varied or reused.
- **Music**, instrumental or sung from a `[verse]`/`[chorus]` lyric sheet, with
  extend, cover and repaint on models that support them, and stem separation
  into drums, bass, vocals and other.
- **Speech and voices**: text-to-speech, voice cloning from a clip or the
  microphone, voice conversion, and a Voice Lab whose voices are cast onto
  lines of a multi-character script.
- **Studio**: a multi-track timeline with per-track effects, MIDI input, a
  piano roll, recording and one-click mixdown, plus an assistant chat that
  proposes edits as a plan you confirm.
- **MCP server** (21 tools) for Claude Code, Cursor and other MCP clients, an
  Agents page showing every call each client made, and an **HTTP API**
  (see `docs/API.md`).
- **Local model runtime** via [audio.cpp](docs/AUDIOCPP.md): one managed
  native binary with CUDA/HIP/Metal/Vulkan/CPU backends, no Python required.
- **Licences up front**: each model's licence and commercial-use status is
  shown before download, and non-commercial weights need explicit confirmation.
- **Local library**: one SQLite file and a folder of WAVs under `~/.soundbox`;
  works offline once weights are downloaded.
- **Desktop app** for Windows and macOS (Apple silicon and Intel), built on
  Tauri 2: an installer that carries its own Node and server, starts and
  supervises the server, and stops it on exit. Not signed yet.
- Optional local **artwork** (cover art, voice avatars) via stable-diffusion.cpp.

### Security

- Native binaries (`audiocpp_cli`, `llama-server`, `sd-server`) are verified
  against a published SHA-256 before install; unverifiable downloads are refused
  unless `SOUNDBOX_ALLOW_UNVERIFIED_BINARIES=1` is set.
- The server binds to loopback by default, rejects non-loopback `Host` headers,
  trusts only an allowlist of browser origins (its own, the Vite dev server and
  `SOUNDBOX_ALLOWED_HOSTS`), and requires JSON or an `X-Soundbox` header on
  mutating API requests.

[Unreleased]: https://github.com/HamSanders/soundbox/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/HamSanders/soundbox/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/HamSanders/soundbox/releases/tag/v0.1.0
