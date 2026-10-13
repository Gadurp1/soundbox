# Using Soundbox from an AI agent

Soundbox exposes its generation pipeline over [MCP](https://modelcontextprotocol.io),
so an agent can produce sound effects, music and speech as part of a larger
task instead of you alt-tabbing to make each one by hand — and, for anything
longer than a single clip, arrange them on a timeline it can come back to.

The MCP server runs inside the main Soundbox process at
`http://127.0.0.1:17494/mcp` — **the server must be running** for any of this to
work. There is no separate daemon to start.

## Connecting

### HTTP (preferred)

```json
{
  "mcpServers": {
    "soundbox": { "type": "http", "url": "http://127.0.0.1:17494/mcp" }
  }
}
```

Claude Code:

```bash
claude mcp add --transport http soundbox http://127.0.0.1:17494/mcp
```

Note there is **no trailing slash** on the URL. Soundbox rewrites `/mcp` to the
mounted path internally, so clients that don't follow 307 redirects on POST work
correctly.

### stdio

For clients that only speak stdio. The bridge is a thin proxy onto the running
server — it does not load models, so you never end up with two copies of a
diffusion model fighting over your GPU.

```json
{
  "mcpServers": {
    "soundbox": {
      "command": "node",
      "args": ["/absolute/path/to/soundbox/server/dist/mcp/stdio.js"]
    }
  }
}
```

By path, not by name, and the path is worth the ugliness. `npx soundbox-mcp`
cannot resolve — the package is private — and while `npm install` does link a
`soundbox-mcp` bin, it links it into the checkout's own `node_modules/.bin`,
which is not on the `PATH` your editor spawns an MCP server with. Both short
forms fail as "command not found", which tells you nothing.

`server/dist/mcp/stdio.js` exists only after `npm run build` (or
`npm run build --workspace server`); a fresh clone does not have it.

The **Agents** page prints this line with the path already resolved for the
install you are running, which is the copy button worth using.

The bridge covers six tools — `generate`, `enhance_prompt`, `list_models`,
`list_sounds`, `get_sound` and `delete_sound`. For `separate`, speech,
stories and arrangement, use the HTTP transport.

Set `SOUNDBOX_URL` if the server listens somewhere other than
`http://127.0.0.1:17494`.

## Tools

Twenty-one of them, in four groups: sounds, voices, stories, arrangement. The
authority on all of it is `server/src/mcp/server.ts` — the `MCP_TOOLS` table
for names and descriptions, the zod `inputSchema` on each `registerTool` call
for arguments. Where this file and that one disagree, that one is right.

### Sounds

#### `soundbox.generate`

Generates one or more sounds and saves them to the library. **Blocks until the
audio is written to disk**, which can be seconds to a minute depending on model
and length.

| Argument | Type | Default | Notes |
|---|---|---|---|
| `prompt` | string | — | Describe material, action and space |
| `duration_s` | number | 5.0 | 0.5–30, clamped to the model's max |
| `model` | string? | loaded model | Falls back to the first installed one |
| `negative_prompt` | string? | — | Ignored by models that don't support it |
| `seed` | int? | random | For reproducibility |
| `variations` | int | 1 | 1–4 distinct takes |
| `tags` | string[]? | — | Library tags |
| `lyrics` | string? | — | Words for a lyrics-conditioned music model to sing |
| `source_sound_id` | string? | — | Edit an existing sound instead of rendering fresh |
| `edit` | string? | — | `extend` / `cover` / `repaint`, paired with `source_sound_id` |

Returns each sound with an **absolute filesystem path**, so the agent can hand
it straight to ffmpeg or copy it into a project.

`lyrics` and the `edit` family only work on models that declare them —
`supports.lyrics`, `supports.extend`, `supports.cover` in `list_models`. Every
other model ignores the field rather than complaining.

#### `soundbox.separate`

Splits a library sound into its stems — vocals, drums, bass, other — each saved
as its own sound with its own absolute path. **Blocks until the audio is on
disk.** Needs a separation model installed (`task: "sep"` in `list_models`).

| Argument | Type | Default | Notes |
|---|---|---|---|
| `sound_id` | string | — | The library sound to split |
| `model` | string? | installed separator | Prefers one already loaded |
| `stems` | string[]? | all | Which stems to keep, e.g. `["vocals"]`. A name nothing answers to is reported back, not dropped |
| `rest` | `discard` / `merge` | `discard` | What happens to the stems not named. `merge` sums them into one "rest" sound — the original minus what you took out. Ignored when `stems` is omitted |

#### `soundbox.enhance_prompt`

Rewrites a vague prompt ("scary sound") into a concrete one, or several. Takes
`prompt`, `n` (1–5), `category` (`sfx` / `music`), `lyrics`, and `model` — pass
the id you intend to generate with and the rewrite follows that model's own
prompting conventions instead of generic advice.

Only useful when the local prompt assistant is enabled. When it isn't, the tool
says so in plain text rather than failing, so surface the reply.

#### `soundbox.list_models`

Models with status and licence, including `commercial_use` (`yes` / `no` /
`conditional`). Worth calling before generating anything destined for a
commercial project.

For a text-to-speech model it also returns `delivery`: the knobs that family
will actually listen to, each with its range and default, read from audio.cpp's
own parameter table. This is the authority on those names — audio.cpp accepts
an unknown option silently, so a name taken from a model card rather than from
here is not an error, it is a setting that does nothing. A model with no
`delivery` list has no knobs at all: its words and its voice are the only
controls it has.

#### `soundbox.list_sounds` / `soundbox.get_sound` / `soundbox.delete_sound`

Search and manage the library. `list_sounds` takes `q`, `tag` and `limit` —
searching before generating is usually faster than regenerating. `get_sound`
takes a `sound_id` and returns the one sound with its absolute path.
`delete_sound` takes a `sound_id` and **permanently** removes the row and the
file on disk.

### Voices

Spoken words are a different path: `soundbox.generate` will not say them.

#### `soundbox.list_voices`

No arguments. The saved voices a script can be read in. Call it before writing
one, so lines are cast to real voice ids rather than invented ones.

#### `soundbox.speak`

One read, saved to the library. Takes `lines` (1–200 objects of `text`,
`voice_id`, `speaker` — several with different `voice_id`s is a dialogue),
`model`, `gap_s` (silence between lines, default 0.4), `name`, and `delivery`.
**Blocks until the audio is written.**

This is the one-off. Anything you want to keep, re-read, or rearrange should be
a story instead — `speak` gives you one finished WAV and no way back into it.

### Stories

A story is a script that persists: lines carry a place in time, can be voiced
line by line, and outlive the conversation that made them.

#### `soundbox.create_story`

Takes `title` and `delivery`. Returns a summary with a `story_id` and an
`open_in_studio` URL — every story tool returns that summary, so a chat can
offer to open the thing rather than describe it.

#### `soundbox.list_stories` / `soundbox.get_story`

`list_stories` takes `limit` (1–200, default 20), most recently worked on
first. `get_story` takes a `story_id` and returns every line — text, voice,
track, start, whether it has been voiced yet. The summary the other tools
return deliberately omits the lines; this is the call that asks for them.

#### `soundbox.add_lines`

Takes `story_id` and `lines` (1–200). Each line is a spoken line, a `pause` of
`duration_s` seconds, or an existing library `sound_id` dropped onto the
timeline. `track_index` picks the lane and `start_s` the position — omit
`start_s` to append after that track's last clip.

#### `soundbox.update_line`

Takes `line_id` plus whatever you are changing: `text`, `speaker`, `voice_id`,
`track_index`, `start_s`, `muted`, `gain_db`, `duration_s` (how much of the
clip plays), `trim_start_s` (how far into the source it begins), `delivery`.

Changing the words or the delivery does not re-read the line. It stays as it
was recorded until something voices it again.

#### `soundbox.speak_story`

Takes `story_id`, `model`, and `regenerate` (re-read lines that already have
audio, default false). Reads every silent line in its assigned voice, one at a
time. **This is the slow one** — a forty-line script is forty reads.

#### `soundbox.delete_line` / `soundbox.split_line`

`delete_line` takes a `line_id` and removes it from the story; the audio it was
using stays in the library. `split_line` takes `line_id` and `at_s` — seconds
into that line's own audio — and gives two clips. The words stay with the first
half, because there is no honest way to know which of them fell either side of
the cut.

#### `soundbox.export_story`

Takes `story_id`. Mixes the whole arrangement down to one sound, honouring
where each clip sits, its trim, its gain and whether it is muted. **Blocks**,
and returns the resulting sound with an absolute path.

### Arrangement

#### `soundbox.open_in_studio`

Takes `sound_id`, `separate` (split into stems first, default true), `stems`
(which ones get a track — omit for all) and `rest` (`discard` or `merge` the
ones you didn't name). Lays a library sound out on a timeline. Reuses stems the
sound already has rather than separating it again.

#### `soundbox.mix_track` / `soundbox.remove_track`

`mix_track` takes `story_id`, `track_index` and any of `name`, `muted`,
`soloed`, `gain_db`. These belong to the lane, not to the clips on it — with
any track soloed, only soloed tracks are heard. `remove_track` takes
`story_id` and `track_index` and **deletes the lane and everything on it**;
lanes above slide down. Call `get_story` first if you are not certain what is
on it.

### Delivery

How a line is *performed* is separate from what it says, and it is not in the
text — writing `(whispering)` into a line makes the model say the word
"whispering" out loud. Pass `delivery` instead, at whichever level it belongs:

| Where | Applies to |
|---|---|
| `soundbox.create_story` | Every line in the story that doesn't override it |
| `soundbox.add_lines` | One line, set as it is written |
| `soundbox.update_line` | One line, afterwards. `{}` puts it back on the story's |
| `soundbox.speak` | The whole one-off read |

Narrowest wins: a line's own delivery beats the story's. Changing a delivery
does not re-read anything — the line has to be voiced again before it is
audible.

## Watching what your agents do

Open the **Agents** page in the app (`/#/agents`) to see every client that has
connected: which agent, what it called, whether it worked, how long it took,
and every sound it produced — live, not a log file you have to go find. It
also shows the endpoint and stdio command above, and the bundled skills below.

Every call the server handles is:

- **Attributed.** The MCP handshake's `clientInfo` (name + version) is
  captured automatically — no header to add, no auth to configure, because
  there is none. Sounds an agent generates are tagged with that identity
  (`Sound.source = "mcp"`, `Sound.client = "claude-code 2.1.0"`), and the
  Library can filter to just what agents made.
- **Logged.** One line per call in the server's log (`grep mcp
  ~/.soundbox/soundbox-17494.log`, or whatever port you run on), and persisted to `GET /api/mcp/calls` /
  `GET /api/mcp/status` for the app — or your own tooling — to read.
- **Optionally exported.** OpenTelemetry export is built in — no extra
  install — just point it at a collector:

  ```json
  { "otel_endpoint": "http://localhost:4318" }
  ```
  via `PATCH /api/settings`, or set `OTEL_EXPORTER_OTLP_ENDPOINT` in the
  server's environment (that env var wins). Each call becomes a span carrying
  the client, session, tool, model and resulting sound ids on standard
  OTLP/HTTP — traces to `<endpoint>/v1/traces`, metrics to
  `<endpoint>/v1/metrics`. Works with Jaeger, Tempo, Honeycomb, the OTel
  Collector, or anything else that speaks OTLP.

## Skills

Soundbox ships agent skills under `server/skills/` —
`soundbox-sfx` (prompting technique, tool usage), `soundbox-sound-pass`
(inventorying and generating every sound event a whole project needs) and
`soundbox-voice-story` (writing, voicing and arranging spoken audio as a
story). They
teach a connected agent how to use these tools well from the first call,
instead of it discovering the right prompt shape by trial and error.

Install them once per machine:

```bash
soundbox skills install                  # -> ~/.claude/skills/
soundbox skills install --target cursor  # -> ~/.cursor/skills/
soundbox skills list                     # see what's bundled/installed
```

or click **Install skills** on the Agents page — it calls
`POST /api/mcp/skills/install` with the same effect. Re-running overwrites, so
upgrading Soundbox and reinstalling keeps them current.

## Notes for agent authors

**Generation is serialised.** One GPU, one job at a time. Firing off five
`generate` calls in parallel queues them; it does not speed anything up. Prefer
`variations` if you want several takes of the same idea.

**No model loaded is a normal state.** If nothing is installed, `generate`
returns an actionable error telling the user to install one from the Models
screen. Surface that rather than retrying.

**Prompt style matters more than parameters.** These models respond to physical
description — material, action, space — not mood words. "Scary sound" produces
noise. "Low metallic groan of a ship's hull under pressure, distant,
reverberant" produces something usable. Short clips layered in an editor beat
one long generation.

**Licences are per-model and some forbid commercial use.** If the user's
project is commercial, prefer a model whose `commercial_use` is `yes`.
