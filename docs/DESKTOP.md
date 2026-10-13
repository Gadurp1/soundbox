# Desktop app (Tauri)

Soundbox ships as a web app you run locally. The desktop shell is a thin
wrapper around exactly that — no second copy of the UI, no separate API.

## Installing

Download the installer for your machine from the
[Releases page](https://github.com/Gadurp1/soundbox/releases):
`Soundbox_<version>_x64-setup.exe` for Windows, and the `.dmg` for macOS —
`aarch64` for Apple silicon, `x64` for Intel. The app carries its own Node and
server; nothing else needs installing. Model weights are still downloaded from
the Models screen on first use.

**The installers are not signed yet**, so the first launch asks you to
confirm:

- **Windows** — SmartScreen says it "protected your PC". Choose **More info →
  Run anyway**.
- **macOS** — the app is ad-hoc signed but not notarized, so macOS refuses the
  first open. Open **System Settings → Privacy & Security**, find the note
  about Soundbox and choose **Open Anyway**. If macOS instead calls the app
  "damaged", the download's quarantine flag is the cause:
  `xattr -dr com.apple.quarantine /Applications/Soundbox.app` clears it.

## How it works

```
┌──────────────────────────────────────────────────────────┐
│ Tauri (Rust)                                             │
│  ├── spawns  <node> <app>/server/dist/cli.js --port 17494│
│  ├── waits for /api/health                               │
│  └── webview ──► http://127.0.0.1:17494                  │
└──────────────────────────────────────────────────────────┘
```

`<node>` and `<app>` depend on where the shell is running:

| | Installed app | A checkout (`npm run desktop`) |
|---|---|---|
| Server | `$RESOURCE/app/server`, staged into the installer | `server/` in the checkout |
| Node | the one installed beside the app's executable | `SOUNDBOX_NODE`, else `node` on `PATH` |

The installed copy is laid out like the repo — `server/{dist,web,skills}`,
its production `node_modules`, and `README.md` plus `docs/` for the in-app
assistant — so the server finds everything relative to itself the same way
in both. It always runs on its own Node, because its native module
(`better-sqlite3`) was built for that Node's ABI.

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

## Building an installer

```bash
npm run desktop:build
```

This runs `tauri build` with `src-tauri/tauri.bundle.conf.json` merged in,
which does three things the plain config does not:

1. Runs `scripts/desktop-stage.mjs` first. It builds the app and server, copies
   them into `build/desktop/`, installs the server's production dependencies
   there at the versions in the root lockfile — fetching `better-sqlite3`'s
   prebuilt module for the bundled Node and the target's architecture — and
   downloads a pinned Node (checked against nodejs.org's published SHA-256)
   into `src-tauri/binaries/`.
2. Ships that Node as an `externalBin`, beside the app's executable.
3. Ships `build/desktop/` as the `app` resource directory.

They live in a separate file so that `cargo check`, `npm run desktop` and CI
do not need anything staged. The output is in
`src-tauri/target/release/bundle/` (or `target/<triple>/release/bundle/` with
`--target`). Cross-building is only supported where Rust and the bundler
support it; the release workflow builds each OS on its own runner.

**Releases** come from `.github/workflows/release.yml`: pushing a `v*` tag
builds Windows (x64) and macOS (Apple silicon and Intel) installers and
attaches them to a draft GitHub Release for a maintainer to publish. Running
the workflow by hand builds the same installers as artifacts without touching
Releases.

## What this build does and does not do

**Does:** launch and supervise the server, adopt an already-running server on
port 17494 instead of starting a second one (so it coexists with
`npm run dev`), and stop the server when the window closes — including on a
crash or force-kill, via a Windows job object, because a graceful-shutdown
handler cannot run if the process is terminated and an orphaned server keeps
holding the GPU and the port.

**Finds its server** in this order: `SOUNDBOX_PROJECT_ROOT`, then the copy
installed with the app, then a checkout found by walking up from the
executable (then the working directory) to `server/package.json`. In a
checkout with no build yet it falls back to running `server/src/cli.ts` with
the workspace's `tsx`.

**Logs** its own few lifecycle lines to `soundbox-desktop.log` in the system
temp directory (a release build on Windows has no console), including any
error the splash screen shows. Everything after the server starts is in the
server's own log in the data directory.

**Does not:** bundle model weights, and should not. They are gigabytes, they
come from Hugging Face under the user's own account, and several models are
non-commercial or gated — see the licence table in the README. Weights stay a
user-directed download from the Models screen exactly as in the web app.

## Environment

| Variable | Purpose |
|---|---|
| `SOUNDBOX_NODE` | Node interpreter to run the server with. Overrides both the bundled Node and the `PATH` lookup. |
| `SOUNDBOX_PROJECT_ROOT` | Run a checkout instead of the installed server — or point at one the shell cannot find by walking up. |
| `SOUNDBOX_DATA_DIR` | Inherited by the server — library, weights, logs. |

The port is fixed at 17494 in the shell. Every other server variable in
[INSTALL.md](./INSTALL.md#environment-variables) is inherited the same way.

## Prerequisites

None for the installed app. To build it: Node 22.12+ (the same as for the web
app), Rust (stable), plus the platform toolchain Tauri needs:

- **Windows** — MSVC Build Tools and the WebView2 runtime (present by default on Windows 11).
- **macOS** — Xcode command line tools.
- **Linux** — `webkit2gtk` 4.1 and friends; see the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

## Known gaps

- **No code signing yet.** See [Installing](#installing) for what that costs a
  user today, and [Signing](#signing) for what turns it on.
- **No Linux installer in releases.** `npm run desktop:build` can produce an
  AppImage on Linux, but the release workflow does not build one yet.
- **macOS is unverified.** Every model runs through
  [audio.cpp](./AUDIOCPP.md), which has a Metal backend, but none of the
  verified-status claims were made on a Mac. Web MIDI is unavailable in the
  macOS desktop shell.
- **Auto-update is not wired up.** Tauri has an updater plugin; it should
  cover the app shell only, never the weights.

## Signing

The release workflow signs whatever it has secrets for, and nothing else.

**macOS** — with an Apple Developer account ($99/yr), add these repository
secrets and the next tagged build is signed with your Developer ID and
notarized: `APPLE_CERTIFICATE` (the base64 of your exported `.p12`),
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD` (an app-specific password) and `APPLE_TEAM_ID`. A Developer ID
signature turns on the hardened runtime, under which Node's JIT and its loading
of `better-sqlite3` need the `com.apple.security.cs.allow-jit` and
`com.apple.security.cs.disable-library-validation` entitlements — check the
first signed build starts its server before publishing it.

**Windows** — an unsigned installer works, behind the SmartScreen prompt. A
code-signing certificate (Azure Trusted Signing is the cheapest current route)
removes it; Tauri's `bundle.windows.signCommand` is where it plugs in.
