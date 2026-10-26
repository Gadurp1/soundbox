---
title: "Bring your games to life: Claude Code, Soundbox and Godot"
description: One sentence to Claude Code, six local generations, one jingle that failed by ear and the retake that fixed it. Every prompt, seed and timing.
date: 2026-10-26
author: Anthony Saviano
tags: [games, mcp, agents, godot]
draft: true
image: /blog/bring-your-games-to-life.jpg
---

On 23 October I asked Claude Code for the sounds in a small Godot platformer,
and it got them from Soundbox, the local app I build, over MCP: open-weight
models on my own GPU, no account, no credits. This post is that run, call by
call — the sentence I typed, the six prompts the agent wrote from it, the seeds,
the server's own timings, and the level-complete jingle that came back wrong and
what fixing it taught me about which model to ask.

It does not cover setting up the MCP connection in detail (that is
[point your agent at Soundbox](/blog/point-your-agent-at-soundbox)), why there is
no Python anywhere in this (that is
[what audio.cpp replaced](/blog/what-audio-cpp-replaced)), or voices.

![The finished run: the Godot platformer playing its six generated sounds, then the Soundbox library and Agents page showing the calls that made them](/media/godot.mp4 "/media/posters/godot.jpg")

The game audio in that clip is this run's sounds: five first takes and the
retaken jingle, levelled for video and otherwise untouched. The synthwave bed
under it is a Soundbox render from an earlier film, not part of this run.

## The setup

Three things, all on one Windows machine with an RTX 5080:

- **Soundbox, running.** Its MCP server lives inside the main process at
  `http://127.0.0.1:17494/mcp`, so if the app is open the tools are there.
- **Claude Code, pointed at it.** One command:

  ```bash
  claude mcp add --transport http soundbox http://127.0.0.1:17494/mcp
  ```

- **A new Godot 4.5.1 project.** One `Node2D` that draws itself in `_draw`,
  six `AudioStreamPlayer` nodes in `main.tscn`, and a `main.gd` that calls
  `play()` on the right one when the character jumps, lands, picks up a coin,
  smashes a crate, opens the door and reaches the flag.

The game is scripted rather than played — no input, a fixed course, the same
event frames on every run — because it was built to be recorded. That makes it
a demo, not a game, and I would rather say so than let the video imply
otherwise.

![The Godot scene: a teal block runs a fixed course, collecting coins, breaking a crate and passing a stone door before the flag](/blog/godot-game.gif)

## One sentence in

This is the whole request, verbatim:

```text
Make sound effects for my little Godot platformer: jump, coin pickup,
landing, a crate breaking, a stone door opening and a level-complete jingle.
```

Nothing in it is a usable prompt. "Jump" is a label, and these models respond
to material, action and space, not to labels. The interesting part is not that
the agent made six calls; it is what it wrote in each one.

## Six calls out

Every call went to `soundbox.generate` on **Stable Audio 3.0 SFX**. The times are
`elapsed_s`, the server's own figure, and the arguments are copied from the
call log rather than from memory:

| Sound | Prompt the agent wrote | Seed | Asked | Got | Time |
| --- | --- | --- | --- | --- | --- |
| Jump | quick light cartoon jump, soft springy whoosh rising upward, short, dry studio | 101 | 1.0 s | 0.36 s | 10.57 s |
| Coin | bright metallic coin pickup chime, small gold coin, two quick high bell tones, dry | 202 | 1.0 s | 0.20 s | 0.26 s |
| Land | soft thud of rubber sneakers landing on a hollow wooden platform, short, dry room | 303 | 1.0 s | 0.29 s | 0.26 s |
| Crate | small wooden crate smashing apart, splintering planks and debris scattering on a stone floor | 404 | 1.5 s | 1.13 s | 1.96 s |
| Door | heavy stone door grinding open slowly, low rumble, echoing dungeon corridor | 505 | 2.0 s | 1.62 s | 0.52 s |
| Win | short triumphant retro synth fanfare, rising arpeggio, video game level complete jingle | 606 | 2.5 s | 2.50 s | 0.74 s |

