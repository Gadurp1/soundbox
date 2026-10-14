/**
 * The `/music` track list — thirty-six real renders, twenty instrumental and
 * sixteen sung, with the prompt that produced each one.
 *
 * The list is in two halves. The first twelve are game and film cues, which is
 * what the page opened with. The twenty-four below them carry `trending: true`
 * and cover contemporary chart and club genres — amapiano, drill, corridos
 * tumbados, jersey club, hyperpop and so on. Both halves are the same two
 * models at the same twenty seconds; the second half exists because "can a
 * local model hold a genre a listener already knows?" is a sharper question
 * than "can it score a boss fight?", and the answer is legible to more people.
 *
 * Every prompt here is the exact string sent to the model, not a tidied-up
 * version of it. `scripts/gen-music-tracks.mjs` holds the same list (plain JS,
 * because this file is TypeScript and the render script is not) and is the
 * thing that actually produced `site/public/music/*.mp3`. **The slugs and prompts
 * in the two files must stay in sync** — the script prints a mismatch warning
 * if a slug here has no audio file, which is the cheap version of a test.
 *
 * Model split is not arbitrary. Stable Audio 3.0 Small Music has no vocal path
 * at all, so every instrumental below is its work; ACE-Step is the
 * lyrics-conditioned model, so the four sung tracks are its. That division is
 * the page's actual teaching point, and it's why both models appear rather
 * than picking whichever sounded better once.
 *
 * Cover art lives in `site/public/music/covers/`. The first twelve were generated
 * with Google's Nano Banana image model via the Antigravity CLI; the trending
 * twenty-four come from Stable Diffusion 3.5 Medium running locally through
 * `scripts/gen_sd35.py`, the same pipeline that made the `/sfx` covers, from
 * the prompt list in `scripts/gen-music-covers.tsv`.
 *
 * Local is the right default here and the cloud call was the anomaly: a page
 * arguing that you do not need an account or a quota to make audio should not
 * depend on someone's image quota to show it. It is also simply reproducible —
 * the TSV and the script are both in the repo, where an API key is not.
 *
 * Either way it is decoration around the audio, and the page says so — no
 * cover implies a release that exists.
 */

import type { MusicTrack } from "./types";

const MUSIC = "audiocpp-stable-audio-3-small-music" as const;
const ACE = "audiocpp-ace-step" as const;

