/**
 * The second half of the post-audit collections: human performance, trailer
 * design, and the creature/machine families.
 *
 * Split from `new-categories.ts` purely for file size. The design family —
 * riser, braam, drone — earns its own pages because that is how the trailer
 * houses index their own libraries and how Soundsnap shelves them on its front
 * page: nobody searching for a braam will find it under "cinematic", and
 * nobody building a tension bed wants to scroll past explosions to reach it.
 *
 * The same rule applies as everywhere else in `/sfx`: a page ships because
 * somebody wrote it. Nothing here is templated from a slug.
 */

import type { SfxCategory, SfxFaq, SfxSample } from "./types";

const MODEL = "audiocpp-stable-audio-3-sfx";

function s(slug: string, title: string, prompt: string, durationS: number): SfxSample {
  return { slug, title, prompt, source: "model", model: MODEL, durationS };
}

/** Shared tail questions — see the note in `new-categories.ts`. */
function faqs(specific: SfxFaq): SfxFaq[] {
  return [
    specific,
    {
      question: "Can I use these sounds commercially?",
      answer:
        "That depends on the model that made them, and Soundbox states each model's terms before you download its weights. The clips on this page were rendered with Stable Audio 3.0 Small SFX, which ships under the Stability AI Community License — free for individuals and small companies, with a revenue threshold above which Stability wants an enterprise agreement. Soundbox itself is MIT, but the app's licence does not govern the audio; the model's does. Read the licence rather than this summary before you ship.",
    },
    {
      question: "Does this work offline?",
      answer:
        "Yes, once the weights are on disk. Generation, the library and the HTTP API all run locally against one SQLite file and one folder of WAVs under ~/.soundbox. There is no account, no API key, and nothing is uploaded — the only step that touches the network is the initial model download.",
    },
    {
      question: "What hardware does it need?",
      answer:
        "The clips here were rendered on a consumer NVIDIA GPU at roughly ten seconds of wall time per clip through audio.cpp's quantised GGUF runtime, which is deliberately light on VRAM. CPU-only generation works and is supported, but expect minutes instead of seconds — fine for a handful of sounds, slow for a whole library.",
    },
    {
      question: "Can an agent generate these for me?",
      answer:
        "Yes. Soundbox runs an MCP server at http://127.0.0.1:17494/mcp while the app is open, exposing tools for generating, listing and mixing sounds. Every generated file comes back as an absolute path, so a coding agent wiring up a scene can render the sound it needs and drop it straight into the project — which is exactly how the several hundred clips across these pages were made.",
    },
  ];
}

/* ======================================================= Human & voice */

const APPLAUSE: SfxCategory = {
  slug: "applause",
  name: "Applause",
  targetQuery: "applause sound effect",
  intent:
    "Editors who need clapping at a specific size and warmth — two people, a conference room, a " +
    "stadium — and keep getting a canned laugh-track crowd that dates the whole piece.",
  metaTitle: "Applause Sound Effects — Clapping & Cheers | Soundbox",
  metaDescription:
    "Generate applause, clapping and ovations locally at any crowd size. Prompts for small rooms, theatres, stadiums and single claps.",
  h1: "Applause sound effects you generate yourself",
  intro:
    "Applause is a crowd-size instrument. Four people clapping in an office and four thousand in an " +
    "arena are not the same sound at different volumes — the large one is dense enough that the " +
    "individual claps merge into noise, and the small one is sparse enough that you can count the " +
    "hands. Choosing the wrong size is the fastest way to make a video feel canned, and it is the " +
    "one thing a stock clip rarely lets you control.",
  content: {
    samples: [
      s("applause-small-room", "Small room", "six people applauding politely in a small meeting room, individual claps clearly audible, close and dry", 6),
      s("applause-theatre-warm", "Theatre applause", "theatre audience of several hundred applauding warmly, dense overlapping claps, wooden hall reverb", 8),
      s("applause-stadium-roar", "Stadium ovation", "stadium crowd of thousands applauding and cheering, applause merging into a continuous roar, vast open space", 10),
      s("applause-single-slow-clap", "Slow clap", "single person slow clapping sarcastically, deliberate spaced claps with a hard room echo, empty hall", 6),
      s("applause-building-ovation", "Building ovation", "audience applause starting scattered and building into a full standing ovation with whistles, large hall", 10),
      s("applause-conference-polite", "Conference", "conference audience applauding politely at the end of a talk, even and restrained, medium hall with air conditioning", 8),
      s("applause-fade-out-end", "Applause dying out", "applause tapering off and dying away to a few last claps, then room tone, medium hall", 8),
      s("applause-golf-clap", "Golf clap", "small polite golf gallery clapping quietly, soft muffled claps outdoors with birdsong behind", 6),
      s("applause-comedy-club-laugh", "Laughter and applause", "small comedy club audience laughing then breaking into applause, close intimate room, low ceiling", 8),
      s("applause-single-clap-slate", "Single clap", "one sharp hand clap in an empty room, bright transient with a clear slap-back echo, dry and close", 2),
    ],
    recipes: [
      {
        label: "Set the head count",
        prompt: "six people applauding politely in a small meeting room, individual claps clearly audible, close and dry",
        why: "A number plus \"individual claps clearly audible\" is what keeps the model from defaulting to a stadium, which is where it goes on the word applause alone.",
      },
      {
        label: "Large and merged",
        prompt: "stadium crowd of thousands applauding and cheering, applause merging into a continuous roar, vast open space",
        why: "\"Merging into a continuous roar\" is the actual acoustic signature of a big crowd, and it is what distinguishes size from volume.",
      },
      {
        label: "Applause with a shape",
        prompt: "audience applause starting scattered and building into a full standing ovation with whistles, large hall",
        why: "Applause almost always has an arc; describing the arc gives you something you can cut against picture rather than a flat bed.",
      },
      {
        label: "Comic timing",
        prompt: "single person slow clapping sarcastically, deliberate spaced claps with a hard room echo, empty hall",
        why: "\"Deliberate spaced\" plus an empty room is the whole joke — the echo between claps is what makes it read as sarcasm.",
      },
    ],
    craft: [
      {
        heading: "Density, not loudness, communicates size",
        body: "As a crowd grows, the gaps between individual claps fill in until the sound becomes continuous. That transition happens somewhere around a hundred people and it is the only cue an audience needs. So when applause reads as the wrong size, change the density words rather than the level: \"individual claps clearly audible\" for small, \"dense overlapping\" for medium, \"merging into a continuous roar\" for large. Turning a stadium down does not produce a boardroom, it produces a distant stadium.",
      },
      {
        heading: "Give it a beginning and an end",
        body: "Nothing marks a stock clip faster than applause that starts at full volume and stops dead. Real applause ramps — the first few hands, then the room joining, then the peak, then the ragged tail as people stop at different times. Ask for the shape you need explicitly, and generate the tail as its own clip if you want to control where the scene lands. The fade-out sample in this collection exists for exactly that job.",
      },
      {
        heading: "The room dates the recording",
        body: "A dry, close, mid-sized applause with no room in it is the sound of 1980s television, because that is what a laugh-track machine produced. If you want something to feel contemporary and real, give it a specific space — a wooden hall, a low-ceilinged club, an outdoor gallery — and let the reflections do the work. It costs nothing in the prompt and it is the difference between an audience and an effect.",
      },
    ],
    faqs: faqs({
      question: "How do I avoid the canned laugh-track sound?",
      answer:
        "Three things: name a plausible crowd size rather than leaving it open, put the crowd in a real acoustic space, and give the applause an arc instead of a flat plateau. Canned applause fails on all three at once — it is a mid-sized, roomless, shapeless loop. Fixing any one helps; fixing all three is generally indistinguishable from a location recording.",
    }),
    related: ["crowd", "scream", "ambience", "notification", "cinematic", "cartoon"],
  },
};

