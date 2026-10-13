# The studio

The studio is where clips become a piece of audio: a timeline with lanes, a
mixer, a device rack, and an export. It opens on a **story** — a document that
persists, whose clips have a place in time and survive being regenerated.

Two ways in:

- **Voice Studio → new story.** You write a script; each line is read by a TTS
  model and lands on the timeline in order.
- **Any sound → "Open in the studio".** The clip is placed on a lane. If a
  separator is installed, you pick which stems you want and each of them gets
  its own lane.

Those two entrances make the same kind of document. A story that arrived as
stems can grow a spoken line; a script can have a music bed dragged under it.

<!-- screenshot: docs/images/studio-overview.png — the studio on a multi-track story: script on the left, timeline in the middle, library and sample panels on the right -->

## The layout

Three columns, each resizable by dragging the divider between them:

| Column    | What lives there                               |
| --------- | ---------------------------------------------- |
| Left (⅕)  | The Script panel, the Prompt panel, or both    |
| Middle    | The Timeline, with the Device rack beneath it  |
| Right (⅕) | The Library, the Sample and the History panels |

The timeline is the one panel with no close button — everything else here is a
view *of* something you are arranging, and there is nothing to view without it.
Closing every other panel gives it the whole page. **A column with nothing left
in it is not rendered at all**, so closing the script does not leave a gap; the
timeline moves left into the space.

Below roughly a tablet's width the three columns stack — left panels, timeline,
right panels — rather than any of them disappearing. Arranging is half the job
on a narrow window too.

Panels within a column share the leftover height by weight, and the divider
between two open panels can be dragged (or nudged with the arrow keys once
focused) to trade height between them. Collapsing a panel with its chevron hides
its body but keeps it mounted — the timeline owns the audio graph, and
unmounting it to save a few hundred pixels would stop playback.

## The panels

Every panel is available in every story. Which ones *start* open depends on what
the story is, decided once when its clips first load and then never again — a
panel that reopened every time the story changed shape would be a panel fighting
you.

| Panel        | Shortcut     | What it is for                                                             | Open by default                         |
| ------------ | ------------ | -------------------------------------------------------------------------- | --------------------------------------- |
| **Timeline** | —            | The arrangement. Always open, no close button                              | Always                                  |
| **Script**   | `⌘/Ctrl + R` | The lines, their voices and their delivery; write, edit, re-read           | Yes, unless the story is an arrangement |
| **Prompt**   | `⌘/Ctrl + P` | Describe a sound or a piece of music and drop the result onto this timeline | Only on a story with no clips yet       |
| **Library**  | `⌘/Ctrl + B` | Your sounds, to drag onto a lane                                           | Only on an arrangement                  |
| **Sample**   | `⌘/Ctrl + E` | The selected clip: waveform, stems, and what generated it                  | No — double-clicking a clip opens it    |
| **Devices**  | `⌘/Ctrl + F` | One track's insert chain                                                   | No                                      |
| **History**  | `⌘/Ctrl + I` | Every prompt you have run into this timeline, kept across reloads          | No                                      |
| **MIDI**     | `⌘/Ctrl + N` | Play or import notes, and render them onto a lane                          | No                                      |
| **Piano roll** | `⌘/Ctrl + O` | The same notes, as something you edit                                    | No                                      |
| **Logs**     | `⌘/Ctrl + G` | What the server was doing while this was made                              | No                                      |

The closable panels appear in three places, all read from one table in the
code, so they cannot drift apart:

- the **Panels** menu in the header, which prints each shortcut beside its name
  and is the only way back for a panel you have X'd out of;
- the shortcuts above;
- the **command palette**, `⌘/Ctrl + K`. It filters by name, moves with the
  arrow keys and runs with Enter. It contains the panels and nothing else — it
  is for when you know a panel's name but not its key, which is most of the time
  until a shortcut is in your fingers.

Script and Prompt share the left column rather than taking turns in it: a track
you generated is exactly the sort of thing you then want to narrate over, and a
scripted story is exactly the sort of thing you want a generated bed under.

An "arrangement" is not a stored mode. It is derived: a story is an arrangement
when every clip has audio and none has words. That is why music and SFX stories
arrive with no script and the library already open, and why writing a line from
the timeline's right-click menu brings the script back.

Two collisions to know about, because the panel shortcuts and the timeline's own
shortcuts are both bound to the window and neither stops the other:
Panel shortcuts deliberately avoid the letters the timeline already uses (`A C D M S V X Z`, and `Y` for redo). Both handlers listen on `window` and neither stops the other, so a shared letter would fire twice — Script, History and Devices sit on `R`, `I` and `F` for that reason rather than the obvious `S`, `Y` and `D`.

