/**
 * The `/sfx` taxonomy — one entry per programmatic landing page.
 *
 * Every entry carries its own metadata and intro copy. Entries with a `content`
 * block are publishable; the rest are the planned backlog and render only as
 * links from the hub (see `isPublished`). Nothing here is generated at runtime:
 * a page exists because someone wrote it, which is the whole difference between
 * this and a doorway-page farm.
 *
 * Ordering is deliberate — the hub renders these in groups, and the groups are
 * how search intent clusters, not how an alphabet sorts.
 */

import type { SfxCategory } from "./types";
import { EXTRA_SAMPLES } from "./expansions";
import { FOLEY_AND_TRANSPORT } from "./new-categories";
import { DESIGN_AND_CREATURE } from "./design-categories";

/** Hub grouping. Purely presentational, but stable enough to link against. */
export type SfxGroup =
  | "Games"
  | "Film & video"
  | "World & nature"
  | "Foley & materials"
  | "Vehicles & transport"
  | "Human & voice"
  | "Interface & motion";

export const GROUP_ORDER: SfxGroup[] = [
  "Games",
  "Film & video",
  "World & nature",
  "Foley & materials",
  "Vehicles & transport",
  "Human & voice",
  "Interface & motion",
];

export const CATEGORY_GROUPS: Record<string, SfxGroup> = {
  "8bit": "Games",
  "8bit-music": "Games",
  "chiptune-music": "Games",
  "retro-game": "Games",
  "video-game": "Games",
  "coin-pickup": "Games",
  "power-up": "Games",
  "game-over": "Games",
  laser: "Games",
  magic: "Games",
  weapon: "Games",

  explosion: "Film & video",
  impact: "Film & video",
  horror: "Film & video",
  "sci-fi": "Film & video",
  cinematic: "Film & video",
  glitch: "Film & video",
  crowd: "Film & video",

  rain: "World & nature",
  thunder: "World & nature",
  wind: "World & nature",
  water: "World & nature",
  fire: "World & nature",
  animal: "World & nature",
  ambience: "World & nature",
  footsteps: "World & nature",
  door: "World & nature",

  whoosh: "Interface & motion",
  ui: "Interface & motion",
  notification: "Interface & motion",
  transition: "Interface & motion",
  machinery: "Interface & motion",

  // Added after auditing the big libraries' own category trees — see the note
  // at the top of new-categories.ts for where each of these came from.
  robot: "Games",
  creature: "Games",

  riser: "Film & video",
  braam: "Film & video",
  drone: "Film & video",
  gunshot: "Film & video",
  alarm: "Film & video",
  electricity: "Film & video",
  cartoon: "Film & video",

  glass: "Foley & materials",
  metal: "Foley & materials",
  wood: "Foley & materials",
  paper: "Foley & materials",
  cloth: "Foley & materials",
  keyboard: "Foley & materials",
  clock: "Foley & materials",
  bell: "Foley & materials",

  car: "Vehicles & transport",
  engine: "Vehicles & transport",
  train: "Vehicles & transport",
  aircraft: "Vehicles & transport",

  applause: "Human & voice",
  scream: "Human & voice",
  heartbeat: "Human & voice",
};

/* ------------------------------------------------------------------------ */
/* The fully authored prototype page.                                        */
/* ------------------------------------------------------------------------ */

const EIGHT_BIT: SfxCategory = {
  slug: "8bit",
  name: "8-bit",
  coverImage: "/sfx/covers/8bit-cover.png",
  targetQuery: "8bit sound effects",
  intent:
    "Solo/indie game devs building a retro-styled game who need coins, jumps, " +
    "lasers and death jingles, and would rather generate a set that matches " +
    "than dig through a pack where every clip came from a different game.",
  metaTitle: "8-Bit Sound Effects — Generate Them Locally | Soundbox",
  metaDescription:
    "Make 8-bit and chiptune sound effects on your own machine: coins, jumps, lasers, power-ups. Real prompts, open-weight models, no cloud and no per-sound billing.",
  h1: "8-bit sound effects you generate yourself",
  intro:
    "Retro game audio is a small, opinionated vocabulary — a coin blip, an ascending jump, " +
    "a descending death jingle — and the hard part has never been finding one clip. It is " +
    "finding twenty that sound like they came from the same machine. Soundbox runs " +
    "open-weight audio models on your own GPU, so you can generate a whole set from one " +
    "prompt family, in one sitting, and regenerate any of them with a different seed when " +
    "one lands wrong.",
  content: {
    samples: [
      {
        slug: "dungeon-loop-16bit",
        title: "Dungeon crawl loop",
        prompt:
          "16-bit chiptune dungeon crawl loop, driving square wave lead synth melody, triangle wave bass synth, punchy 8-bit drum machine percussion, dark minor key, 120 BPM, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "boss-battle-sting",
        title: "Boss battle stinger",
        prompt:
          "8-bit boss battle intro stinger, square wave brass stab synth hits, fast triangle wave bass synth run, escalating rhythmic intensity, three phrases building tension, chiptune",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "level-complete-fanfare-full",
        title: "Level-complete fanfare (full)",
        prompt:
          "chiptune level-complete fanfare, square wave lead synth melody, triangle wave harmony synth, 8-bit noise-channel drum hits, four ascending musical phrases resolving to a bright major chord",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "8bit-boss-theme-loop",
        title: "Boss theme loop",
        prompt:
          "8-bit boss battle theme, driving square wave bass synth, fast arpeggiated pulse wave lead synth, noise-channel drum machine on the offbeat, tense minor key, 140 BPM, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
    ],
    recipes: [
      {
        label: "Coin / pickup",
        prompt:
          "short two-note chiptune coin pickup, bright square wave, B5 up to E6, no reverb",
        why: "Naming the two pitches and the interval is what stops the model returning a generic ping. Coins are recognisable because they *rise*.",
      },
      {
        label: "Jump",
        prompt:
          "8-bit jump blip, square wave rising from low to high over 300 ms, tight and dry",
        why: "Give it a duration in milliseconds. Anything over half a second stops reading as a jump and starts reading as a siren.",
      },
      {
        label: "Laser",
        prompt:
          "retro arcade laser shot, thin pulse wave sweeping downward fast, narrow duty cycle",
        why: "\"Narrow duty cycle\" is the actual timbre word for the reedy NES lead. It does more work than \"sci-fi\".",
      },
      {
        label: "Game over",
        prompt:
          "chiptune game over jingle, six-note descending minor line, square wave, slow and final",
        why: "Direction plus mode. Ascending-major is a win, descending-minor is a loss; say which and the model stops guessing.",
      },
      {
        label: "Menu blip",
        prompt:
          "single 8-bit menu select blip, one short square wave note, 60 ms, completely dry",
        why: "UI sounds fail by being too long. State the length explicitly and trim the tail in your editor afterwards.",
      },
    ],
    craft: [
      {
        heading: "Describe the waveform, not the vibe",
        body: "These models respond to physical and technical description far better than to mood words. \"Retro sound\" gives you mush. \"Square wave, narrow duty cycle, no reverb, 200 ms\" gives you something you can drop into a game. The three things worth naming every time are the waveform (square, pulse, triangle, filtered noise), the pitch movement (rising, falling, a named interval), and the space (dry, no reverb — chiptune SFX are almost always bone dry).",
      },
      {
        heading: "Generate short, layer later",
        body: "One three-second generation you can place precisely beats one twenty-second generation you cannot. Most 8-bit effects want to be under half a second. Generate them short, then layer and pitch them in your DAW or game engine — a coin and a power-up built from the same square-wave prompt family will sit together in a way that clips from six different sample packs never will.",
      },
      {
        heading: "Seeds are how you get a matching set",
        body: "Soundbox records the prompt, seed, steps and CFG for every sound it makes, and lets you regenerate from any of them. That is the practical route to a coherent set: find a seed whose character you like, then vary only the prompt's pitch and length words across the whole family. If one clip lands wrong, you re-roll that one clip rather than the set.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial game?",
        answer:
          "It depends entirely on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with that sound. Check the model's own licence — the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer:
          "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer:
          "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds — which is fine for a handful of short 8-bit blips and painful for anything longer.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer:
          "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent building your level can make the door sound in the same pass, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer:
          "A pack gives you someone else's twelve coin sounds. Generating gives you the one that fits the pitch of your menu music, at the length your animation actually needs, in a set that matches. The trade is time and a GPU against fit and consistency.",
      },
    ],
    related: ["retro-game", "video-game", "coin-pickup", "power-up", "game-over", "laser"],
  },
};

const CHIPTUNE_MUSIC: SfxCategory = {
  slug: "chiptune-music",
  name: "Chiptune Music",
  targetQuery: "chiptune music generator",
  intent:
    "Game devs and musicians who want authentic chip-music — SID, FM synth, tracker — " +
    "named by the actual hardware it imitates, not a vague \"retro\" preset, and who need " +
    "a full loop rather than a one-shot blip.",
  metaTitle: "Chiptune Music Generator — SID, FM Synth & Tracker Loops | Soundbox",
  metaDescription:
    "Generate chiptune music locally: SID chip, Sega Genesis FM synth, NES 2A03, OPL2 AdLib and Amiga tracker loops. Real prompts, open-weight models, no cloud.",
  h1: "Chiptune music, named by the chip it imitates",
  intro:
    "\"Chiptune\" is not one sound — a Commodore 64 SID chip, a Sega Genesis YM2612 FM synth " +
    "and a Yamaha OPL2 AdLib card are three different pieces of hardware with three " +
    "different timbres, and a prompt that says \"chiptune\" and nothing else asks the model " +
    "to guess which one you mean. Name the chip and the voice it's known for — filtered " +
    "square wave, FM bell, tracker sample — and Stable Audio's music-trained model renders " +
    "a loop that actually sounds like that machine, not a generic 8-bit preset.",
  content: {
    samples: [
      {
        slug: "sid-chiptune-loop",
        title: "SID chip loop (C64)",
        prompt:
          "Commodore 64 SID chip chiptune loop, MOS 6581 filtered square wave lead synth arpeggio, pulse-width modulation bass synth, gritty analog filter sweep, upbeat major key, 130 BPM, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "genesis-fm-synth-theme",
        title: "Genesis FM synth theme",
        prompt:
          "Sega Genesis YM2612 FM synth action theme, punchy FM bell lead synth melody, driving FM bass synth, crisp PSG noise-channel hi-hats, energetic 16-bit action game score, 140 BPM, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "nes-2a03-dungeon-theme",
        title: "NES 2A03 dungeon theme",
        prompt:
          "NES 2A03 chiptune dungeon theme, triangle wave bass synth ostinato, pulse wave lead synth melody with duty-cycle changes, noise-channel percussion, moody minor key, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "opl2-adlib-boss-theme",
        title: "OPL2 AdLib boss theme",
        prompt:
          "Yamaha OPL2 AdLib FM synthesis boss battle theme, aggressive FM brass stab synth hits, driving FM bass synth line, retro PC soundcard timbre, tense minor key, 145 BPM, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "amiga-modtracker-overworld",
        title: "Amiga tracker overworld theme",
        prompt:
          "Amiga ProTracker module overworld theme, sampled square wave lead synth melody, plucked chiptune bass synth, tracker-style drum breaks, bright cheerful major key, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      // ACE-Step, not Stable Audio — the other four loops above are instrumental
      // because Stable Audio has no vocal path at all. ACE-Step is a
      // lyrics-conditioned vocal music model: `prompt` still sets genre and
      // instrumentation, but a separate `lyrics` block gives it words to sing,
      // which is the one thing no other model on this page can do.
      {
        slug: "hero-anthem-vocal-chant",
        title: "8-bit hero anthem (vocal)",
        prompt:
          "8-bit chiptune hero anthem, bright square wave lead synth melody, driving triangle wave bass synth, punchy noise-channel drums, energetic major key, gang-vocal chant",
        source: "model",
        model: "audiocpp-ace-step",
      },
    ],
    recipes: [
      {
        label: "SID (Commodore 64)",
        prompt:
          "Commodore 64 SID chip loop, MOS 6581 filtered square wave lead synth, pulse-width modulation bass synth, analog filter sweep",
        why: "\"Filtered\" and \"pulse-width modulation\" are the two words that actually separate a SID from a generic square wave — the SID's analog filter and PWM bass are its signature.",
      },
      {
        label: "Sega Genesis FM synth",
        prompt:
          "Sega Genesis YM2612 FM synth theme, FM bell lead synth, FM bass synth, PSG noise-channel hi-hats",
        why: "\"FM\" plus an instrument word (bell, bass) is the whole trick — FM synthesis has a metallic, bell-like character that square-wave chiptune doesn't, and naming the synthesis method is what gets it.",
      },
      {
        label: "NES 2A03",
        prompt:
          "NES 2A03 chiptune theme, triangle wave bass synth, pulse wave lead synth with duty-cycle changes, noise-channel percussion",
        why: "The 2A03 has exactly four voices — two pulse, one triangle, one noise. Naming all four by their real role (bass, lead, percussion) keeps the arrangement authentic instead of a wall of square waves.",
      },
      {
        label: "OPL2 / AdLib",
        prompt:
          "Yamaha OPL2 AdLib FM synthesis theme, FM brass stab synth hits, FM bass synth line, retro PC soundcard timbre",
        why: "OPL2 is a different FM chip from the Genesis's YM2612 — \"AdLib\" and \"soundcard\" nudge the model toward its thinner, brassier late-80s PC voice instead of a console sound.",
      },
      {
        label: "Amiga / tracker",
        prompt:
          "Amiga ProTracker module theme, sampled square wave lead synth melody, plucked bass synth, tracker-style drum breaks",
        why: "The Amiga did not synthesise its voices, it played samples — \"tracker\" and \"sampled\" are what push the output toward that grittier, sample-based tracker-music texture.",
      },
      {
        label: "Hero anthem (vocal)",
        prompt:
          "8-bit chiptune hero anthem, bright square wave lead synth melody, driving triangle wave bass synth, punchy noise-channel drums, energetic major key, gang-vocal chant",
        why: "ACE-Step's `prompt` sets the same genre/instrumentation role as on the instrumental loops above — the difference is a separate `lyrics` field (\"[verse]\\nRise up, hero\\nThe quest begins\") that gives it words to actually sing over the beat.",
      },
    ],
    craft: [
      {
        heading: "Name the chip, not the decade",
        body: "\"Retro\" and \"old-school\" describe an era; \"SID\", \"YM2612\", \"2A03\" and \"OPL2\" describe a sound. Each of those chips has a documented, well-known timbre — the SID's analog filter, the YM2612's FM bell tones, the 2A03's four fixed voices, the OPL2's thinner AdLib character — and naming the chip is how you tell the model which of those four very different sounds you actually want.",
      },
      {
        heading: "This is where a music model earns its keep",
        body: "Stable Audio 3 SFX is tuned for one-shot sound design — a door, a footstep, a laser. A 15-second chiptune loop with a lead melody, a bass line and percussion staying in time and in key for its whole length is a music-composition problem, not a sound-design one, and a music model — Stable Audio 3 Small Music, or ACE-Step — is what holds it together. Reach for it whenever the result needs to sound like an instrument performance, not an isolated sound.",
      },
      {
        heading: "Say \"seamless loop\" and mean it",
        body: "These models can render a loop where the last beat and the first beat line up, but only if you ask for it explicitly and structure the prompt as a fixed-tempo phrase (\"130 BPM\", \"seamless loop\") rather than a one-off event. If a loop point still clicks, trim a few milliseconds off the tail in an editor — that is a crossfade problem, not a generation problem.",
      },
      {
        heading: "Stable Audio plays instruments; ACE-Step sings",
        body: "None of the loops above have a voice, because Stable Audio 3 Small SFX has no vocal path — it renders instruments only, however music-literate the arrangement. ACE-Step is a different model family built specifically for lyrics-conditioned vocal music: give it a `lyrics` block and it sings those words over the arrangement described in `prompt`. That makes it the right reach whenever the moment needs a hook, a chant, or a line of actual words — a hero anthem, a victory chorus — not just a backing loop.",
      },
    ],
    faqs: [
      {
        question: "What's the difference between chiptune and 8-bit music?",
        answer:
          "8-bit usually means specifically the sound of 8-bit game consoles — the NES's 2A03 or the Game Boy's APU, both fixed at four simple voices. Chiptune is the broader family: it includes those consoles plus 16-bit-era FM synth chips (the Sega Genesis's YM2612), PC soundcards (the OPL2/OPL3 behind AdLib and Sound Blaster) and sample-based tracker music (the Commodore Amiga). If you want the specifically 8-bit console sound, see the 8-bit music collection; if you want any of the wider chip-music family, this page covers it.",
      },
      {
        question: "Can I use AI-generated chiptune music commercially?",
        answer:
          "It depends on which model rendered it, and Soundbox shows you the licence before you download the weights. Most samples on this page were made with Stable Audio 3 Small SFX, under the Stability AI Community License — free for individuals and organisations under $1M annual revenue. The vocal track used ACE-Step instead, Apache-2.0 (unverified — only generation was tested here, so check the model's own licence page before shipping). Soundbox itself is MIT, but the model's licence is what governs the audio it produces.",
      },
      {
        question: "Can these loops actually have vocals?",
        answer:
          "One can — ACE-Step is a lyrics-conditioned vocal music model, and the hero anthem sample above gives it a short chant to sing. Stable Audio 3 Small SFX, which made the other four loops, is instrumental only; it has no path for words at all, however musical the arrangement. If you want a sung hook over a chiptune backing, reach for ACE-Step and its `lyrics` field rather than trying to coax vocals out of a model that structurally can't produce them.",
      },
      {
        question: "Does this actually sound like a real SID or YM2612 chip?",
        answer:
          "It's a diffusion model's impression of the timbre, not an emulation of the silicon — there's no actual SID or YM2612 running underneath. For sample-accurate chip emulation you still want a real emulator (VICE for the SID, a Genesis sound driver for the YM2612). What generation buys you is a quick, royalty-clear starting loop in that style, which you can then run through a real chiptune tracker or emulator if you need bit-exact authenticity.",
      },
      {
        question: "Does this run offline?",
        answer:
          "Yes, once the model's weights are downloaded. Soundbox runs entirely on your own machine — one SQLite file and one folder of WAVs under ~/.soundbox, no account, no upload step. Only the initial model download needs the network.",
      },
      {
        question: "Can my coding agent generate a chiptune soundtrack for my game?",
        answer:
          "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it's running. An agent building your game's audio can generate a whole set of chip-specific loops in one pass and get back absolute file paths to drop straight into your project.",
      },
    ],
    related: ["8bit-music", "8bit", "retro-game", "cinematic"],
  },
};

const EIGHT_BIT_MUSIC: SfxCategory = {
  slug: "8bit-music",
  name: "8-Bit Music",
  targetQuery: "8 bit music generator",
  intent:
    "Indie devs who need drop-in background music for a retro-styled game — a title screen, " +
    "an overworld, a shop, a final boss — built from the specific NES/Game Boy voices " +
    "(square, pulse, triangle, noise-channel) rather than a generic chiptune preset.",
  metaTitle: "8-Bit Music Generator — Royalty-Free Game Loops | Soundbox",
  metaDescription:
    "Generate 8-bit background music locally: Game Boy and NES-style title, overworld, shop and boss loops. Real prompts naming the actual synth voices, no cloud, no licensing per track.",
  h1: "8-bit background music for your game",
  intro:
    "An 8-bit console has exactly four voices to write with — two pulse/square waves, one " +
    "triangle, one noise channel — and every NES or Game Boy soundtrack you remember was " +
    "built entirely out of that small set. Naming those four voices by role (lead, harmony, " +
    "bass, percussion) instead of asking for \"8-bit music\" in the abstract is what gets a " +
    "loop that could actually sit under a title screen or an overworld map, not a generic " +
    "blip-fest.",
  content: {
    samples: [
      {
        slug: "gameboy-overworld-loop",
        title: "Game Boy overworld loop",
        prompt:
          "Game Boy APU chiptune overworld theme, cheerful square wave lead synth melody, pulse wave harmony synth, triangle wave bass synth, simple noise-channel percussion, bright major key, 125 BPM, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "nes-title-screen-theme",
        title: "NES title screen theme",
        prompt:
          "NES-style 8-bit title screen theme, bold square wave lead synth fanfare opening into a looping pulse wave melody, triangle wave bass synth, noise-channel snare hits, heroic major key, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "8bit-shop-menu-loop",
        title: "Shop / menu loop",
        prompt:
          "8-bit shop menu background loop, gentle square wave lead synth melody, soft triangle wave bass synth, sparse noise-channel percussion, relaxed mid-tempo major key, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      {
        slug: "8bit-final-boss-theme",
        title: "Final boss theme",
        prompt:
          "8-bit final boss battle theme, fast arpeggiated pulse wave lead synth, driving triangle wave bass synth, aggressive noise-channel drum pattern, dark minor key, 150 BPM, seamless loop",
        source: "model",
        model: "audiocpp-stable-audio-3-sfx",
      },
      // Same instrumental loop territory as the four above, rendered by
      // ACE-Step instead of Stable Audio — no lyrics on this one, since the
      // point here is comparing two different models' takes on an
      // instrumental chiptune loop, not showing off the vocal path (see the
      // chiptune-music collection for that).
      {
        slug: "ace-victory-loop",
        title: "Victory loop (ACE-Step)",
        prompt:
          "Game Boy APU chiptune victory loop, cheerful square wave lead synth melody, pulse wave harmony synth, triangle wave bass synth, bright major key, seamless loop",
        source: "model",
        model: "audiocpp-ace-step",
      },
    ],
    recipes: [
      {
        label: "Overworld / exploration",
        prompt:
          "Game Boy APU overworld theme, cheerful square wave lead synth, pulse wave harmony synth, triangle wave bass synth, simple noise-channel percussion, bright major key",
        why: "Naming all four voices by their job — lead, harmony, bass, percussion — is what keeps the arrangement from collapsing into one melody line with no supporting parts.",
      },
      {
        label: "Title screen",
        prompt:
          "NES-style title screen theme, bold square wave lead synth fanfare opening into a looping pulse wave melody, triangle wave bass synth, noise-channel snare hits",
        why: "A title theme has a shape: a fanfare opening, then a loop. Saying so explicitly is the difference between one continuous idea and an actual intro-into-loop structure.",
      },
      {
        label: "Menu / shop",
        prompt:
          "8-bit shop menu loop, gentle square wave lead synth, soft triangle wave bass synth, sparse noise-channel percussion, relaxed mid-tempo",
        why: "\"Sparse\" and \"relaxed\" matter here — menu music needs to sit quietly under UI sounds, not compete with them, and the model will fill every voice unless told to hold back.",
      },
      {
        label: "Boss battle",
        prompt:
          "8-bit final boss theme, fast arpeggiated pulse wave lead synth, driving triangle wave bass synth, aggressive noise-channel drum pattern, dark minor key, 150 BPM",
        why: "\"Arpeggiated\" is the specific NES-composer trick for making one voice sound like a chord — square-wave chips can only play one note at a time, so fast arpeggios are how they faked harmony.",
      },
    ],
    craft: [
      {
        heading: "Write for four voices, not one",
        body: "Real 8-bit hardware had a hard ceiling of four simultaneous voices, and that constraint is exactly what makes the genre recognisable. Ask for a lead melody, a harmony or counter-melody, a bass line and percussion by name, and the model renders something that reads as a composition. Ask for \"8-bit music\" with nothing else and you tend to get one busy lead line and not much underneath it.",
      },
      {
        heading: "Reach for a music model, not the SFX model",
        body: "Stable Audio 3 SFX is built for one-shot sound design — coins, jumps, hits. A 15-second background loop with a melody, harmony, bass and drums staying in key and in time for its full length is a composition task, and a music model — Stable Audio 3 Small Music or ACE-Step — is what holds that together over time. Use the SFX model for the coin blip, a music model for the music underneath it.",
      },
      {
        heading: "Match the tempo to the scene",
        body: "State a BPM. Overworld and shop themes read as calmer around 100-125 BPM; boss and combat themes want 140-160. The model follows a stated tempo far more reliably than a mood word like \"energetic\", and a consistent BPM across a set is also what makes several generated tracks feel like they belong to the same game.",
      },
      {
        heading: "Two models, two takes on the same brief",
        body: "The victory loop above uses the identical instrumental brief as the overworld loop — same voices, same major key, same \"seamless loop\" instruction — but renders it on ACE-Step instead of Stable Audio 3 Small SFX. Worth comparing directly: ACE-Step is primarily a lyrics-conditioned vocal model (see the chiptune-music collection for a sung example), but it renders a fully credible instrumental when `lyrics` is left empty, which makes it a genuine second option here, not just a vocal-only specialist.",
      },
    ],
    faqs: [
      {
        question: "Can I use this as royalty-free background music in my game?",
        answer:
          "It depends on the model, and Soundbox shows the licence before you download any weights. Most samples used Stable Audio 3 Small SFX, under the Stability AI Community License — free for individuals and organisations under $1M annual revenue; above that you need a Stability enterprise licence. The ACE-Step victory loop is Apache-2.0 (unverified — only generation was tested here). Soundbox itself is MIT, but the model that made the audio governs what you can do with it.",
      },
      {
        question: "How long a loop can I generate?",
        answer:
          "Stable Audio 3 Small SFX generates up to 11 seconds per render at its native settings, though the samples here run 13-18s using this model's extended range. For a longer loop, generate the phrase you want repeated and loop it in your game engine or DAW — that is also the more reliable way to get a click-free loop point than asking for a very long single render.",
      },
      {
        question: "What's the difference between this and the chiptune music collection?",
        answer:
          "This page is specifically the 8-bit console sound — NES/Game Boy-style square, pulse, triangle and noise-channel voices — organised by game scene (title, overworld, shop, boss). The chiptune music collection is the wider family, including 16-bit FM synth chips (Sega Genesis), PC soundcards (OPL2/AdLib) and Amiga tracker music. If you specifically want the classic NES/Game Boy sound, stay here.",
      },
      {
        question: "Can my coding agent generate a full soundtrack for my game?",
        answer:
          "Yes. Soundbox runs an MCP server at http://127.0.0.1:17494/mcp while it's active, with tools for generating and listing sounds. An agent building your game can generate the title, overworld, shop and boss themes in one pass and get back absolute file paths to wire straight in.",
      },
      {
        question: "Does this run offline?",
        answer:
          "Yes, after the one-time model download. Everything after that runs locally — no account, no API key, no per-track cost — stored in a single SQLite file and folder of WAVs under ~/.soundbox.",
      },
    ],
    related: ["chiptune-music", "8bit", "retro-game", "video-game"],
  },
};

const WHOOSH: SfxCategory = {
  slug: "whoosh",
  name: "Whoosh",
  coverImage: "/sfx/covers/whoosh-cover.png",
  targetQuery: "whoosh sound effect",
  intent:
    "Video editors and motion designers who need a swipe, swing or transition sound that " +
    "matches the exact speed and size of the object moving on screen, rather than a whoosh " +
    "that was clearly recorded for someone else's cut.",
  metaTitle: "Whoosh Sound Effects — Generate Them Locally | Soundbox",
  metaDescription:
    "Make whoosh, swipe and transition sounds on your own machine: fast or slow, small or huge, dry or roomy. Real prompts, open-weight models, no cloud.",
  h1: "Whoosh sound effects you generate yourself",
  intro:
    "A whoosh is one of the few sounds where the physics is the whole prompt: something moved " +
    "through air, at a speed, with a mass, and the air had an opinion about it. Soundbox runs " +
    "open-weight audio models on your own GPU, so instead of scrubbing a library for the one " +
    "clip that happens to match your edit's timing, you generate a whoosh at the exact length " +
    "and weight your cut needs, then regenerate it in five seconds when the director wants it faster.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Fast swipe",
        prompt:
          "fast thin whoosh, small light object passing close to the microphone, 200 ms, sharp attack, dry",
        why: "\"Close to the microphone\" is what makes it read as fast — proximity does more of the speed work than any tempo word could.",
      },
      {
        label: "Heavy sweep",
        prompt:
          "slow heavy whoosh, large object moving through open air, 1.5 seconds, low-frequency weight, subtle room tone",
        why: "Naming the frequency range (\"low-frequency weight\") is how you separate a heavy object from a fast one — speed and mass are two different prompt words, not one.",
      },
      {
        label: "Doppler pass-by",
        prompt:
          "realistic cinematic whoosh, deep object passing overhead, doppler pitch shift down as it passes, 2 seconds, roomy",
        why: "\"Doppler pitch shift down as it passes\" names the actual acoustic event a real pass-by produces, which is the difference between a whoosh that moves and one that just swells.",
      },
      {
        label: "UI transition",
        prompt:
          "short UI swipe whoosh for screen transition, thin and clean, left-to-right pan implied, 250 ms, completely dry",
        why: "Interface whooshes fail when they carry room tone — say \"completely dry\" and you keep the sound out of the way of whatever plays under it.",
      },
      {
        label: "Cartoon swish",
        prompt:
          "cartoon whoosh swish, exaggerated pitch rise then fall, bright and airy, 400 ms, no low end",
        why: "\"No low end\" is the word that keeps a comedic swish from accidentally sounding cinematic — cartoons live entirely in the upper register.",
      },
    ],
    craft: [
      {
        heading: "Speed and mass are two separate words",
        body: "Every whoosh is the sound of displaced air, and air behaves differently depending on how fast something moved and how much of it there was. Set both independently: speed as a duration (\"200 ms\" reads fast, \"1.5 seconds\" reads slow) and mass as a frequency description (\"thin\" and \"light\" for something small, \"low-frequency weight\" or \"heavy\" for something large). A prompt that only sets one of these will drift toward a generic mid-sized swoosh no matter what else you say.",
      },
      {
        heading: "Doppler is the tell for realism",
        body: "A whoosh that just fades in and out reads as synthetic. A real object passing a fixed listener does something more specific: it arrives, and the pitch drops slightly as it passes and recedes, because the listener is stationary and the source is not. Naming that — \"doppler pitch shift down as it passes\" — is the single most reliable way to push a generation from cartoon-swish territory into realistic pass-by territory.",
      },
      {
        heading: "Dry for cuts, roomy for reveals",
        body: "A whoosh that sits under a hard cut needs to be dry and short so it doesn't smear into the next shot — say \"dry\" or \"no reverb\" and keep it under half a second. A whoosh that sells a slow reveal or a title card can afford room tone and a longer tail, which reads as space rather than as clutter. Decide which job the sound is doing before you write the prompt, because the two want opposite acoustics.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer:
          "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a whoosh governs what you can do with it. Check the model's own licence — the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer:
          "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer:
          "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds — which is fine for a handful of short transition whooshes and painful if you're batching a whole edit's worth.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer:
          "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent wiring up your UI transitions can generate the swipe sound in the same pass, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer:
          "A pack gives you someone else's whoosh, timed for someone else's edit. Generating gives you one at the exact duration your cut needs, with the speed and weight matched to what's actually moving on screen. The trade is time and a GPU against fit and timing.",
      },
    ],
    related: ["transition", "cinematic", "ui", "glitch", "impact", "explosion"],
  },
};