const SCREAM: SfxCategory = {
  slug: "scream",
  name: "Screams & vocal effort",
  targetQuery: "scream sound effect",
  intent:
    "Game developers and horror editors needing human vocal reactions — screams, grunts, gasps, " +
    "pain and effort — which are the hardest thing to source cleanly and the most obvious when wrong.",
  metaTitle: "Scream Sound Effects — Horror, Pain, Effort | Soundbox",
  metaDescription:
    "Generate screams, gasps, grunts and vocal effort sounds locally. Prompts for horror reactions, combat effort and pain, with the room built in.",
  h1: "Scream and vocal effort sound effects you generate yourself",
  intro:
    "Human vocal effort is the layer that makes a character feel like a person rather than a rig. " +
    "It is also the layer most likely to break immersion, because listeners are experts in human " +
    "voices and will spot a wrong one instantly. The useful frame is that a scream is not one sound " +
    "but a shape — an intake, a release and a collapse — and prompting the shape produces something " +
    "far more usable than prompting the emotion.",
  content: {
    samples: [
      s("scream-terror-female", "Terror scream", "woman screaming in terror, sharp full-throated cry breaking at the top, medium reverberant interior", 4),
      s("scream-terror-male", "Male shout of fear", "man shouting in sudden fear, short sharp cry cutting off abruptly, close and dry", 3),
      s("scream-pain-grunt", "Pain grunt", "short pained grunt from a body taking an impact, air forced out with a strained edge, close mic, dry", 2),
      s("scream-effort-lift", "Effort grunt", "person straining to lift something heavy, low sustained effort grunt with a shaky release, close mic", 3),
      s("scream-gasp-startle", "Startled gasp", "sudden sharp intake of breath, startled gasp then held, very close mic, quiet room", 2),
      s("scream-breathing-panic", "Panicked breathing", "person breathing fast and shallow in panic, ragged inhales with a tight throat, very close mic", 8),
      s("scream-battle-cry", "Battle cry", "warrior roaring a battle cry, full chested and sustained, open outdoor space with a distant echo", 4),
      s("scream-distant-help", "Distant cry for help", "someone shouting for help from far away, thin and reverberant, echoing across a large empty space", 5),
      s("scream-crowd-terror", "Crowd screaming", "crowd of people screaming and panicking together, overlapping voices scattering, street reverb", 6),
      s("scream-dying-fall", "Falling scream", "long falling scream receding with a doppler drop as it disappears into the distance, open air", 5),
    ],
    recipes: [
      {
        label: "Full scream",
        prompt: "woman screaming in terror, sharp full-throated cry breaking at the top, medium reverberant interior",
        why: "\"Breaking at the top\" is the physical detail that separates a real scream from a sung note — voices distort at maximum effort and listeners expect it.",
      },
      {
        label: "Effort, not pain",
        prompt: "person straining to lift something heavy, low sustained effort grunt with a shaky release, close mic",
        why: "Effort is sustained and low; pain is sudden and sharp. Naming which one you want stops the model splitting the difference into something ambiguous.",
      },
      {
        label: "Breath as performance",
        prompt: "person breathing fast and shallow in panic, ragged inhales with a tight throat, very close mic",
        why: "\"Tight throat\" gives you the constriction that reads as fear; without it panicked breathing sounds like exercise.",
      },
      {
        label: "Distance and space",
        prompt: "someone shouting for help from far away, thin and reverberant, echoing across a large empty space",
        why: "Distance strips the body out of a voice and leaves the reflections — asking for it directly beats putting reverb on a close recording.",
      },
    ],
    craft: [
      {
        heading: "Prompt the mechanism, not the emotion",
        body: "\"Scared scream\" gives the model an abstraction; \"sharp full-throated cry breaking at the top\" gives it a physical event. These models consistently respond better to descriptions of what the body is doing — air forced out, throat tightening, voice cracking, breath held — than to the feeling that caused it. This is the same principle that runs through the whole of Soundbox's prompting advice, and vocals are where it makes the largest difference.",
      },
      {
        heading: "The room is doing half the acting",
        body: "A scream in a tiled bathroom, a forest and a cathedral are three different scenes, and the voice is the same in all of them. Because reflections arrive after the voice, they also tell the audience how far away the person is and how big the space is — information dialogue cannot carry. Always place the vocal somewhere. A dry scream sounds like a sound effect no matter how good the performance is.",
      },
      {
        heading: "Small sounds do more work than big ones",
        body: "Games and film both use far more grunts, gasps and breaths than screams, and those small sounds are what make a character continuously present. They are also cheap to generate and easy to vary — three renders of the same effort grunt give you enough variation to avoid the repetition that makes game audio grating. Build the small library first; you will reach for it constantly and for the scream twice.",
      },
    ],
    faqs: faqs({
      question: "Can I generate actual dialogue this way?",
      answer:
        "No — and that is a deliberate split. The sound-effect models render vocal noise, not words, and asking them for a line produces something that sounds like speech without being it. Soundbox has a separate path for spoken audio: the speech models and the story tools, which cast lines to real voices and keep them as an arrangement you can re-read line by line. Use this collection for effort and reaction, and that one for anything with words in it.",
    }),
    related: ["horror", "crowd", "applause", "heartbeat", "creature", "impact"],
  },
};

const HEARTBEAT: SfxCategory = {
  slug: "heartbeat",
  name: "Heartbeat & body",
  targetQuery: "heartbeat sound effect",
  intent:
    "Editors building subjective tension — heartbeat beds, breathing, tinnitus, the inside-the-head " +
    "perspective that puts an audience inside a character rather than beside them.",
  metaTitle: "Heartbeat Sound Effects — Pulse, Breath, Tension | Soundbox",
  metaDescription:
    "Generate heartbeats, breathing, tinnitus tones and body sounds locally. Loopable tension beds and one-shot beats for subjective sequences.",
  h1: "Heartbeat and body sound effects you generate yourself",
  intro:
    "The heartbeat is cinema's shorthand for subjectivity: the moment you hear one, you are inside " +
    "somebody rather than watching them. It works because it is a sound nobody hears externally, so " +
    "its presence can only mean the camera has moved inward. Getting it right is mostly about " +
    "tempo and body — a heartbeat that is too fast reads as a drum, and one with no chest resonance " +
    "reads as a kick sample.",
  content: {
    samples: [
      s("heartbeat-calm-loop", "Calm heartbeat", "human heartbeat at rest, slow double thump about once per second, deep chest resonance, very close and internal, seamless loop", 10),
      s("heartbeat-accelerating", "Accelerating", "heartbeat accelerating steadily from calm to racing, deep internal thumps growing faster and harder", 10),
      s("heartbeat-racing-panic", "Racing", "heartbeat racing in panic, fast hard double thumps with blood rushing in the ears, internal perspective, seamless loop", 8),
      s("heartbeat-single-thump", "Single beat", "single deep heartbeat thump with a long low chest resonance, internal perspective, dry", 2),
      s("heartbeat-flatline-monitor", "Flatline", "hospital heart monitor beeping steadily then dropping to a continuous flat tone, clinical room, close", 8),
      s("heartbeat-monitor-steady", "Monitor beeping", "hospital heart monitor beeping steadily once per second, thin electronic tone, quiet ward, seamless loop", 10),
      s("heartbeat-breath-held-release", "Held breath", "person holding their breath then releasing it in a long shaky exhale, very close mic, quiet", 6),
      s("heartbeat-tinnitus-ring", "Tinnitus", "high pitched tinnitus ringing after an explosion, thin sine tone with all other sound muffled and distant", 8),
      s("heartbeat-underwater-pulse", "Underwater pulse", "heartbeat heard underwater, muffled low thumps with water pressure and no high frequencies, submerged", 8),
      s("heartbeat-slowing-to-stop", "Slowing to stop", "heartbeat slowing gradually and weakening until it stops, deep internal thumps spacing out, dark and quiet", 10),
    ],
    recipes: [
      {
        label: "Resting bed",
        prompt: "human heartbeat at rest, slow double thump about once per second, deep chest resonance, very close and internal, seamless loop",
        why: "\"Double thump\" is the anatomically correct shape — a heart makes two sounds per beat, and a single thump reads as a drum instead.",
      },
      {
        label: "Escalation",
        prompt: "heartbeat accelerating steadily from calm to racing, deep internal thumps growing faster and harder",
        why: "Building the acceleration into one render keeps the tempo curve smooth; automating it afterwards produces audible steps.",
      },
      {
        label: "Inside the head",
        prompt: "high pitched tinnitus ringing after an explosion, thin sine tone with all other sound muffled and distant",
        why: "Naming what happens to everything else — muffled, distant — is what creates the subjective perspective; the tone alone is just a tone.",
      },
      {
        label: "Clinical, not internal",
        prompt: "hospital heart monitor beeping steadily once per second, thin electronic tone, quiet ward, seamless loop",
        why: "The monitor is the objective version of the same information, and swapping between the two is a cheap and very effective perspective cut.",
      },
    ],
    craft: [
      {
        heading: "Tempo carries the whole performance",
        body: "A resting heart is around one beat per second; frightened is closer to two; a racing one is faster still and starts to lose its double-thump definition. That is your entire emotional range and it needs no other parameter. Prompt the rate explicitly — \"about once per second\", \"fast\", \"racing\" — and if a scene needs a change, render the change as one continuous clip rather than crossfading between two loops, which never quite hides the join.",
      },
      {
        heading: "Chest resonance is what makes it a body",
        body: "A heartbeat without low-frequency body is a kick drum, and audiences hear the difference immediately even if they cannot name it. The words that reliably produce it are \"deep chest resonance\" and \"internal perspective\", and they matter more than volume — a quiet heartbeat with real body sits under dialogue perfectly, while a loud thin one fights everything. If yours is not landing, add body before you add level.",
      },
      {
        heading: "Subjective sound needs the outside world to change too",
        body: "The heartbeat alone does not put an audience inside a character; the contrast does. Real subjective sequences muffle the exterior, roll off its top end, and often add tinnitus or held breath — and the heartbeat sits in the space that clears. Generate the interior layer here and treat the exterior as a separate decision, because the moment everything else stays normal, the heartbeat reads as score rather than perception.",
      },
    ],
    faqs: faqs({
      question: "Why does my heartbeat sound like a drum?",
      answer:
        "Two usual causes. The first is a single thump per beat instead of the real double — ask for \"double thump\" explicitly. The second is missing low-frequency body: without \"deep chest resonance\" and an internal perspective, you get the transient without the cavity around it, which is precisely what a kick drum is. Fixing both in the prompt is faster than any amount of EQ afterwards.",
    }),
    related: ["horror", "cinematic", "scream", "ambience", "clock", "drone"],
  },
};