Three things in that table matter.

**The first call is ten seconds and the rest are not.** The 10.57 s on the jump
includes loading the model into VRAM; after that it stays resident, and a coin
chime takes a quarter of a second. Those are numbers from a 16 GB desktop GPU.
On a CPU, the README warns, a clip that takes seconds takes minutes.

**The prompts describe things, not feelings.** "Rubber sneakers on a hollow
wooden platform" and "dry room" are the kind of detail that changes the output;
"satisfying landing sound" is not. The agent wrote all six in that register
without my asking, and the reason is mundane: the description of `generate`'s
`prompt` argument says "Describe material, action and space", and a tool's
description is the one piece of documentation an agent always reads.

**What comes back is shorter than what was asked for.** Soundbox trims trailing
silence, so a 1-second request for a coin returns 0.2 seconds of coin. For game
sounds that is the right default: a pickup with 800 ms of nothing after it is a
pickup that clips the next one.

Every result carries an absolute path to a WAV. The files went into the
project's `sfx/` folder under the names the scene expects — `jump.wav`,
`coin.wav` and so on — and the six players were pointed at them. The agent was
handed a path, not a payload, which is why none of this needed base64 or a
download step.

![The Soundbox SFX library filtered to the godot-video tag: six sounds, each with its model, seed and the label claude-code 2.1.299](/blog/godot-sfx-library.png)

Every one of them is in the library with its prompt, model, seed and the client
that asked for it. If the crate is right but too long, the take to iterate on
is one click away rather than buried in an agent transcript.

## The jingle was wrong

Five of the six were fine on the first take. The win sound was not, and the
agent could not have known: it does not listen. I did, and it was a wash of
bright noise where a fanfare should have been.

Asked to fix it, the agent made four more calls, each with `variations: 3`, for
twelve takes. Unable to hear them, it ranked them by what it could measure —
the spectrogram (are there discrete notes, or broadband noise?), a note track
(does it climb?), and the last 100 ms (does it decay, or stop at full level?):

| Call | Model | Seed | Time for 3 takes | What came back |
| --- | --- | --- | --- | --- |
| "bright 8-bit chiptune victory jingle, square wave arpeggio rising up a major chord, ending on a held high note, clean, no reverb" | Stable Audio 3.0 SFX | 611 | 7.37 s | Noise wash, no notes, cut off at 2.5 s |
| "video game level complete sting, cheerful bell and synth chime, three rising notes then a sparkle, dry" | Stable Audio 3.0 SFX | 621 | 2.29 s | Noise wash, no notes, cut off |
| "short cheerful chiptune victory fanfare, 8-bit, rising arpeggio, major key, 140 BPM" | Stable Audio 3.0 Small Music | 631 | 6.49 s | Real notes, but drums, and cut off mid-phrase |
| "short 8-bit chiptune victory fanfare, square wave lead, quick rising major arpeggio then a long held final note, no drums, major key, 140 BPM" | Stable Audio 3.0 Small Music | 641 | 3.40 s | Real notes that climb and end |

Six takes from the SFX model, on two prompts that asked for notes by name, and
not one of them has a note in it — the model makes textures, and a melody is
not a texture however you phrase the request. Similar prompts on **Stable Audio
3.0 Small Music**, the music fine-tune of the same model at the same ~2.5 GB of
VRAM, gave pitched notes on every take.

The rejected fix was the obvious one: keep the SFX model and rewrite the
prompt. Two calls proved that was the wrong lever. The model was the problem,
and changing it took one argument.

Within the music model the prompt still mattered. The first music call
produced drums and phrases that ran straight into the cut — the start of a
loop, not a sting. Saying what the ending does — "a long held final note, no
drums" — is what produced endings. The take now in the game is seed 544958598,
the third take of that call: 3.44 s of notes that climb and end on the highest
one, decaying to −38 dB by the end, so nothing is chopped.