export const MUSIC_TRACKS: MusicTrack[] = [
  /* ---------------------------------------------------------------- */
  /* Instrumental — Stable Audio 3.0 Small Music.                      */
  /* ---------------------------------------------------------------- */
  {
    slug: "neon-arcade-nights",
    title: "Neon Arcade Nights",
    genre: "Synthwave",
    model: MUSIC,
    collection: "instrumental",
    durationS: 20,
    cover: "/music/covers/neon-arcade-nights.webp",
    prompt:
      "1980s synthwave arcade title theme, wide analog saw lead synth melody, gated reverb drum machine, pulsing sidechained bass synth, bright neon major key, 110 BPM, seamless loop",
    why: "Name the drum treatment (gated reverb); it says more about the 1980s than 'retro'. It is a specific production technique the model has heard thousands of examples of.",
  },
  {
    slug: "crystal-caverns",
    title: "Crystal Caverns",
    genre: "Ambient",
    model: MUSIC,
    collection: "instrumental",
    durationS: 20,
    cover: "/music/covers/crystal-caverns.webp",
    prompt:
      "ambient underground exploration theme, glassy bell synth arpeggio, deep sustained pad underneath, sparse hand percussion, long dripping-water reverb tail, slow minor key, seamless loop",
    why: "'Sparse' matters most here. Left to itself the model fills every bar, and an exploration bed has to leave room for footsteps and dialogue on top.",
  },
  {
    slug: "final-gate",
    title: "Final Gate",
    genre: "Orchestral hybrid",
    model: MUSIC,
    collection: "instrumental",
    durationS: 20,
    cover: "/music/covers/final-gate.webp",
    prompt:
      "orchestral hybrid final boss theme, staccato low string ostinato, brass ensemble stabs, taiko drum hits on the downbeat, choir pad sustained underneath, dark minor key, 150 BPM",
    why: "Four named sections, each with a named articulation (staccato strings, brass stabs, taiko downbeats, sustained choir), turn a mood request into an arrangement the model can voice.",
  },
  {
    slug: "pixel-sunrise",
    title: "Pixel Sunrise",
    genre: "Lo-fi chiptune",
    model: MUSIC,
    collection: "instrumental",
    durationS: 20,
    cover: "/music/covers/pixel-sunrise.webp",
    prompt:
      "lo-fi hip hop chiptune beat, dusty vinyl crackle, mellow square wave lead synth melody, warm sub bass, laid-back swung drum machine, 82 BPM, seamless loop",
    why: "Two genres crossed on purpose: the vinyl crackle and swung drums come from lo-fi, the square wave lead from chiptune. The model blends them cleanly because both halves are named as concrete timbres.",
  },
  {
    slug: "iron-foundry",
    title: "Iron Foundry",
    genre: "Industrial",
    model: MUSIC,
    collection: "instrumental",
    durationS: 20,
    cover: "/music/covers/iron-foundry.webp",
    prompt:
      "industrial factory level theme, metallic percussion struck on scrap steel, distorted bass synth ostinato, mechanical clanking locked to the grid, driving minor key, 128 BPM, seamless loop",
    why: "'Locked to the grid' keeps the clanking in time. Without it the clanking drifts and the loop sounds like factory ambience instead of a track.",
  },
  {
    slug: "starlight-drift",
    title: "Starlight Drift",
    genre: "Space ambient",
    model: MUSIC,
    collection: "instrumental",
    durationS: 20,
    cover: "/music/covers/starlight-drift.webp",
    prompt:
      "slow space ambient theme, evolving analog pad, distant reverb-drenched piano notes, soft granular texture, weightless and spacious, no percussion",
    why: "'No percussion' is a negative instruction worth including: the model's default for anything called a 'theme' is to put a beat under it.",
  },
  {
    slug: "street-circuit",
    title: "Street Circuit",
    genre: "Rock / electronic",
    model: MUSIC,
    collection: "instrumental",
    durationS: 20,
    cover: "/music/covers/street-circuit.webp",
    prompt:
      "high energy racing game theme, distorted electric guitar riff, driving four-on-the-floor drum kit, aggressive bass synth, rising tension across the loop, 165 BPM, seamless loop",
    why: "Tempo is the strongest instruction in a racing prompt. 165 BPM gets more urgency from the model than 'fast' or 'intense'.",
  },
  {
    slug: "market-of-lanterns",
    title: "Market of Lanterns",
    genre: "Fantasy folk",
    model: MUSIC,
    collection: "instrumental",
    durationS: 20,
    cover: "/music/covers/market-of-lanterns.webp",
    prompt:
      "cheerful fantasy town market theme, plucked lute melody, hand drum and tambourine groove, wooden flute counter-melody, warm major key, seamless loop",
    why: "'Counter-melody' tells the model the flute has its own line to play against the lute, which keeps the two from collapsing into unison.",
  },

  /* ---------------------------------------------------------------- */
  /* Sung — ACE-Step 1.5 Turbo. `prompt` sets the arrangement, the     */
  /* `lyrics` block is what the model actually sings.                  */
  /* ---------------------------------------------------------------- */
  {
    slug: "victory-lap",
    title: "Victory Lap",
    genre: "Power pop",
    model: ACE,
    collection: "vocal",
    durationS: 20,
    cover: "/music/covers/victory-lap.webp",
    prompt:
      "triumphant power pop victory anthem, bright electric guitars, punchy live drums, gang vocal chorus, major key, 140 BPM",
    lyrics: "[chorus]\nWe took the long way home\nWe took the crown\nVictory lap, victory lap\nWe are not coming down",
    why: "Short repeated lines fit a 20-second render. Give ACE-Step a dense verse and it rushes the syllables or drops half of them.",
  },
  {
    slug: "game-over-blues",
    title: "Game Over Blues",
    genre: "Blues",
    model: ACE,
    collection: "vocal",
    durationS: 20,
    cover: "/music/covers/game-over-blues.webp",
    prompt:
      "slow electric blues, weeping guitar bends, brushed drums, warm upright bass, smoky male lead vocal, minor key, 68 BPM",
    lyrics:
      "[verse]\nOne more life, one more try\nThe screen goes dark, so do I\n[chorus]\nGame over blues again",
    why: "Put the vocal timbre in the prompt. 'Smoky male lead vocal' is arrangement, and ACE-Step reads the lyrics block only as words to sing.",
  },
  {
    slug: "co-op-forever",
    title: "Co-op Forever",
    genre: "Indie pop",
    model: ACE,
    collection: "vocal",
    durationS: 20,
    cover: "/music/covers/co-op-forever.webp",
    prompt:
      "upbeat indie pop duet, jangly electric guitars, handclaps, warm synth pads, cheerful male and female vocals trading lines, major key, 124 BPM",
    lyrics:
      "[verse]\nYou take the left, I take the right\n[chorus]\nCo-op forever, player one and two",
    why: "'Trading lines' asks for two voices that alternate. It is the only reliable way to get call-and-response from a model with no per-voice controls.",
  },
  {
    slug: "loading-screen-lullaby",
    title: "Loading Screen Lullaby",
    genre: "Lullaby",
    model: ACE,
    collection: "vocal",
    durationS: 20,
    cover: "/music/covers/loading-screen-lullaby.webp",
    prompt:
      "gentle lullaby, soft nylon-string guitar arpeggio, airy female vocal, quiet sustained strings, slow and tender, major key, 70 BPM",
    lyrics:
      "[verse]\nClose your eyes, the world will wait\n[chorus]\nSleep now little one, the stars are loading",
    why: "Every element in this prompt points the same way: nylon strings, airy, quiet, slow, tender. If any one element turns assertive, the lullaby stops working.",
  },

  /* ---------------------------------------------------------------- */
  /* Popular now — contemporary chart and club genres.                 */
  /*                                                                   */
  /* These carry `trending: true` on top of a normal collection, so    */
  /* each one appears twice: in its model's section, where it argues   */
  /* the Stable-Audio-vs-ACE-Step split alongside the game cues, and   */
  /* in the "Popular now" section, where the argument is that a local  */
  /* 20-second render can hold a recognisable genre. A track that only */
  /* worked in the second framing would not be worth shipping.         */
  /*                                                                   */
  /* Genre choice is a snapshot, not a ranking. Nothing here is        */
  /* modelled on a specific artist or record — the prompts name        */
  /* instruments, rhythms and production techniques, which is both the */
  /* honest way to ask and the way that actually works.                */
  /* ---------------------------------------------------------------- */

  /* --- Instrumental, Stable Audio 3.0 Small Music --- */
  {
    slug: "log-drum-sunset",
    title: "Log Drum Sunset",
    genre: "Amapiano",
    scene: "Amapiano",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/log-drum-sunset.webp",
    prompt:
      "amapiano instrumental, deep detuned log drum bassline, airy shaker and rim-click percussion, soft Rhodes chord stabs, wide reverb, laid-back groove, 112 BPM",
    why: "The log drum defines amapiano, so the prompt names it as an instrument. Ask for 'amapiano bass' and the model reaches for an ordinary sub, and the track no longer sounds like amapiano.",
  },
  {
    slug: "drift-tape",
    title: "Drift Tape",
    genre: "Phonk",
    scene: "Phonk",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/drift-tape.webp",
    prompt:
      "phonk instrumental, distorted cowbell melody, heavily saturated 808 bass, lo-fi tape hiss and vinyl noise, halftime trap drums, dark minor key, 140 BPM, seamless loop",
    why: "Phonk depends on degraded sound, and the model defaults to a clean mix. 'Heavily saturated', 'tape hiss' and 'vinyl noise' are three separate requests for degradation because one is not enough to override that default.",
  },
  {
    slug: "club-bounce-140",
    title: "Club Bounce 140",
    genre: "Club",
    scene: "Jersey club",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/club-bounce-140.webp",
    prompt:
      "jersey club instrumental, triplet kick pattern in groups of three, chopped vocal stab hook, punchy layered claps, sparse bright percussion, 140 BPM, seamless loop",
    why: "Spell out the rhythm: 'triplet kick pattern in groups of three' is what separates jersey club from any other track at 140 BPM. The genre name alone does not do it.",
  },
  {
    slug: "two-step-rain",
    title: "Two Step Rain",
    genre: "UK garage",
    scene: "UK garage",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/two-step-rain.webp",
    prompt:
      "UK garage two-step instrumental, shuffled syncopated drum groove, warm sub bass, filtered organ chord stabs, crisp offbeat hi-hats, night-time city mood, 134 BPM, seamless loop",
    why: "'Shuffled syncopated' is the swing that makes it two-step. Without those two words the same instrument list renders as straight four-to-the-floor house.",
  },
  {
    slug: "basement-rollers",
    title: "Basement Rollers",
    genre: "Tech house",
    scene: "Tech house",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/basement-rollers.webp",
    prompt:
      "rolling tech house instrumental, dry four-on-the-floor kick, tight rubbery bassline on the offbeat, filtered percussion loop, minimal dub chord stab, 126 BPM, seamless loop",
    why: "'Dry' and 'minimal' are subtractive instructions, and tech house needs both. Left alone the model adds the reverb and pads that turn a rolling groove into progressive house.",
  },
  {
    slug: "baile-heat",
    title: "Baile Heat",
    genre: "Baile funk",
    scene: "Brazilian funk",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/baile-heat.webp",
    prompt:
      "brazilian baile funk instrumental, punchy tamborzao drum pattern, distorted bass drop, chopped vocal shout sample, whistle hook, raw and loud, 130 BPM, seamless loop",
    why: "Naming the tamborzão gets a specific pattern that 'brazilian percussion' does not, because the term appears in training data attached to the rhythm itself.",
  },
  {
    slug: "velvet-rhodes",
    title: "Velvet Rhodes",
    genre: "Neo-soul",
    scene: "Neo-soul",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/velvet-rhodes.webp",
    prompt:
      "neo-soul instrumental, lush Rhodes electric piano chords with extended jazz voicings, loose pocket drums slightly behind the beat, warm fretless bass, muted trumpet fills, 88 BPM",
    why: "'Slightly behind the beat' asks for a feel. It is the instruction that separates neo-soul from ordinary Rhodes-and-bass jazz at the same tempo.",
  },
  {
    slug: "kick-cathedral",
    title: "Kick Cathedral",
    genre: "Hardstyle",
    scene: "Hardstyle",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/kick-cathedral.webp",
    prompt:
      "hardstyle instrumental, distorted pitched-down kick drum, screeching reverse lead synth, euphoric supersaw chord progression, festival main stage energy, 155 BPM",
    why: "In hardstyle the kick carries the pitch, so it is named first. Prompt order matters: the start of the list gets the most of the model's attention.",
  },
  {
    slug: "slow-lean",
    title: "Slow Lean",
    genre: "Trap soul",
    scene: "Trap soul",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/slow-lean.webp",
    prompt:
      "trap soul instrumental, sparse muted electric guitar loop, deep sliding 808 bass, skittering triplet hi-hat rolls, wide reverb tail, melancholy minor key, 72 BPM, seamless loop",
    why: "Trap has two tempos at once: '72 BPM' sets the halftime pulse while 'triplet hi-hat rolls' keeps the top end busy. Ask for a fast tempo instead and you get fast drums with no space under them.",
  },
  {
    slug: "liquid-mile",
    title: "Liquid Mile",
    genre: "Drum and bass",
    scene: "Liquid DnB",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/liquid-mile.webp",
    prompt:
      "liquid drum and bass instrumental, fast broken breakbeat, smooth rolling sub bass, warm major-seventh pad chords, sparse piano flourishes, 174 BPM, seamless loop",
    why: "'Major-seventh pad chords' make this liquid drum and bass. Neurofunk uses the same 174 BPM breakbeat; the chord quality decides which one you get.",
  },
  {
    slug: "wall-of-blue",
    title: "Wall of Blue",
    genre: "Shoegaze",
    scene: "Shoegaze revival",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/wall-of-blue.webp",
    prompt:
      "shoegaze instrumental, thick layered guitar wall drenched in reverb and chorus, bent tremolo lead buried in the mix, steady live drum kit, hazy major key, 108 BPM",
    why: "'Buried in the mix' is a mixing instruction. Shoegaze is one of the few genres where telling the model to hide the lead is correct.",
  },
  {
    slug: "desert-drum",
    title: "Desert Drum",
    genre: "Afro house",
    scene: "Afro house",
    model: MUSIC,
    collection: "instrumental",
    trending: true,
    durationS: 20,
    cover: "/music/covers/desert-drum.webp",
    prompt:
      "afro house instrumental, tribal hand drum polyrhythm, deep round sub bass, hypnotic marimba melody, breathy vocal chop texture, 122 BPM, seamless loop",
    why: "'Hypnotic' tells the model to repeat a figure instead of developing it, which keeps a groove track from turning into a composition over twenty seconds.",
  },

  /* --- Sung, ACE-Step 1.5 Turbo --- */
  {
    slug: "lagos-midnight",
    title: "Lagos Midnight",
    genre: "Afrobeats",
    scene: "Afrobeats",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/lagos-midnight.webp",
    prompt:
      "afrobeats, syncopated log drum and shaker groove, bright plucked guitar riff, warm sub bass, smooth melodic male vocal, major key, 104 BPM",
    lyrics: "[chorus]\nLagos midnight, hold me slow\nDance until the morning show\nSay you never let me go",
    why: "Three short lines, all hook. Twenty seconds has room for a chorus and nothing else; a verse written at the density of a real single gets swallowed or rushed.",
  },
  {
    slug: "cold-corner",
    title: "Cold Corner",
    genre: "Drill",
    scene: "Melodic drill",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/cold-corner.webp",
    prompt:
      "melodic drill, sliding 808 bass, skippy drill hi-hat pattern, dark piano loop, half-sung half-rapped male vocal, minor key, 142 BPM",
    lyrics: "[chorus]\nCold corner, same old street\nNothing changes but the beat\nI been running on repeat",
    why: "'Half-sung half-rapped' describes melodic-drill delivery in four words. Put it in the prompt: ACE-Step reads that field as performance direction and the lyrics field as words to sing.",
  },
  {
    slug: "corrido-de-la-frontera",
    title: "Corrido de la Frontera",
    genre: "Regional Mexican",
    scene: "Corridos tumbados",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/corrido-de-la-frontera.webp",
    prompt:
      "corridos tumbados, requinto guitar lead melody, tuba bassline, twelve-string bajo sexto strumming, earnest male vocal, no drums, moderate tempo",
    lyrics: "[verse]\nCruzando la frontera al amanecer\nCon el corazon pesado y nada que perder",
    why: "'No drums' is the exclusion that matters. Sierreño uses only requinto, tuba and bajo sexto, and left to itself the model puts a kit under everything.",
  },
  {
    slug: "sugar-crash",
    title: "Sugar Crash",
    genre: "Hyperpop",
    scene: "Hyperpop",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/sugar-crash.webp",
    prompt:
      "hyperpop, pitched-up processed vocals, glitchy chopped drums, brittle saw synth chords, extreme sidechain pumping, sugary major key, 160 BPM",
    lyrics: "[chorus]\nSugar crash, love it when it hurts\nTurn it up until it breaks\nEverything at once or nothing",
    why: "Every phrase here is a production verb: pitched-up, chopped, sidechained. Hyperpop is defined by its production, and an instrument list alone renders as ordinary pop.",
  },
  {
    slug: "two-lane-heart",
    title: "Two-Lane Heart",
    genre: "Country pop",
    scene: "Country crossover",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/two-lane-heart.webp",
    prompt:
      "modern country pop, acoustic guitar strum, slide guitar fills, stomp-clap drums, warm bass, earnest male vocal with a slight drawl, major key, 96 BPM",
    lyrics: "[chorus]\nTwo-lane heart, one-way town\nI keep driving, you keep pulling me down",
    why: "'With a slight drawl' shapes the accent without naming a singer to imitate, which also keeps the prompt working after a model update.",
  },
  {
    slug: "neon-signal",
    title: "Neon Signal",
    genre: "K-pop",
    scene: "K-pop",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/neon-signal.webp",
    prompt:
      "K-pop, glossy synth-pop production, punchy electronic drums, staccato synth bass, layered female group vocals with harmony stacks, bright major key, 128 BPM",
    lyrics: "[chorus]\nNeon signal, catch the light\nWe go up, we go up tonight",
    why: "'Harmony stacks' gets the layered group vocal the genre is built on; 'female vocals' on its own gets one tracked voice and a much smaller chorus.",
  },
  {
    slug: "bedroom-ceiling",
    title: "Bedroom Ceiling",
    genre: "Bedroom pop",
    scene: "Bedroom pop",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/bedroom-ceiling.webp",
    prompt:
      "bedroom pop, softly clipped lo-fi drums, warm detuned synth pad, simple clean electric guitar, intimate close-mic breathy female vocal, hazy major key, 92 BPM",
    lyrics: "[verse]\nStaring at the bedroom ceiling\nCounting all the ways of healing",
    why: "'Close-mic' and 'softly clipped' describe the recording. Bedroom pop is a production style, and prompted by genre name alone it comes back as clean studio pop.",
  },
  {
    slug: "silk-hours",
    title: "Silk Hours",
    genre: "R&B",
    scene: "Contemporary R&B",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/silk-hours.webp",
    prompt:
      "contemporary R&B slow jam, sparse finger-snap percussion, deep warm bass, muted Rhodes chords, breathy layered female vocal with runs, minor key, 74 BPM",
    lyrics: "[chorus]\nSilk hours, don't turn on the light\nStay a little longer, make it last all night",
    why: "'With runs' is the phrase that gets melisma from the model. Without it ACE-Step sings the line straight and the take sounds like pop.",
  },
  {
    slug: "perreo-nocturno",
    title: "Perreo Nocturno",
    genre: "Reggaeton",
    scene: "Reggaeton",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/perreo-nocturno.webp",
    prompt:
      "reggaeton, classic dembow drum pattern, deep boomy kick, minor key synth plucks, confident male vocal, club atmosphere, 96 BPM",
    lyrics: "[chorus]\nPerreo nocturno, baja la luz\nMuevete conmigo, no pares tu",
    why: "Naming 'dembow' pins one exact rhythm. Writing the lyric in Spanish keeps the vowel shapes the genre's phrasing is built around.",
  },
  {
    slug: "suburb-static",
    title: "Suburb Static",
    genre: "Pop punk",
    scene: "Pop punk revival",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/suburb-static.webp",
    prompt:
      "pop punk revival, palm-muted distorted power chords, fast driving punk drums, melodic bass, urgent young male vocal, gang vocal backing, major key, 168 BPM",
    lyrics: "[chorus]\nSuburb static, same four walls\nScreaming down an empty hall",
    why: "'Gang vocal backing' adds three words and gives a chorus that sounds like a room full of people. That is most of what makes the genre feel live.",
  },
  {
    slug: "lift-me-higher",
    title: "Lift Me Higher",
    genre: "Gospel house",
    scene: "Soulful house",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/lift-me-higher.webp",
    prompt:
      "soulful gospel house, four-on-the-floor kick, organ chord stabs, rolling piano riff, powerful belting female lead vocal with choir backing, uplifting major key, 124 BPM",
    lyrics: "[chorus]\nLift me higher, higher than before\nI can feel it, I can feel it in my soul",
    why: "'Belting' sets the vocal effort level, and effort level is what separates gospel house from house with a singer on it.",
  },
  {
    slug: "paper-thin",
    title: "Paper Thin",
    genre: "Indie folk",
    scene: "Indie folk",
    model: ACE,
    collection: "vocal",
    trending: true,
    durationS: 20,
    cover: "/music/covers/paper-thin.webp",
    prompt:
      "indie folk, fingerpicked acoustic guitar, brushed snare, quiet swelling strings, close intimate female vocal with a second harmony voice, minor key, 76 BPM",
    lyrics: "[verse]\nEverything I built was paper thin\nThe wind came through and found its way in",
    why: "'A second harmony voice' gets two-part harmony from a model with no per-voice controls by describing the arrangement. Co-op Forever does the same with 'trading lines' for alternation.",
  },
];