/* ================================================== Trailer & sound design */

const RISER: SfxCategory = {
  slug: "riser",
  name: "Risers",
  targetQuery: "riser sound effect",
  intent:
    "Video editors and trailer cutters who need tension builds of an exact length that land " +
    "precisely on a cut — the single most common request in the whole transition family.",
  metaTitle: "Riser Sound Effects — Tension Builds & Uplifters | Soundbox",
  metaDescription:
    "Generate risers, uplifters and tension builds locally at exactly the length your cut needs. Prompts for tonal, noise, metallic and orchestral builds.",
  h1: "Riser sound effects you generate yourself",
  intro:
    "A riser exists to end. Everything about it — the rate it climbs, the way it thins out at the " +
    "top, the silence it leaves behind — is in service of the cut it lands on, which is why library " +
    "risers are so frustrating: you get a four-second build for a three-second gap and no honest way " +
    "to fix it. Generating one at the exact length you need is the clearest case in this whole " +
    "library for making the sound rather than finding it.",
  content: {
    samples: [
      s("riser-noise-white-build", "White noise riser", "white noise riser building steadily in volume and brightness over four seconds and cutting off sharply, wide stereo", 4),
      s("riser-tonal-pitch-climb", "Tonal riser", "tonal riser, synthetic pitch climbing steadily upward with growing intensity, ending abruptly, wide stereo", 4),
      s("riser-metallic-scrape", "Metallic riser", "metallic riser built from scraping metal harmonics accelerating upward into a hard stop, harsh and wide", 5),
      s("riser-orchestral-strings", "Orchestral build", "orchestral string section building from soft tremolo to a full dissonant fortissimo, large hall, ending on a cut", 8),
      s("riser-shepard-infinite", "Endless rise", "shepard tone riser, layered octaves creating an endlessly rising illusion, smooth and unsettling, seamless loop", 10),
      s("riser-percussive-accelerando", "Accelerating drums", "percussive riser, drum hits accelerating from slow to a blur over six seconds then stopping dead, big room", 6),
      s("riser-vocal-choir-swell", "Choir swell", "choir swelling from a whisper to a full dissonant cluster over eight seconds, cathedral reverb", 8),
      s("riser-downlifter-reverse", "Downlifter", "downlifter, pitch and energy falling away steadily into a low settled hum, wide stereo, cinematic", 5),
      s("riser-glitch-digital-build", "Glitch riser", "digital riser built from stuttering glitch artefacts accelerating and rising in pitch, harsh, ending abruptly", 4),
      s("riser-long-twelve-second", "Long build", "very long cinematic riser building slowly over twelve seconds through noise, tone and low rumble to a hard cut", 12),
    ],
    recipes: [
      {
        label: "Cut-ready build",
        prompt: "white noise riser building steadily in volume and brightness over four seconds and cutting off sharply, wide stereo",
        why: "Naming the length in the prompt and setting the render to the same number is what makes it land — and \"cutting off sharply\" gives you a clean edit point.",
      },
      {
        label: "Tonal versus noise",
        prompt: "tonal riser, synthetic pitch climbing steadily upward with growing intensity, ending abruptly, wide stereo",
        why: "Tonal risers sit in the harmony and can clash with music; noise risers sit outside it. Choosing deliberately avoids a fight in the mix.",
      },
      {
        label: "The infinite one",
        prompt: "shepard tone riser, layered octaves creating an endlessly rising illusion, smooth and unsettling, seamless loop",
        why: "The Shepard tone is a specific, named illusion the models know — asking for it by name is far more reliable than describing the effect.",
      },
      {
        label: "Falling instead",
        prompt: "downlifter, pitch and energy falling away steadily into a low settled hum, wide stereo, cinematic",
        why: "Downlifters cover the other half of every transition — you almost always want a matched pair, and generating both in one session keeps them related.",
      },
    ],
    craft: [
      {
        heading: "Render the length of the gap, not a standard length",
        body: "This is the whole argument for generating risers. A build that is even a quarter second long has to be trimmed from the front, which removes the quiet beginning that made the build feel long; one that is short has to be stretched, which smears the top. Measure the gap in your timeline, set the render to that number, say the number in the prompt as well, and the problem stops existing. It is a fifteen-second round trip.",
      },
      {
        heading: "Decide what happens at the top",
        body: "Risers end in one of three ways and they are not interchangeable: a hard cut into silence, a cut into an impact, or a spill of reverb that carries over the edit. The first is tense, the second is violent, the third is a reveal. Say which — \"ending abruptly\", \"cutting off sharply\", \"spilling into a long reverb tail\" — because if you do not, the model tends to fade, which is the one ending that never works.",
      },
      {
        heading: "Layer sources rather than turning one up",
        body: "A big trailer build is usually three risers at once: noise for the top, a tonal element for the middle, and a low rumble for the weight. Generating them separately and stacking them lets you time each independently and keeps the mix controllable — and it is why this collection has a noise riser, a tonal riser and a long combined build rather than ten variations of the same thing. One riser turned up is loud; three risers together is big.",
      },
    ],
    faqs: faqs({
      question: "How do I make a riser land exactly on the cut?",
      answer:
        "Set the render duration to the exact gap in your timeline and ask for the abrupt ending explicitly. Because the model produces a clip of the length you requested with the peak at the end, it lines up with the cut without trimming. If you are a few frames out, trim from the front rather than the back — losing the quiet start of a build is almost inaudible, while losing the top is immediately obvious.",
    }),
    related: ["transition", "braam", "cinematic", "whoosh", "drone", "glitch"],
  },
};