const FOOTSTEPS: SfxCategory = {
  slug: "footsteps",
  name: "Footsteps",
  coverImage: "/sfx/covers/footsteps-cover.png",
  targetQuery: "footsteps sound effect",
  intent:
    "Game devs and sound designers who need a set of footstep variations per surface — " +
    "gravel, wood, concrete, snow — that all sound like the same pair of boots, rather than " +
    "eight clips pulled from eight different recording sessions.",
  metaTitle: "Footstep Sound Effects — Generate Them Locally | Soundbox",
  metaDescription:
    "Make footstep sound effects on your own machine: gravel, wood, concrete, snow, water, grass. Real prompts, open-weight models, no cloud, no billing.",
  h1: "Footstep sound effects you generate yourself",
  intro:
    "A footstep is a small, precise sound — a foot's weight meeting a surface for a few dozen " +
    "milliseconds — and games need a lot of them, all matching, per surface, per pace. Soundbox " +
    "runs open-weight audio models on your own GPU, so instead of licensing a foley pack and " +
    "hoping the gravel matches the wood, you generate a whole surface set from one prompt " +
    "family and regenerate any single step that lands wrong.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Gravel",
        prompt:
          "single footstep on loose gravel, walking pace, boot sole, close mic, crunchy grain, dry",
        why: "\"Crunchy grain\" names the actual texture of small stones shifting under weight — it does more than \"gravel\" alone, which the model will otherwise render as generic crunch.",
      },
      {
        label: "Wood floor",
        prompt:
          "single footstep on old wooden floorboard, walking pace, boot heel, slight creak, small room reflection",
        why: "\"Small room reflection\" is what separates an indoor wood step from an outdoor deck — footsteps carry the room with them far more than most sounds do.",
      },
      {
        label: "Concrete run",
        prompt:
          "single footstep on bare concrete, running pace, hard sneaker sole, sharp slap, tight and dry",
        why: "Naming the pace as \"running\" changes the impact shape the model reaches for — running steps are shorter and harder-edged than walking steps on the same surface.",
      },
      {
        label: "Snow",
        prompt:
          "single footstep in fresh snow, walking pace, boot sinking in, soft compressing crunch, muffled and close",
        why: "\"Sinking in\" and \"compressing\" describe the mechanics of snow underfoot, not just its texture — that's what keeps it from coming back as generic soft crunch.",
      },
      {
        label: "Water",
        prompt:
          "single footstep in shallow water, walking pace, bare foot, splash with a wet slap, small puddle depth",
        why: "Stating the depth (\"small puddle\") stops the model reaching for a full splash or a swimming sound — depth is the variable that decides how much water moves.",
      },
    ],
    craft: [
      {
        heading: "Name the surface material, not just its label",
        body: "\"Gravel\" gives the model a category; \"loose gravel, crunchy grain\" gives it a mechanism. The surfaces that read most convincingly are the ones where you describe what the material does under weight — compresses, shifts, creaks, splashes — rather than just naming the surface. Pair the material with the footwear (boot, bare foot, sneaker) since sole and surface interact as much as the surface alone.",
      },
      {
        heading: "Generate one step, build the walk cycle after",
        body: "Ask for a single footstep, not a walking loop — a single clean impact is easier to place accurately in an animation than a pre-timed sequence that never quite lines up with your character's stride. Generate four to eight single-step variations per surface from the same prompt family, varying only small wording, then alternate them in your model's footstep system so no two consecutive steps sound identical.",
      },
      {
        heading: "Pace changes the impact, not just the tempo",
        body: "Walking and running steps on the same surface are not the same sound sped up — a running step lands harder, shorter, and with less roll-off, because more weight arrives faster. Say \"walking pace\" or \"running pace\" (or \"jogging\") explicitly in the prompt rather than relying on duration alone, and keep the mic distance close and consistent across a surface set so the whole set matches.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial game?",
        answer:
          "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a footstep governs what you can do with it. Check the model's own licence — the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer:
          "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer:
          "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds — which is fine for a handful of single steps and slow if you're batching a full surface set of eight variations.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer:
          "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent wiring up a character's surface-detection system can generate a matching step set in the same pass, and it gets back absolute file paths it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer:
          "A pack gives you someone else's gravel and someone else's wood, recorded at different distances with different boots — they never quite match. Generating gives you a whole surface set from one prompt family, so the gravel and the wood sound like the same character walked on both. The trade is time and a GPU against fit and consistency.",
      },
    ],
    related: ["door", "impact", "ambience", "horror", "animal", "water"],
  },
};

/* ------------------------------------------------------------------------ */
/* The rest of the taxonomy. All fully authored.                             */
/* ------------------------------------------------------------------------ */

