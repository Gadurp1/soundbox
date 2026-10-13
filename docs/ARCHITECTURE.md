# How Soundbox is put together

Soundbox is a local audio workstation: a web app, an HTTP API and an MCP server,
all served by one process on one port, generating audio with open-weight models
that run on your own machine. Nothing leaves the box unless you export it.

This page is the map. It explains what the pieces are, where the boundaries sit
and why, so that a change lands in the right file.

## One process, one port

The server is a [Fastify](https://fastify.dev) app that serves four things:

| Path      | What it is                                                            |
| --------- | --------------------------------------------------------------------- |
| `/`       | The built web app — the whole UI, as static files                      |
| `/api/*`  | The HTTP API                                                          |
| `/mcp`    | The MCP endpoint an agent connects to                                 |
| `/files/*`| The audio itself, straight off disk                                   |

Everything on one origin means the app has no CORS story, the desktop shell has
one thing to launch, and an agent's MCP session and your browser session are
looking at the same database at the same moment.

The default port is **17494**.

## The repository

Three npm workspaces plus a Rust shell:

```
soundbox/
├── app/        the web app: React 19, Vite, Tailwind v4, shadcn/ui
├── server/     the server: Fastify, better-sqlite3, the model adapters
├── site/       the public static site, built from app/ components
├── src-tauri/  the desktop shell
├── docs/       these pages
└── scripts/    dev, build, and the content generators
```

`app/` and `site/` are two build targets over **one source tree**. The site
imports the app's components through the `@/*` alias and prerenders them to
static HTML, so a page like `/sfx` is written once and shipped twice: as part of
the app, and as a crawlable page with no backend behind it. See
[the site build](#the-public-site) below.

## Where your data lives

Everything is under one directory — `~/.soundbox` by default, or wherever
`SOUNDBOX_DATA_DIR` points:

```
~/.soundbox/
├── soundbox.db      SQLite: every row of metadata
├── sounds/          one .wav per generated sound
├── models/          downloaded weights (GGUF and friends)
├── cache/           model and download scratch
└── settings.json    your settings
```

Two things follow from this. **A sound is a file plus a row** — the row carries
the prompt, the model, the seed and the peaks; the file is plain WAV you can open
in anything. And **backing up is copying a directory**. There is no hidden state
anywhere else.

### The database

| Table            | What it holds                                                       |
| ---------------- | ------------------------------------------------------------------- |
| `sounds`         | Every generated or imported clip, with its full provenance          |
| `sound_tags`     | The tag index                                                       |
| `sessions`       | A sitting: the sounds made in one run of the composer               |
| `projects`       | A folder you put sounds in on purpose                               |
| `stories`        | A script/arrangement you keep coming back to                        |
| `story_segments` | The clips on a story's timeline                                     |
| `story_tracks`   | Per-lane mute, solo, gain and name                                  |
| `voices`         | Builtin voices and clones                                           |
| `mcp_calls`      | What agents have done, so the Activity page can show it             |

Migrations are additive and run at startup: new columns are added to existing
databases, never removed. A database made by an older build keeps working.

## How a generation flows

Everything slow is a **job**, and jobs are the same shape whatever they do:

```
POST /api/generate   →  { job_id }
GET  /api/jobs/:id/events   (Server-Sent Events)
     ↓
   queued → loading → generating → encoding → done
```

The client never blocks. It gets a job id, subscribes to the event stream, and
watches the phase and progress; the finished job carries the ids of the sounds
it produced. The same machinery covers every long operation:

| Job kind   | Started by                                            |
| ---------- | ----------------------------------------------------- |
| `generate` | Making a sound or a track from a prompt               |
| `speak`    | Reading a line, or a whole story                      |
| `separate` | Splitting a track into stems                          |
| `download` | Fetching a model's weights                            |
| `segment`  | Regenerating one line of a story                      |
| `export`   | Mixing a story's timeline down to one file            |
| `convert`  | Voice conversion                                      |

Because a job is a row and a stream rather than an open request, closing the tab
does not cancel the work, and an agent's job and yours are equally visible on the
Activity page.

## Models

A model is described by a `ModelSpec` and carries a `task`:

| Task  | Meaning                            | Example                     |
| ----- | ---------------------------------- | --------------------------- |
| `gen` | Text to audio (SFX or music)       | Stable Audio, ACE-Step      |
| `tts` | Text to speech                     | Chatterbox                  |
| `vc`  | Voice conversion                   | —                           |
| `sep` | Source separation into stems       | HTDemucs                    |

Most run through **audio.cpp** — one native binary with CUDA, HIP, Metal, Vulkan
and CPU backends, no Python in the inference path. That is the whole reason
adding a model is usually a catalogue entry rather than a new dependency
negotiation; [audio.cpp](./AUDIOCPP.md) covers it properly.

Every model's licence is on screen before you download it, because "open weights"
and "you may sell what it makes" are different claims.

## The web app

React 19 with a `HashRouter`, TanStack Query for server state, and Zustand for
the handful of things that are genuinely global — chiefly *what is playing*, so
that two players can never talk over each other.

Three surfaces you will meet in the code:

- **Generate** (`/app`, `/console`) — the composer: a prompt, a model, some
  parameters, N takes. The console is the same session with a hardware-style
  front panel.
- **The studio** (`/voice/:storyId`) — the timeline: lanes, clips, a mixer, a
  device rack, and an export. See [the studio](./STUDIO.md).
- **The library** (`/library/*`, `/sounds/:id`) — everything you have made,
  searchable, taggable, and editable without destroying the original.

### The public site

`site/` is a second Vite entry that prerenders app components to static HTML
with [vite-react-ssg](https://github.com/Daydreamer-riri/vite-react-ssg). It has
no backend: the pages it renders (`/sfx`, `/music`, `/models`, `/docs`) read
from content files and manifests rather than the API, which is why they can be
served from any static host.

It borrows the app's components deliberately — one design system, one waveform
player, one set of tokens. A component that reaches for a live backend cannot be
used there, and the two files that do are aliased out.

## The desktop app

`src-tauri/` is a thin Rust shell: it starts the same server, waits for
`/api/health`, and points a webview at it. There is no second copy of the UI and
no separate API. [Desktop app](./DESKTOP.md) has the details.

## Agents

The MCP server exposes the same operations the UI drives — generating, listing,
speaking, and the whole studio: create a story, add lines, mix a track, export.
An agent working on a story is announced to any browser watching it, which is
why the studio can say "an agent is writing" and pause editing rather than
letting two writers race. See [MCP tools](./MCP.md).

## Conventions worth knowing before you change something

- **Non-destructive edits.** Every tool that changes audio writes a *new* sound
  with `parent_id` set. Nothing overwrites a file you made.
- **The timeline and the export must agree.** What you hear while arranging and
  what the mixdown writes are two implementations of one rule; where they could
  drift, the code says so and points at its twin.
- **Honest state.** If a value is estimated rather than measured, the UI says
  so on screen. Lyrics highlighting is divided evenly, not aligned, and the page
  admits it.
- **Comments explain decisions, not mechanics.** The code says what it does; a
  comment is for why it does it that way and what the alternative cost.