const BRAAM: SfxCategory = {
  slug: "braam",
  name: "Trailer hits & braams",
  targetQuery: "braam trailer sound effect",
  intent:
    "Trailer editors after the specific brass-and-sub blast the form is built on, plus the impacts, " +
    "stingers and boom hits that punctuate a cut.",
  metaTitle: "Braam & Trailer Hit Sound Effects | Soundbox",
  metaDescription:
    "Generate braams, trailer hits, boom impacts and stingers locally. Prompts for the brass blast, the sub drop and the tail that follows.",
  h1: "Braam and trailer hit sound effects you generate yourself",
  intro:
    "The braam is the most recognisable sound in modern film marketing: a distorted brass blast over " +
    "an enormous sub, sitting on a cut and decaying for several seconds. It is also close to " +
    "impossible to buy a good one, because the ones in libraries are the ones everyone else has " +
    "already used. Generating means yours is yours — and it means you can render the version with " +
    "the longer tail when the edit changes.",
  content: {
    samples: [
      s("braam-classic-brass", "Classic braam", "enormous distorted brass braam, low blaring horn blast with a huge sub underneath and a long decaying tail", 6),
      s("braam-double-hit", "Double braam", "two braam hits in succession, distorted brass blasts a beat apart with overlapping sub tails, enormous space", 8),
      s("braam-rising-into-hit", "Build into braam", "tension building for three seconds then landing on a massive distorted brass braam with a long tail", 8),
      s("braam-sub-drop-only", "Sub drop", "pure cinematic sub bass drop with no midrange, deep pitch falling and sustaining, felt more than heard", 6),
      s("braam-metallic-impact", "Metallic hit", "trailer impact with a bright metallic transient over a deep distorted boom, long shimmering decay", 5),
      s("braam-choir-hybrid", "Choir braam", "hybrid trailer hit blending a dark male choir with distorted brass and a sub drop, cathedral scale", 6),
      s("braam-percussive-boom", "Boom hit", "huge percussive trailer boom, gated drum-like impact with a compressed room and a fast tight decay", 4),
      s("braam-reverse-into-hit", "Reverse into hit", "reversed swell sucking backwards for two seconds then landing on a massive distorted trailer impact", 5),
      s("braam-stinger-short-sharp", "Short stinger", "short sharp trailer stinger, aggressive distorted stab with almost no tail, dry and violent", 2),
      s("braam-final-hit-long-tail", "Final hit", "final trailer hit, enormous impact with a twelve second decaying tail settling into a low drone", 12),
    ],
    recipes: [
      {
        label: "The braam itself",
        prompt: "enormous distorted brass braam, low blaring horn blast with a huge sub underneath and a long decaying tail",
        why: "All three components named at once — brass, sub, tail — because a braam missing any one of them reads as a different sound entirely.",
      },
      {
        label: "Hit without brass",
        prompt: "huge percussive trailer boom, gated drum-like impact with a compressed room and a fast tight decay",
        why: "\"Gated\" and \"compressed room\" describe the production, not the source, and these models respond to that vocabulary surprisingly well.",
      },
      {
        label: "Weight only",
        prompt: "pure cinematic sub bass drop with no midrange, deep pitch falling and sustaining, felt more than heard",
        why: "\"No midrange\" keeps the sub out of the way of everything else, which is what lets you stack it under an existing hit rather than replacing it.",
      },
      {
        label: "Landing the ending",
        prompt: "final trailer hit, enormous impact with a twelve second decaying tail settling into a low drone",
        why: "The last hit of a trailer is defined by its tail, and a tail that long needs the render length to match or it simply gets cut off.",
      },
    ],
    craft: [
      {
        heading: "A braam is three sounds pretending to be one",
        body: "Brass supplies the identity, the sub supplies the physical weight, and the tail supplies the scale. Missing brass gives you a generic boom; missing sub gives you a horn; missing tail gives you something that sounds small no matter how loud it is. You can prompt all three together, and you can also generate them separately and stack them — which is what to do when you want the brass from one take and the weight from another.",
      },
      {
        heading: "The tail is where the size is",
        body: "As with bells, the decay is what tells an audience how big the space is, and trailer hits are built to sound like they are happening in something the size of a canyon. This has a direct practical consequence: give the render enough seconds. A braam with a six-second tail rendered into a three-second clip has had its whole claim to scale removed, and no amount of reverb afterwards restores it convincingly.",
      },
      {
        heading: "Hits need silence around them",
        body: "The reason trailer hits land is contrast — the beat of near-silence before, and the space the tail decays into afterwards. That is an edit decision, not a sound design one, but it changes what you should generate: you want a hit with a clean start and a long uninterrupted decay, not one padded with atmosphere. Ask for a dry start and a long tail, and leave the silence to the timeline.",
      },
    ],
    faqs: faqs({
      question: "Why do my trailer hits sound small?",
      answer:
        "Nearly always the tail. Big hits are big because of what happens in the three to twelve seconds after the transient, and the two most common mistakes are rendering too short a clip and prompting only the impact. Ask for the decay explicitly, set the render length to contain it, and add a sub layer if the hit has no low end — those three fixes account for most of the difference between a trailer hit and a drum sample.",
    }),
    related: ["cinematic", "riser", "impact", "explosion", "drone", "transition"],
  },
};

const DRONE: SfxCategory = {
  slug: "drone",
  name: "Drones & soundscapes",
  targetQuery: "dark drone sound effect",
  intent:
    "Editors and game developers who need a sustained tonal bed to sit under a scene — dread, awe, " +
    "unease, machinery — for minutes rather than seconds, and seamlessly.",
  metaTitle: "Drone Sound Effects — Dark Ambient Beds & Soundscapes | Soundbox",
  metaDescription:
    "Generate dark drones, tension beds and evolving soundscapes locally. Loopable atmospheres for horror, sci-fi and cinematic scenes.",
  h1: "Drone and soundscape sound effects you generate yourself",
  intro:
    "A drone is the least visible and most load-bearing element in a soundtrack. It does not ask to " +
    "be noticed; it sets what the scene feels like before anything happens in it, and it holds a " +
    "long take together when there is nothing else to hold it. What makes a drone good is that it " +
    "moves slowly enough not to attract attention but enough that the ear does not stop hearing it, " +
    "and that balance is very controllable from a prompt.",
  content: {
    samples: [
      s("drone-dark-dread-low", "Dark dread", "dark sustained drone, low detuned tones slowly beating against each other, oppressive and airless, seamless loop", 12),
      s("drone-sci-fi-ship-hum", "Ship hum", "spacecraft interior drone, warm low mechanical hum with a faint high electrical shimmer, seamless loop", 12),
      s("drone-cathedral-awe", "Awe drone", "vast sustained drone suggesting enormous scale, slow swelling low strings and choir under a hall of air, seamless loop", 12),
      s("drone-industrial-throb", "Industrial throb", "industrial drone with a slow rhythmic throb, distant machinery pressure and metallic resonance, seamless loop", 12),
      s("drone-tension-rising-unease", "Rising unease", "tension drone slowly rising in pitch and density over twelve seconds without ever resolving, dissonant", 12),
      s("drone-underwater-pressure", "Underwater pressure", "deep underwater drone, immense low pressure with distant groaning hull creaks, submerged, seamless loop", 12),
      s("drone-desert-heat-shimmer", "Heat shimmer", "sparse arid drone, thin high shimmering tone over a warm low bed with occasional distant wind, seamless loop", 12),
      s("drone-electrical-hum-fault", "Faulty electrics", "electrical drone with an unstable mains hum, buzzing and intermittently flickering, close and claustrophobic", 10),
      s("drone-choral-ethereal", "Ethereal choir", "ethereal choral drone, wordless voices sustaining a slowly shifting consonant chord, huge reverberant space", 12),
      s("drone-sub-rumble-bed", "Sub rumble", "pure low frequency rumble bed with no midrange or top, slowly undulating, felt more than heard, seamless loop", 12),
    ],
    recipes: [
      {
        label: "Dread",
        prompt: "dark sustained drone, low detuned tones slowly beating against each other, oppressive and airless, seamless loop",
        why: "Detuned tones beating against each other is the actual mechanism of unease — it is dissonance you feel as movement rather than hear as a chord.",
      },
      {
        label: "Awe rather than fear",
        prompt: "vast sustained drone suggesting enormous scale, slow swelling low strings and choir under a hall of air, seamless loop",
        why: "The difference between dread and awe is consonance and space; same technique, opposite harmonic instruction.",
      },
      {
        label: "Movement without event",
        prompt: "tension drone slowly rising in pitch and density over twelve seconds without ever resolving, dissonant",
        why: "\"Without ever resolving\" is what keeps it a bed rather than a riser — it moves, but it never arrives, so it never pulls focus.",
      },
      {
        label: "Weight only",
        prompt: "pure low frequency rumble bed with no midrange or top, slowly undulating, felt more than heard, seamless loop",
        why: "A sub-only bed can sit under dialogue without masking a single word, which is why it is the most reusable drone in any library.",
      },
    ],
    craft: [
      {
        heading: "Slow movement is what stops it becoming furniture",
        body: "A perfectly static tone disappears from perception within about twenty seconds — the ear adapts and stops reporting it. A drone that undulates, beats or drifts very slowly stays present without ever becoming an event. Ask for that movement explicitly: \"slowly beating\", \"undulating\", \"slowly shifting\". It is the difference between a bed that holds a scene and one the audience stops hearing halfway through.",
      },
      {
        heading: "Pick the frequency band the dialogue is not in",
        body: "Drones fail in the mix far more often than they fail on their own, and the cause is almost always that they occupy the same midrange as the voices above them. Generating a sub-only bed, or one whose energy is high and airy, gives you something that can sit loud without masking anything. Prompting the band directly — \"no midrange\", \"thin high shimmering tone\", \"low pressure\" — is more effective than EQing afterwards, because the model gives you a sound designed for that register rather than a filtered one.",
      },
      {
        heading: "Generate long and loop honestly",
        body: "These render up to two minutes at a time, which is long enough that a scene often needs no loop at all — and an unlooped bed never has a loop point to give itself away. When you do need to loop, ask for a seamless loop and keep the request steady, because a drone that swells inside its own clip cannot join to itself. Then cut at a zero crossing in the quietest moment, which for a drone is a matter of seconds rather than a hunt.",
      },
    ],
    faqs: faqs({
      question: "How long can a single drone render be?",
      answer:
        "Up to two minutes on the Stable Audio SFX model, which is the per-generation ceiling Soundbox reports for it. The clips on this page are twelve seconds because that is a practical size for a page like this, not because it is a limit — for real work, render the full length of the scene and skip looping entirely. Longer renders take proportionally longer, so a two-minute bed is a coffee-break job rather than a ten-second one.",
    }),
    related: ["ambience", "horror", "cinematic", "sci-fi", "heartbeat", "braam"],
  },
};