A jingle is music, so ask a music model. And the ear caught what the agent's
measurements then explained; neither would have fixed it alone.

## What the Agents page shows

Every call an agent makes is logged in the app with the client that made it,
the prompt, how many sounds it returned and how long it took. This is the real
list from the run, newest first:

![The Agents page's Recent calls: ten generate calls from claude-code, the six original sounds at the bottom with the 10569 ms first call, the four three-take win retakes at the top](/blog/godot-recent-calls.png)

It exists because an agent that generates audio as a side effect of writing
code is an agent you will want to audit afterwards. "What did it ask for, and
which of these files came from that?" should not need a transcript search.

## The licence, before you ship

Both models used here are under the **Stability AI Community License**:
commercial use, including selling what you make, is free while you or your
organisation have under US$1M in total annual revenue, and above that you need
an Enterprise licence from Stability AI. That is on each model's card in the
app before you download it, and on the site for
[Stable Audio 3.0 SFX](/models/stable-audio-3-sfx) and
[Small Music](/models/stable-audio-3-small-music).

Some models in the catalogue are non-commercial; you should know that before
you ship a game with their output in it. Soundbox treats any model whose
licence it could not establish as non-commercial, and the summary on a card is
a summary, not legal advice.

## If you came for a local Suno alternative

Most of this run was sound effects, but the jingle is the small end of the
other thing people ask about. Soundbox does music with lyrics locally:
**ACE-Step 1.5 Turbo** (MIT, commercial use allowed) and **MiniMax Music 3**
(about 10 GB of VRAM, conditional commercial terms) both take a lyric sheet, and
ACE-Step can also extend, cover and repaint a take. Because every model runs
through the same audio.cpp binary, the same prompt and seed can go to all three
music models and be compared side by side:

![The same prompt and seed rendered by Stable Audio 3.0 Small Music, MiniMax Music 3 and ACE-Step 1.5 Turbo, with measured render times on an RTX 5080](/product/same-prompt-three-models.gif)

It is not Suno, and the README's comparison table says so: hosted services run
closed, tuned models with consistent output; here the weights are open and
quality varies by model. What you get in exchange is no account, no credits,
output under the licence of the model that made it, and an agent that can ask
for a song the same way it asked for a coin.

The cost is time on first load. Measured on the same RTX 5080 with audio.cpp
0.9.2: a 15-second song with lyrics on ACE-Step took 151 s the first time,
while the model loaded, and about 15 s warm; a 10-second Small Music loop took
8 s. That is fine for a jingle and slow for an album.

## What is still rough

- **Four models are verified end to end.** Stable Audio 3.0 SFX, Small Music,
  ACE-Step 1.5 Turbo and MiniMax Music 3 are on by default; 61 more can be
  switched on and are marked unverified until someone reports. Four of those
  (VibeVoice 1.5B, MiDashengLM-Gen, HTDemucs 6-stem and Chatterbox Turbo) have
  also been run end to end.
- **The hardware that matters is an NVIDIA GPU.** A few GB of VRAM covers the
  verified models, except MiniMax Music 3 at about 10 GB. AMD and Intel GPUs
  fall back to the CPU unless you opt into Vulkan, which nobody has confirmed
  on the verified models yet. Mac installers exist and the verified models have
  not been confirmed on Apple silicon.
- **Unsigned installers.** The first launch asks you to confirm.
- **An agent that cannot hear.** It can measure a spectrogram and write a
  sensible prompt, and it will still hand you a noise wash called a fanfare.
  Listen before you commit.

## Try the same run

Install Soundbox from the
[latest release](https://github.com/HamSanders/soundbox/releases/latest),
open it, connect Claude Code with the one command above, and hand it the
sentence from this post — or your own game. The tools it gets, the
`soundbox-sound-pass` skill that reads a project and derives the list of sounds
itself, and the stdio bridge for clients that cannot speak HTTP are all in
[docs/MCP.md](./MCP.md).

A sound you asked for in a sentence and placed in a scene beats a library you
searched for an afternoon. Start with the jump.