const RETRO_GAME: SfxCategory = {
  slug: "retro-game",
  name: "Retro game",
  coverImage: "/sfx/covers/retro-game-cover.png",
  targetQuery: "retro game sound effects",
  intent:
    "Broader than 8-bit: 16-bit, arcade and early-CD-era game audio.",
  metaTitle: "Retro Game Sound Effects, Generated Locally | Soundbox",
  metaDescription:
    "Generate retro and arcade game sound effects on your own machine — prompts, seeds and a library that remembers every setting.",
  h1: "Retro game sound effects, made on your machine",
  intro:
    "Arcade and early-console audio has a specific grain to it. Here is how to describe that grain to a model rather than hunting for it in a pack.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Menu blip",
        prompt: "8-bit menu navigation blip, single square wave note, 80 ms, mid pitch, completely dry",
        why: "\"Mid pitch\" keeps the blip from reading as either a coin (high) or an error (low) \u2014 cursor sounds sit deliberately in the middle of the register.",
      },
      {
        label: "Confirm chime",
        prompt: "retro menu confirm chime, two-note square wave rise, low to high fifth, 150 ms, dry",
        why: "Naming the interval as a fifth, not just \"rising\", is what gives it the open, resolved quality a confirm sound needs instead of the tighter climb of a coin pickup.",
      },
      {
        label: "Level-start fanfare",
        prompt: "chiptune level-start fanfare, four-note ascending square wave arpeggio, bright and punchy, 700 ms",
        why: "\"Punchy\" tells the model to keep each note's attack sharp rather than let the arpeggio blur into a pad \u2014 fanfares read as energetic because of the attack, not the pitch.",
      },
      {
        label: "Error buzz",
        prompt: "retro error buzz, low pulse wave held flat for 200 ms, slight detune, harsh and dry",
        why: "\"Held flat\" is the key phrase \u2014 a static pitch reads as a system rejection, while any pitch movement at all starts sounding like a musical note instead of an error.",
      },
      {
        label: "Boss alert",
        prompt: "8-bit boss-appears alert, descending pulse wave siren over 600 ms, wide duty cycle, ominous but dry",
        why: "\"Wide duty cycle\" pushes the pulse wave toward a thicker, more aggressive timbre than the thin lead used for lasers \u2014 that timbre shift alone signals threat.",
      },
    ],
    craft: [
      {
        heading: "Retro game audio is a UI vocabulary, not a music vocabulary",
        body: "Most retro-game sounds are functional signals first \u2014 confirm, deny, advance, warn \u2014 and only decorative second. Prompt for the function directly: name whether the sound should read as a success or a rejection, and let pitch direction carry that meaning (rising for good, static or falling for bad). Save melodic complexity for the handful of sounds that are genuinely musical, like fanfares and jingles.",
      },
      {
        heading: "Keep the waveform palette consistent across a set",
        body: "A convincing retro game doesn't mix synthesis models mid-scene \u2014 everything comes from the same two or three oscillators. Pick square wave for melodic UI cues, pulse wave with a stated duty cycle for lasers and alerts, and filtered noise for hits and errors, then stick to that palette across every prompt in the set so the whole game sounds like it shares a sound chip.",
      },
      {
        heading: "State duration to control how much a sound interrupts",
        body: "UI feedback that runs too long feels like it's blocking the player. Menu blips and confirms want 80\u2013200 ms; fanfares and boss alerts can run out to 600\u2013800 ms because they mark a real event. Put the number in the prompt rather than trusting a duration word like \"short\", since \"short\" gets interpreted differently depending on what else is in the prompt.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A retro asset pack gives you one designer's whole UI vocabulary at once \u2014 their confirm, their error, their fanfare \u2014 and they rarely match your game's own coin or laser sounds because those came from somewhere else. Generating lets you build every UI cue from the same prompt family as your gameplay sounds, so a menu confirm and a coin pickup share a waveform and a register instead of just a genre label.",
      },
    ],
    related: ["8bit", "video-game", "coin-pickup", "power-up", "game-over", "ui"],
  },
};
const VIDEO_GAME: SfxCategory = {
  slug: "video-game",
  name: "Video game",
  coverImage: "/sfx/covers/video-game-cover.png",
  targetQuery: "video game sound effects",
  intent:
    "Highest-volume head term; searcher wants a starting point and a tool.",
  metaTitle: "Video Game Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate video game sound effects locally from a text prompt. Open-weight models, your GPU, no per-sound billing.",
  h1: "Video game sound effects from a text prompt",
  intro:
    "Every game needs a hundred small sounds and a budget for none of them. This is the local, repeatable way to make them.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Footstep",
        prompt: "single game footstep impact, boot on generic hard surface, walking pace, close mic, tight and dry, 150 ms",
        why: "\"Generic hard surface\" instead of naming a specific material keeps the sound neutral enough to layer with any surface-swap system in-model, which is what a base footstep actually needs to be.",
      },
      {
        label: "Melee swing",
        prompt: "melee weapon swing whoosh, fast blade cutting air, sharp doppler snap, 300 ms, dry",
        why: "\"Doppler snap\" is the physical event of a blade passing close and fast \u2014 naming it gets you the crack of a real swing instead of a generic air-whoosh.",
      },
      {
        label: "Hit marker",
        prompt: "hit marker confirmation tick, short high synth click, 60 ms, no tail, completely dry",
        why: "\"No tail\" matters more than any other word here \u2014 a hit marker has to be able to repeat rapidly without smearing, and any reverb or decay ruins that.",
      },
      {
        label: "Quest complete",
        prompt: "quest complete stinger, bright orchestral-hybrid rising chord over 900 ms, triumphant, light room reverb",
        why: "\"Light room reverb\" is deliberate here, unlike most UI sounds \u2014 a reward stinger is allowed a little space because it's meant to feel bigger than a click, not to stay out of the way.",
      },
      {
        label: "Low health warning",
        prompt: "low health warning pulse, low sine wave thump repeating twice over 500 ms, tense, dry",
        why: "Specifying \"repeating twice\" gives the model an actual rhythmic structure to generate instead of a single hit, which is what makes a warning read as ongoing rather than a one-off event.",
      },
    ],
    craft: [
      {
        heading: "Separate diegetic sounds from UI sounds in the prompt",
        body: "A footstep or a sword swing is a sound that exists in the game world and should carry some acoustic space \u2014 mic distance, a hint of environment. A hit marker or an inventory chime is a UI sound that should stay flat and dry so it doesn't compete with the mix. Decide which bucket a sound belongs in before writing the prompt, and only reach for reverb or room words on the diegetic ones.",
      },
      {
        heading: "Generic materials generalize, specific materials commit",
        body: "If a sound needs to work across many in-game contexts \u2014 a base footstep before surface detection, a generic impact before you know what's being hit \u2014 describe it in neutral terms (\"generic hard surface\", \"solid object\") so it doesn't carry an identity that clashes later. Save specific materials (gravel, metal, wood) for sounds you already know will only ever play in one context.",
      },
      {
        heading: "Reward sounds can break the house rules",
        body: "Most gameplay UI wants to be short and dry so it never gets in the player's way, but the handful of sounds that mark genuine achievement \u2014 level up, quest complete, boss defeated \u2014 are allowed to be longer and roomier, because for that one moment you want the sound to fill the space rather than stay invisible. Prompt those with duration and reverb words you'd avoid everywhere else.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A general video-game SFX pack is built to cover every genre at once, which means nothing in it is tuned to your specific UI style or your specific weapon feel. Generating lets you build a footstep, a hit marker and a quest stinger from prompts that share a register and an acoustic treatment, so the whole interface feels designed rather than assembled from a dozen unrelated packs.",
      },
    ],
    related: ["retro-game", "8bit", "coin-pickup", "power-up", "ui", "weapon"],
  },
};
const COIN_PICKUP: SfxCategory = {
  slug: "coin-pickup",
  name: "Coin pickup",
  coverImage: "/sfx/covers/coin-pickup-cover.png",
  targetQuery: "coin pickup sound effect",
  intent:
    "Very specific single-asset search; wants one good clip immediately.",
  metaTitle: "Coin Pickup Sound Effect — Generate Your Own | Soundbox",
  metaDescription:
    "Make a coin pickup sound that matches your game's key and length. Prompts, seeds and instant regeneration, all local.",
  h1: "Coin pickup sound effects",
  intro:
    "A coin sound is two notes and a rising interval. Getting it to sit with your menu music is the actual problem.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Classic coin",
        prompt: "short two-note chiptune coin pickup, bright square wave, B5 up to E6, no reverb, 150 ms",
        why: "Naming the exact two pitches and the interval between them is what makes it recognizable \u2014 a coin sound is defined by that specific rising leap, not just \"rising\".",
      },
      {
        label: "Coin combo",
        prompt: "rapid three-note ascending chiptune coin run, square wave, each note higher and shorter, 300 ms total, dry",
        why: "\"Each note higher and shorter\" tells the model the notes should accelerate, which is what reads as a combo counter climbing rather than three separate coins.",
      },
      {
        label: "Gem pickup",
        prompt: "sparkling gem pickup chime, bright bell-like synth tone with fast shimmer, 400 ms, light reverb tail",
        why: "\"Bell-like\" and \"shimmer\" push the timbre toward metallic harmonics instead of a flat square wave, which is what separates a premium gem from an ordinary coin.",
      },
      {
        label: "Physical coin drop",
        prompt: "coin dropping and tumbling on a hard surface, metallic clinking, three to four small bounces, 800 ms, close mic",
        why: "Counting the bounces explicitly (\"three to four\") gives the model a rhythmic event to generate instead of one clink, which is what a realistic tumble actually sounds like.",
      },
      {
        label: "Soft modern pickup",
        prompt: "soft modern pickup chime, single sine wave note with quick pitch bend up, 200 ms, subtle reverb, no harshness",
        why: "\"No harshness\" plus a sine wave instead of a square wave is the deliberate move away from chiptune territory toward the rounder pickup tones mobile and casual games use.",
      },
    ],
    craft: [
      {
        heading: "The rise is the whole sound",
        body: "Almost every pickup sound, regardless of style, communicates \"you gained something\" through upward pitch movement. Retro coins do it with a two-note square wave leap, modern pickups do it with a smoother pitch bend, jackpot bursts do it with a cascading run of many notes. Whatever style you're after, keep the direction rising \u2014 a falling pickup sound reads as a loss no matter what else is in the prompt.",
      },
      {
        heading: "Waveform sets the era",
        body: "Square wave with no reverb reads as retro/arcade. A sine wave with a pitch bend and a little reverb reads as a contemporary mobile or indie game. Bell-like or shimmering synth tones read as premium currency (gems, tokens) rather than base currency (coins). Decide which era and tier the pickup belongs to before writing the prompt, and let the waveform word carry that decision rather than an adjective like \"modern\" or \"premium\" alone.",
      },
      {
        heading: "Combos want acceleration, not just repetition",
        body: "When you need a run of pickups for a combo or multiplier, don't just ask for \"three coin sounds\" \u2014 ask for notes that get higher and shorter as the sequence continues. That acceleration is what makes a combo feel like it's building rather than just looping the same pickup three times.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you one fixed coin sound, and if it doesn't match your game's key or your combo system's pacing you're stuck editing someone else's file. Generating lets you set the exact pitches, the exact note count, and the exact acceleration your combo system needs, and regenerate any variant in seconds when the design changes.",
      },
    ],
    related: ["8bit", "power-up", "retro-game", "video-game", "game-over", "notification"],
  },
};
const POWER_UP: SfxCategory = {
  slug: "power-up",
  name: "Power-up",
  coverImage: "/sfx/covers/power-up-cover.png",
  targetQuery: "power up sound effect",
  intent:
    "Single-asset search, usually alongside coin and jump.",
  metaTitle: "Power-Up Sound Effect Generator | Soundbox",
  metaDescription:
    "Generate power-up jingles locally — ascending arpeggios, sweeps and risers, with the prompt and seed saved for every one.",
  h1: "Power-up sound effects",
  intro:
    "Ascending and major, or it does not read as a reward. The prompt vocabulary for getting there is short and learnable.",
  content: {
    samples: [
        // A rare-buff moment big enough to earn an actual sung line — ACE-Step
        // instead of the SFX model, prompt sets the arrangement and lyrics
        // gives it a hook to chant.
        {
          slug: "triumphant-power-chant",
          title: "Triumphant power chant (vocal)",
          prompt: "triumphant orchestral-hybrid power-up theme, uplifting choir vocals, bright brass and strings, ascending major key",
          source: "model",
          model: "audiocpp-ace-step",
        },
    ],
    recipes: [
      {
        label: "Classic power-up",
        prompt: "chiptune power-up jingle, five-note ascending major arpeggio, square wave, no decay tail, 500 ms",
        why: "\"No decay tail\" keeps each note punchy and equal in volume, which is what makes a five-note arpeggio read as one confident event instead of trailing off.",
      },
      {
        label: "Shield activate",
        prompt: "shield activation sound, rising synth pad with a soft shimmer, 600 ms, warm low-mid body, subtle reverb",
        why: "\"Warm low-mid body\" is the word that signals protection rather than speed \u2014 a shield sound wants weight and coverage, not a thin bright lead.",
      },
      {
        label: "Speed boost",
        prompt: "speed boost whoosh-synth hybrid, fast rising pitch sweep with a bright tail, 400 ms, energetic, dry",
        why: "Combining \"whoosh\" with \"synth\" tells the model to blend a physical air-movement sound with a musical rise, which reads as velocity in a way a pure arpeggio doesn't.",
      },
      {
        label: "Invincibility",
        prompt: "invincibility power-up fanfare, rapid ascending square wave run across two octaves, sparkly, 700 ms, dry",
        why: "Spanning \"two octaves\" instead of a fixed five-note run is what makes this sound bigger and rarer than an ordinary power-up \u2014 range signals scale.",
      },
      {
        label: "Health restore",
        prompt: "health restore chime, warm rising sine wave with a gentle bell overtone, 500 ms, soft reverb tail",
        why: "A sine wave base with only a \"gentle\" bell overtone keeps the sound soothing rather than triumphant, distinguishing a healing effect from an offensive or speed buff.",
      },
    ],
    craft: [
      {
        heading: "Match the waveform to the power-up's effect, not just its category",
        body: "All power-ups share an upward pitch motion, but the timbre should describe what the buff actually does. Speed wants brightness and a fast sweep. Shields and armor want low-mid warmth and weight. Healing wants a soft sine-based tone with no harsh overtones. Offensive buffs (invincibility, damage boosts) can be the brightest and loudest of the set. Write the effect into the prompt, not just the word \"power-up\".",
      },
      {
        heading: "Scale duration and range to rarity",
        body: "A common pickup should be quick \u2014 three to five notes, under 500 ms \u2014 so it doesn't interrupt gameplay when it happens often. A rare or run-ending buff like invincibility can run longer and span a wider pitch range, because the player experiences it far less often and the game can afford the extra half second to sell it as special.",
      },
      {
        heading: "Keep the whole power-up family on one waveform",
        body: "If your game has five different buffs, generate all of them from the same base waveform (square wave for a retro game, synth pad for a modern one) and vary only the pitch range, speed, and overtone description between prompts. That's what makes a player recognize \"something good just happened\" instantly, before they've even parsed which buff it was.",
      },
      {
        heading: "Save the sung chant for the rarest buff",
        body: "The triumphant chant above is deliberately the odd one out \u2014 ACE-Step's `lyrics` field gives it an actual sung line, not just a bigger arrangement. That makes it right for the one power-up in your game that should feel like an event (a legendary drop, an ultimate unlock), and wrong for anything a player sees often. A sung hook that repeats every few minutes stops registering as special and starts being noise.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A sample pack's power-up sounds were tuned for someone else's buff system, with no obvious way to tell a shield from a speed boost apart from the filename. Generating lets you write the actual effect into the prompt \u2014 warmth for a shield, a bright sweep for speed \u2014 so your whole power-up family is distinguishable by ear and shares a waveform, not just a folder.",
      },
    ],
    related: ["coin-pickup", "8bit", "retro-game", "video-game", "magic", "game-over"],
  },
};
const GAME_OVER: SfxCategory = {
  slug: "game-over",
  name: "Game over",
  coverImage: "/sfx/covers/game-over-cover.png",
  targetQuery: "game over sound effect",
  intent:
    "Single-asset search; often needs a matching win jingle too.",
  metaTitle: "Game Over Sound Effect Generator | Soundbox",
  metaDescription:
    "Generate game over jingles and failure stingers locally, and regenerate any of them from the saved prompt and seed.",
  h1: "Game over sound effects",
  intro:
    "The mirror image of a power-up: descending, minor, and slower than you think it should be.",
  content: {
    samples: [
        // ACE-Step is a lyrics-conditioned vocal music model, not a sound-effect
        // model — its `prompt` sets the genre/instrumentation and a separate
        // `lyrics` field carries the words a synthetic choir actually sings.
        // A game over moment is one of the few SFX categories where an actual
        // sung line ("game over") reads as an intentional payoff rather than
        // uncanny — see the craft note below.
        {
          slug: "sung-defeat-chant",
          title: "Sung defeat chant",
          prompt: "dark orchestral-hybrid game over theme, slow dirge tempo, mournful choir vocals, deep strings and low brass, minor key, cinematic",
          source: "model",
          model: "audiocpp-ace-step",
        },
    ],
    recipes: [
      {
        label: "Classic game over",
        prompt: "chiptune game over jingle, six-note descending minor line, square wave, slow and final, 1.2 seconds",
        why: "\"Slow\" and \"final\" together tell the model to stretch out the note spacing near the end \u2014 a game over jingle needs to feel like it's stopping, not just going down in pitch.",
      },
      {
        label: "Death stinger",
        prompt: "player death stinger, short descending synth sweep with a low thud landing, 700 ms, dry and abrupt",
        why: "\"Landing\" on a low thud gives the sweep an endpoint to arrive at, which reads as a definite stop rather than an open-ended fade.",
      },
      {
        label: "Defeat fanfare",
        prompt: "orchestral-hybrid defeat fanfare, descending minor brass-synth line with a dissonant final chord, 1.5 seconds, light reverb",
        why: "\"Dissonant final chord\" is the specific harmonic move that separates a defeat fanfare from a merely sad one \u2014 unresolved dissonance is what reads as loss rather than melancholy.",
      },
      {
        label: "Flatline",
        prompt: "flatline defeat tone, single sustained low sine wave note fading out over 1 second, no vibrato, dry",
        why: "\"No vibrato\" matters because any pitch wobble on a sustained tone reads as alive \u2014 flatness is literally the point of a flatline sound.",
      },
      {
        label: "Boss defeated",
        prompt: "boss defeated fanfare, dramatic descending-then-resolving synth line, 2 seconds, triumphant despite descent, moderate reverb",
        why: "\"Resolving\" after the descent is the key phrase \u2014 this is the one game-over-family sound that should end on a stable, satisfying chord because the player won, even though the target went down.",
      },
      {
        label: "Sung defeat chant",
        prompt: "dark orchestral-hybrid game over theme, slow dirge tempo, mournful choir vocals, deep strings and low brass, minor key, cinematic",
        why: "This one is ACE-Step, not a sound-effect model \u2014 the prompt sets the genre and instrumentation, and a separate lyrics field (\"[verse]\\nGame over\\nYou have fallen\") carries the words a synthetic choir sings. A game over moment is one of the few places an actual sung line lands as deliberate rather than uncanny.",
      },
    ],
    craft: [
      {
        heading: "Direction tells the model who lost",
        body: "Descending pitch motion is the near-universal signal for game over, defeat, and death. Ascending motion, even mixed into an otherwise falling line, reads as a win. When you want the player's loss (their own death, a timer running out) prompt for a clean descent that ends low. When you want an enemy's defeat, prompt for a descent that resolves upward or lands on a stable major chord at the end \u2014 the target went down, but the player came out ahead.",
      },
      {
        heading: "Finality is a pacing instruction",
        body: "Words like \"slow\", \"final\", and \"landing\" tell the model to widen the spacing between the last notes and give the sound a definite stopping point, rather than trailing off or looping in the listener's ear. A game over sound that doesn't clearly end feels unresolved, which undercuts the moment it's supposed to punctuate.",
      },
      {
        heading: "Harshness and dissonance are different tools from sadness",
        body: "A time's-up buzzer wants to be blunt and harsh \u2014 a flat, static pulse with no melodic content, because it's a rule violation, not a tragedy. A story-beat death wants melodic descent and maybe dissonance, because it's meant to land emotionally. Don't reach for the same prompt shape for both; decide whether the moment is punitive or dramatic first.",
      },
      {
        heading: "A sung line is a different tool from a jingle",
        body: "Every sample above except one comes from a sound-effect model \u2014 synthesized tones and swept pitches, no voice. ACE-Step is a lyrics-conditioned music model instead: it takes a genre/instrumentation prompt and a separate block of lyrics, and it sings them. For a game over screen that's the difference between a jingle implying loss and a choir stating it outright. Reach for it when the moment is a story beat worth a real payoff \u2014 a final boss run, a permadeath \u2014 not for the twentieth retry on a platformer level, where a half-second stinger is the correct scale.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Why does one sample have a sung vocal instead of a jingle?",
        answer: "That one comes from ACE-Step, Soundbox's lyrics-conditioned vocal music model \u2014 a different kind of model from the sound-effect generators that made the other samples on this page. It takes a genre/instrumentation prompt plus a separate lyrics block, and it sings the words. Worth reaching for on a story-beat death or a permadeath, not for a jingle you're going to hear fifty times in a play session.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack's game over sound is tuned to somebody else's story beat, and slotting it into your ending either fights your music or undersells the moment. Generating lets you set the exact descent, duration, and whether it resolves or stays unresolved, so a player death and a boss defeat in the same game can share a family without sounding interchangeable.",
      },
    ],
    related: ["8bit", "power-up", "coin-pickup", "retro-game", "video-game", "horror"],
  },
};
const LASER: SfxCategory = {
  slug: "laser",
  name: "Laser",
  coverImage: "/sfx/covers/laser-cover.png",
  targetQuery: "laser sound effect",
  intent:
    "Spans retro arcade zaps and modern sci-fi weapon fire; two sub-intents.",
  metaTitle: "Laser Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate laser zaps and beam weapons locally — arcade-thin or cinematic-wide, from a prompt you control.",
  h1: "Laser sound effects",
  intro:
    "Two different sounds share one word: the thin arcade zap and the wide cinematic beam. Prompt for one or the other.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Classic zap",
        prompt: "retro arcade laser shot, thin pulse wave sweeping downward fast, narrow duty cycle, 200 ms, dry",
        why: "\"Narrow duty cycle\" is the actual synthesis term for the thin, reedy timbre a classic laser needs \u2014 it's more precise than any adjective like \"sharp\" or \"electronic\".",
      },
      {
        label: "Sci-fi blaster",
        prompt: "sci-fi energy blaster shot, thick sawtooth wave with a fast downward pitch sweep, gritty edge, 250 ms, dry",
        why: "Swapping pulse wave for sawtooth and adding \"gritty edge\" is what moves a laser from clean arcade territory into a heavier, more modern weapon sound.",
      },
      {
        label: "Charging beam",
        prompt: "charging energy beam, rising pitch synth whine building over 800 ms, then a sharp release burst at the end",
        why: "Structuring the prompt as build-then-release gives the model two distinct phases to generate, which is what separates a charge-up weapon from a simple one-shot zap.",
      },
      {
        label: "Rapid fire",
        prompt: "rapid-fire laser burst, four short thin pulse wave zaps in quick succession, 300 ms total, tight and dry",
        why: "Counting the shots (\"four\") and giving a total duration keeps the burst tight and evenly spaced instead of the model returning one long stuttering sweep.",
      },
      {
        label: "Heavy cannon",
        prompt: "heavy laser cannon blast, deep low-frequency pulse with a bright high crack layered on top, 350 ms, powerful and dry",
        why: "Layering a described low element with a described high element in one prompt is how you get weight and clarity together \u2014 a heavy weapon needs both, not just volume.",
      },
    ],
    craft: [
      {
        heading: "Waveform choice sets the weapon's tech level",
        body: "Pulse wave with a narrow duty cycle is the classic thin arcade laser. Sawtooth wave reads as grittier and more modern, good for sci-fi blasters and energy weapons. Layering a low sine or pulse element under a bright zap adds the sense of physical power a hand weapon or vehicle cannon needs, versus the pure thin tone of an old arcade shot. Choose the waveform before anything else \u2014 it decides more of the character than any other word in the prompt.",
      },
      {
        heading: "Pitch direction reads as impact",
        body: "A downward pitch sweep is the default laser shape and reads as a shot being fired and losing energy as it travels. An upward sweep or a bend near the end reads as a ricochet or a deflection rather than a clean hit. If you need a set that includes both a fired shot and a bounced shot, keep everything else about the prompt identical and change only the direction word.",
      },
      {
        heading: "Structure multi-phase weapons explicitly",
        body: "A charge-up weapon, a rapid-fire burst, and a single shot are three different event shapes, not three volumes of the same sound. Describe the shape directly: \"building then a release burst\" for a charge weapon, \"four short zaps in quick succession\" for a burst, a single clean sweep for a standard shot. The model follows structural language like this far more reliably than it infers structure from adjectives alone.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A weapons pack gives you a fixed set of laser types that rarely match your game's own tech tier or firing pattern. Generating lets you set the exact waveform, sweep direction, and shot structure your weapon design calls for, and produce a whole tier of weapons \u2014 light blaster through heavy cannon \u2014 from one consistent prompt family.",
      },
    ],
    related: ["8bit", "weapon", "sci-fi", "explosion", "retro-game", "video-game"],
  },
};
const MAGIC: SfxCategory = {
  slug: "magic",
  name: "Magic",
  coverImage: "/sfx/covers/magic-cover.png",
  targetQuery: "magic sound effect",
  intent:
    "RPG and fantasy game devs; spells, casts, shimmer.",
  metaTitle: "Magic Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate spell casts, shimmers and magical impacts locally from text prompts, with every setting saved.",
  h1: "Magic sound effects",
  intro:
    "Magic is not a material, which is exactly why these prompts are hard. The fix is to describe the material it is pretending to be.",
  content: {
    samples: [
        // Sound design above imitates a material; this instead gives the
        // ritual actual words to chant, via ACE-Step's lyrics field.
        {
          slug: "arcane-ritual-chant",
          title: "Arcane ritual chant",
          prompt: "mystical fantasy ritual theme, ethereal chanting vocals, ancient choir, deep drone, arcane atmosphere",
          source: "model",
          model: "audiocpp-ace-step",
        },
    ],
    recipes: [
      {
        label: "Spell cast",
        prompt: "magical spell cast, bright metallic shimmer, glass and bell overtones, rising pitch, sparkling texture, 1 second, close and dry",
        why: "\"Glass and bell overtones\" gives the model two real resonant materials to imitate instead of the word \"magical,\" which has no acoustic signature of its own.",
      },
      {
        label: "Charge-up",
        prompt: "magical energy charging, low rumble building to a crackling hiss, fire and static layered, rising intensity over 1.5 seconds, close mic",
        why: "Naming two source materials \u2014 \"fire and static\" \u2014 and stacking them is how you get the layered buildup players expect; either one alone reads thin.",
      },
      {
        label: "Ice burst",
        prompt: "magical ice burst, glass shattering into fine crystalline shards, cold high-frequency sparkle, sharp attack, 800 ms, dry",
        why: "\"Glass shattering into fine crystalline shards\" borrows a real physical event to sell \"ice,\" which by itself has no sound at all.",
      },
      {
        label: "Heal chime",
        prompt: "magical healing chime, soft bell and glass resonance, warm sustained tone with gentle shimmer decay, 1.2 seconds, roomy",
        why: "\"Warm\" and \"gentle decay\" are the words doing the emotional work \u2014 a healing spell needs a soft release envelope, not a hard cutoff, to read as benevolent.",
      },
      {
        label: "Curse drone",
        prompt: "malevolent magic drone, low detuned metal groan under a thin dissonant whine, no percussive attack, 2 seconds, roomy and unsettling",
        why: "\"No percussive attack\" is the instruction that keeps a dread drone from accidentally arriving as a hit \u2014 dark magic needs to creep in, not strike.",
      },
    ],
    craft: [
      {
        heading: "Describe the material magic is imitating",
        body: "Magic has no acoustic signature of its own \u2014 nobody has ever recorded a spell. Every convincing magic sound is a real material standing in for the effect: glass and bells for anything shimmering, fire and static for anything charging, metal groaning under strain for anything cursed. Pick the real-world material first, then describe what that material is doing (shattering, resonating, straining), and let the word \"magical\" do the least amount of work in the prompt.",
      },
      {
        heading: "Pitch direction tells the story",
        body: "A rising pitch reads as gathering power; a falling pitch reads as release or dissipation; a sudden cutoff reads as a spell being interrupted or landing. Say which one you want explicitly \u2014 \"rising pitch\" for a charge, \"pitch cutting off sharply\" for a teleport vanish \u2014 because the model has no other way to know whether the spell is starting or ending.",
      },
      {
        heading: "Sparkle is a texture, not a synonym for magic",
        body: "\"Sparkling\" and \"shimmering\" only work as prompt words when they're attached to a real high-frequency source \u2014 glass, bells, chimes, static. Used alone they tend to produce a generic bright hiss. Pair the texture word with its material every time, and reserve it for the specific moment (the cast, the impact) rather than smearing it across the whole sound.",
      },
      {
        heading: "A ritual needs words, and only one model here provides them",
        body: "The six sound-design samples above all imitate a material standing in for magic \u2014 glass, fire, metal. A summoning ritual or an ancient incantation is a different kind of moment: it wants an actual chant, not just a drone that sounds ceremonial. ACE-Step's `lyrics` field is what makes that possible (\"[verse]\\nAncient words\\nAwaken now\") \u2014 pick it specifically when the spell is a ritual with words, not an impact effect.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A magic sample pack gives you someone else's idea of what a fireball or a heal spell sounds like, usually tuned to a different game's art style. Generating lets you pick the exact real-world materials \u2014 glass, bells, fire, static \u2014 that match your own spell's visual design, and regenerate instantly when the art team changes the effect. The trade is time and a GPU against a perfect match to your game.",
      },
    ],
    related: ["cinematic", "sci-fi", "whoosh", "video-game", "power-up", "glitch"],
  },
};
const WEAPON: SfxCategory = {
  slug: "weapon",
  name: "Weapon",
  coverImage: "/sfx/covers/weapon-cover.png",
  targetQuery: "weapon sound effects",
  intent:
    "Game audio; melee and ranged, needs impact plus tail.",
  metaTitle: "Weapon Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate melee and ranged weapon sounds locally — swings, impacts, reloads — from prompts you can iterate on.",
  h1: "Weapon sound effects",
  intro:
    "A weapon sound is nearly always two sounds: the action and the impact. Generate them separately and layer.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Sword swing",
        prompt: "metal sword slash through air, thin blade whoosh, sharp doppler snap, close mic, dry, 300 ms",
        why: "\"Doppler snap\" is what separates a blade cutting air from a generic whoosh \u2014 a thin edge moving fast produces a distinct pitch snap that plain \"whoosh\" won't.",
      },
      {
        label: "Gunshot",
        prompt: "single pistol gunshot, sharp crack, tight muzzle report, short natural decay, close mic, minimal room tone",
        why: "\"Minimal room tone\" keeps the shot dry enough to layer a separate tail or echo yourself \u2014 baking in reverb here removes control you'll want later.",
      },
      {
        label: "Reload",
        prompt: "rifle magazine reload, metal clicks and a solid mechanical slide, close mic, dry, sequential mechanical sounds, 1 second",
        why: "\"Sequential mechanical sounds\" tells the model this is several discrete actions in order, not one blended clank \u2014 reload sounds fail when they collapse into a single event.",
      },
      {
        label: "Arrow release",
        prompt: "bow string release, taut string snap followed by a thin fast whoosh, close mic, dry, 400 ms",
        why: "Splitting it into \"snap followed by whoosh\" mirrors the real two-stage mechanics of a bow \u2014 the string releases, then the arrow moves \u2014 and the model needs that order spelled out.",
      },
      {
        label: "Shield block",
        prompt: "metal weapon striking a shield, hard clang, bright metallic ring with short sustain, close mic, small room reflection",
        why: "\"Short sustain\" caps the ring so it reads as a solid parry rather than a struck bell \u2014 an unbounded ring makes a block sound decorative instead of hard.",
      },
    ],
    craft: [
      {
        heading: "A weapon sound is two sounds layered",
        body: "Almost no weapon effect is a single event. A sword swing is a whoosh plus, sometimes, a clash on contact. A gunshot is a crack plus a mechanical action plus an optional impact. Generate each half separately \u2014 the action (swing, trigger pull, string release) and the result (clash, shot, impact) \u2014 and layer them in your model rather than asking one prompt to do both jobs at once, because the model tends to blend two distinct mechanical events into one mushy sound.",
      },
      {
        heading: "Name the mechanism, not the weapon category",
        body: "\"Gun sound\" is a category with hundreds of correct answers. \"Sharp crack, tight muzzle report, short natural decay\" describes the actual mechanism of a shot and narrows the model to one family of results. Do the same for melee \u2014 \"metal clicks and a solid mechanical slide\" beats \"reload sound\" because it names the parts that physically move.",
      },
      {
        heading: "Match the impact surface to the target",
        body: "The same swing lands completely differently on metal, flesh, or wood \u2014 a strike on a shield rings, a strike on a body thuds and dies fast. State the target material explicitly (\"soft target, no metallic ring\" versus \"metal shield, bright ring\") since this single word changes the entire spectral shape of the impact half of the sound.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A weapon pack bundles a swing and an impact recorded on someone else's foley stage, at someone else's mic distance, which rarely layers cleanly with your other assets. Generating gives you the action and the impact as separate, matched clips you built for your own game's materials \u2014 metal, flesh, shield \u2014 so a whole weapon kit shares one sonic character. The trade is time and a GPU against layers that actually fit together.",
      },
    ],
    related: ["laser", "impact", "explosion", "video-game", "whoosh", "cinematic"],
  },
};
const EXPLOSION: SfxCategory = {
  slug: "explosion",
  name: "Explosion",
  coverImage: "/sfx/covers/explosion-cover.png",
  targetQuery: "explosion sound effect",
  intent:
    "Film, trailer and game use; wants weight and a long tail.",
  metaTitle: "Explosion Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate explosions locally — from small pops to long cinematic booms — with prompts, seeds and a searchable library.",
  h1: "Explosion sound effects",
  intro:
    "Weight comes from the tail, not the hit. Most disappointing generated explosions are simply too short.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Small pop",
        prompt: "small explosion pop, sharp initial crack, short debris scatter, brief low-end thump, close mic, 500 ms",
        why: "Keeping the duration short and calling it a \"pop\" instead of a \"blast\" tells the model to skip the long tail entirely, which is what actually separates small from large.",
      },
      {
        label: "Grenade",
        prompt: "grenade explosion, sharp crack followed by a full-bodied low rumble tail, debris and dust settling, 2 seconds, close and slightly roomy",
        why: "\"Debris and dust settling\" extends the sound past the blast itself, giving the ear an aftermath rather than a single hit \u2014 that trailing detail is what most short generations skip.",
      },
      {
        label: "Cinematic boom",
        prompt: "large cinematic explosion, deep sub-bass impact, long rolling low-frequency tail, distant debris rain, 4 seconds, wide and roomy",
        why: "\"Long rolling low-frequency tail\" is the load-bearing phrase \u2014 weight lives in the tail, not the hit, and a short duration setting will undercut it no matter how big the attack sounds.",
      },
      {
        label: "Fuel fireball",
        prompt: "fuel explosion fireball, whooshing ignition followed by a crackling roar, sustained burning tail, 3 seconds, roomy",
        why: "\"Sustained burning tail\" distinguishes a fuel explosion from a solid blast \u2014 fuel keeps burning after the bang, and naming that keeps the model from cutting it off early.",
      },
      {
        label: "Distant artillery",
        prompt: "distant explosion, muffled low thud, high frequencies absorbed by distance, long faint rumble tail, 3 seconds, wide and open space",
        why: "\"High frequencies absorbed by distance\" is real acoustic behavior, not a mood word, and it's the specific instruction that pushes a blast from close-and-sharp to convincingly far away.",
      },
    ],
    craft: [
      {
        heading: "Weight is in the tail, not the hit",
        body: "Most disappointing generated explosions are simply too short. The crack of ignition is a fraction of a second no matter how big the explosion is \u2014 what tells the ear \"this was huge\" is everything after it: a rolling low-frequency tail, settling debris, distant rumble. Set your duration generously (3 to 5 seconds for anything cinematic) and describe the tail explicitly, because a model left to its own devices will often deliver a satisfying crack and then nothing.",
      },
      {
        heading: "Distance is a filter, not a volume knob",
        body: "A far-away explosion isn't a quiet close one \u2014 high frequencies fall off with distance while low frequencies carry, so a distant blast is specifically a muffled thud with the crack and debris detail gone. Say \"high frequencies absorbed by distance\" or \"muffled\" rather than just \"distant,\" which the model may otherwise render as a smaller explosion instead of a farther one.",
      },
      {
        heading: "Match the fuel to the aftermath",
        body: "A grenade blast ends abruptly with settling debris; a fuel or gas explosion keeps burning after the initial bang and needs a crackling roar in the tail; a structural collapse continues as tumbling rubble for several seconds after the blast itself. Decide what's actually detonating before you write the prompt, since each produces a completely different second half of the sound.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you a handful of fixed-length explosions and you cut your scene to fit them. Generating lets you set the exact duration and tail length your shot needs \u2014 a 500 ms pop for a prop gag, a 5-second collapse for a finale \u2014 from one consistent prompt family, and regenerate instantly if the edit changes. The trade is time and a GPU against a blast built for your timing, not someone else's.",
      },
    ],
    related: ["impact", "weapon", "cinematic", "video-game", "machinery", "thunder"],
  },
};
const IMPACT: SfxCategory = {
  slug: "impact",
  name: "Impact",
  coverImage: "/sfx/covers/impact-cover.png",
  targetQuery: "impact sound effect",
  intent:
    "Editors and game devs; the generic hit/thud family.",
  metaTitle: "Impact Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate impacts, thuds and hits locally by naming the material, the action and the room.",
  h1: "Impact sound effects",
  intro:
    "Name the material and the room and you get an impact. Say \"impact\" and you get noise.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Wood thud",
        prompt: "heavy object hitting a wooden plank, dull thud, short resonant creak, close mic, dry, 300 ms",
        why: "\"Short resonant creak\" adds the specific secondary vibration wood makes after a hit \u2014 without it the model tends to give you a generic thud with no material identity.",
      },
      {
        label: "Metal clang",
        prompt: "solid object striking a metal pipe, bright hard clang, short metallic ring, close mic, small room reflection",
        why: "Naming the exact object (\"metal pipe\") instead of just \"metal\" gives the model a resonant shape to imitate \u2014 a pipe rings differently than a sheet or a plate.",
      },
      {
        label: "Concrete drop",
        prompt: "heavy concrete block dropped on concrete floor, deep flat thud, no ring, tight low-end, close mic, dry",
        why: "\"No ring\" is doing real work here \u2014 concrete absorbs vibration instead of resonating, and without that instruction the model may borrow a metallic tail from elsewhere in its training.",
      },
      {
        label: "Punch",
        prompt: "fist punch impact on flesh, wet dull thump, short decay, no ring, close mic, dry",
        why: "\"Wet\" is the single word that keeps a body-hit thump from sounding like it landed on a bag of sand \u2014 flesh has moisture content and the prompt should say so.",
      },
      {
        label: "Glass break",
        prompt: "object striking glass pane, sharp crack followed by shattering fragments scattering, close mic, dry, 700 ms",
        why: "Splitting the event into \"crack followed by fragments scattering\" mirrors the real two-stage physics of breaking glass, which a single word like \"shatter\" tends to compress into one indistinct hit.",
      },
    ],
    craft: [
      {
        heading: "Name the material and the room, in that order",
        body: "Say \"impact\" alone and you get noise \u2014 the model has no material to reference and no acoustic space to place it in. Every convincing impact prompt states what struck what (\"heavy object hitting a wooden plank\") and where that happened (\"close mic, dry\" or \"small room reflection\"). The material decides the timbre; the room decides whether it sounds like it happened in your scene or in a vacuum.",
      },
      {
        heading: "Resonance is the material's fingerprint",
        body: "Different materials don't just sound different in tone, they behave differently after the hit: wood creaks briefly, metal rings and sustains, concrete and sand absorb the energy and produce almost no tail at all. State explicitly whether you want a ring, a creak, or \"no ring\" \u2014 this single instruction does more to sell the material than any adjective describing the hit itself.",
      },
      {
        heading: "Two materials means two prompt clauses",
        body: "Most real impacts involve two different surfaces meeting \u2014 metal on metal, wood on stone, fist on flesh \u2014 and each contributes its own texture. Naming both materials explicitly, rather than describing the impact generically, gives the model two acoustic references to blend instead of one ambiguous \"hit\" to guess at.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A generic hit/thud pack gives you dozens of impacts with no consistent recording distance or material logic, so nothing in your scene sounds like it's happening in the same room. Generating lets you specify the exact material pairing and space your scene needs and keep that mic distance consistent across every impact you make. The trade is time and a GPU against a set of hits that actually belong together.",
      },
    ],
    related: ["explosion", "weapon", "footsteps", "door", "machinery", "horror"],
  },
};
const HORROR: SfxCategory = {
  slug: "horror",
  name: "Horror",
  coverImage: "/sfx/covers/horror-cover.png",
  targetQuery: "horror sound effects",
  intent:
    "Film, game and short-form video; wants dread, not jump scares alone.",
  metaTitle: "Horror Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate horror atmospheres, stingers and drones locally, and iterate on the prompt until the dread lands.",
  h1: "Horror sound effects",
  intro:
    "\"Scary\" is a mood label and models ignore it. Describe the physical event instead — metal under strain, a room too large for its sound.",
  content: {
    samples: [
        // A genuinely different tool from the rest of this page: ACE-Step
        // sings actual words instead of rendering sound design. A whispered
        // chant reads as a presence in a way a wordless drone can't.
        {
          slug: "whispered-dread-chant",
          title: "Whispered dread chant",
          prompt: "dark ambient horror theme, whispered ghostly vocals, dissonant strings, unsettling drone, slow tempo",
          source: "model",
          model: "audiocpp-ace-step",
        },
    ],
    recipes: [
      {
        label: "Metal groan",
        prompt: "metal under extreme strain, slow deep groaning creak, low frequency, no percussive attack, 3 seconds, roomy and unsettling",
        why: "\"Metal under extreme strain\" describes a physical event, not a mood \u2014 the model can render strain, but it has nothing to do with a word like \"scary.\"",
      },
      {
        label: "Room too large",
        prompt: "sustained low drone in a room too large for its own sound, faint resonant hum, no melody, 4 seconds, distant and cold",
        why: "\"A room too large for its own sound\" is a spatial contradiction the model can actually render as thin, distant resonance \u2014 it's dread expressed as acoustics instead of adjective.",
      },
      {
        label: "Jump stinger",
        prompt: "sharp horror stinger, sudden dissonant metallic hit, high-frequency shriek, instant attack, hard cutoff, 500 ms",
        why: "\"Instant attack\" and \"hard cutoff\" are the envelope instructions that make a stinger feel like a shock rather than a swell \u2014 a slow fade-in defeats the whole purpose of a jump scare.",
      },
      {
        label: "Scratching behind a wall",
        prompt: "faint scratching sound behind a wall, irregular rhythm, dry scraping texture, low volume, distant and muffled, 2 seconds",
        why: "\"Irregular rhythm\" is what keeps this from sounding mechanical \u2014 a perfectly even scratch reads as a machine, not something alive and unwelcome.",
      },
      {
        label: "Close breathing",
        prompt: "slow uneven breathing close to the microphone, wet and ragged texture, irregular rhythm, no words, 3 seconds, intimate and dry",
        why: "\"Close to the microphone\" plus \"dry\" removes any room around the sound, which is what makes breathing feel like it's happening right next to the listener instead of somewhere in the scene.",
      },
    ],
    craft: [
      {
        heading: "Describe the physical event, never the mood",
        body: "\"Scary\" is a mood label and models ignore it, because nothing in a training set is tagged as sounding scary in the abstract \u2014 things are tagged as metal, or strain, or a room, or breathing. Translate the feeling you want into a physical event first: dread becomes \"metal under strain\" or \"a room too large for its sound,\" tension becomes \"irregular rhythm,\" a jump becomes \"instant attack, hard cutoff.\" The mood arrives as a side effect of specific, renderable physics.",
      },
      {
        heading: "Space is doing half the work",
        body: "Horror sound design leans harder on room and distance than almost any other category \u2014 the same groan is unremarkable close and dry, and deeply unsettling when it's \"distant and muffled\" behind a wall or drifting through \"a room too large for its own sound.\" Decide where the listener is relative to the source before you write the prompt, since proximity and space often carry more dread than the source material itself.",
      },
      {
        heading: "Irregularity reads as alive, regularity reads as mechanical",
        body: "A perfectly even scratch, drip, or breath pattern reads as a machine or a loop, and machines aren't frightening the way unpredictable things are. Say \"irregular rhythm\" or \"uneven\" explicitly for anything meant to suggest a presence rather than an environment \u2014 it's a small instruction that separates ambience from something that might be listening back.",
      },
      {
        heading: "Words are scarier than a wordless drone",
        body: "Every other sample on this page is texture \u2014 a groan, a drone, a scratch, nothing that could be mistaken for a voice saying something. ACE-Step can render an actual whispered line (\"[verse]\\nThey are near\\nDo not look\"), and a barely-intelligible chant reads as a presence that knows you're there in a way no amount of dissonant drone can match. Use it sparingly \u2014 this is a once-per-scene device, not a bed.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A horror pack gives you someone else's stingers and drones, generic enough to fit any scene and specific enough to fit none of them well. Generating lets you tune the exact physical event \u2014 which metal, how large the room, how ragged the breathing \u2014 to match your scene's particular dread, and regenerate the stinger three times until the timing lands. The trade is time and a GPU against atmosphere built for your scene, not a stock library's.",
      },
    ],
    related: ["ambience", "footsteps", "door", "cinematic", "thunder", "wind"],
  },
};
const SCI_FI: SfxCategory = {
  slug: "sci-fi",
  name: "Sci-fi",
  coverImage: "/sfx/covers/sci-fi-cover.png",
  targetQuery: "sci fi sound effects",
  intent:
    "Film and game; UI bleeps, models, energy.",
  metaTitle: "Sci-Fi Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate sci-fi interfaces, models and energy sounds locally from text, with every prompt and seed retained.",
  h1: "Sci-fi sound effects",
  intro:
    "Science fiction audio is nearly always a real material processed past recognition. Prompt for the material first.",
  content: {
    samples: [
        {
          slug: "spaceship-engine-hum",
          title: "Spaceship engine hum",
          prompt: "spaceship engine drone, sustained low mechanical hum with a metallic edge, subtle pulsing rhythm, 3 seconds, roomy",
          source: "model",
          model: "audiocpp-stable-audio-3-sfx",
          durationS: 3,
        },
        // A background bed rather than an event — deliberately instrumental,
        // no lyrics, to show ACE-Step also renders a plain ambient loop when
        // there's nothing for it to sing.
        {
          slug: "ace-spaceship-ambient-loop",
          title: "Spaceship interior ambience (loop)",
          prompt: "ambient sci-fi spaceship interior theme, slow synth pads, subtle mechanical hum, minimal melodic movement, seamless loop",
          source: "model",
          model: "audiocpp-ace-step",
        },
    ],
    recipes: [
      {
        label: "UI bleep",
        prompt: "sci-fi interface bleep, short clean synth tone, quick pitch confirmation blip, digital and dry, 200 ms",
        why: "\"Digital and dry\" keeps this out of any physical space \u2014 interface sounds break the illusion of a real console the moment they pick up room reflections.",
      },
      {
        label: "Model hum",
        prompt: "spaceship engine drone, sustained low mechanical hum with a metallic edge, subtle pulsing rhythm, 3 seconds, roomy",
        why: "\"Metallic edge\" grounds the drone in a real, imaginable machine \u2014 a pure synth tone alone tends to read as music rather than as an model.",
      },
      {
        label: "Shield hit",
        prompt: "energy shield impact, metallic ring processed into a resonant electronic tone, quick decay, close mic, dry, 500 ms",
        why: "\"Metallic ring processed into an electronic tone\" is the whole trick of sci-fi audio in one clause \u2014 start from a real material, then say how it's been altered.",
      },
      {
        label: "Airlock",
        prompt: "airlock door opening, pressurized air hiss followed by a heavy mechanical slide, close mic, dry, 1.5 seconds",
        why: "Splitting it into \"hiss followed by slide\" mirrors the two real mechanical stages of a pressurized door, which is what sells the mechanism over a plain door sound.",
      },
      {
        label: "Weapon charge",
        prompt: "energy weapon charging, rising electronic whine over a low mechanical hum, building intensity over 1.5 seconds, close mic",
        why: "Layering an electronic whine \"over\" a mechanical hum, rather than choosing one, is what keeps it from sounding purely synthetic or purely mechanical \u2014 sci-fi weapons live in between.",
      },
    ],
    craft: [
      {
        heading: "Start from a real material, then process it",
        body: "Science fiction audio is nearly always a real material processed past recognition \u2014 a shield hit is metal run through an electronic filter, an alien voice is a human vocal warble pushed into unnatural pitch territory. Prompt for the material first (\"metallic ring,\" \"vocal warble\") and the processing second (\"electronic tone,\" \"unnatural pitch modulation\"). Skipping the material and asking only for \"sci-fi sound\" tends to produce something that sounds synthetic but unanchored to anything physical.",
      },
      {
        heading: "Mechanical and electronic are two different layers",
        body: "The most convincing sci-fi machines \u2014 models, doors, weapons \u2014 combine a mechanical layer (a real hum, hiss, or slide with physical mass) and an electronic layer (a synth whine, a modulated tone) rather than committing to one or the other. Say \"mechanical hum\" and \"electronic whine\" as separate clauses in the same prompt so the model has two distinct textures to blend instead of collapsing into pure synth or pure machine noise.",
      },
      {
        heading: "Dry UI, roomy hardware",
        body: "Interface sounds \u2014 bleeps, confirmations, alerts \u2014 should stay completely dry so they don't compete with whatever plays under them and don't imply a physical space that doesn't exist on a screen. Physical sci-fi hardware \u2014 models, airlocks, weapons \u2014 benefits from some room tone because it's supposedly happening inside a ship or a station. Decide which category a sound belongs to before setting its space.",
      },
      {
        heading: "ACE-Step, minus the vocal, is still a usable ambience model",
        body: "ACE-Step is built around lyrics-conditioned singing, but leaving the `lyrics` field empty gets a fully instrumental render \u2014 the spaceship ambience loop above never touches a vocal path at all. Worth knowing if you're already generating vocal tracks elsewhere in a project and want a background bed that matches the same model's tonal character instead of switching models mid-project.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A sci-fi pack gives you generic beeps and drones built for no particular ship or interface, so you spend time processing them to fit your own art direction anyway. Generating lets you specify the exact real material and processing your world uses \u2014 this model's mechanical character, this interface's tone \u2014 from one consistent prompt family across your whole UI or ship. The trade is time and a GPU against a sound library that's actually yours.",
      },
    ],
    related: ["laser", "cinematic", "ui", "glitch", "machinery", "magic"],
  },
};
const CINEMATIC: SfxCategory = {
  slug: "cinematic",
  name: "Cinematic",
  coverImage: "/sfx/covers/cinematic-cover.png",
  targetQuery: "cinematic sound effects",
  intent:
    "Trailer editors; risers, braams, whooshes, hits.",
  metaTitle: "Cinematic Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate risers, hits and trailer transitions locally — long-form prompts, saved settings, no per-render cost.",
  h1: "Cinematic sound effects",
  intro:
    "Trailer audio is built from four shapes. Learn to prompt each one and you can build a whole cut.",
  content: {
    samples: [
        {
          slug: "full-trailer-buildup",
          title: "Full trailer buildup",
          prompt: "cinematic trailer buildup, rising sub-bass synth drone, tense string section ostinato, sparse brass ensemble braam hits accenting the climb, orchestral hybrid, one final deep orchestral hit at the end",
          source: "model",
          model: "audiocpp-stable-audio-3-sfx",
        },
        // Everything above is sound design — one-shot hits and drones from
        // Stable Audio 3 SFX. ACE-Step adds
        // the one thing it cannot do: an actual sung line. `prompt` sets the
        // orchestral arrangement, `lyrics` gives the choir words.
        {
          slug: "trailer-choir-chant",
          title: "Epic trailer choir chant",
          prompt: "epic orchestral trailer theme, dramatic choir vocals, deep strings and brass, rising tension, cinematic",
          source: "model",
          model: "audiocpp-ace-step",
        },
    ],
    recipes: [
      {
        label: "Trailer braam",
        prompt: "single cinematic braam hit, deep brass-like impact with sub-bass underneath, hard attack, short decay, no reverb tail",
        why: "\"Short decay, no reverb tail\" keeps the hit from smearing into whatever cuts next \u2014 trailer hits are edited on the frame, and a long tail fights the cut.",
      },
      {
        label: "Slow build tension",
        prompt: "cinematic tension riser, thin string-like texture climbing in pitch and volume over 2.5 seconds, no percussive hit at the end",
        why: "Explicitly excluding the hit (\"no percussive hit at the end\") stops the model from defaulting to a riser-plus-braam combo when you only need the climb by itself.",
      },
      {
        label: "Sub-bass drone",
        prompt: "cinematic low drone riser, sustained sub-bass tone with slow pitch climb, dark and tense, 3 seconds, subtle grit on the top end",
        why: "\"Subtle grit on the top end\" adds just enough high-frequency content to keep a pure sub tone from disappearing on small speakers, without turning it into a lead sound.",
      },
      {
        label: "Reverse swell",
        prompt: "reverse cymbal swell building into a sharp cutoff, bright metallic wash growing in volume over 1.5 seconds, ends abruptly with no tail",
        why: "\"Ends abruptly with no tail\" is the word that makes it read as reverse rather than forward \u2014 a real reverse swell has no natural decay, it just stops.",
      },
      {
        label: "Trailer boom",
        prompt: "trailer hit boom, single deep sub-bass punch with a short metallic clang layered on top, tight low end, dry",
        why: "Naming two separate layers \u2014 sub-bass punch and metallic clang \u2014 tells the model to combine a felt low end with an audible transient, which is what a boom needs on small monitors.",
      },
    ],
    craft: [
      {
        heading: "Separate the riser from the hit",
        body: "A cinematic sting is usually two events edited together: a build and a punctuation. Prompt them separately \u2014 a riser that only climbs, and a hit that only lands \u2014 rather than asking for \"a cinematic sting,\" which the model will render as its own fixed idea of both glued together. Generating them apart lets you time the hit to the exact frame you're cutting on, instead of hoping a pre-baked combo lines up.",
      },
      {
        heading: "Sub-bass needs a partner frequency",
        body: "Pure sub-bass content below roughly 60 Hz is felt more than heard, and on a laptop speaker or phone it disappears entirely. Whenever you want low-end weight, pair it with a word that puts something in the audible range too \u2014 \"grit,\" \"metallic clang,\" \"brass-like\" \u2014 so the sound still reads on small speakers, not just in a mixed theater.",
      },
      {
        heading: "State the absence, not just the presence",
        body: "Cinematic prompts fail most often by getting a generic combo when you wanted one specific piece of it. If you want a riser with no hit at the end, or a swell with no tail, say so directly (\"no percussive hit,\" \"no reverb tail\") \u2014 the model's default cinematic vocabulary bundles these events together, and negation is the cleanest way to unbundle them.",
      },
      {
        heading: "A choir is a lyrics problem, not a sound-design problem",
        body: "Stable Audio can render a wash that sounds vaguely choral, but it has no actual vocal path \u2014 there is no voice singing real syllables, just a texture that reads as one at a distance. ACE-Step is the model built for that: give it a short lyrics block and its choir sings it. Reach for it specifically when a trailer moment wants an intelligible chant or hook, not a generic \"epic choir\" pad.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A trailer sting pack gives you someone else's braam, tuned to someone else's key and someone else's edit length. Generating gives you a riser or a hit at the exact duration your cut needs, with the low-end weight and the amount of grit dialed to match the rest of your mix. The trade is time and a GPU against fit and pitch match.",
      },
    ],
    related: ["horror", "sci-fi", "explosion", "impact", "glitch", "whoosh"],
  },
};
const GLITCH: SfxCategory = {
  slug: "glitch",
  name: "Glitch",
  coverImage: "/sfx/covers/glitch-cover.png",
  targetQuery: "glitch sound effect",
  intent:
    "Motion designers and editors; digital artefacts and stutters.",
  metaTitle: "Glitch Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate digital glitches, stutters and data artefacts locally from prompts you can tune.",
  h1: "Glitch sound effects",
  intro:
    "Glitch is a texture with a rhythm. The prompts that work name both.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Buffer stutter",
        prompt: "digital glitch stutter, short audio buffer repeating rapidly then cutting out, harsh and metallic, 400 ms, no reverb",
        why: "\"Buffer repeating rapidly then cutting out\" describes the actual mechanism of a real audio glitch \u2014 a stuck loop that stops \u2014 rather than just asking for a vague digital sound.",
      },
      {
        label: "Bit-crushed zap",
        prompt: "bit-crushed digital zap, heavily quantized square wave with aliasing artifacts, sharp downward pitch bend, 300 ms, dry",
        why: "Naming \"aliasing artifacts\" pushes the model toward the specific harsh texture that low bit-depth quantization produces, instead of a generic synth zap.",
      },
      {
        label: "Signal dropout",
        prompt: "signal dropout glitch, brief silence gaps punched into a static-laden tone, choppy and irregular, 500 ms",
        why: "\"Silence gaps punched into\" a continuous tone is what makes a dropout read as broken rather than just noisy \u2014 the silence itself is doing the work.",
      },
      {
        label: "Corruption burst",
        prompt: "data corruption burst, rapid granular clicks and digital noise fragments overlapping, no tonal center, 350 ms, harsh",
        why: "\"No tonal center\" stops the model from resolving the clicks into a rhythm or a pitch \u2014 real corruption noise has no underlying structure to lock onto.",
      },
      {
        label: "Static flicker",
        prompt: "screen static flicker, short bursts of white noise interrupted by silence, uneven rhythm, 600 ms, thin and brittle",
        why: "\"Uneven rhythm\" is the key phrase \u2014 a metronomic flicker reads as a designed effect, an uneven one reads as a failing signal.",
      },
    ],
    craft: [
      {
        heading: "Glitches are interruptions, not textures",
        body: "The temptation is to describe glitch as a sound quality \u2014 \"digital,\" \"harsh,\" \"electronic\" \u2014 but what actually reads as broken is interruption: silence gaps, sudden cutoffs, repeats that stop mid-loop. Prompt the event structure (\"repeating rapidly then cutting out,\" \"silence gaps punched into a tone\") and let the harsh texture be secondary, because a smooth harsh tone with no interruption just sounds like a synth pad.",
      },
      {
        heading: "Name the failure mode",
        body: "Real digital artifacts come from a handful of specific mechanisms \u2014 buffer underrun, bit-crushing, dropped packets, corrupted data \u2014 and each has a distinct sonic signature. \"Aliasing,\" \"quantization,\" \"dropout,\" and \"corruption\" are not synonyms for each other in a prompt; naming the actual failure gets you a texture that matches, instead of a generic catch-all zap.",
      },
      {
        heading: "Keep it dry and short",
        body: "Glitch effects almost always sit on top of other audio or video, so reverb and long tails work against them by smearing the interruption into something smoother. Say \"dry,\" \"no reverb,\" and keep duration under a second unless you specifically need a longer breakdown sequence \u2014 the sharper the edges, the more it reads as broken rather than designed.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A glitch pack gives you a fixed set of failure modes someone else chose \u2014 a stutter here, a dropout there \u2014 and none of them are tuned to your footage's actual glitch moment. Generating lets you pick the specific mechanism (bit-crush, dropout, buffer stutter) and the exact duration your cut needs, then regenerate with different wording if the first pass reads too clean or too musical. The trade is time and a GPU against fit and specificity.",
      },
    ],
    related: ["sci-fi", "cinematic", "whoosh", "transition", "ui", "notification"],
  },
};
const CROWD: SfxCategory = {
  slug: "crowd",
  name: "Crowd",
  coverImage: "/sfx/covers/crowd-cover.png",
  targetQuery: "crowd sound effects",
  intent:
    "Film and game ambience; reaction beds and walla.",
  metaTitle: "Crowd Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate crowd beds, applause and reaction walla locally, with the room and the size of the crowd under your control.",
  h1: "Crowd sound effects",
  intro:
    "Crowd sounds live or die on the room. Say how big it is and how far away you are.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Small murmur",
        prompt: "small crowd murmur, 10 to 15 people talking indoors at low volume, indistinct overlapping speech, no individual words audible, room tone",
        why: "Giving a headcount (\"10 to 15 people\") is what keeps the murmur small \u2014 without a number the model defaults to an ambiguous mid-sized crowd.",
      },
      {
        label: "Stadium cheer",
        prompt: "large stadium crowd cheering, hundreds of voices layered, sudden rise in energy, outdoor open space, 3 seconds",
        why: "\"Sudden rise in energy\" captures the moment a crowd reacts to a play, which is what separates a cheer from a steady ambient roar.",
      },
      {
        label: "Restaurant bed",
        prompt: "restaurant background chatter, dozens of overlapping conversations at moderate volume, occasional cutlery clink, indoor room tone, steady and even",
        why: "The stray detail \"occasional cutlery clink\" sells the specific location far more than \"restaurant\" alone, which the model would otherwise render as generic chatter.",
      },
      {
        label: "Angry mob",
        prompt: "angry crowd shouting, dozens of voices layered with aggressive tone, outdoor open space, rising intensity, no distinct words",
        why: "\"Aggressive tone\" changes the vocal texture the model reaches for, distinct from a cheering or neutral murmur crowd of the same size.",
      },
      {
        label: "Applause",
        prompt: "sudden crowd applause burst, indoor auditorium, dozens of hands clapping at once, sharp onset, 2 seconds, natural decay",
        why: "\"Sharp onset\" plus \"natural decay\" gives the transient shape of a real applause burst \u2014 instant start, gradual settle \u2014 instead of a static clapping loop.",
      },
    ],
    craft: [
      {
        heading: "Size the crowd with a number, not an adjective",
        body: "\"Big crowd\" and \"small crowd\" are relative and the model has no fixed scale for them. Give an actual headcount or venue size \u2014 \"10 to 15 people,\" \"hundreds of voices,\" \"stadium\" \u2014 and it anchors the density of overlapping voices far more reliably than an adjective alone.",
      },
      {
        heading: "Say what the crowd is doing, not just how big it is",
        body: "A crowd's emotional state changes its texture as much as its size does \u2014 talking, cheering, shouting, applauding, and murmuring are different acoustic events, not volume levels of the same sound. Name the activity explicitly, and if it's a reaction to something (a cheer, a burst of applause), describe the shape of that reaction (\"sudden rise,\" \"sharp onset\") rather than asking for a steady state.",
      },
      {
        heading: "Keep individual voices out of it",
        body: "The line between a crowd and a small group of speaking characters is intelligibility. If you want true background crowd tone, say \"no individual words audible\" or \"indistinct\" explicitly \u2014 otherwise the model may render a few voices clearly enough to read as dialogue rather than atmosphere, which will pull focus in a mix.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A crowd pack gives you a fixed size and mood recorded at someone else's venue, and stitching two different crowd clips together usually exposes the seam. Generating lets you set the exact headcount, indoor or outdoor space, and emotional tone your scene needs, so a cheer and the murmur before it can share the same underlying voice character. The trade is time and a GPU against fit and consistency.",
      },
    ],
    related: ["horror", "cinematic", "ambience", "animal", "notification", "door"],
  },
};
const RAIN: SfxCategory = {
  slug: "rain",
  name: "Rain",
  coverImage: "/sfx/covers/rain-cover.png",
  targetQuery: "rain sound effect",
  intent:
    "Ambience for film, games and video; also sleep/focus audio.",
  metaTitle: "Rain Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate rain — on glass, on tin, on leaves — locally, at the length and intensity you actually need.",
  h1: "Rain sound effects",
  intro:
    "There is no generic rain. There is rain on a specific surface, and that surface is the whole prompt.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Window rain",
        prompt: "light rain falling on a glass window, steady soft patter, close mic, indoor perspective, no wind or thunder",
        why: "\"Indoor perspective\" tells the model to filter the sound the way a pane of glass actually would, which reads completely differently from the same rain heard outdoors.",
      },
      {
        label: "Downpour",
        prompt: "heavy rain downpour, dense continuous patter on hard ground, outdoor open space, loud and full, no thunder",
        why: "\"Dense continuous patter\" describes density rather than just volume \u2014 a downpour is defined by how little space is between drops, not by loudness alone.",
      },
      {
        label: "Tin roof",
        prompt: "rain falling on a corrugated tin roof, sharp metallic patter, steady rhythm, close mic, resonant metal surface",
        why: "\"Resonant metal surface\" is the phrase that gets the characteristic ping of rain on metal instead of the soft patter you'd get from a generic \"rain on roof\" prompt.",
      },
      {
        label: "Umbrella rain",
        prompt: "rain drumming on a nylon umbrella, close mic just below the canopy, tight rhythmic patter, muffled outdoor ambience behind it",
        why: "Placing the mic \"just below the canopy\" gives the model a specific listening position, which is what makes the umbrella surface dominate over the rain around it.",
      },
      {
        label: "Puddle detail",
        prompt: "rain falling into shallow puddles on pavement, individual droplet splashes audible over a steady patter bed, close mic",
        why: "Asking for \"individual droplet splashes audible over\" the bed layer separates foreground detail from background wash, which a flat \"rain on pavement\" prompt won't do on its own.",
      },
    ],
    craft: [
      {
        heading: "The surface is doing most of the work",
        body: "Rain sound is really the sound of water hitting a particular material, and the material changes the texture more than the rain intensity does \u2014 glass gives a soft patter, tin gives a sharp metallic ping, pavement gives a dense wash with occasional splashes. Always name the surface, not just \"rain,\" because \"rain\" alone gives the model no material to render against.",
      },
      {
        heading: "Set the listening position",
        body: "The same rain sounds completely different from three positions: outdoors in the open, indoors behind glass, or under a sheltering surface like an umbrella or eave. Say \"indoor perspective,\" \"through a closed window,\" or \"close mic just below the canopy\" to tell the model which filtering and proximity to apply \u2014 this single detail changes the result more than adjusting intensity words does.",
      },
      {
        heading: "Keep thunder and wind out unless you want them",
        body: "Rain, wind, and thunder are often bundled together in training data, so a plain \"rain\" prompt can drift toward a full storm. If you need clean rain on its own, say \"no wind or thunder\" explicitly \u2014 you can always layer a separate thunder clip in your edit with full control over its timing, which is harder to do if it's baked into the rain generation.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A rain pack gives you a fixed surface and intensity recorded on someone else's roof or window, and looping it often reveals the seam. Generating lets you match the exact surface and perspective your scene needs \u2014 a window for an interior shot, a tin roof for a cabin \u2014 and adjust intensity without hunting through a library for the one clip that's close enough. The trade is time and a GPU against fit and seamlessness.",
      },
    ],
    related: ["thunder", "wind", "water", "ambience", "animal", "fire"],
  },
};
const THUNDER: SfxCategory = {
  slug: "thunder",
  name: "Thunder",
  coverImage: "/sfx/covers/thunder-cover.png",
  targetQuery: "thunder sound effect",
  intent:
    "Storm ambience and single-strike stingers; two intents.",
  metaTitle: "Thunder Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate thunder cracks and distant rolls locally, and control the distance with the prompt.",
  h1: "Thunder sound effects",
  intro:
    "Distance is the only variable that matters. Close is a crack, far is a roll, and the prompt has to pick one.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Distant rumble",
        prompt: "distant thunder rumble, low continuous rolling boom, no sharp crack, far away and muffled, 3 seconds",
        why: "Explicitly excluding the crack (\"no sharp crack\") is what keeps distant thunder distant \u2014 without it the model tends to add a transient that reads as close.",
      },
      {
        label: "Close strike",
        prompt: "close lightning strike crack, sudden sharp high-frequency snap immediately followed by a deep rolling boom, loud and dry",
        why: "Ordering the event as \"snap immediately followed by\" the boom mirrors how sound and light actually arrive together at close range, which is the detail that sells proximity.",
      },
      {
        label: "Long roll",
        prompt: "long thunder roll, sustained low rumble that swells and fades unevenly over 4 seconds, no distinct crack, outdoor space",
        why: "\"Swells and fades unevenly\" avoids a smooth, synthetic-sounding rumble \u2014 real thunder rolls have irregular peaks as the sound bounces off distant terrain.",
      },
      {
        label: "Double crack",
        prompt: "double thunder crack, two sharp cracking impacts close together followed by a long low rumble tail, dramatic and loud",
        why: "Specifying the count (\"two sharp cracking impacts\") gives the model a concrete rhythmic structure instead of leaving the number of cracks to chance.",
      },
      {
        label: "Thunder over rain",
        prompt: "thunder crack over a steady rain bed, sharp crack rolling into a low rumble, rain continues underneath at moderate volume",
        why: "Saying the rain \"continues underneath\" tells the model to keep the bed layer constant through the crack rather than ducking it, which is what a single continuous take actually does.",
      },
    ],
    craft: [
      {
        heading: "Distance is a crack-to-rumble ratio",
        body: "Thunder close by is dominated by a sharp high-frequency crack because the sound hasn't had distance to lose its transient; thunder far away has lost the crack entirely and arrives as pure low rumble, because high frequencies attenuate over distance faster than low ones. Set distance by describing this ratio directly \u2014 \"no sharp crack, far away\" for distant, \"sharp snap immediately followed by\" a boom for close \u2014 rather than just saying \"loud\" or \"quiet.\"",
      },
      {
        heading: "Real rumbles are uneven",
        body: "A single peal of thunder is not a smooth swell \u2014 it rolls, because the sound reflects off clouds, hills, and buildings at different delays, producing an irregular, bumpy loudness contour. Ask for it to \"swell and fade unevenly\" rather than accepting a clean rise-and-fall, which reads as synthetic.",
      },
      {
        heading: "Decide if rain is part of the take",
        body: "Thunder almost never occurs without rain in a real recording, so if you want it isolated for layering control in your edit, generate it alone and add rain separately in your mix. If you want a single continuous ambience clip, prompt them together and say the rain \"continues underneath at moderate volume\" through the crack so the bed doesn't duck or disappear.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A thunder pack gives you a fixed distance and a fixed crack-to-rumble ratio that was right for someone else's storm, and doesn't time-align with your rain bed. Generating lets you set the exact distance, sharpness, and duration your scene needs, and layer it against a rain track that matches instead of fighting it. The trade is time and a GPU against fit and timing.",
      },
    ],
    related: ["rain", "wind", "horror", "cinematic", "explosion", "ambience"],
  },
};
const WIND: SfxCategory = {
  slug: "wind",
  name: "Wind",
  coverImage: "/sfx/covers/wind-cover.png",
  targetQuery: "wind sound effect",
  intent:
    "Ambience; also motion/whoosh adjacency.",
  metaTitle: "Wind Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate wind beds and gusts locally — through trees, around structures, across open ground.",
  h1: "Wind sound effects",
  intro:
    "Wind is inaudible until it hits something. Name what it hits.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Wind through trees",
        prompt: "strong wind gust through leafy trees, rustling and creaking branches, 3 seconds, outdoor open space",
        why: "\"Rustling and creaking branches\" names the two separate objects wind is hitting \u2014 leaves and wood \u2014 which is what actually makes wind audible in the first place.",
      },
      {
        label: "Howl around a corner",
        prompt: "wind howling around a building corner, hollow whistling tone, gusty, close mic, 3 seconds",
        why: "\"Hollow whistling tone\" is the resonance a corner or gap produces \u2014 without naming the obstruction the model defaults to a flat, featureless hiss.",
      },
      {
        label: "Flag in wind",
        prompt: "steady wind flapping a loose fabric flag, sharp snapping cracks, outdoor, 3 seconds",
        why: "\"Sharp snapping cracks\" describes the fabric's own percussive contribution, which is a different sound than the wind itself and needs its own words.",
      },
      {
        label: "Window rattle",
        prompt: "wind gust rattling a loose window pane, brief low rumble then a rattle, indoor perspective, 2 seconds",
        why: "\"Indoor perspective\" tells the model to render the gust as heard through a barrier, which is what turns raw wind into a rattle instead of an open-air gust.",
      },
      {
        label: "Gentle breeze",
        prompt: "gentle wind breeze moving through tall grass, soft continuous hiss, no gusts, 3 seconds",
        why: "\"No gusts\" is a deliberate exclusion \u2014 without it the model tends to add dynamic swells even when you asked for something calm and steady.",
      },
    ],
    craft: [
      {
        heading: "Wind needs something to hit",
        body: "Moving air by itself is nearly featureless \u2014 a flat broadband hiss with no identity. What makes a wind sound recognizable is what it's disturbing: leaves, a flag, a gap in a window frame, a wire, a cave mouth. Always name the obstruction. \"Wind\" alone gives you generic room tone; \"wind through leafy trees\" or \"wind whistling through a gap in a window\" gives the model a specific interaction to render, and that interaction is where all the character lives.",
      },
      {
        heading: "Gust vs. bed are different requests",
        body: "A gust is an event with a shape \u2014 it rises, peaks, and falls inside a few seconds, and words like \"gust\" or \"sudden strong wind\" tell the model to generate that arc. A bed is closer to flat and sustained, meant to loop or sit under a scene without drawing attention to itself \u2014 ask for \"steady\" or \"continuous\" and avoid gust language entirely. Mixing the two in one prompt tends to produce something that swells unpredictably in the middle, which is rarely what either use case wants.",
      },
      {
        heading: "Altitude and enclosure change the tone, not just the volume",
        body: "High-altitude or open-plain wind reads thin and whistling because there's nothing nearby to add low-frequency turbulence \u2014 say \"thin\" and \"no low end\" to get that character. Wind moving through a confined space (a hallway, a canyon, a chimney) picks up resonance and hollowness from the space itself \u2014 say \"hollow\" or name the space directly. The same gust in open air versus a corridor is not a volume difference, it's a different set of prompt words.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you a fixed wind bed at a fixed intensity and length, and you either cut it to fit or loop it awkwardly. Generating gives you a gust or a bed at the exact length, obstruction, and intensity your scene needs, and you can dial the intensity up or down by regenerating with different words instead of hunting for a closer match. The trade is time and a GPU against fit.",
      },
    ],
    related: ["ambience", "rain", "thunder", "water", "whoosh", "cinematic"],
  },
};
const WATER: SfxCategory = {
  slug: "water",
  name: "Water",
  coverImage: "/sfx/covers/water-cover.png",
  targetQuery: "water sound effects",
  intent:
    "Broad ambience and foley; streams, splashes, pours.",
  metaTitle: "Water Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate splashes, streams, drips and pours locally from prompts that name the vessel and the volume.",
  h1: "Water sound effects",
  intro:
    "Container and volume. A drip in a cave and a drip in a sink are different sounds and the same word.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Cave drip",
        prompt: "single water drip falling into a shallow cave pool, sharp plink, long reverberant tail, close mic",
        why: "\"Long reverberant tail\" is what a cave contributes on top of the drip itself \u2014 without it the model renders a drip in a neutral, unplaceable space.",
      },
      {
        label: "Tap drip",
        prompt: "single water drip from a kitchen tap into a metal sink, tight dry plink, no reverb",
        why: "\"Metal sink\" and \"no reverb\" push the same drip toward a small, hard, close surface instead of the cave version \u2014 the vessel is doing all the differentiating work.",
      },
      {
        label: "Pouring",
        prompt: "water poured from a bottle into a small glass, steady stream, rising pitch as glass fills, 2 seconds, dry",
        why: "\"Rising pitch as glass fills\" names a real acoustic phenomenon \u2014 the resonant cavity shrinking as liquid rises \u2014 that separates a convincing pour from a static stream loop.",
      },
      {
        label: "Big splash",
        prompt: "large splash of a person jumping into a pool, heavy impact then bubbling settle, 2 seconds, outdoor",
        why: "\"Heavy impact then bubbling settle\" breaks the splash into its two real phases, since a single word like \"splash\" collapses both into a shorter, less physical sound.",
      },
      {
        label: "Stream",
        prompt: "small rocky stream flowing over stones, continuous bubbling trickle, 3 seconds, outdoor close mic",
        why: "\"Over stones\" is the obstruction that turns flat flowing water into a bubbling trickle \u2014 same logic as wind, water needs something to disturb it to sound specific.",
      },
    ],
    craft: [
      {
        heading: "Name the vessel, not just the liquid",
        body: "\"Water\" is not a sound \u2014 a drip in a stone cave, a drip in a metal sink, and a drip in a plastic bucket are three different pitches, decay times, and reverb characters, all from the same physical event. Always tell the model what the water is in or falling into: cave pool, sink, glass, puddle, pool, bucket. That container is doing more work than any adjective about the water itself.",
      },
      {
        heading: "Volume is a category, not a slider",
        body: "A single drip, a stream, a pour, and a splash are not the same sound at different volumes \u2014 they're different physical events with different durations and shapes. A drip is a single sharp transient; a stream is continuous and textured; a splash has an impact phase followed by a settling phase. Pick the actual event you need rather than trying to describe a \"big\" or \"small\" version of a generic \"water sound.\"",
      },
      {
        heading: "Give impacts a settle phase",
        body: "Anything landing in water \u2014 a jump, a dropped object, a thrown bucket \u2014 has a loud initial impact followed by several hundred milliseconds of bubbling, dripping runoff as the disturbance settles. Naming both phases explicitly (\"heavy impact then bubbling settle\") keeps the model from cutting the sound off right after the transient, which is the most common way a water splash ends up sounding clipped and unfinished.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you a fixed drip, pour, or splash recorded in someone else's kitchen or pool, and you adjust your scene to fit the clip. Generating lets you specify the exact vessel, volume, and phase you need \u2014 a drip in a cave versus a sink, a small pour versus a bucket dump \u2014 and regenerate immediately if the first take doesn't match. The trade is time and a GPU against fit.",
      },
    ],
    related: ["rain", "ambience", "footsteps", "wind", "fire", "impact"],
  },
};
const FIRE: SfxCategory = {
  slug: "fire",
  name: "Fire",
  coverImage: "/sfx/covers/fire-cover.png",
  targetQuery: "fire sound effect",
  intent:
    "Ambience and game loops; campfires through infernos.",
  metaTitle: "Fire Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate crackle, roar and ignition locally, from a campfire bed to a full blaze.",
  h1: "Fire sound effects",
  intro:
    "Fire is crackle plus roar in some ratio, and the ratio is what you are really choosing.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Campfire bed",
        prompt: "small campfire burning, steady wood crackle and pop, low warm hiss, outdoor, 4 seconds, loopable",
        why: "\"Steady\" and \"loopable\" push the ratio toward mostly crackle with a low, near-constant hiss underneath \u2014 the profile of a fire that isn't going anywhere.",
      },
      {
        label: "Ignition",
        prompt: "torch bursting into flame, sudden whoosh ignition then settling into a steady flicker, 2 seconds",
        why: "Splitting the prompt into two named phases \u2014 the ignition whoosh, then the settle \u2014 is what makes a single generation contain a believable start instead of just a static flame loop.",
      },
      {
        label: "Match strike",
        prompt: "single wooden match struck and igniting, sharp scrape then a quick flare hiss, close mic, dry",
        why: "\"Sharp scrape\" is the friction event before there's any fire at all \u2014 leaving it out gets you a flame appearing from nowhere instead of one being struck.",
      },
      {
        label: "Big blaze",
        prompt: "large structure fire, dominant roaring flame body, occasional sharp pops from burning debris, 3 seconds",
        why: "\"Dominant roaring flame body\" tips the crackle-to-roar ratio hard toward roar, which is the actual difference between a campfire and an inferno at the prompt level.",
      },
      {
        label: "Flare-up",
        prompt: "sudden fire flare-up from a fuel splash, sharp whoosh burst, brief roar, then fading crackle, 2 seconds",
        why: "Naming the cause (\"fuel splash\") gives the model a reason for the sharp whoosh burst instead of a smooth crackle swell, which is what a real flare-up sounds like.",
      },
    ],
    craft: [
      {
        heading: "Fire is a crackle-to-roar ratio",
        body: "Every fire sound is a mix of two components in different proportions: crackle, the discrete pops of wood or debris combusting, and roar, the continuous rush of the flame body itself pulling in air. A campfire is mostly crackle with a thin hiss underneath; a raging structure fire is mostly roar with occasional sharp pops from things collapsing. Decide the ratio before you write the prompt \u2014 \"steady wood crackle and pop\" versus \"dominant roaring flame body\" \u2014 because that ratio is the entire identity of the fire.",
      },
      {
        heading: "Ignition is a separate event from burning",
        body: "A fire starting is not a quieter version of a fire burning \u2014 it's a distinct acoustic event with its own shape: a scrape or whoosh, then a flare, then a settle into steady combustion. If you want a fire coming to life rather than a fire already established, describe that arc explicitly (\"bursting into flame... then settling\") rather than just asking for \"fire starting,\" which tends to render as a generic crackle with no attack.",
      },
      {
        heading: "Scale changes texture, not just loudness",
        body: "A match, a torch, a campfire, and a structure fire aren't the same sound turned up \u2014 larger fires shift the balance toward low-frequency roar and add irregular debris pops that small fires don't have. Name the actual fuel and scale (\"single wooden match,\" \"large structure fire\") rather than relying on volume words, since the model reaches for different textures at different scales, not just different amplitude.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you one fixed crackle-to-roar ratio at one fixed scale, and you either accept it or layer clips to fake the size you actually need. Generating lets you dial the ratio and the fuel directly \u2014 a match versus a campfire versus a blaze \u2014 and regenerate the ignition separately from the sustained burn. The trade is time and a GPU against fit.",
      },
    ],
    related: ["explosion", "ambience", "horror", "impact", "cinematic", "machinery"],
  },
};
const ANIMAL: SfxCategory = {
  slug: "animal",
  name: "Animal",
  coverImage: "/sfx/covers/animal-cover.png",
  targetQuery: "animal sound effects",
  intent:
    "Games and video; specific creatures and generic beasts.",
  metaTitle: "Animal Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate animal calls and creature sounds locally, including things that do not exist.",
  h1: "Animal sound effects",
  intro:
    "Real animals are a recording problem. Imaginary ones are a prompting problem, and that is where generation wins.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Dog bark",
        prompt: "single large dog bark, deep and aggressive, close mic, dry, no room tone",
        why: "\"Large\" sets the pitch register before anything else does \u2014 dog barks span two octaves by breed size, and size is the word that actually controls pitch.",
      },
      {
        label: "Crow",
        prompt: "single crow caw, harsh and raspy, outdoor open space, slight distance",
        why: "\"Harsh and raspy\" is the texture that separates a crow from a generic bird call \u2014 most bird prompts default to something closer to a songbird unless you name the roughness.",
      },
      {
        label: "Cat hiss",
        prompt: "angry cat hiss followed by a low growl, close mic, sharp and defensive, dry",
        why: "Sequencing two named sounds \u2014 hiss, then growl \u2014 gives the model an emotional arc to render instead of one static vocalization.",
      },
      {
        label: "Wolf howl",
        prompt: "single wolf howl, rising then sustained pitch, heard from a distance, faint echo, outdoor night",
        why: "\"Heard from a distance\" changes more than volume \u2014 it tells the model to add the faint echo and softened high end that distance actually produces.",
      },
      {
        label: "Invented creature",
        prompt: "large imaginary creature growl, low guttural rumble with a wet throat texture, threatening, close mic, 2 seconds",
        why: "\"Wet throat texture\" borrows a real physical detail from actual animal anatomy, which is what makes a creature that doesn't exist still sound like it has a body.",
      },
    ],
    craft: [
      {
        heading: "Size sets pitch before species does",
        body: "Across almost every animal vocalization, body size maps directly to pitch and resonance \u2014 a large dog barks an octave lower than a small one, a big cat growls where a house cat hisses. Naming size (\"large,\" \"small,\" \"massive\") is often more effective than piling on species-specific adjectives, because it gives the model the one variable that governs register across the whole animal kingdom, real or invented.",
      },
      {
        heading: "Distance and space are part of the vocalization",
        body: "A wolf howl heard close and a wolf howl heard across a valley aren't the same recording at different volumes \u2014 distance adds echo, softens high frequencies, and often implies an outdoor night setting. If the sound needs to feel far away, say so directly (\"heard from a distance,\" \"faint echo\") rather than expecting the model to infer it from context.",
      },
      {
        heading: "Invented creatures still need real anatomy",
        body: "A monster growl that doesn't map to any real physiology tends to render as a generic low rumble with no character. Borrow real anatomical detail from actual animals \u2014 \"wet throat texture,\" \"guttural,\" \"chest resonance\" \u2014 and combine it with an impossible scale (\"massive,\" \"cavernous\") to get something that sounds like it has a body, even though nothing like it exists. This is the one place where generation clearly beats a sample library, since no library has a recording of something imaginary.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack can give you a real dog bark or a real crow caw, but it cannot give you a monster growl that was never recorded because the monster doesn't exist. Generating handles both: real animals at the exact size and distance your scene needs, and invented creatures built out of real anatomical detail. The trade is time and a GPU against fit \u2014 and, for creatures, against a source that doesn't exist to record in the first place.",
      },
    ],
    related: ["horror", "footsteps", "ambience", "sci-fi", "water", "cinematic"],
  },
};
const AMBIENCE: SfxCategory = {
  slug: "ambience",
  name: "Ambience",
  coverImage: "/sfx/covers/ambience-cover.png",
  targetQuery: "ambience sound effects",
  intent:
    "Long background beds for games and film; the loop question dominates.",
  metaTitle: "Ambience Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate room tone and background beds locally, at the durations your model can loop.",
  h1: "Ambience and background sound effects",
  intro:
    "Beds are a duration problem before they are a content problem. Check what your model's maximum actually is.",
  content: {
    samples: [
        // A musical bed rather than a room-tone bed — instrumental, no
        // lyrics, on ACE-Step instead of the SFX model, since a folk
        // instrument performance is a music-composition problem the SFX
        // model isn't trained for.
        {
          slug: "ace-tavern-folk-loop",
          title: "Tavern folk music (loop)",
          prompt: "cozy medieval tavern folk music loop, acoustic strummed instrument, warm mellow tone, relaxed tempo, seamless loop",
          source: "model",
          model: "audiocpp-ace-step",
        },
    ],
    recipes: [
      {
        label: "Office room tone",
        prompt: "quiet office room tone, faint hum of fluorescent lights and distant HVAC, no voices, static and dry",
        why: "\"No voices\" is a necessary exclusion \u2014 ambience prompts left open-ended default toward including indistinct speech, which you often don't want under dialogue.",
      },
      {
        label: "Cafe bed",
        prompt: "busy cafe ambience, overlapping indistinct chatter, occasional cup clinks, steady bed, 3 seconds",
        why: "\"Overlapping indistinct chatter\" specifically avoids intelligible words, which is what keeps a crowd bed from accidentally producing distracting, parseable speech.",
      },
      {
        label: "Night forest",
        prompt: "quiet forest at night, steady cricket chorus, faint distant owl, outdoor, 3 seconds",
        why: "Layering one steady element (crickets) with one occasional element (a faint owl) gives the bed texture without turning it into a sequence of foreground events.",
      },
      {
        label: "Sci-fi interior",
        prompt: "sci-fi spaceship interior ambience, low mechanical hum, faint electronic beeps, sealed pressurized feel, 3 seconds",
        why: "\"Sealed pressurized feel\" is a spatial description, not a sound source \u2014 it tells the model to shape the whole bed's frequency response as if heard inside an enclosed hull.",
      },
      {
        label: "Loopable dungeon bed",
        prompt: "dark stone dungeon ambience loop, distant dripping water, low reverberant drone, no voices, 8 seconds, seamless loop",
        why: "\"Seamless loop\" signals the model to avoid a strong attack or decay at the start and end, which is what actually makes a bed loop cleanly instead of clicking at the seam.",
      },
    ],
    craft: [
      {
        heading: "Ambience is duration-first, content-second",
        body: "Before writing what a bed contains, check what length your model actually needs \u2014 a two-second sting behind a menu screen and an eight-second seamless loop behind a level are different prompts entirely. Say the target length explicitly and, if it needs to loop, say \"seamless loop\" so the model avoids a hard attack or a fading tail that would click at the seam. Getting the duration right matters more here than in almost any other category, because a bed that's the wrong length is unusable regardless of how good it sounds.",
      },
      {
        heading: "Layer one steady element with one occasional one",
        body: "The most convincing ambience beds aren't uniform \u2014 they have a steady floor (hum, hiss, a chorus of crickets) plus one or two occasional events that break it up (a distant owl, a car pass, a cup clink). Naming both in the same prompt, with the occasional element marked as \"faint\" or \"distant,\" keeps the bed from feeling either sterile-flat or too busy to sit under dialogue.",
      },
      {
        heading: "Exclude speech unless you specifically want it",
        body: "Crowd and cafe ambiences will often drift toward including intelligible or semi-intelligible speech unless you tell the model not to. Say \"indistinct chatter\" or \"no voices\" explicitly depending on which you need \u2014 the former for texture that reads as a crowd without pulling focus, the latter for anything that has to sit under actual dialogue without competing for the listener's attention.",
      },
      {
        heading: "A room-tone bed and a music bed are different requests",
        body: "Every other sample on this page is environmental sound \u2014 hums, chatter, wind, dripping water \u2014 and Stable Audio 3 SFX is the right tool for all of it. A tavern that has actual background music playing, not just room tone, is a composition problem instead: an instrument performing a melody that holds together for the loop's whole length. That's ACE-Step's territory (with `lyrics` left empty for an instrumental render), the same reasoning as reaching for a music model over the SFX model on the chiptune-music pages.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you a bed at a fixed length that you have to crossfade-loop or trim to fit, and the content is whatever the pack happened to include. Generating lets you set the exact duration your model loops at and the exact mix of steady floor and occasional events your scene needs, down to whether it includes speech at all. The trade is time and a GPU against fit and length.",
      },
    ],
    related: ["rain", "thunder", "wind", "water", "crowd", "machinery"],
  },
};
const DOOR: SfxCategory = {
  slug: "door",
  name: "Door",
  coverImage: "/sfx/covers/door-cover.png",
  targetQuery: "door sound effect",
  intent:
    "Foley staple; open, close, slam, creak, in a named space.",
  metaTitle: "Door Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate door opens, closes, slams and creaks locally — material, action and room, all in the prompt.",
  h1: "Door sound effects",
  intro:
    "Material, action, space. A door sound is the canonical demonstration of why that triple works.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Wooden door open",
        prompt: "interior wooden door opening, single slow hinge creak rising in pitch, close mic, small room reflection",
        why: "\"Rising in pitch\" describes what a hinge under increasing torque actually does \u2014 without it the model defaults to a flat, looped-sounding creak.",
      },
      {
        label: "Wooden door close",
        prompt: "interior wooden door closing, firm push, solid low thud on latch, short room decay, dry",
        why: "Naming the latch as the sound source, not the door itself, is what gets you a percussive thud instead of a vague wood-on-wood knock.",
      },
      {
        label: "Metal slam",
        prompt: "heavy metal door slamming shut, sharp clang with a low boom, hard reverb tail, industrial space",
        why: "Pairing \"clang\" with \"low boom\" captures both the thin metal surface and the heavy mass behind it \u2014 one word alone gives you either a cymbal or a drum, not a door.",
      },
      {
        label: "Horror hinge",
        prompt: "long rusty hinge creak, slow uneven pitch wobble, dry attic-sized room, unsettling",
        why: "\"Uneven pitch wobble\" is the mechanical detail that separates a genuinely worn hinge from a clean synthetic creak, and it's what horror editors are actually listening for.",
      },
      {
        label: "Latch click",
        prompt: "small door latch click, single metallic snap, close mic, no reverb, under 200 ms",
        why: "Stating the duration cap keeps the model from adding a decay tail \u2014 a latch is a single instant, not a ring.",
      },
    ],
    craft: [
      {
        heading: "Separate the hinge from the impact",
        body: "A door sound is almost always two physically different events glued together: a continuous hinge creak while it moves, and a discrete impact \u2014 a latch click, a slam, a thud \u2014 when it stops. Decide which one your prompt needs before you write it. \"Opening\" prompts should describe the creak's pitch behaviour (rising, wobbling, steady); \"closing\" prompts should describe the impact's material and force (firm push versus slam, wood thud versus metal clang). Asking for both in one short generation tends to blur into a single unconvincing scrape.",
      },
      {
        heading: "Room size is doing more work than you think",
        body: "Doors are almost never heard dry in real life \u2014 the space around them rings back at you, and that ring is what tells the listener whether they're in a hallway, an attic, or outdoors. Name the room (\"small room reflection\", \"industrial space\", \"outdoor open space\") rather than leaving it out, because the model's default is an ambiguous mid-sized reflection that doesn't commit to anything. If you truly need it dry for later processing, say so explicitly \u2014 \"dry\" is a choice, not a default.",
      },
      {
        heading: "Material tells the story before the action does",
        body: "Wood, metal, and glass doors don't just sound different in timbre \u2014 they carry different implications for a scene. A metal door slam reads as institutional or dangerous; a wooden door close reads as domestic and mundane; a car door thunk reads as arrival or departure. Lead your prompt with the material and let the action follow, since that's the order a listener actually parses the sound in.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you someone else's front door, recorded in someone else's hallway, with a creak that either matches your scene's room tone or doesn't. Generating gives you a door built for your space \u2014 the same room size, the same material, the same force \u2014 open and close pulled from one consistent prompt family so a listener can't tell they were made in two separate takes. The trade is time and a GPU against fit and consistency.",
      },
    ],
    related: ["footsteps", "horror", "ambience", "impact", "cinematic", "machinery"],
  },
};
const UI: SfxCategory = {
  slug: "ui",
  name: "UI",
  coverImage: "/sfx/covers/ui-cover.png",
  targetQuery: "ui sound effects",
  intent:
    "App and game UI designers; clicks, toggles, confirms.",
  metaTitle: "UI Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate clicks, toggles and confirmations locally — dry, short and consistent across a whole interface.",
  h1: "UI sound effects",
  intro:
    "Interface audio fails by being too long and too wet. Both are prompt problems with one-word fixes.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Button click",
        prompt: "single UI button click, short clean tick, high frequency, no reverb, under 80 ms",
        why: "The millisecond cap is the whole prompt \u2014 anything the model reads as a note rather than a tick will feel sluggish under a tap.",
      },
      {
        label: "Toggle",
        prompt: "UI toggle switch sound, two-stage click with a slight pitch shift between on and off states, dry, 150 ms",
        why: "\"Two-stage\" tells the model to generate two discrete events, not one \u2014 a toggle needs a distinct on-click and off-click even in a single short file.",
      },
      {
        label: "Error",
        prompt: "UI error sound, short low buzzy tone, mildly dissonant two-note interval, dry, 250 ms",
        why: "\"Mildly dissonant\" is doing the emotional work \u2014 too dissonant reads as alarming, too consonant reads as a success chime, and the word \"mildly\" keeps it in the narrow band that actually reads as error.",
      },
      {
        label: "Confirm",
        prompt: "UI confirmation chime, two ascending clean sine notes, bright and simple, no reverb, under 300 ms",
        why: "Ascending direction is the universal shorthand for success in interface audio \u2014 swap it to descending and the same timbre reads as a dismissal instead.",
      },
      {
        label: "Hover",
        prompt: "UI hover tick, extremely short single sine blip, subtle, under 40 ms, completely dry",
        why: "\"Subtle\" matters as much as the duration \u2014 a hover fires constantly as a cursor moves, so it has to sit below the threshold of being annoying, not just being short.",
      },
    ],
    craft: [
      {
        heading: "State the duration cap, always",
        body: "Interface sounds fail almost exclusively by being too long. A click that rings for half a second reads as laggy no matter how snappy its attack is, because the ear is still hearing it when the next interaction happens. Put a hard millisecond number in every UI prompt \u2014 under 80 ms for clicks, under 40 ms for hover states, under 300 ms for anything with a melodic shape \u2014 and trim in your editor if the model still overshoots.",
      },
      {
        heading: "Direction encodes meaning",
        body: "UI sound is a tiny vocabulary built almost entirely out of pitch direction and interval size. Rising pitch reads as opening, enabling, or succeeding; falling pitch reads as closing, disabling, or failing; a small clean interval reads as neutral, a wider or slightly dissonant one reads as attention-getting. Decide what the sound needs to communicate before you write the prompt, and pick the direction and interval to match \u2014 the waveform matters less than this.",
      },
      {
        heading: "Dry by default, reverb only for full-screen events",
        body: "Most interface sounds should be completely dry, because they play constantly and any room tone accumulates into mud across a session. Reserve reverb or air for infrequent, larger events \u2014 a full menu opening, a level transition \u2014 where a bit of space actually helps the sound feel like an event rather than a tick. If you're unsure, say \"no reverb\" explicitly; it's the safer default for anything that fires more than once a minute.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you a generic click that was tuned for someone else's app and someone else's brand of sine tone. Generating gives you a click, toggle, and confirm chime pulled from the same prompt family, tuned to the same duration cap and the same pitch language, so your whole interface sounds like one coherent instrument instead of six borrowed ones. The trade is time and a GPU against fit and consistency.",
      },
    ],
    related: ["notification", "whoosh", "transition", "glitch", "8bit", "machinery"],
  },
};
const NOTIFICATION: SfxCategory = {
  slug: "notification",
  name: "Notification",
  coverImage: "/sfx/covers/notification-cover.png",
  targetQuery: "notification sound effect",
  intent:
    "Product and app designers; a short branded alert.",
  metaTitle: "Notification Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate notification tones and alerts locally, and iterate until one sounds like your product.",
  h1: "Notification sound effects",
  intro:
    "A notification has to be noticeable once and forgettable forever. That is a surprisingly narrow target.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Soft ping",
        prompt: "gentle notification ping, single clean sine tone, short natural decay, no reverb, under 500 ms",
        why: "\"Natural decay\" rather than a hard cutoff is what keeps a single tone from sounding like a UI click instead of a notification \u2014 notifications are allowed a small tail, interface ticks aren't.",
      },
      {
        label: "Urgent alert",
        prompt: "urgent notification alert, three fast repeated tones, sharp attack, slightly harsh, no reverb",
        why: "Repetition count is the urgency dial \u2014 one tone is informational, three fast repeats is the model's shorthand for something that needs attention now.",
      },
      {
        label: "Email chime",
        prompt: "email received chime, single warm bell-like tone, medium decay, subtle room air, under 700 ms",
        why: "\"Warm\" and \"bell-like\" push the timbre away from the thin sine of a generic ping toward something a mail client would actually ship, without needing to name a real app.",
      },
      {
        label: "Achievement",
        prompt: "achievement unlock notification, short ascending three-note major arpeggio, bright and rewarding, no reverb",
        why: "\"Major arpeggio\" and \"rewarding\" together are what separate a celebratory sound from a neutral confirm chime \u2014 the note count and the mode are both doing work here.",
      },
      {
        label: "Low battery",
        prompt: "low battery warning tone, two low descending notes, flat and cautionary, dry, no reverb",
        why: "Descending plus low register reads as caution without reading as failure \u2014 that distinction is what keeps a battery warning from feeling like an error state.",
      },
    ],
    craft: [
      {
        heading: "Urgency is a function of repetition and register",
        body: "A single soft tone reads as informational; the same timbre repeated three times fast reads as urgent, and dropped an octave it reads as a warning rather than an alert. Before writing the prompt, decide where on that scale the notification sits \u2014 pure information, gentle nudge, or something the user must act on \u2014 and encode it with repeat count and pitch register rather than reaching for words like \"urgent\" alone, which the model interprets less consistently than the concrete musical parameters.",
      },
      {
        heading: "Give it a small amount of tail",
        body: "Unlike UI clicks, which want to be as short as possible, notification sounds benefit from a short natural decay \u2014 300 to 700 ms is the useful range. A tail is what makes a tone feel like a considered chime rather than an accidental blip, and it gives the sound enough presence to be noticed over ambient noise without dragging into obviously musical territory.",
      },
      {
        heading: "Keep the whole set in one register family",
        body: "Apps that ship five unrelated notification sounds end up sounding like five different apps stitched together. Generate your success, warning, and alert tones from the same base timbre description \u2014 same waveform character, same rough pitch center \u2014 and vary only direction, note count, and dissonance between them. That consistency is more convincing to a user's ear than any single sound being clever on its own.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you unrelated pings, dings, and buzzes scraped from a dozen different apps, none of which were designed to sit next to each other. Generating gives you a success chime, a warning tone, and an urgent alert built from one prompt family with a consistent timbre and register, so a user hearing them in sequence reads them as one coherent notification system rather than a grab bag. The trade is time and a GPU against fit and consistency.",
      },
    ],
    related: ["ui", "whoosh", "transition", "coin-pickup", "power-up", "8bit"],
  },
};
const TRANSITION: SfxCategory = {
  slug: "transition",
  name: "Transition",
  coverImage: "/sfx/covers/transition-cover.png",
  targetQuery: "transition sound effects",
  intent:
    "Video editors; short-form content and cuts.",
  metaTitle: "Transition Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate transitions, swells and cut accents locally, at the exact length of your edit.",
  h1: "Transition sound effects",
  intro:
    "The best transition sound is the length of the transition. Generation lets you hit that exactly.",
  content: {
    samples: [
    ],
    recipes: [
      {
        label: "Scene swoosh",
        prompt: "cinematic scene transition swoosh, smooth rising sweep into a soft impact, 1 second, subtle room air",
        why: "\"Rising sweep into a soft impact\" gives the model a two-part shape \u2014 build then land \u2014 which is what makes a transition feel resolved rather than an unfinished whoosh.",
      },
      {
        label: "Riser into hit",
        prompt: "tension riser building into a sharp cinematic hit, 2 seconds, low rumble underneath, dry hit at the end",
        why: "Stacking \"low rumble underneath\" with the riser is what gives it cinematic weight \u2014 a riser without low end reads as a cheap synth sweep instead of a trailer beat.",
      },
      {
        label: "Glitch cut",
        prompt: "short digital glitch transition, stuttering bitcrushed texture, fast and choppy, under 500 ms, dry",
        why: "\"Stuttering\" and \"choppy\" describe rhythm, not just texture \u2014 a glitch transition needs irregular timing to read as broken rather than as a clean synth effect.",
      },
      {
        label: "UI slide",
        prompt: "UI slide panel transition, thin whoosh with a soft landing thud, 300 ms, completely dry",
        why: "The landing thud is the part most prompts forget \u2014 without an endpoint the sound just fades, and a panel sliding into place needs an audible stop.",
      },
      {
        label: "Downlifter",
        prompt: "cinematic downlifter, falling pitch sweep with fading tail, 1.5 seconds, roomy, ends in silence",
        why: "\"Ends in silence\" tells the model not to resolve the sweep into a hit, which is the detail that makes a downlifter useful for a somber or quiet cut instead of a hype one.",
      },
    ],
    craft: [
      {
        heading: "A transition has a shape, not just a texture",
        body: "Most transition sounds are really three possible shapes: build-and-land (riser into a hit), sweep-and-fade (a downlifter or a soft whoosh that just recedes), or a single sharp cut (a glitch stutter or a page turn). Decide which shape your edit needs before writing the prompt, and describe it as a sequence \u2014 \"rising sweep into a soft impact\", \"falling pitch sweep with fading tail\" \u2014 rather than a single adjective. The model follows a described arc far more reliably than a mood word.",
      },
      {
        heading: "Match the transition's weight to the cut's weight",
        body: "A cut between two casual UI screens wants something thin and quick \u2014 under half a second, dry, no low end. A cut between two scenes in a trailer wants low-frequency weight and a couple of seconds to build. Using a heavy cinematic riser on a UI panel slide reads as comically oversized, and a thin UI whoosh under a trailer cut disappears. Name the duration and the frequency weight together so the two stay proportional.",
      },
      {
        heading: "Silence is a valid ending",
        body: "Not every transition needs to land on a hit. Downlifters and fades that resolve into silence are useful precisely because they don't punctuate \u2014 they let the next shot or scene establish itself without a stinger stepping on it. If that's the job, say so explicitly (\"ends in silence\", \"fading tail\", \"no hit\"), because the model's default lean, especially for cinematic prompts, is toward a resolved impact at the end.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you a trailer riser built for someone else's two-second build, which you then have to stretch or cut to fit your edit. Generating gives you one built at your exact duration, with the weight and shape matched to the specific cut it's covering, whether that's a UI panel sliding or a scene change in a trailer. The trade is time and a GPU against fit and timing.",
      },
    ],
    related: ["whoosh", "cinematic", "glitch", "ui", "notification", "sci-fi"],
  },
};
const MACHINERY: SfxCategory = {
  slug: "machinery",
  name: "Machinery",
  coverImage: "/sfx/covers/machinery-cover.png",
  targetQuery: "machinery sound effects",
  intent:
    "Industrial ambience and mechanical foley for games and film.",
  metaTitle: "Machinery Sound Effects Generator | Soundbox",
  metaDescription:
    "Generate motors, servos, lifts and industrial beds locally by describing load, metal and space.",
  h1: "Machinery sound effects",
  intro:
    "Machines sound like the load they are under. Describe the strain and the space, not the machine.",
  content: {
    samples: [
        {
          slug: "engine-startup",
          title: "Engine startup",
          prompt: "small combustion engine starting up, initial crank then catching and idling, 2 seconds, outdoor space",
          source: "model",
          model: "audiocpp-stable-audio-3-sfx",
          durationS: 2,
        },
    ],
    recipes: [
      {
        label: "Model startup",
        prompt: "small combustion engine starting up, initial crank then catching and idling, 2 seconds, outdoor space",
        why: "\"Crank then catching\" names the two distinct phases of a real start \u2014 without them the model tends to jump straight to a steady idle and skip the mechanical struggle that sells it.",
      },
      {
        label: "Gear grind",
        prompt: "metal gears grinding under load, harsh irregular scraping, mid frequency, close mic, dry",
        why: "\"Irregular\" is the key word \u2014 real gear grind is not a steady tone, it's uneven scraping as teeth catch inconsistently, and a steady version reads as synthetic.",
      },
      {
        label: "Hydraulic release",
        prompt: "hydraulic press releasing pressure, sharp air hiss with a mechanical thunk at the end, close mic, dry",
        why: "Sequencing the hiss before the thunk mirrors the actual physical order of a pressure release finishing in mechanical contact \u2014 reverse that order and it stops reading as hydraulic.",
      },
      {
        label: "Conveyor hum",
        prompt: "conveyor belt motor running, steady low mechanical hum with a faint rattle, factory room tone, 3 seconds",
        why: "The \"faint rattle\" layered on a steady hum is what keeps a looped machine sound from feeling like a pure synth tone \u2014 real machinery is never perfectly clean.",
      },
      {
        label: "Power-down",
        prompt: "industrial machine powering down, motor winding down in pitch, mechanical clunk at the end, factory room tone",
        why: "\"Winding down in pitch\" describes a motor losing RPM, which is the specific acoustic cue for power-down versus power-up \u2014 direction of pitch change carries almost the entire meaning.",
      },
    ],
    craft: [
      {
        heading: "Machines have a start, a run state, and a stop \u2014 pick one",
        body: "A single generation captures one phase well; asking for all three in one short clip tends to blur into an unconvincing average. Startup prompts should describe the mechanical struggle before it catches (\"crank then catching\"); a running-state prompt should describe steady character plus one imperfection (a rattle, a faint irregularity) so it doesn't read as a pure tone; a power-down prompt should describe pitch or speed falling away. Generate the phase you actually need rather than a generic \"model sound\".",
      },
      {
        heading: "Perfect regularity reads as fake",
        body: "Real mechanical sound is full of small irregularities \u2014 a belt with a faint rattle, gears that grind unevenly, a motor with a slight flutter in its pitch. A model asked for a plain, undecorated mechanical hum tends to produce something too clean and tonal to pass as a real machine. Naming one specific imperfection (\"faint rattle\", \"irregular scraping\", \"slight flutter\") is usually enough to sell the whole sound as mechanical rather than synthesized.",
      },
      {
        heading: "Room tone tells you the machine's scale",
        body: "A servo motor whirring dry and close reads as small \u2014 something in a robot arm or a printer. The same whir with factory room tone and more low end reads as part of something industrial-scale. Since machinery prompts span everything from a wristwatch mechanism to a hydraulic press, naming the room (\"close mic\" and dry for small devices, \"factory room tone\" for large equipment) is often what actually sets the scale, more than any size adjective would.",
      },
    ],
    faqs: [
      {
        question: "Can I use these sounds in a commercial video or game?",
        answer: "It depends on which model generated them, and Soundbox tells you before you download the weights. the Stable Audio 3 models are under the Stability AI Community License, which is free below a revenue threshold; ACE-Step 1.5 is MIT; MiniMax's models are conditional on attribution and a revenue cap; and some voice and stem-separation weights are non-commercial. Soundbox itself is MIT, but the licence of the model that made a sound governs what you can do with it. Check the model's own licence \u2014 the summary in the app is not legal advice.",
      },
      {
        question: "Does this run offline?",
        answer: "Yes, once the weights are downloaded. Soundbox runs the models locally and stores everything in one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key and no upload step. The one thing that needs the network is the initial model download.",
      },
      {
        question: "What hardware do I need?",
        answer: "Realistically an NVIDIA GPU with 8 GB or more. CPU-only works and is fully supported, but a generation takes minutes rather than seconds \u2014 which is fine for a handful of short clips and painful if you're batching a large set.",
      },
      {
        question: "Can my coding agent generate these for me?",
        answer: "Yes. Soundbox exposes an MCP server at http://127.0.0.1:17494/mcp while it is running, with tools for generating and listing sounds. An agent can generate the sound in the same pass it's already working in, and it gets back an absolute file path it can drop straight into your project.",
      },
      {
        question: "How is this different from downloading a sample pack?",
        answer: "A pack gives you one factory's conveyor belt, recorded at whatever distance and load the original modeler happened to capture. Generating gives you a machine sound built at the scale and room your scene actually needs, and lets you produce a matched startup, run, and power-down from the same prompt family instead of splicing together clips that were never meant to sit next to each other. The trade is time and a GPU against fit and consistency.",
      },
    ],
    related: ["door", "sci-fi", "glitch", "impact", "ambience", "cinematic"],
  },
};