const GUNSHOT: SfxCategory = {
  slug: "gunshot",
  name: "Gunshots",
  targetQuery: "gunshot sound effect",
  intent:
    "Game developers and film editors who need firearms specifically — the report, the mechanism, " +
    "the distance and the environment — rather than the generic weapon category.",
  metaTitle: "Gunshot Sound Effects — Pistol, Rifle, Shotgun | Soundbox",
  metaDescription:
    "Generate gunshots, reloads, ricochets and distant gunfire locally. Prompts that control calibre, mechanism, distance and the environment's tail.",
  h1: "Gunshot sound effects you generate yourself",
  intro:
    "A gunshot is two sounds bolted together: a very short, very loud report, and the environment's " +
    "answer to it. The report tells you what the weapon is; the answer tells you where you are " +
    "standing. Almost every unconvincing gunshot in an edit has a plausible report and no answer at " +
    "all, which is why they sound like samples. These prompts always name the space, because the " +
    "space is at least half of what an audience is actually hearing.",
  content: {
    samples: [
      s("gunshot-pistol-indoor", "Pistol indoors", "9mm pistol fired once inside a concrete stairwell, sharp cracking report with hard slapping echoes, close", 4),
      s("gunshot-pistol-outdoor", "Pistol outdoors", "pistol fired once in an open field, sharp report with a fast dry crack and almost no reflection, distant treeline", 4),
      s("gunshot-rifle-distant-valley", "Distant rifle", "hunting rifle fired far away across a valley, delayed crack with a long rolling echo between hillsides", 6),
      s("gunshot-shotgun-blast-pump", "Shotgun and pump", "pump-action shotgun fired then racked, heavy blast with a shell ejecting onto concrete, alley reverb", 4),
      s("gunshot-automatic-burst-street", "Automatic burst", "automatic rifle firing a short burst in a city street, rapid overlapping reports with building echoes", 5),
      s("gunshot-suppressed-shot", "Suppressed shot", "suppressed pistol shot, muted mechanical thump with the slide cycling clearly audible, close and dry", 2),
      s("gunshot-revolver-single", "Revolver", "revolver fired once, deep booming report with a cylinder ring, open outdoor space with a rolling tail", 4),
      s("gunshot-reload-magazine", "Magazine reload", "pistol magazine released and dropped, a fresh one inserted and the slide released, very close mic, dry", 4),
      s("gunshot-ricochet-metal", "Ricochet", "bullet ricocheting off metal, sharp impact with a whining pitched departure, industrial space, echoing", 3),
      s("gunshot-distant-firefight", "Distant firefight", "distant firefight heard from several streets away, scattered muffled reports with long urban echoes", 10),
    ],
    recipes: [
      {
        label: "Indoors",
        prompt: "9mm pistol fired once inside a concrete stairwell, sharp cracking report with hard slapping echoes, close",
        why: "Hard enclosed spaces produce discrete slap-back echoes rather than smooth reverb, and naming the material gets you that specific reflection.",
      },
      {
        label: "Outdoors",
        prompt: "pistol fired once in an open field, sharp report with a fast dry crack and almost no reflection, distant treeline",
        why: "\"Almost no reflection\" is what makes an exterior shot read as exterior — and the treeline gives it one distant return so it is not lifeless.",
      },
      {
        label: "Distance",
        prompt: "hunting rifle fired far away across a valley, delayed crack with a long rolling echo between hillsides",
        why: "At distance the echo becomes the main event and the report becomes small — prompting the echo is prompting the distance.",
      },
      {
        label: "Mechanism, not report",
        prompt: "pistol magazine released and dropped, a fresh one inserted and the slide released, very close mic, dry",
        why: "Weapon handling is used far more often than firing and is almost never in stock packs at usable length.",
      },
    ],
    craft: [
      {
        heading: "The environment is the sound",
        body: "A gunshot's report lasts a few milliseconds; everything else an audience hears is the room, the street or the valley responding. That is why the same weapon is unrecognisable indoors and outdoors, and why a dry stock shot never sits in a scene. Make the space a required part of every gunfire prompt, and change the space rather than the weapon when a shot does not fit the picture. It is nearly always the space.",
      },
      {
        heading: "Mechanism sounds do more storytelling than shots",
        body: "Slides racking, magazines dropping, hammers cocking, shells hitting concrete — these are quiet, specific, instantly readable, and they carry tension in a way that firing does not, because they signal intent rather than consequence. They are also short and cheap to generate. If you are building a weapon set, make the handling sounds first; a scene can be built entirely from them and often is.",
      },
      {
        heading: "Distance delays the crack, not just quietens it",
        body: "Sound travels roughly a third of a kilometre per second, so a shot from far away arrives noticeably after the muzzle flash and arrives smeared — the sharp transient has been absorbed and what is left is the rolling echo. Prompting \"delayed crack\" and \"long rolling echo\" gives you that, and it reads as distance immediately. A quiet close gunshot, by contrast, reads as a quiet gunshot, which is not the same thing at all.",
      },
    ],
    faqs: faqs({
      question: "Will these pass for real firearm recordings?",
      answer:
        "For most game and video work, yes — particularly the handling sounds and anything at distance, where the environment dominates. Close, dry, high-calibre reports are the hardest case for any generative model, because the transient is extremely short and extremely loud and there is nowhere for an approximation to hide. If you need that specific sound at feature-film scrutiny, layer a generated tail under a recorded crack; for everything else, the generated version placed in a well-described space holds up.",
    }),
    related: ["weapon", "explosion", "impact", "alarm", "crowd", "cinematic"],
  },
};