## Working with clips

A **clip** is a segment on a lane: a start time, a length, and a window into the
sound behind it. Nothing you do on a timeline modifies the underlying audio file.

### Selecting

| Gesture                        | What it does                                                 |
| ------------------------------ | ------------------------------------------------------------ |
| Click a clip                   | Select just that one                                         |
| Shift-click, or `⌘/Ctrl`-click | Add or remove one clip, keeping the rest                     |
| Drag across empty lane         | Rubber band. Shift or `⌘/Ctrl` adds to the existing selection |
| `⌘/Ctrl + A`                   | Select every clip                                            |
| `Escape`                       | Clear the selection, and disarm the scissors                 |

One clip in the selection is the **primary** — the one the Sample panel
describes and the one whose track the device rack shows. Shift-clicking the
primary away promotes another rather than emptying the selection, so those
panels never go blank while clips are still visibly ringed.

The rubber band catches clips it **overlaps**, not only ones it fully encloses: a
band drawn across the middle of a row is asking for the clips it crosses, and
requiring full enclosure would mean a long clip could never be caught.

A press on empty lane starts out as a playhead scrub and only becomes a rubber
band once it has travelled about four pixels — so clicking empty track to move
the playhead still works, and does *not* clear the selection. `Escape` is what
clears it, and unlike the rest of the shortcuts it is handled by the lane area
rather than the window, so click somewhere in the timeline first.

### Moving

Drag a clip to move it in time and between lanes. Drag any clip that is part of a
multi-selection and the whole selection travels: the group keeps its spacing and
its lane offsets, and only one delta is applied to all of it. If part of the
group would be pushed past the start of the story or past the last lane, the
*delta* is clamped rather than each clip — so the group stays rigid instead of
piling up at the edge.

Pressing on a clip that is already in a multi-selection keeps that selection,
because the press might be the start of dragging the group. Releasing without
having moved says it was not, and the click then means "just this one".

A whole group drag is **one** undo entry.

The order clips sit in on the timeline is the order the script reads in. Moving a
clip re-orders the script to match, in the same frame the clip lands: the
arrangement is the source of truth for order, and a script that disagrees with it
is simply wrong.

#### Snapping

Dragged edges snap to other clips' starts and ends, the playhead, time zero, and
the two nearest ruler ticks. The tolerance is 8 pixels — measured in pixels, not
seconds, so it means the same thing at every zoom level. **Hold `Alt` to defeat
it.**

Both ends of a dragged clip reach for a target and the closer pull wins, so
butting a clip against the one before it and against the one after it are the
same gesture. The clip being dragged, and every clip travelling with it, is
excluded from its own targets.

### Trimming

Drag either end of a clip. Clips narrower than about 24 pixels get no trim
handles, so there is always a middle left to drag by.

Trimming is a window, not a cut. Dragging the **start** moves both where the clip
begins in time and how far into the source it begins, by the same amount, so the
audio you can still hear does not slide around underneath you. Dragging the
**end** is bounded by what is left of the source after the in-point. A pause has
no source to run out of, so it stretches freely. Lengthening a shortened clip
again simply gives the time back.

### Splitting

Three ways, all the same operation:

- Select a clip with the playhead inside it and press `S`, or the scissors
  button.
- Press the scissors with the playhead *outside* the clip and it arms instead:
  click a generated clip where you want it cut. `Escape` cancels.
- Right-click a clip → **Split at playhead**, or right-click a lane → **Split all
  at playhead**, which cuts every clip the playhead crosses and says how many
  that is.

Only a clip that has audio can be split.

### Fades and crossfades

Every clip wider than about 36 pixels has a small fade handle in each top corner,
inset past the trim strips so the two gestures never fight over the same pixel.
Drag inward to lengthen the fade; the shape is drawn over the waveform, because
the question you are asking is "does this reach far enough into the clip", and
that is a length you look at. Each fade is capped at half the clip, so the two
can never cross.

**Overlapping clips on one lane crossfade automatically**, across the overlap,
whether or not you set a fade — capped at the shorter of the two clips, so a
short clip dropped on top of a long one crossfades over its own length. Two clips
summing through an overlap is a lump in the level at best and a click at both
edges at worst, and nobody overlaps two clips wanting that.

Both use equal-power curves. Two linear ramps summed across a crossfade dip by
3 dB exactly where the join is supposed to be seamless; equal power holds the
level flat through it. The rule lives in one file on the client and a twin inside
the export, so what you hear while arranging is what the mixdown writes.

### Duplicating, deleting, copy and paste

`⌘/Ctrl + D` duplicates and `Delete` (or `Backspace`) deletes **everything
selected**. The toolbar's own duplicate, mute and delete buttons act on the
primary clip only.