/** The track the hero plays. Kept as a slug lookup so reordering the array
 *  above cannot silently change what the top of the page is about. */
export const FEATURED_SLUG = "neon-arcade-nights";

/** The tracks in the cover row, in display order. Hand-picked for genre spread
 *  rather than sliced off the top of the array, and deliberately mixed across
 *  the two halves of the list so the row does not read as "games only". */
export const RECOMMENDED_SLUGS = [
  "neon-arcade-nights",
  "log-drum-sunset",
  "cold-corner",
  "final-gate",
  "silk-hours",
  "drift-tape",
  "victory-lap",
  "two-lane-heart",
  "crystal-caverns",
  "sugar-crash",
];

/** The trending set, in the order the "Popular now" section shows them:
 *  alternating instrumental and sung so the two models trade places down the
 *  list instead of arriving in two blocks. */
export const TRENDING_SLUGS = [
  "log-drum-sunset",
  "lagos-midnight",
  "drift-tape",
  "cold-corner",
  "club-bounce-140",
  "corrido-de-la-frontera",
  "two-step-rain",
  "sugar-crash",
  "basement-rollers",
  "two-lane-heart",
  "baile-heat",
  "neon-signal",
  "velvet-rhodes",
  "bedroom-ceiling",
  "kick-cathedral",
  "silk-hours",
  "slow-lean",
  "perreo-nocturno",
  "liquid-mile",
  "suburb-static",
  "wall-of-blue",
  "lift-me-higher",
  "desert-drum",
  "paper-thin",
];

export function trackBySlug(slug: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find((t) => t.slug === slug);
}

export function tracksIn(collection: MusicTrack["collection"]): MusicTrack[] {
  return MUSIC_TRACKS.filter((t) => t.collection === collection);
}

/** The trending tracks in `TRENDING_SLUGS` order. Driven by the slug list
 *  rather than by array order so the section's alternation between the two
 *  models survives someone appending a track to `MUSIC_TRACKS`. A slug in the
 *  list with no matching track is dropped rather than thrown on: this is a
 *  landing page, and one stale slug should not blank the section. */
export function trendingTracks(): MusicTrack[] {
  return TRENDING_SLUGS.map(trackBySlug).filter((t): t is MusicTrack => t !== undefined);
}