const ALARM: SfxCategory = {
  slug: "alarm",
  name: "Alarms & sirens",
  targetQuery: "alarm sound effect",
  intent:
    "Editors and game developers needing warnings — sirens, klaxons, fire alarms, reversing beepers " +
    "— which have to be recognisable in half a second and loopable for as long as the scene lasts.",
  metaTitle: "Alarm Sound Effects — Siren, Klaxon, Warning | Soundbox",
  metaDescription:
    "Generate alarms, sirens, klaxons and warning beeps locally. Loopable emergency beds and one-shot alerts for games, film and interfaces.",
  h1: "Alarm and siren sound effects you generate yourself",
  intro:
    "Alarms are designed to be unmistakable, which makes them the most functionally constrained " +
    "sounds in any library: they have to cut through noise, repeat indefinitely, and be identifiable " +
    "before anyone thinks about them. That constraint is useful when prompting, because it means the " +
    "features that matter are few and explicit — the pattern, the pitch, and whether the listener is " +
    "inside the building or outside it.",
  content: {
    samples: [
      s("alarm-fire-building", "Fire alarm", "building fire alarm sounding, harsh repeating electronic tone echoing down a corridor, seamless loop", 10),
      s("alarm-police-siren-pass", "Police siren", "police siren wailing and passing the listener at speed, doppler shift through the pass, city street", 8),
      s("alarm-air-raid-klaxon", "Air raid siren", "air raid siren winding up to a long mournful wail and falling away, distant across a city, outdoor", 12),
      s("alarm-submarine-dive", "Dive klaxon", "submarine dive klaxon, harsh two-tone mechanical horn repeating, enclosed metal interior, seamless loop", 8),
      s("alarm-car-alarm-street", "Car alarm", "car alarm going off in a quiet street at night, repeating cycle of chirps and horn blasts, echoing", 10),
      s("alarm-reverse-beeper", "Reversing beeper", "heavy vehicle reversing beeper, single high electronic beep repeating steadily, outdoor site, seamless loop", 8),
      s("alarm-smoke-detector-chirp", "Smoke detector", "smoke detector low battery chirp, single piercing beep every thirty seconds, quiet house at night", 6),
      s("alarm-sci-fi-red-alert", "Red alert", "spacecraft red alert klaxon, urgent synthetic two-tone alarm over a low warning drone, metal interior, seamless loop", 10),
      s("alarm-ambulance-siren-distant", "Ambulance distant", "ambulance siren wailing several streets away, muffled and echoing between buildings, night city", 10),
      s("alarm-industrial-warning-horn", "Warning horn", "industrial warning horn blasting three times before machinery starts, huge factory reverb", 8),
    ],
    recipes: [
      {
        label: "Interior alarm",
        prompt: "building fire alarm sounding, harsh repeating electronic tone echoing down a corridor, seamless loop",
        why: "The corridor is what makes it read as a building rather than a sound effect — alarms are always heard through a lot of hard architecture.",
      },
      {
        label: "Moving siren",
        prompt: "police siren wailing and passing the listener at speed, doppler shift through the pass, city street",
        why: "A siren that does not move reads as parked; asking for the pass and the doppler in one render gives you the whole event.",
      },
      {
        label: "Distance and muffling",
        prompt: "ambulance siren wailing several streets away, muffled and echoing between buildings, night city",
        why: "\"Between buildings\" produces the specific slapping urban reflections that place a siren in a city rather than in open air.",
      },
      {
        label: "Mechanical, not electronic",
        prompt: "air raid siren winding up to a long mournful wail and falling away, distant across a city, outdoor",
        why: "\"Winding up\" names the rotating mechanical siren's spin-up, which is exactly what distinguishes it from an electronic tone.",
      },
    ],
    craft: [
      {
        heading: "Pattern is identity",
        body: "What makes an alarm recognisable is its rhythm, not its timbre: the two-tone European siren, the American wail, the single repeating reversing beep, the three-blast industrial warning. Describe the pattern and the model will get the character right even if the tone is approximate. Describe only the tone and you tend to get something that sounds like an alarm in general and like nothing in particular, which is the one outcome an alarm cannot afford.",
      },
      {
        heading: "Inside or outside changes everything",
        body: "An alarm heard inside the building it is protecting is loud, hard and close, with corridor reflections; heard from outside it is muffled, distant and mixed with the street. These are different assets and no filtering turns one into the other. Because the alarm itself is so repetitive, the space is what carries most of the information about where the scene is — which makes it the single most valuable clause in the prompt.",
      },
      {
        heading: "Loop the alarm, generate the arrival separately",
        body: "An alarm scene usually has three parts: the moment it starts, the sustained state, and the moment it stops or is silenced. The sustained state should be a steady seamless loop you can run under the whole scene; the start and the stop are one-shots. Trying to get all three into a single clip gives you something that cannot loop and cannot be extended, which is exactly the limitation that makes stock alarm clips awkward.",
      },
    ],
    faqs: faqs({
      question: "Are these safe to use for a real alert in an app?",
      answer:
        "For a product notification, yes — that is what the notification collection is for. For anything safety-critical, no: real emergency and medical alarms are governed by standards that specify exact frequencies, patterns and levels precisely so they are not confusable, and a generated approximation should never stand in for a certified one. Use these for film, games and interfaces, and use the standard for anything where somebody has to act on the sound.",
    }),
    related: ["notification", "clock", "sci-fi", "machinery", "crowd", "gunshot"],
  },
};

const ELECTRICITY: SfxCategory = {
  slug: "electricity",
  name: "Electricity",
  targetQuery: "electricity sound effect",
  intent:
    "Sound designers who need arcs, sparks, buzzes and surges — for sci-fi weapons, faulty " +
    "lighting, storms and anything that should feel dangerous to touch.",
  metaTitle: "Electricity Sound Effects — Sparks, Arcs, Buzz | Soundbox",
  metaDescription:
    "Generate electrical arcs, sparks, mains buzz, surges and tesla discharges locally. Prompts that separate clean hum from violent discharge.",
  h1: "Electricity sound effects you generate yourself",
  intro:
    "Electrical sound splits into two families that get confused constantly: the steady kind, which " +
    "is hum and buzz and comes from current doing what it is supposed to, and the violent kind, " +
    "which is arcing and sparking and comes from current going where it should not. Both are useful " +
    "and they need completely different prompts. Almost every disappointing electrical generation is " +
    "one family described in the other's words.",
  content: {
    samples: [
      s("electricity-arc-discharge", "Arc discharge", "high voltage electrical arc discharging, violent crackling snap with an ozone hiss, close and dry", 3),
      s("electricity-tesla-coil", "Tesla coil", "tesla coil firing repeatedly, rhythmic buzzing electrical discharges with a bright cracking edge, large room", 6),
      s("electricity-mains-hum-fault", "Faulty mains", "faulty mains electrical hum, low buzzing drone with intermittent crackling and flickering, close, seamless loop", 8),
      s("electricity-fluorescent-flicker", "Fluorescent flicker", "fluorescent tube failing, buzzing starter clicking repeatedly with the tube stuttering on and off, empty room", 6),
      s("electricity-power-surge-trip", "Surge and trip", "electrical power surge building then a breaker tripping with a hard clunk and everything falling silent", 4),
      s("electricity-sparks-shower", "Shower of sparks", "shower of electrical sparks from a severed cable, rapid crackling with sputtering bursts, industrial space", 4),
      s("electricity-taser-crackle", "Taser", "taser arcing between contacts, rapid harsh electrical crackle with a rising whine, close mic, dry", 3),
      s("electricity-substation-hum", "Substation", "electrical substation humming under load, deep mains drone with a metallic resonance, outdoor, seamless loop", 10),
      s("electricity-static-shock-zap", "Static shock", "sharp static electricity shock, single brief snapping zap, very close mic, completely dry", 1),
      s("electricity-lightning-arc-strike", "Lightning arc", "lightning arcing to ground, tearing electrical rip into a deep concussive crack, open outdoor space", 5),
    ],
    recipes: [
      {
        label: "Violent discharge",
        prompt: "high voltage electrical arc discharging, violent crackling snap with an ozone hiss, close and dry",
        why: "\"Ozone hiss\" is a genuinely useful cue — high voltage arcs produce a distinctive hiss alongside the crack, and naming it separates an arc from a spark.",
      },
      {
        label: "Steady fault",
        prompt: "faulty mains electrical hum, low buzzing drone with intermittent crackling and flickering, close, seamless loop",
        why: "\"Intermittent\" is what makes it faulty rather than merely present — the irregularity is the entire story.",
      },
      {
        label: "Rhythmic discharge",
        prompt: "tesla coil firing repeatedly, rhythmic buzzing electrical discharges with a bright cracking edge, large room",
        why: "A tesla coil is discharge at an audio-rate rhythm, and asking for the rhythm is what stops it collapsing into undifferentiated noise.",
      },
      {
        label: "Tiny and dry",
        prompt: "sharp static electricity shock, single brief snapping zap, very close mic, completely dry",
        why: "Static shocks are one of the shortest sounds in any library; without \"very close\" and \"completely dry\" the room swallows them entirely.",
      },
    ],
    craft: [
      {
        heading: "Hum is a pitch, arcing is noise",
        body: "Mains hum is tonal — it sits at the supply frequency and its harmonics, which is why it can be notched out of a recording. Arcing is broadband and chaotic, closer to a crackling fire than to a tone. Because they are spectrally opposite, mixing their vocabulary produces mush: a prompt asking for a buzzing arc gets you something halfway between and convincing as neither. Decide which family you are in first, then write the prompt entirely inside it.",
      },
      {
        heading: "Electrical faults are rhythmic, and the rhythm is the character",
        body: "A working circuit is boring. What makes electrical sound dramatic is intermittency — the flicker, the stutter, the sputter, the moment it cuts out and comes back. Prompt the irregularity directly with words like \"intermittent\", \"stuttering\", \"flickering\" and \"sputtering\", and give the render enough time for several cycles. Four seconds of a fault that repeats twice reads as a fault; one second reads as a click.",
      },
      {
        heading: "Electricity is the raw material for sci-fi weapons",
        body: "Most energy-weapon sounds are electrical discharge processed and pitched, which means generating here and treating it as a source is often better than prompting the laser collection directly. An arc gives you the aggressive broadband texture; a tesla coil gives you rhythm; a rising hum gives you the charge. Layer them and you get something that belongs to your project rather than something recognisable from a pack.",
      },
    ],
    faqs: faqs({
      question: "How do I get a convincing energy weapon out of this?",
      answer:
        "Build it in three layers, each its own render: a rising hum or whine for the charge, an arc or discharge for the shot itself, and a decaying crackle for the tail. Generating them separately lets you time the charge to whatever the animation does, which is the part that always breaks when you use a single pre-made clip. The laser collection has the finished versions; this one has the ingredients.",
    }),
    related: ["sci-fi", "laser", "glitch", "machinery", "thunder", "horror"],
  },
};