`⌘/Ctrl + C` copies the primary clip; `⌘/Ctrl + X` copies the primary and deletes
the whole selection — the clipboard holds one clip because paste has one playhead
to land on, but the cut takes everything that was ringed when the key went down.
`⌘/Ctrl + V` pastes at the playhead, on the copied clip's own track. A copied
line carries its words, its speaker and its voice, so pasting a written-but-
unvoiced line keeps the part worth keeping.

Right-click a lane → **Paste here** puts it where you clicked instead.

### Muting and looping

`M` mutes or unmutes the primary clip. Muted clips are left out of the export.

Shift-drag the ruler to mark a loop span; it snaps like everything else, and
`Alt` defeats that too. With no region marked, the loop button loops the selected
clip. The region survives being switched off — solid while it is being honoured,
dashed when it is only remembered — so hearing the rest of the story does not
cost you the marks.

### Zoom and the playhead

The mouse wheel zooms about the pointer, so the bar you are pointing at stays
under the cursor; `Shift` + wheel is the browser's own horizontal scroll. The
toolbar's zoom buttons step by 1.5× between 8 and 400 pixels per second. Clicking
or dragging the ruler — or empty lane — moves the playhead.

### Right-click

On a clip: **Read this line / Regenerate** (only for a written line), **Split at
playhead**, **Split into stems…** (when a separator model is installed),
**Duplicate**, **Extend this track** and **Cover in a new style** (when the
clip's model supports them), **Repaint**, **Mute / Unmute**, **Delete**.

**Repaint** asks first — a small dialog naming the window, with what should be
there instead (empty rerolls the clip's own description), a strength and a
mode — then regenerates that part of the clip's audio and puts the result back
in the same place — the clip does not move, is not re-trimmed, and the rest of it
comes back untouched. Which part is the span marked on the ruler (shift-drag
it), cut down to the clip you right-clicked, so the row names the seconds it is
about: *Repaint 1.8s–5.3s*. With nothing marked it is the whole clip. Undo puts
the previous take back; both takes stay in the library either way. Needs a
model that can repaint — ACE-Step is the only one today — and the same thing
over a finer range is on the waveform editor's own toolbar, where you drag out
the selection by hand.

On empty lane, headed with the exact time and track you clicked: **Create voice
line**, **New recording**, **New prompt** (opens the Prompt panel and puts the
cursor in it), **Insert sample** (opens the Library), **Split all at playhead**,
**Paste here**, **Add track**.

<!-- screenshot: docs/images/studio-timeline.png — the timeline with a multi-selection ringed, a clip mid-fade, and the lane right-click menu open -->

## Tracks

Each lane has a head pinned to the left edge of the scrollport — sticky, the way
a spreadsheet keeps its row headers, so it is still there when you have scrolled
into the middle of the piece.

| Control               | What it does                                                                           |
| --------------------- | -------------------------------------------------------------------------------------- |
| The number, in colour | The lane's index and its hue. Clips, head and rack all share it                         |
| The name              | Click to rename. `Enter` commits, `Escape` cancels; blank clears it back to "Track *n*" |
| **M**                 | Mute this track                                                                         |
| **S**                 | Solo this track                                                                         |
| The slider            | Track gain, −30 to +6 dB in 1 dB steps                                                  |
| The bin (on hover)    | Remove the track                                                                        |

**Solo wins over mute**, as it does on any desk: once anything is soloed, the
only audible lanes are the soloed ones, whether or not they are also muted. A
lane you will not hear is drawn at half opacity, which is the state you actually
care about — not whether its M is lit.

There are eight lane colours, spaced around the hue circle with the app's teal
accent's neighbourhood left out so a lane never reads as "selected", and stepping
half way round each time so lanes 0 and 1 are opposites rather than neighbours. A
ninth lane repeats the first colour.

**Adding a track**: the **Add track** row under the last lane, the lane
right-click menu, or simply drag a clip down onto the trailing empty lane. A lane
with defaults and no clips *is* an empty track, so creating the row is creating
the track.

**Removing a track takes its clips with it.** That is Audacity's rule and the
honest one: a lane is where those clips live, not a folder you empty first. You
are asked to confirm when there is something to lose, and not when the lane is
empty. Undo does not cover it.

**New audio always lands on a new track** — one below everything that exists. A
generated clip, a recording, or a drop onto a lane where something already sits
all go there. Two clips sharing a lane and a moment now crossfade rather than
sum, which is right when you meant it and a silent edit to your arrangement when
you did not; anything that arrives without being aimed somewhere has no business
landing on top of what you already have. Moving it down onto another lane is one
drag away.

Dropping a sound from the Library is the case that shows the rule: it lands on
the lane you aimed at, starting where you let go — unless something already
occupies that span, in which case it goes to the next free lane.

Track name, mute, solo and gain are stored with the story, and the export honours
all four. Clip gain is stored too, but there is no control for it on the
timeline — it is reachable over the API and from an agent.

## Recording

The record button captures from your microphone onto a **new track at the
playhead**. Where the playhead was when you pressed record is remembered on the
way in, so moving it while you talk does not move the take.

While it runs you get an elapsed counter and a live input level. That meter is
the point: a recording with no visible level is one you find out was silent
afterwards.

Recording is also on the lane right-click menu as **New recording** — named for
what it does rather than for where you asked, because the take goes onto a lane
of its own regardless.

The browser picks the container (WebM/Opus on Chrome and Firefox, MP4/AAC on
Safari); Soundbox decodes it, converts to WAV, uploads it to your library as
`Take HH:MM`, and then places the clip. It has to become a library sound, because
the timeline references clips by id and the export reads them off disk — a take
that lived only in the browser could be arranged and then vanish from its own
mixdown.

Permission denial, a missing microphone or an unsupported browser show up on the
record button's own tooltip rather than in a dialog.

## MIDI

> **Experimental.** The panel works end to end, but a placed take is audio, not
> notes — see the trade below before building on it.

The **MIDI** panel (`Ctrl/⌘ + N`) sits under the timeline beside the rack. Play
a line, and **Place on timeline** renders it and drops it on a new track at the
playhead, exactly as a microphone take does.

Three ways to play, because the first two each fail somewhere:

| Way | When |
| --- | ---- |
| A MIDI keyboard | Where the browser has Web MIDI — Chromium does, the macOS desktop build's WKWebView does not |
| The on-screen keyboard | Always. Click the keys, or focus it and use your computer keyboard |
| **Import** a `.mid` | When you want a real piece of music in here without playing one |

### Knobs, pads and the pedal

A 25-key controller is mostly not keys, and until the mapping existed every
knob, pad, wheel and pedal press arrived at the panel and was thrown away —
which is what made a connected board feel like a broken one. **Mapping**, at
the right of the keyboard row, is where that gets fixed.

It opens with three things:

- **The monitor.** A live readout of the last message: port, what it was
  (`CC 74`, `Note 36`, pitch bend), the channel, and the value. This is the
  part to look at first when something "isn't working" — it tells *nothing is
  arriving*, *the channel is not what you assumed* and *that control is simply
  unbound* apart from each other without reading a manual.
- **A layout.** A starting point for a whole controller, listed below.
- **Learn.** Press it on any row, move the control you want, and it binds.
  Notes are not sounded while Learn is armed, so setting up a mapping does not
  leave stray notes in your take.

| Layout | What it assumes |
| ------ | --------------- |
| **General MIDI** | Only the three controllers the spec actually fixes: mod wheel (CC 1), volume (CC 7), damper pedal (CC 64). Works on any board |
| **M-Vave SMK-25 / 25 II** | The above, plus the usual 8-pad default of notes 36-43 and a CC 21-24 knob bank |
| **Sustain pedal only** | Nothing but CC 64 |
| **Nothing mapped** | Keys and wheels; Learn the rest |

The presets past the pedal and the mod wheel are conventions, not guarantees —
both the M-Vave's pads and its knobs are re-assignable in its own editor app,
so a table claiming to know their CC numbers would be wrong for anyone who had
ever opened it. Check the monitor, and press Learn on whatever does not light
up. A control can only drive one target: binding a knob that already drives
something else takes it, rather than leaving two targets fighting over the
same message.

Eleven things can be bound: **Sustain** (hold), **Record**, **Preview**,
**Clear**, **Quantise**, **Octave ±**, **Place dry** and **Generate
instrument** (momentary), and **Cover strength** and **Roll tempo**
(continuous). Sustain behaves like a piano pedal — a key released under it
keeps ringing *and* keeps being timed, so a pedalled phrase records as held
notes rather than staccato ones.

The map is stored per browser rather than per story, because it describes the
hardware on your desk and not the take. It outlives every story and survives a
reload.

> **Blocked, rather than denied.** If Chrome has a remembered block for the
> site, `requestMIDIAccess` is rejected instantly without prompting again, so
> there is no Retry button to offer — the panel says to allow MIDI devices from
> the padlock menu in the address bar and reload. That is the only way back.

Notes are held while you play, drawn on a strip as they arrive. **Quantise**
snaps their starts to a grid in seconds — seconds, not note values, because a
take played to no click has no bar line to snap to. It is a button, not a
setting: it edits the take, so the roll always shows what will be rendered. It
only moves starts; snapping both ends of a held chord throws away the one thing
a human performance has that a step sequencer does not.

### The piano roll

The **Piano roll** panel (`Ctrl/⌘ + O`) is the same take as something you edit:
a keyboard down the left edge, pitch on the vertical, bars across the top.

| Gesture                  | What it does                                |
| ------------------------ | ------------------------------------------- |
| Drag on empty grid       | Draw a note; keep dragging to set its length |
| Drag a note              | Move it in time and pitch                   |
| Drag its right edge      | Change its length                           |
| Arrow keys               | Nudge the selected note; `Shift` for an octave or a bar |
| `Delete`, or right-click | Remove it                                   |
| Hold `Alt`               | Defeat snapping, as on the timeline          |

Editing a note auditions it, so a pitch you are dragging to is one you can
hear before you let go.

The two panels are one document, not two: what you play in the MIDI panel
appears here, what you fix here is what gets rendered, and there is nothing to
move between them. They are separate panels because they are separate
postures — playing a phrase in, and repairing the note you fluffed — and the
roll is where a tempo starts to mean something, which is why the grid here is
in bars and beats while the recorder stays in seconds.

### The instrument is a second pass

Nothing in the model catalogue takes notes as input. So the panel does not try
to generate a violin — it renders the notes with a plain synth, and the timbre
is asked for afterwards:

```
notes ──▶ [synth] ──▶ dry clip ──▶ [Cover, ACE-Step] ──▶ "solo violin, large hall"
```

Pitch and timing have to be exactly right — that is the whole value the notes
add — and a model asked to invent both will get one of them wrong. Rendering
them first means the model is only ever asked for timbre, over audio whose
notes are already correct, and the cover is rendered at the source's own
length, so it lines up with the take it came from.

**Generate instrument** does the whole thing in one press: it places the dry
take and submits the cover of it, and both land — the performance on one lane,
what the model made of it on the next — so you can solo between them and
re-cover the dry one when a prompt does not land.

The cover clip is **trimmed to the take's length**, because a cover follows its
source and has a floor: ACE-Step will not render shorter than about five
seconds, so a three-second phrase drawn in the roll comes back at 5.12s no
matter what length is asked for. (Longer takes track closely — 7.70s covers to
7.68s.) The extra is silence at the end, since the material sits at the head of
the render, so trimming is what keeps the two lanes lined up. The audio past
the trim is still on disk; drag the clip's right edge to get it back. **Keep the notes** is the
cover strength: high and it is your synth with a new coat, low and the model
starts writing its own notes. **Place dry** skips the model entirely.

Those controls sit at the bottom of **both** the MIDI panel and the piano roll,
because a take can be finished from either one — played in and placed without
ever opening the roll, or drawn entirely in the roll without touching the
keyboard. An action that lived in only one panel would make the other a dead
end.

The four **Instrument** presets are therefore chosen to be conditioned on, not
listened to: bright and harmonically rich, because a cover pass has more to
work from in a filtered sawtooth than in a sine. The render is normalised to
-3 dBFS so what the model receives does not depend on how many notes happened
to overlap.

For the hall itself, reach for the **Reverb** device rather than the prompt. A
generative model asked for a room smears the note attacks; the rack's reverb is
a room you can turn down.

**What this costs:** the story keeps the WAV, not the notes, so a placed take
cannot be re-edited as a performance — re-play it instead. Clips are audio
everywhere else in the studio, and a clip that is notes is a change to the
story document rather than to this panel.

## The device rack

The rack sits under the timeline and holds **one track's** inserts. Pick the lane
from the buttons in its header; selecting a clip already points it at that clip's
track, since selecting is how you say "this one" here.

Devices are inserts, so they sit *before* the lane's fader — a gate should hear
the take, not your monitoring level. A new device is appended to the end of the
chain, and the **Add device** menu lists them roughly in the order they belong in
one, so building a chain top to bottom lands somewhere sensible. There is no
drag-to-reorder: the chain is the order you added them in. Each device can be
bypassed without losing its settings; bypassing is the most common thing you do
to a device, and it must not cost you what you dialled in.

Dials are swept by dragging up and down (hold `Shift` for a four-times finer
sweep) and are keyboard-operable: arrows nudge by one step, `Shift` + arrow by
ten, `Home` and `End` jump to the ends. Wet/dry is a horizontal slider, because
that is the one control everybody expects to be linear.

> **Devices are heard on the timeline; they are not baked into the export.** The
> mixdown honours clip gain, track gain, mute, solo, trims and fades — it has no
> idea what a reverb is. Making the rack real on export means a second
> implementation of all eight devices in the server's DSP. The rack says so where
> you add a device.
>
> For the same reason, **racks are stored in your browser**, per story, rather
> than in the story document. They do not travel to another machine, and clearing
> site data clears them.

### The devices

Values are stored in the unit the device thinks in and shown in the unit you
would tune in, which is why several ranges below read in milliseconds.

| Device                                                                      | Parameter | Range                   | Default   |
| --------------------------------------------------------------------------- | --------- | ----------------------- | --------- |
| **Gate** — shuts the track between phrases, so room tone stops piling up     | Thresh    | −80 to 0 dB             | −45 dB    |
|                                                                             | Smooth    | 10 to 500 ms            | 60 ms     |
| **Autotune** — pulls a sung take onto the nearest note                       | Key       | C … B                   | C         |
|                                                                             | Scale     | Chromatic, Major, Minor | Chromatic |
|                                                                             | Retune    | 0 to 400 ms             | 80 ms     |
|                                                                             | Amount    | 0 to 1                  | 1         |
| **EQ** — three bands: lift the body, cut the mud, open the top               | Low       | −24 to +12 dB           | 0 dB      |
|                                                                             | Mid       | −24 to +12 dB           | 0 dB      |
|                                                                             | High      | −24 to +12 dB           | 0 dB      |
|                                                                             | Lo × Mid  | 80 to 1000 Hz           | 400 Hz    |
|                                                                             | Mid × Hi  | 1000 to 10000 Hz        | 2500 Hz   |
| **Compressor** — evens out a take that swings between a whisper and a shout  | Thresh    | −60 to 0 dB             | −24 dB    |
|                                                                             | Ratio     | 1:1 to 20:1             | 4:1       |
|                                                                             | Attack    | 1 to 300 ms             | 6 ms      |
|                                                                             | Release   | 10 to 1000 ms           | 150 ms    |
| **Distortion** — grit, from a warm edge to a radio that has given up         | Drive     | 0 to 1                  | 0.3       |
|                                                                             | Mix       | 0 to 1                  | 0.5       |
| **Delay** — repeats, fed back on themselves                                  | Time      | 10 to 1000 ms           | 250 ms    |
|                                                                             | Feedback  | 0 to 0.95               | 0.3       |
|                                                                             | Mix       | 0 to 1                  | 0.25      |
| **Reverb** — puts the line in a room instead of against a dry wall           | Decay     | 0.1 to 10 s             | 1.8 s     |
|                                                                             | Pre       | 0 to 300 ms             | 20 ms     |
|                                                                             | Mix       | 0 to 1                  | 0.25      |
| **Limiter** — a ceiling nothing gets over                                    | Ceiling   | −24 to 0 dB             | −1 dB     |

Defaults are chosen to be audible but not a statement: a device you have just
added should do something, or you cannot tell it is on, and should not wreck the
take, or you have to undo before you can listen.

Some notes on the ones that are not obvious:

- **Limiter** belongs last in the chain, or it is decoration.
- **Autotune** is the odd one out. Everything else here is a node; autotune is a
  measurement feeding a correction — a pitch detector reading the signal arriving
  at a shifter, sixty times a second. Its default scale is **Chromatic**, which
  is the identity: every note is in it, so the device straightens a flat note
  onto the nearest semitone without imposing a key. That is what you want when
  you do not know the key, which is most of the time. **Retune** is the knob that
  decides whether this is a repair or an effect — long, and it chases the
  singer's own drift so nothing sounds processed; at the bottom of the range the
  note is simply *there* on the attack, which is the famous sound.
- The pitch detector is normalized autocorrelation, and it deliberately refuses
  weak or noisy frames. An unvoiced consonant — an "s", a "t" — has no period in
  it at all, and a detector that guesses anyway is one that lurches a fifth on
  every sibilant. When it has no answer the shifter is left alone, because
  "nothing is being sung right now" and "sung very low" must not look the same.
- **Reverb**'s decay and pre-delay re-render an impulse response rather than
  moving a value, so the audio waits for the drag to settle while the reading on
  the card keeps up in real time. Sixty ten-second renders a second is what
  dragging that dial would otherwise ask for.

Parameter moves are ramped onto the running audio graph — that is the point of
turning a knob while listening. Adding, removing or bypassing a device rebuilds
only that lane's chain, without re-scheduling a single clip.

<!-- screenshot: docs/images/studio-devices.png — the device rack open under the timeline, showing a compressor and a reverb on a coloured lane -->

## Keyboard shortcuts

Everything below is bound to the window, so it works wherever the pointer left
the focus — with one deliberate exception: **while you are typing in a text
field, every shortcut here is off**, so `⌘/Ctrl + Z` in the script means "undo my
typing".

`Escape` is the other exception. It is handled by the lane area rather than the
window, so the timeline needs focus — click in it first.

### Panels

| Keys         | Action                   |
| ------------ | ------------------------ |
| `⌘/Ctrl + K` | Command palette          |
| `⌘/Ctrl + R` | Toggle the Script panel  |
| `⌘/Ctrl + P` | Toggle the Prompt panel  |
| `⌘/Ctrl + B` | Toggle the Library panel |
| `⌘/Ctrl + E` | Toggle the Sample panel  |
| `⌘/Ctrl + F` | Toggle the Devices panel |
| `⌘/Ctrl + I` | Toggle the History panel |
| `⌘/Ctrl + N` | Toggle the MIDI panel    |
| `⌘/Ctrl + O` | Toggle the Piano roll    |
| `⌘/Ctrl + G` | Toggle the Logs panel    |
| `⌘/Ctrl + L` | Toggle the Timeline      |

Holding `Alt` disables the panel shortcuts, so `Alt` combinations reach the
browser untouched.

### Timeline

| Keys                         | Action                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| `Space`                      | Play or stop                                                 |
| `⌘/Ctrl + Z`                 | Undo                                                         |
| `⌘/Ctrl + Y`, `⌘/Ctrl + ⇧ Z` | Redo                                                         |
| `⌘/Ctrl + A`                 | Select every clip                                            |
| `Escape`                     | Clear the selection; cancel an armed scissors                |
| `⌘/Ctrl + C`                 | Copy the primary clip                                        |
| `⌘/Ctrl + X`                 | Copy the primary clip, delete the whole selection            |
| `⌘/Ctrl + V`                 | Paste at the playhead, on the copied clip's track            |
| `⌘/Ctrl + D`                 | Duplicate the whole selection                                |
| `Delete`, `Backspace`        | Delete the whole selection                                   |
| `M`                          | Mute or unmute the primary clip                              |
| `S`                          | Split the primary clip at the playhead, when it is inside it |
| `Alt` (held while dragging)  | Defeat snapping                                              |
| `Shift` + drag the ruler     | Mark a loop region                                           |
| `Shift` + click a clip       | Add or remove it from the selection                          |
| Wheel                        | Zoom about the pointer                                       |
| `Shift` + wheel              | Scroll horizontally                                          |

Undo and redo keep working while an agent holds the story; everything that edits
does not. Playing and selecting are reading, not writing.

An agent rewriting the story **clears the undo stack**, because the recorded
inverses describe clips that may no longer be where — or what — they were.

## Generating into the timeline

The **Prompt panel** (`⌘/Ctrl + P`) is the same request form the Music studio
uses, with its submit button relabelled **Generate & insert**. Describe a sound
or a piece of music, pick a model, and the result lands on this timeline rather
than in a shelf.

Where it lands:

- **In time**: at the playhead if the story is playing, otherwise at the start of
  the selected clip, otherwise at zero.
- **On which lane**: the lane the device rack is pointed at — which follows your
  selection.

If the request asked for the take to be **separated**, every stem comes back as
part of one take and each one gets a lane of its own, stacked above the highest
lane in use. **Variations** are alternatives rather than parts, so only the first
is inserted; the rest stay in the shelf to be dragged in.

Every attempt — running, done or failed — is recorded in the **History** panel
(`⌘/Ctrl + I`), which is per story and survives a reload. History is separate
from the Prompt panel on purpose: what you are about to ask for and what you
already asked for are different questions, and stacking them made the panel you
write in shorter every time you generated.

See [Generating](./GENERATING.md) for prompt technique and what each model
wants.

## Driving the studio with words

Under the whole studio — not inside a panel, because what it acts on is the
arrangement rather than any one view of it — is an instruction bar. Type what you
want done and press `Enter` (`Shift + Enter` for a newline).

The rest of the studio is direct manipulation: drag the clip, click the M. That
is the right interface for one clip and the wrong one for eight, and "name all of
the tracks" is a sentence long and a minute of clicking.

**It shows you the plan before running it.** Each edit is listed in your own
terms — clips named by their words or by their sound's name, tracks by number and
name — with anything destructive marked. An id in a confirmation prompt tells you
nothing about whether the assistant understood you, which is the entire question
the preview exists to answer. **Apply** runs it, **Discard** throws it away.

This uses the local prompt assistant, which is **off by default**; with nothing
configured the bar says so rather than failing silently.

### What works

The request is classified first, then planned by whichever branch it belongs to —
one small model doing one job at a time, because a single prompt covering all of
them was long enough that strengthening one section destabilised another.
Roughly:

- **Editing what is already there** — "mute 1 and 3", "rename the tracks", "move
  the vocal to the cursor", "delete the last clip", "put a delay on the drums",
  "drop track 2 by 6 dB".
- **Making something new for this timeline** — "add some drums", "put rain under
  this", "add a bassline on track 2". This is handed to the Prompt panel's own
  submit path, so the take arrives by the same route a typed prompt would take
  and shows up in the History beside it.
- **Describing a whole finished piece**, with no reference to this timeline — "a
  hardcore instrumental where distorted guitars thrash over a double-kick kit".
  There is nothing here to edit, so it is routed to the Prompt panel instead of
  refused. A description is not a failed instruction.
- **Working the interface** — "show the library", "open the script", "start
  recording".

References are resolved by meaning rather than by exact words: "the vocals" is
the track holding a clip labelled *breathy female vocal hook*. Track numbers are
literal — "mute 1 and 3" means tracks 1 and 3, never positions in a list. "Here"
and "at the cursor" mean the playhead; "these" and "the selected ones" mean your
selection. Nothing has to be selected for it to act.

### The action vocabulary

The assistant never runs anything and never names a thing that was not handed to
it. It returns a list of actions; the page applies each one through the same
handler a click would have used, so an assistant edit is optimistic, invalidates
the same queries, and **lands on the undo stack exactly like a manual one**.

| Action                         | What it does                                       |
| ------------------------------ | -------------------------------------------------- |
| `rename_track`                 | Give a track a name                                |
| `set_track`                    | Mute, solo, or set a track's gain                  |
| `move_clip`                    | Move a clip in time, onto another track, or both   |
| `set_clip`                     | Mute a clip, or rewrite its words                  |
| `delete_clip`                  | Remove a clip — the one action flagged destructive |
| `add_clip`                     | Write a new line onto a track at a time            |
| `add_device` / `remove_device` | Put a device on a track's rack, or take one off    |
| `generate_clip`                | Generate audio from a prompt and place it          |
| `show_panel`                   | Open or close a panel                              |
| `start_recording`              | Start a take                                       |

Every action that names a clip id or a track index is checked against the
timeline that was sent, and anything referring to something that does not exist
is thrown away before you see it. The bar tells you how many were dropped rather
than quietly applying a smaller plan than the one that came back. Device kinds
are checked the same way, against the same eight the rack can build.

This part of the studio is under active development. The set of actions above is
the part worth relying on, not any particular phrasing.

## Export

**Export** flattens the arrangement into one file in your library:

- Clips are placed at their real start times; gaps stay silent.
- Overlaps sum — that is what lanes are for — with crossfades applied.
- Clip gain and track gain both apply; muted clips and un-soloed tracks are left
  out.
- Trims are honoured, so a shortened clip is short in the file too.
- Devices are **not** applied. See the rack, above.

The result is a normal sound: it appears in your library with the story's title
and can be dropped back onto another timeline.

## For agents (MCP)

An agent connected over [MCP](./MCP.md) can build and drive a story without the
page being open. While one is working, the studio says so and pauses editing —
two writers on one line is a race nobody wins, and the work is usually seconds.
Everything the agent does streams into the open page as it happens, so you can
watch a story being written rather than refreshing to discover it.

The studio-relevant tools:

| Tool                      | What it does                                                       |
| ------------------------- | ------------------------------------------------------------------ |
| `soundbox.create_story`   | Start a story. Sets the default delivery for every line            |
| `soundbox.list_stories`   | Stories, most recently worked on first                             |
| `soundbox.get_story`      | Every line: text, voice, timing, and whether it has been voiced    |
| `soundbox.add_lines`      | Append lines — spoken lines, pauses, or existing library sounds    |
| `soundbox.update_line`    | Words, voice, delivery, start, track, gain, mute, and trim         |
| `soundbox.delete_line`    | Remove one line. Its audio stays in the library                    |
| `soundbox.split_line`     | Cut a voiced line at a point in its own audio                      |
| `soundbox.speak_story`    | Read every line that has no audio yet. This is the slow one        |
| `soundbox.open_in_studio` | Put a library sound on a timeline, split into stems where possible |
| `soundbox.mix_track`      | Name, mute, solo or set the level of one lane                      |
| `soundbox.remove_track`   | Delete a lane and the clips on it. Lanes above slide down          |
| `soundbox.export_story`   | Mix the arrangement down to one sound                              |

Changing a line's words or its delivery does not re-read it — the line has to be
voiced again before the change is audible.

Splitting a voiced line leaves the words with the first half. There is no honest
way to know which of them fell either side of the cut.

The track properties an agent can touch are exactly the ones the export honours:
name, mute, solo and gain. There is no MCP tool for the device rack, for the same
reason the export ignores it.

Underneath, the studio is an ordinary HTTP API — `/api/stories`, its `/tracks`
and `/segments`, and `/export`. See [the API reference](./API.md) if you would
rather drive it directly.
