# Desktop app (Tauri)

Soundbox ships as a web app you run locally. The desktop shell is a thin
wrapper around exactly that — no second copy of the UI, no separate API.

## How it works

```
┌─────────────────────────────────────────────────────┐
│ Tauri (Rust)                                        │
│  ├── spawns  node server/dist/cli.js --port 17494   │
│  ├── waits for /api/health                          │
│  └── webview ──► http://127.0.0.1:17494             │
└─────────────────────────────────────────────────────┘
```

The server already serves the built frontend at `/`, the HTTP API under
`/api`, and the MCP server at `/mcp` — all on one port. So the desktop app has
one job: start that server and point a window at it. Everything you see after
the splash screen is the same app that runs in a browser, which means the
desktop build cannot drift from the web build.

`src-tauri/splash/` is the only markup the shell owns: a standalone loading
screen shown while the server starts. It is also what `tauri.conf.json` names
as `frontendDist`, so the shell compiles without a prior web build.

**The UI must be staged into the server first.** `scripts/build.mjs` builds
the app and copies `app/dist` into `server/web/`, and the server serves it
from there. Skip that and the window shows a JSON stub saying the UI is not
bundled — the server is working fine, it just has nothing to serve. The
`desktop` and `desktop:build` scripts both run the build first.

## Running it

```bash
npm run desktop
```

Builds the frontend, stages it, builds the server, then compiles and launches
the shell. First compile pulls the whole Tauri dependency tree — several
minutes. After that it is seconds.

To produce an installer:

```bash
npm run desktop:build
```

## What this build does and does not do

**Does:** launch and supervise the server, adopt an already-running server on
port 17494 instead of starting a second one (so it coexists with
`npm run dev`), and stop the server when the window closes — including on a
crash or force-kill, via a Windows job object, because a graceful-shutdown
handler cannot run if the process is terminated and an orphaned server keeps
holding the GPU and the port.

**Does not:** bundle a Node runtime or the server. This shell runs against a
real checkout. It finds the checkout by walking up from the executable (then
the working directory) looking for `server/package.json`, or takes
`SOUNDBOX_PROJECT_ROOT`. It then runs `server/dist/cli.js` with the Node it
finds — `SOUNDBOX_NODE` if set, otherwise `node` on `PATH` — and if there is no
build yet, falls back to running `server/src/cli.ts` with the workspace's
`tsx`. Shipping an installer to someone with no Node is the next piece of work
and is deliberately not pretended-at here.

**Does not:** bundle model weights, and should not. They are gigabytes, they
come from Hugging Face under the user's own account, and several models are
non-commercial or gated — see the licence table in the README. Weights stay a
user-directed download from the Models screen exactly as in the web app.

## Environment

| Variable | Purpose |
|---|---|
| `SOUNDBOX_NODE` | Node interpreter to run the built server with. Overrides the `PATH` lookup. |
| `SOUNDBOX_PROJECT_ROOT` | Where the checkout lives, if the shell cannot find it by walking up from the executable. |
| `SOUNDBOX_DATA_DIR` | Inherited by the server — library, weights, logs. |

The port is fixed at 17494 in the shell. Every other server variable in
[INSTALL.md](./INSTALL.md#environment-variables) is inherited the same way.

## Prerequisites

Node 22.12+ (the same as for the web app), Rust (stable), plus the platform
toolchain Tauri needs:

- **Windows** — MSVC Build Tools and the WebView2 runtime (present by default on Windows 11).
- **macOS** — Xcode command line tools.
- **Linux** — `webkit2gtk` 4.1 and friends; see the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

## Known gaps

- **No code signing.** Unsigned builds get a SmartScreen warning on Windows;
  on macOS, Gatekeeper blocks unsigned apps outright rather than warning, so a
  macOS release needs an Apple Developer account ($99/yr) and notarization
  before it is distributable at all.
- **macOS is unverified.** Every model runs through
  [audio.cpp](./AUDIOCPP.md), which has a Metal backend, but none of the
  verified-status claims were made on a Mac. Web MIDI is unavailable in the
  macOS desktop shell.
- **Auto-update is not wired up.** Tauri has an updater plugin; it should
  cover the app shell only, never the weights.