/* ============================================================ Creatures */

const CARTOON: SfxCategory = {
  slug: "cartoon",
  name: "Cartoon & comedy",
  targetQuery: "cartoon sound effect",
  intent:
    "Animators, meme editors and casual game developers after the comedy vocabulary — boings, pops, " +
    "slide whistles, splats — a top-tier tag on every free library and almost absent from serious ones.",
  metaTitle: "Cartoon Sound Effects — Boing, Pop, Splat | Soundbox",
  metaDescription:
    "Generate cartoon boings, pops, slide whistles, splats and comedy stings locally. Prompts for classic animation and modern meme editing.",
  h1: "Cartoon sound effects you generate yourself",
  intro:
    "Cartoon sound is a formal language with a fixed vocabulary — the boing, the pop, the slide " +
    "whistle, the splat, the sad trombone — and its whole job is to be instantly legible as a joke. " +
    "That makes it the opposite of most of this library: realism is actively wrong, and exaggeration " +
    "is the correct answer. It is also consistently among the most searched tags on the free " +
    "libraries, which is a good indication of how much of the internet is trying to be funny.",
  content: {
    samples: [
      s("cartoon-boing-spring", "Boing", "cartoon boing, comedic metal spring twanging with a wobbling pitch bend, bright and dry", 1.5),
      s("cartoon-pop-bubble", "Pop", "cartoon pop, single bright mouth-like bubble pop with a hollow tone, very close mic, dry", 1),
      s("cartoon-slide-whistle-up", "Slide whistle up", "slide whistle sweeping quickly upward, bright comedic glissando, dry and close", 1.5),
      s("cartoon-slide-whistle-down", "Slide whistle down", "slide whistle sweeping downward like a falling body, comedic glissando ending in a splat, dry", 2),
      s("cartoon-splat-goo", "Splat", "cartoon splat, wet exaggerated goo impact with a comedic squelch, close and dry", 1.5),
      s("cartoon-running-feet-loop", "Running feet", "cartoon running feet, rapid comedic scampering with a rhythmic tumbling patter, dry, seamless loop", 3),
      s("cartoon-anvil-drop-clang", "Anvil drop", "cartoon anvil falling with a descending whistle and landing with a huge comedic clang and a wobble", 3),
      s("cartoon-sad-trombone", "Sad trombone", "comedic sad trombone, four descending muted brass notes with a wah wah bend, dry", 3),
      s("cartoon-record-scratch-stop", "Record scratch", "vinyl record scratching to an abrupt stop, classic comedic freeze-frame effect, close and dry", 2),
      s("cartoon-eat-crunch-gulp", "Eat and gulp", "cartoon eating, exaggerated rapid crunching followed by a huge comedic gulp, close mic, dry", 3),
    ],
    recipes: [
      {
        label: "The boing",
        prompt: "cartoon boing, comedic metal spring twanging with a wobbling pitch bend, bright and dry",
        why: "\"Pitch bend\" and \"wobbling\" are what make it comic — a real spring twang without the exaggerated bend just sounds like hardware.",
      },
      {
        label: "The pop",
        prompt: "cartoon pop, single bright mouth-like bubble pop with a hollow tone, very close mic, dry",
        why: "\"Mouth-like\" is the key: the classic cartoon pop was performed by a person, and asking for that origin gets you the hollow character.",
      },
      {
        label: "Falling",
        prompt: "slide whistle sweeping downward like a falling body, comedic glissando ending in a splat, dry",
        why: "Naming what the sweep represents gives you the timing — a fall accelerates, and the model shapes the glissando accordingly.",
      },
      {
        label: "The comic stop",
        prompt: "vinyl record scratching to an abrupt stop, classic comedic freeze-frame effect, close and dry",
        why: "Calling it by its use rather than its mechanism works here because the effect is so codified that the model has heard it labelled that way.",
      },
    ],
    craft: [
      {
        heading: "Exaggeration is the brief, not a failure mode",
        body: "Everywhere else in this library, a generation that sounds too big or too obvious is wrong. Here it is the target. Cartoon sound works by being more extreme than physics allows — springs that bend further than metal can, splats wetter than any substance, falls that whistle. Use the words that would be warnings elsewhere: \"exaggerated\", \"comedic\", \"cartoon\", \"huge\". They steer the model toward the animation corpus rather than the foley corpus, and that is exactly where you want it.",
      },
      {
        heading: "Keep it dry and keep it short",
        body: "Comic timing depends on a sound stopping when the joke does. Room tone smears the ending and softens the punchline, which is why virtually every prompt in this collection ends with \"dry\" and asks for one to three seconds. If a cartoon sound is not landing, it is more often too long than wrong — trim it before you regenerate it, and if you regenerate, shorten the render.",
      },
      {
        heading: "Most of the classics were performed by people",
        body: "The pop, the boing, the gulp, the crunch and the whistle were originally mouths, springs and slide whistles played by hand in a studio, not synthesised. Prompts that gesture at that human origin — \"mouth-like\", \"performed\", \"comedic\" — reliably land closer to the classic sound than prompts describing an abstract effect, because the recordings the model learned from are those performances.",
      },
    ],
    faqs: faqs({
      question: "Can I get the specific classic sounds from old animation?",
      answer:
        "You can get very close to the archetypes — the boing, the pop, the slide whistle, the sad trombone are all well represented and come back recognisable. What you cannot get is a specific studio's specific recording, and you should not want to: those are copyrighted recordings with owners. What generating gives you is the same comic vocabulary in a version that is yours to ship, which is the entire practical difference.",
    }),
    related: ["8bit", "impact", "whoosh", "transition", "notification", "animal"],
  },
};

const ROBOT: SfxCategory = {
  slug: "robot",
  name: "Robots & mechs",
  targetQuery: "robot sound effect",
  intent:
    "Game developers and sci-fi editors building machines with bodies — servos, actuators, mech " +
    "footsteps, transformations and synthetic voices without words.",
  metaTitle: "Robot Sound Effects — Servos, Mechs, Machines | Soundbox",
  metaDescription:
    "Generate robot servos, mech movement, transformations and synthetic vocalisations locally. Prompts for small drones through to walking machines.",
  h1: "Robot and mech sound effects you generate yourself",
  intro:
    "A robot sounds like its size and its era. Small modern machines are quiet, precise and " +
    "electric; large ones are hydraulic, heavy and slow; retro ones clank and whir with visible " +
    "mechanism. What makes any of them feel alive is that the movement has a shape — a start, a " +
    "travel and a stop — because a servo that just hums is a fan, and a servo that arrives somewhere " +
    "is a machine deciding to move.",
  content: {
    samples: [
      s("robot-servo-arm-move", "Servo movement", "small robotic servo motor moving an arm and stopping precisely, clean electric whir with a settling click, close mic, dry", 2),
      s("robot-mech-heavy-step", "Mech footstep", "giant mech taking a single heavy step, hydraulic servo whine with an enormous metal foot slamming onto concrete", 3),
      s("robot-transform-sequence", "Transformation", "robot transforming, cascade of servos, hydraulic hisses and metal panels locking into place, close and mechanical", 5),
      s("robot-vocal-beeps", "Robot chatter", "small robot vocalising in expressive electronic beeps and warbles, curious and questioning, dry", 3),
      s("robot-power-up-boot", "Boot sequence", "robot powering up, rising electrical whine with systems clicking online and servos calibrating, close mic", 5),
      s("robot-power-down-collapse", "Power down", "robot powering down and collapsing, servos losing tension with a descending whine and metal settling", 4),
      s("robot-hydraulic-piston", "Hydraulic piston", "heavy hydraulic piston extending under load then venting pressure, industrial and close, dry", 3),
      s("robot-retro-clank-walk", "Retro robot walk", "retro tin robot walking, clanking metal feet with a whirring clockwork motor, close mic, dry", 5),
      s("robot-scan-targeting", "Targeting scan", "robot targeting scanner sweeping, thin oscillating electronic tone with tiny servo adjustments, dry", 4),
      s("robot-damage-malfunction", "Malfunction", "robot malfunctioning, servos grinding and stalling with electrical sparks and distorted vocal glitches", 4),
    ],
    recipes: [
      {
        label: "Small and precise",
        prompt: "small robotic servo motor moving an arm and stopping precisely, clean electric whir with a settling click, close mic, dry",
        why: "\"Stopping precisely\" with \"a settling click\" gives the movement an endpoint, which is what makes a servo read as controlled rather than idling.",
      },
      {
        label: "Large and hydraulic",
        prompt: "giant mech taking a single heavy step, hydraulic servo whine with an enormous metal foot slamming onto concrete",
        why: "Scale comes from the two layers together — the whine tells you it is powered, the slam tells you how much of it there is.",
      },
      {
        label: "Voice without words",
        prompt: "small robot vocalising in expressive electronic beeps and warbles, curious and questioning, dry",
        why: "Emotional direction works here where it fails elsewhere, because expressive beeping is a performed convention the model has heard plenty of.",
      },
      {
        label: "Retro mechanism",
        prompt: "retro tin robot walking, clanking metal feet with a whirring clockwork motor, close mic, dry",
        why: "\"Clockwork\" and \"tin\" place it decades before hydraulics, which is a period cue as strong as any visual one.",
      },
    ],
    craft: [
      {
        heading: "Movement needs a start, a travel and a stop",
        body: "The single most common robot-sound mistake is rendering only the travel — a whir with no beginning and no end. Real actuators engage, move, and arrive, and the arrival is a small mechanical event that tells the audience the motion is finished and deliberate. Ask for it explicitly: \"stopping precisely\", \"locking into place\", \"with a settling click\". It costs four words and it is the difference between a machine and a fan.",
      },
      {
        heading: "Scale is hydraulic versus electric",
        body: "Small robots are electric: high-pitched, quiet, fast, clean. Large ones are hydraulic: low, slow, loud, with pressure release as part of every movement. This maps so directly onto perceived size that you can change a robot's scale entirely by swapping those words while leaving the rest of the prompt alone — a useful trick when a design brief changes and you need the same motion at twice the weight.",
      },
      {
        heading: "Layer the body onto the motion",
        body: "A mech step is not one sound: it is the servo that lifted the leg, the mass that landed, and the frame that rattled afterwards. Generating those separately and stacking them gives a much heavier result than any single render, and it means you can retime the impact to the animation frame while leaving the servo where it is. The same principle applies to transformations, which are really a sequence of small events you can control individually.",
      },
    ],
    faqs: faqs({
      question: "Can I get a talking robot voice?",
      answer:
        "For expressive non-verbal chatter — beeps, warbles, curious rising tones — yes, and this collection covers it. For a robot speaking actual words, use Soundbox's speech path instead: the text-to-speech models render real words, and processing that output with the glitch and electricity collections gets you the synthetic character. Trying to get words out of a sound-effect model produces something that sounds like speech without being intelligible.",
    }),
    related: ["sci-fi", "machinery", "electricity", "glitch", "laser", "creature"],
  },
};