/**
 * Appends `expansions.ts` onto the sample grid a category already declares.
 *
 * The extra clips live in their own file so a pass that only widens the grids
 * doesn't bury itself in four thousand lines of prose, but they have to arrive
 * here to be real: the render script, the page template and the hub all read
 * this list and nothing else.
 */
function withExtras(category: SfxCategory): SfxCategory {
  const extra = EXTRA_SAMPLES[category.slug];
  if (!extra || !category.content) return category;
  const seen = new Set(category.content.samples.map((x) => x.slug));
  const added = extra.filter((x) => !seen.has(x.slug));
  if (added.length === 0) return category;
  return { ...category, content: { ...category.content, samples: [...category.content.samples, ...added] } };
}

export const SFX_CATEGORIES: SfxCategory[] = [
  EIGHT_BIT,
  CHIPTUNE_MUSIC,
  EIGHT_BIT_MUSIC,
  WHOOSH,
  FOOTSTEPS,
  RETRO_GAME,
  VIDEO_GAME,
  COIN_PICKUP,
  POWER_UP,
  GAME_OVER,
  LASER,
  MAGIC,
  WEAPON,
  EXPLOSION,
  IMPACT,
  HORROR,
  SCI_FI,
  CINEMATIC,
  GLITCH,
  CROWD,
  RAIN,
  THUNDER,
  WIND,
  WATER,
  FIRE,
  ANIMAL,
  AMBIENCE,
  DOOR,
  UI,
  NOTIFICATION,
  TRANSITION,
  MACHINERY,
  ...FOLEY_AND_TRANSPORT,
  ...DESIGN_AND_CREATURE,
].map(withExtras);

const BY_SLUG = new Map(SFX_CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string | undefined): SfxCategory | undefined {
  return slug ? BY_SLUG.get(slug) : undefined;
}

export function groupOf(slug: string): SfxGroup {
  return CATEGORY_GROUPS[slug] ?? "Games";
}
