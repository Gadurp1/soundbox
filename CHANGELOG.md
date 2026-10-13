# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/Gadurp1/soundbox/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Gadurp1/soundbox/releases/tag/v0.1.0