const CREATURE: SfxCategory = {
  slug: "creature",
  name: "Creatures & monsters",
  targetQuery: "monster sound effect",
  intent:
    "Game developers and horror editors who need creatures — growls, roars, shrieks, chittering — " +
    "that are not simply pitched-down animals, and that can be varied per enemy type.",
  metaTitle: "Monster Sound Effects — Growls, Roars, Creatures | Soundbox",
  metaDescription:
    "Generate monster growls, roars, shrieks and creature vocalisations locally. Prompts for size, anatomy and wetness rather than vague menace.",
  h1: "Creature and monster sound effects you generate yourself",
  intro:
    "Monster sound is anatomy fiction. A convincing creature vocalisation implies a body: lungs of a " +
    "certain size, a throat of a certain wetness, teeth or a beak or neither. Prompting the anatomy " +
    "produces something specific and repeatable; prompting menace produces something generic, " +
    "because menace is the audience's conclusion rather than an acoustic property. This is the " +
    "collection where describing the mechanism instead of the mood pays off most.",
  content: {
    samples: [
      s("creature-large-roar", "Large roar", "enormous creature roaring, deep chest-driven bellow with a rasping throat and a long tail, open outdoor space", 5),
      s("creature-low-growl-threat", "Low growl", "large predator growling a low continuous warning, wet throat rattle with breath behind it, very close mic", 5),
      s("creature-shriek-high", "Shriek", "small creature shrieking in alarm, piercing high cry breaking into a rasp, echoing cave", 3),
      s("creature-insect-chitter", "Chittering", "insectile creature chittering rapidly, dry clicking mandibles with a thin buzzing vocal underneath, close mic", 4),
      s("creature-wet-breathing", "Wet breathing", "large creature breathing slowly and wetly, thick mucous rattle on each inhale, very close and intimate", 8),
      s("creature-swarm-approach", "Swarm", "swarm of small creatures approaching, dense overlapping chittering and scrabbling claws on stone, tunnel reverb", 8),
      s("creature-death-gurgle", "Death rattle", "creature dying, wet gurgling exhale collapsing into silence, close mic, dark space", 4),
      s("creature-tentacle-slither", "Slither", "huge wet tentacle dragging across stone, thick suction with slapping impacts, cavernous and damp", 5),
      s("creature-bone-crunch-feed", "Feeding", "creature feeding, wet tearing of flesh with bone cracking and heavy breathing between, close and visceral", 6),
      s("creature-distant-call-echo", "Distant call", "unknown creature calling from far away, long mournful cry echoing across a vast valley at night", 8),
    ],
    recipes: [
      {
        label: "Size through chest",
        prompt: "enormous creature roaring, deep chest-driven bellow with a rasping throat and a long tail, open outdoor space",
        why: "\"Chest-driven\" is what implies lung volume, which is the only honest cue for size — pitching a small roar down just sounds pitched down.",
      },
      {
        label: "Threat through restraint",
        prompt: "large predator growling a low continuous warning, wet throat rattle with breath behind it, very close mic",
        why: "A sustained quiet growl close to the microphone is far more threatening than a roar, and \"breath behind it\" is what makes it feel alive.",
      },
      {
        label: "Non-mammalian",
        prompt: "insectile creature chittering rapidly, dry clicking mandibles with a thin buzzing vocal underneath, close mic",
        why: "\"Dry\" and \"mandibles\" push away from the wet-throated mammal default the model reaches for on the word creature.",
      },
      {
        label: "Wetness as character",
        prompt: "large creature breathing slowly and wetly, thick mucous rattle on each inhale, very close and intimate",
        why: "Wetness is the most reliable single dial for how disgusting a creature is, and it is independent of size and pitch.",
      },
    ],
    craft: [
      {
        heading: "Describe the body, not the feeling",
        body: "\"Scary monster\" is an instruction the model cannot act on, because there is no spectral property called scary. \"Wet throat rattle\", \"chest-driven bellow\", \"clicking mandibles\", \"mucous inhale\" are all things a body does, and they produce specific and repeatable results. This is the single highest-leverage habit in creature work: every time you are about to write an emotion, write the anatomy that would cause it instead.",
      },
      {
        heading: "Wet and dry is the anatomy axis",
        body: "Wet creatures have throats, mucus and soft tissue — they gurgle, rattle and slather, and they read as flesh. Dry creatures click, rasp and rustle, and they read as chitin, bone or something desiccated. That one axis covers most of the design space between a dragon and a swarm, and it is independent of size and pitch, so you can move along it without losing the other choices you have already made.",
      },
      {
        heading: "Distance makes a creature bigger",
        body: "A roar close to the microphone reads as a large animal; the same roar heard across a valley with a long echo reads as something enormous and, crucially, as something the characters cannot see. Horror gets far more out of the second than the first. Generate the distant version deliberately — \"calling from far away\", \"echoing across a vast valley\" — rather than adding reverb, because real distance removes the high end and stretches the timing in a way a plate cannot fake.",
      },
    ],
    faqs: faqs({
      question: "How do I get variations for the same enemy type?",
      answer:
        "Keep the anatomical description fixed and vary only the action and the take. Four renders of \"large predator, wet throat rattle\" doing four different things — warning, attacking, hurt, dying — read as one creature with a repertoire, which is what a game needs. Varying the anatomy instead gives you four different monsters, which is what makes enemy audio feel inconsistent. The seed parameter also gives you different takes of an identical prompt, which is the cheapest variation there is.",
    }),
    related: ["horror", "animal", "scream", "sci-fi", "robot", "magic"],
  },
};

export const DESIGN_AND_CREATURE: SfxCategory[] = [
  APPLAUSE,
  SCREAM,
  HEARTBEAT,
  RISER,
  BRAAM,
  DRONE,
  GUNSHOT,
  ALARM,
  ELECTRICITY,
  CARTOON,
  ROBOT,
  CREATURE,
];
