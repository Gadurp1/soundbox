/**
 * Collections added after auditing what the big libraries actually shelve.
 *
 * The original taxonomy in `categories.ts` was built around game and film
 * search terms, which covered the loudest half of the demand and missed the
 * half that professional libraries are mostly made of. Epidemic Sound's tree
 * devotes a whole branch to materials — glass, metal, wood, paper, cloth — and
 * ElevenLabs' directory lists them individually too, because that is how a
 * sound editor thinks: not "impact" but "which material hit which material".
 * The same audit turned up vehicles, human effort, and the trailer-design
 * family (riser, braam, drone) that Soundsnap puts on its own front page.
 *
 * Every category here is a real page with its own craft notes, not a slug with
 * a template behind it. The rule from `categories.ts` still holds: if nobody
 * wrote it, it does not ship.
 *
 * Structurally these are identical to the originals — same `SfxCategory` — and
 * they are concatenated onto the same exported list. They live apart only so
 * the diff that introduced two dozen collections is reviewable.
 */

import type { SfxCategory, SfxFaq, SfxSample } from "./types";

const MODEL = "audiocpp-stable-audio-3-sfx";

function s(slug: string, title: string, prompt: string, durationS: number): SfxSample {
  return { slug, title, prompt, source: "model", model: MODEL, durationS };
}

/**
 * The four questions every one of these pages gets asked.
 *
 * These answers are genuinely the same whatever the category is — licensing,
 * offline behaviour, hardware and agent access are properties of Soundbox, not
 * of glass or of trains. Writing four slightly different paraphrases per page
 * would not make them more useful, it would just make the claims harder to keep
 * true when the facts change. The one category-specific question goes first,
 * where a reader will actually see it.
 */
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

/* ==================================================== Foley & materials */

const GLASS: SfxCategory = {
  slug: "glass",
  name: "Glass",
  targetQuery: "glass sound effect",
  intent:
    "Editors and game developers who need a specific glass event — a bottle smashing, a window " +
    "failing, a wine glass ringing — and keep finding library clips that are the wrong size of " +
    "glass in the wrong room.",
  metaTitle: "Glass Sound Effects — Break, Clink, Shatter | Soundbox",
  metaDescription:
    "Generate glass breaking, shattering, clinking and cracking locally. Real prompts for every thickness of glass and every room it breaks in.",
  h1: "Glass sound effects you generate yourself",
  intro:
    "Glass is the material sound designers reach for most and get wrong most often, because " +
    "\"glass breaking\" is at least six different sounds: a thin wine glass ringing itself apart, a " +
    "bottle bursting on concrete, a car window collapsing into pebbles, a pane failing all at once. " +
    "The variable that matters is thickness, and the second is what it lands on. Soundbox runs the " +
    "models on your own GPU, so you can render all six, compare them against the picture, and " +
    "regenerate the one that nearly worked.",
  content: {
    samples: [
      s("glass-bottle-smash-concrete", "Bottle on concrete", "glass bottle smashing on concrete, sharp initial burst with shards scattering and skittering away, outdoor alley reverb", 3),
      s("glass-window-pane-break", "Window pane", "large window pane breaking, cracking then collapsing inward with long shards falling and shattering on a wooden floor", 4),
      s("glass-wine-glass-ring", "Wine glass ring", "wet finger circling the rim of a wine glass, pure sustained crystalline tone slowly building, quiet room", 6),
      s("glass-cheers-clink", "Cheers clink", "two wine glasses clinking together in a toast, bright ringing chime with a short decay, close mic", 2),
      s("glass-car-window-shatter", "Car window", "car side window shattering into thousands of small tempered pebbles, dense granular collapse onto a road", 3),
      s("glass-crack-slow-spread", "Slow crack", "glass cracking slowly under pressure, fine splintering fractures spreading with tiny ticks, very close mic, quiet", 5),
      s("glass-jar-drop-floor", "Jar drop", "glass jar dropped onto a tiled kitchen floor, hard burst with a wet contents splash and shards spinning", 3),
      s("glass-lightbulb-pop", "Lightbulb pop", "lightbulb filament popping and the thin glass envelope bursting, delicate high shatter, close and dry", 1.5),
      s("glass-shard-sweep-up", "Sweeping shards", "broom sweeping broken glass across a tile floor, continuous granular scraping with shards tumbling", 6),
      s("glass-greenhouse-collapse", "Greenhouse collapse", "greenhouse roof collapsing, sequence of large panes failing one after another with a long debris tail", 6),
    ],
    recipes: [
      {
        label: "Thin glass, hard floor",
        prompt: "glass bottle smashing on concrete, sharp initial burst with shards scattering and skittering away, outdoor alley reverb",
        why: "The two words doing the work are the material it hits and the aftermath — \"skittering away\" is what makes it a break rather than a single hit.",
      },
      {
        label: "Tempered glass",
        prompt: "car side window shattering into thousands of small tempered pebbles, dense granular collapse onto a road",
        why: "Tempered glass does not produce shards, it produces gravel. Saying \"pebbles\" and \"granular\" is the whole difference between a car window and a house window.",
      },
      {
        label: "Ringing, not breaking",
        prompt: "wet finger circling the rim of a wine glass, pure sustained crystalline tone slowly building, quiet room",
        why: "Naming the physical action instead of the result keeps the model from breaking the glass, which is where it will go by default the moment you write the word.",
      },
      {
        label: "Pressure fracture",
        prompt: "glass cracking slowly under pressure, fine splintering fractures spreading with tiny ticks, very close mic, quiet",
        why: "\"Very close mic\" and \"quiet\" are what let the small details survive — a fracture is a tiny sound and any room tone buries it.",
      },
    ],
    craft: [
      {
        heading: "Thickness is the first word, not an afterthought",
        body: "Every glass sound is a function of how thick the glass is. Thin glass — bulbs, wine glasses, picture frames — breaks bright, fast and high, with almost no low end. Thick glass — shopfronts, greenhouse panes, bottles — carries real body and a lower initial crack before the debris starts. If a generation comes back sounding like the wrong object, the fix is almost never more adjectives about breaking; it is naming the object precisely enough that its thickness is implied.",
      },
      {
        heading: "Say what it lands on",
        body: "Roughly half of a glass break is not the glass at all, it is the surface receiving the debris. Shards on concrete skitter and ring; on carpet they thud and stop dead; on tile they bounce twice and scatter wide; into a sink they clatter metallically. Leaving the surface unnamed lets the model pick, and it usually picks a vague dry nothing. One extra clause — \"onto a wooden floor\", \"into a metal sink\" — changes more than any amount of tuning.",
      },
      {
        heading: "Breaks have three parts and you can ask for each",
        body: "A convincing break is an impact, a failure, and a settle. Cheap library glass gives you the first two and cuts. If you want the clip to sit under a shot without needing a second layer, write the settle into the prompt explicitly — \"shards scattering and skittering away\", \"debris tail\", \"small pieces still falling\" — and give the render enough seconds to actually get there. Two seconds is an impact; four is an event.",
      },
    ],
    faqs: faqs({
      question: "Why do my glass breaks sound small?",
      answer:
        "Almost always because the prompt named the action but not the object or the room. \"Glass breaking\" gives the model no thickness to work with, so it renders something mid-sized and dry. Name the specific object — a bottle, a windscreen, a greenhouse pane — say what it hits, and add the space, and the size problem usually solves itself in one regeneration.",
    }),
    related: ["impact", "metal", "wood", "explosion", "door", "cartoon"],
  },
};

const METAL: SfxCategory = {
  slug: "metal",
  name: "Metal",
  targetQuery: "metal sound effect",
  intent:
    "Sound designers who need metallic hits, scrapes, groans and resonance for industrial, " +
    "horror or sci-fi work, and who care about the difference between a thin sheet and a thick beam.",
  metaTitle: "Metal Sound Effects — Clang, Scrape, Groan | Soundbox",
  metaDescription:
    "Generate metal impacts, scrapes, creaks and resonant clangs locally. Prompts that separate thin sheet from heavy steel, and dry hits from ringing rooms.",
  h1: "Metal sound effects you generate yourself",
  intro:
    "Metal is the most useful material in a sound library because it is the most tonal: unlike wood " +
    "or stone, a struck piece of metal keeps ringing, and that ring carries the size of the object " +
    "for as long as you let it. That makes metal the raw material behind half of horror and most of " +
    "industrial sci-fi. These prompts treat resonance as the thing you are actually specifying, " +
    "because it is.",
  content: {
    samples: [
      s("metal-sheet-wobble", "Sheet wobble", "large thin metal sheet being flexed and wobbled, deep warbling thunder-like resonance, close mic, dry", 4),
      s("metal-pipe-hit-ring", "Pipe strike", "steel pipe struck hard with a wrench, bright metallic clang with a long ringing sustain, empty warehouse", 4),
      s("metal-chain-drag", "Chain drag", "heavy iron chain dragged slowly across a concrete floor, dense clinking links, basement reverb", 6),
      s("metal-hull-groan", "Hull groan", "ship hull groaning under pressure, low metallic strain with creaking rivets, enormous enclosed space", 8),
      s("metal-scrape-rust", "Rust scrape", "rusted metal scraping against rusted metal, harsh grinding rasp with a squealing high edge, close mic", 4),
      s("metal-anvil-forge", "Forge hammering", "blacksmith hammering hot steel on an anvil, rhythmic bright strikes with a ringing tail, stone forge", 6),
      s("metal-can-crush", "Can crush", "aluminium can crushed in a fist, thin buckling metal with a crinkling collapse, very close mic, dry", 1.5),
      s("metal-girder-drop", "Girder drop", "steel girder dropped onto concrete, enormous low clang with a slow decaying wobble, construction site", 5),
      s("metal-wire-twang", "Wire twang", "taut steel wire plucked hard, sharp descending twang with a long metallic decay, close and dry", 3),
      s("metal-shutter-roll", "Shutter roll", "corrugated metal shop shutter rolled down fast and slamming, rattling ribs with a hard final clang, street", 4),
    ],
    recipes: [
      {
        label: "Thin and tonal",
        prompt: "large thin metal sheet being flexed and wobbled, deep warbling thunder-like resonance, close mic, dry",
        why: "Thin metal bends rather than rings, and \"warbling\" is the word that gets you the bend instead of a clang.",
      },
      {
        label: "Thick and ringing",
        prompt: "steel pipe struck hard with a wrench, bright metallic clang with a long ringing sustain, empty warehouse",
        why: "Naming what struck it as well as what was struck fixes the transient; the room then supplies the sustain for free.",
      },
      {
        label: "Metal under load",
        prompt: "ship hull groaning under pressure, low metallic strain with creaking rivets, enormous enclosed space",
        why: "\"Under pressure\" is what converts an impact into a groan — it tells the model the force is continuous, not instantaneous.",
      },
      {
        label: "Friction, not impact",
        prompt: "rusted metal scraping against rusted metal, harsh grinding rasp with a squealing high edge, close mic",
        why: "Saying both surfaces are rusted doubles the texture; a scrape between two named materials is far more specific than \"metal scrape\".",
      },
    ],
    craft: [
      {
        heading: "Resonance length is the size control",
        body: "You cannot really tell how big a piece of metal is from its attack — you tell from how long it rings afterwards. A small object rings for a fraction of a second and dies; a girder or a hull rings for many seconds and wobbles as different modes decay at different rates. So when a metal sound reads as the wrong size, extend or shorten the tail rather than adjusting the hit: ask for \"a long ringing sustain\" or \"dead, no ring\", and give the render enough seconds for the tail to fit inside the clip.",
      },
      {
        heading: "Rust is a texture word that works",
        body: "Clean metal and rusted metal are acoustically different objects: clean surfaces slide and ring, corroded ones catch, rasp and squeal. \"Rusted\", \"corroded\" and \"old\" are among the few adjectives these models respond to reliably, because they map onto real spectral differences rather than onto mood. If a metal scrape comes back too smooth and synthetic, adding rust is usually a faster fix than rewriting the action.",
      },
      {
        heading: "Metal is where horror comes from",
        body: "Most of the unsettling sounds in horror are metal recorded oddly — a sheet flexed slowly, a wire bowed, a hull straining. The reason is that metal produces inharmonic partials that read as tonal without belonging to any musical scale, which is exactly the quality that makes a sound feel wrong. If you are building dread, generate here rather than in the horror collection and pitch the result down; you get the same result with more control over the source.",
      },
    ],
    faqs: faqs({
      question: "How do I stop every metal hit sounding like the same clang?",
      answer:
        "Vary two things independently: the striker and the space. \"Struck with a wrench\", \"struck with a rubber mallet\" and \"struck with a bare hand\" produce genuinely different transients from the same object, and moving the same hit between \"close mic, dry\" and \"empty warehouse\" changes the tail completely. Most sample-pack sameness comes from every clip having been recorded in one room with one striker — generating is how you escape that.",
    }),
    related: ["impact", "machinery", "horror", "glass", "door", "sci-fi"],
  },
};

const WOOD: SfxCategory = {
  slug: "wood",
  name: "Wood",
  targetQuery: "wood sound effect",
  intent:
    "Editors needing wooden creaks, snaps, knocks and splintering for period drama, horror " +
    "interiors, or any game world built out of planks and furniture.",
  metaTitle: "Wood Sound Effects — Creak, Snap, Splinter | Soundbox",
  metaDescription:
    "Generate wood creaking, breaking, knocking and splintering locally. Prompts for dry timber, wet wood, old floorboards and furniture.",
  h1: "Wood sound effects you generate yourself",
  intro:
    "Wood is the sound of old buildings, and old buildings are most of what atmosphere is made of. " +
    "The useful distinction is between wood under slow load — which creaks, groans and ticks — and " +
    "wood under sudden load, which snaps and splinters. Almost every wooden sound you need is one " +
    "of those two events at a particular size and moisture. These prompts are organised around " +
    "that, because it is the axis the models respond to.",
  content: {
    samples: [
      s("wood-floorboard-creak", "Floorboard creak", "old floorboard creaking under slow shifting weight, dry timber groaning with a small tick at the end, quiet empty house", 4),
      s("wood-branch-snap", "Branch snap", "dry tree branch snapping in half, sharp crack with splintering fibres tearing, forest floor, outdoor", 2),
      s("wood-plank-break-knee", "Plank break", "wooden plank broken over a knee, loud cracking split with long splinters tearing apart, close mic", 2),
      s("wood-knock-hollow-door", "Hollow knock", "knuckles knocking three times on a hollow wooden door, dull resonant thumps, hallway reverb", 2.5),
      s("wood-chopping-axe-log", "Axe chopping", "axe splitting a log on a chopping block, heavy bite into wood with fibres tearing and halves falling", 3),
      s("wood-furniture-drag", "Furniture drag", "heavy wooden chair dragged across a hardwood floor, juddering stick-slip scrape, medium room", 4),
      s("wood-ship-timbers", "Ship timbers", "wooden ship timbers creaking and working against each other in a swell, slow rhythmic groaning, enclosed hold", 10),
      s("wood-match-box-rattle", "Matchbox rattle", "small wooden matchbox shaken, dry rattling of matches inside cardboard and wood, very close mic", 2),
      s("wood-fence-collapse", "Fence collapse", "wooden fence panel collapsing, nails tearing free with planks clattering onto grass, outdoor garden", 3),
      s("wood-stairs-creak-ascend", "Creaking stairs", "someone climbing old wooden stairs slowly, each step producing a different creak, tense spacing, empty house", 8),
    ],
    recipes: [
      {
        label: "Slow load",
        prompt: "old floorboard creaking under slow shifting weight, dry timber groaning with a small tick at the end, quiet empty house",
        why: "\"Shifting weight\" implies a continuous force, which is the only way to get a creak rather than a knock.",
      },
      {
        label: "Sudden load",
        prompt: "dry tree branch snapping in half, sharp crack with splintering fibres tearing, forest floor, outdoor",
        why: "\"Fibres tearing\" is the detail that separates wood from any other snapping material — without it a break can read as plastic.",
      },
      {
        label: "Hollow versus solid",
        prompt: "knuckles knocking three times on a hollow wooden door, dull resonant thumps, hallway reverb",
        why: "\"Hollow\" is the single word that decides whether a knock has a boxy resonance or a dead thud, and the model honours it consistently.",
      },
      {
        label: "Stick-slip friction",
        prompt: "heavy wooden chair dragged across a hardwood floor, juddering stick-slip scrape, medium room",
        why: "Dragged wood does not slide smoothly, it grabs and releases; naming that judder is what stops the result sounding like a synthesised sweep.",
      },
    ],
    craft: [
      {
        heading: "Dry and wet are different instruments",
        body: "Moisture changes wood's acoustics more than size does. Dry timber is brittle, bright and loud — it cracks cleanly and rings a little. Wet or green wood is dull, thuddy and reluctant; it bends before it breaks and the break is muffled. If a snap comes back sounding rubbery, say \"dry\"; if a break sounds implausibly bright for a rain-soaked exterior, say \"damp\" or \"green\". It is one word and it moves the result further than most rewrites.",
      },
      {
        heading: "Creaks want time, not volume",
        body: "A creak is a slow event, and the most common mistake is rendering one into a clip too short to contain it. A floorboard under a shifting foot takes two to four seconds to complete its arc — rise, sustain, tick, release — and a one-second render simply truncates the interesting part. Give creaks room and ask for the ending explicitly, because the small settling tick at the end is what makes an audience believe there is a person standing there.",
      },
      {
        heading: "Empty rooms are part of the prompt",
        body: "Wooden interiors are almost always heard in a space with no furniture and no people, which is why \"quiet empty house\" appears in so many of these prompts. It is not flavour text: it tells the model to give you a long, slightly boxy reflection with a low noise floor, which is what an unfurnished room sounds like and what makes a creak feel like it is happening somewhere rather than nowhere.",
      },
    ],
    faqs: faqs({
      question: "How do I get the classic haunted-house creak?",
      answer:
        "Three things together: dry timber, slow continuous load, and an empty reflective room. \"Old floorboard creaking under slow shifting weight, dry timber groaning, quiet empty house\" gets you most of the way, and giving it four seconds rather than one gets you the rest. The horror collection layers this under drones; on its own it is a far more useful asset because you can place it wherever the footstep actually falls.",
    }),
    related: ["door", "footsteps", "horror", "impact", "metal", "ambience"],
  },
};

const PAPER: SfxCategory = {
  slug: "paper",
  name: "Paper",
  targetQuery: "paper sound effect",
  intent:
    "Editors and UI designers who need page turns, tears, crumples and rustles — small, close, " +
    "detailed foley that almost never exists at the right length in a library.",
  metaTitle: "Paper Sound Effects — Page Turn, Tear, Crumple | Soundbox",
  metaDescription:
    "Generate paper rustles, page turns, tears and crumples locally. Close-mic foley prompts for books, documents, cardboard and newsprint.",
  h1: "Paper sound effects you generate yourself",
  intro:
    "Paper foley is small, quiet and enormously specific, which is exactly why library versions " +
    "rarely fit: the page turn you need is a particular weight of paper at a particular speed with " +
    "a particular amount of hand in it. It is also one of the easiest things to generate well, " +
    "because everything that matters — thickness, speed, dryness — is describable in plain words " +
    "and none of it depends on a room.",
  content: {
    samples: [
      s("paper-page-turn-book", "Page turn", "single page of a hardback book turned at reading speed, soft paper flutter with a light settle, very close mic, quiet room", 2),
      s("paper-tear-slow", "Slow tear", "sheet of paper torn slowly in half, fibres separating with a continuous ragged rip, very close mic, dry", 3),
      s("paper-crumple-ball", "Crumple", "sheet of paper crushed into a ball in one hand, dense crackling collapse, very close mic, dry", 2.5),
      s("paper-newspaper-rustle", "Newspaper", "large newspaper being folded and shaken open, broad thin rustling with sharp snaps, close mic", 3),
      s("paper-stack-shuffle", "Shuffling a stack", "stack of loose documents tapped square on a desk then shuffled, crisp edges sliding, office room tone", 3),
      s("paper-envelope-open", "Envelope", "paper envelope torn open along the top and a letter pulled out, close mic, quiet interior", 3),
      s("paper-cardboard-box-open", "Cardboard box", "cardboard box flaps pulled apart, packing tape peeling away with a stretching rip, close mic", 3),
      s("paper-scroll-unroll", "Scroll unroll", "old parchment scroll unrolled across a table, stiff dry crackling as it flattens, medieval interior", 4),
      s("paper-money-count", "Counting notes", "stack of paper banknotes counted rapidly by hand, rhythmic flicking snaps, very close mic, dry", 3),
      s("paper-shredder-feed", "Shredder", "office paper shredder pulling in a sheet, motor loading then cutting into strips, close mic, office", 4),
    ],
    recipes: [
      {
        label: "Page turn",
        prompt: "single page of a hardback book turned at reading speed, soft paper flutter with a light settle, very close mic, quiet room",
        why: "\"At reading speed\" is the tempo control; without it the model tends to render a fast flick, which reads as searching rather than reading.",
      },
      {
        label: "Tear",
        prompt: "sheet of paper torn slowly in half, fibres separating with a continuous ragged rip, very close mic, dry",
        why: "Speed decides everything about a tear — slow gives you a continuous rip, fast gives you a single snap. Say which.",
      },
      {
        label: "Crumple",
        prompt: "sheet of paper crushed into a ball in one hand, dense crackling collapse, very close mic, dry",
        why: "\"In one hand\" fixes the scale; without it the model can render something the size of a bin bag.",
      },
      {
        label: "Stiff old paper",
        prompt: "old parchment scroll unrolled across a table, stiff dry crackling as it flattens, medieval interior",
        why: "Age and stiffness are the same axis for paper, and naming both gets you a crackle instead of a rustle.",
      },
    ],
    craft: [
      {
        heading: "Everything here is a close-mic sound",
        body: "Paper is quiet enough that in any real room the room wins. Every prompt in this collection says \"very close mic\" or \"close mic\" for that reason, and dropping it is the fastest way to get back a wash of ambience with some paper somewhere inside it. If you want the paper to sit in a space, generate it dry and close and put it in the space yourself — that way you keep control of how much room there is.",
      },
      {
        heading: "Thickness maps onto brightness",
        body: "Thin paper — newsprint, tracing paper, receipts — is bright, fast and papery with very little body. Thick paper — card, parchment, a hardback's pages — is duller, slower and has a real low mid to it. Cardboard is a different material again, closer to wood. Because these differences are spectral rather than structural, naming the specific stock rather than saying \"paper\" is unusually effective here.",
      },
      {
        heading: "Hands are half the sound",
        body: "Most paper foley is actually skin-on-paper. A page turn includes a thumb sliding; a crumple includes a fist closing; counting notes is mostly fingertips. Prompts that mention the hand — \"in one hand\", \"counted rapidly by hand\", \"pulled out\" — come back noticeably more convincing than ones that describe only the paper, because the model has heard those recordings too and they have people in them.",
      },
    ],
    faqs: faqs({
      question: "Why does my paper sound like static or rain?",
      answer:
        "Because both are broadband noise, and without structural cues the model has nothing to distinguish them. The cure is to give the sound an event shape: a beginning, a movement and an end — \"turned\", \"torn in half\", \"crushed into a ball\" — rather than a texture word like \"rustling\". Adding \"very close mic\" also helps, because it pushes the result toward a single nearby object rather than a diffuse field.",
    }),
    related: ["ui", "cloth", "wood", "ambience", "keyboard", "transition"],
  },
};

const CLOTH: SfxCategory = {
  slug: "cloth",
  name: "Cloth",
  targetQuery: "cloth sound effect",
  intent:
    "Game and film editors covering character movement — clothing rustle, leather, zips, capes " +
    "and armour straps — the layer that makes a body feel present rather than sliding.",
  metaTitle: "Cloth Sound Effects — Rustle, Zip, Leather | Soundbox",
  metaDescription:
    "Generate fabric rustles, clothing movement, zips and leather creaks locally. Close foley prompts for character movement layers.",
  h1: "Cloth and fabric sound effects you generate yourself",
  intro:
    "Cloth is the layer nobody notices and everybody misses. Footsteps put a character on the " +
    "ground; cloth movement puts a body above them. It is also the hardest layer to source, because " +
    "what you need is not \"fabric rustle\" but a specific garment moving at a specific speed, and " +
    "there is no library index for that. Generating it means you can match the costume instead of " +
    "settling for the recording.",
  content: {
    samples: [
      s("cloth-jacket-movement", "Jacket movement", "person shifting in a cotton jacket, soft fabric friction with seams stretching, very close mic, quiet room", 3),
      s("cloth-leather-creak", "Leather creak", "leather jacket flexing as someone turns, taut creaking with a dry grain, very close mic", 3),
      s("cloth-zip-fast", "Zip", "metal zip pulled quickly up a jacket, rapid buzzing teeth engaging with a stop at the top, close mic, dry", 1.5),
      s("cloth-cape-swirl", "Cape swirl", "heavy woollen cape swept around, broad low fabric whoosh with a settling drape, medium room", 2.5),
      s("cloth-sheet-flap-line", "Sheet on a line", "bedsheet flapping on a washing line in a breeze, sharp fabric cracks with a continuous flutter, outdoor garden", 6),
      s("cloth-armour-strap", "Armour strap", "leather armour straps tightened and buckled, creaking leather with metal buckle clicks, close mic", 3),
      s("cloth-backpack-shift", "Backpack shift", "hiking backpack shifted on shoulders, nylon straps sliding with buckles knocking, close mic, outdoor", 3),
      s("cloth-curtain-draw", "Curtain draw", "heavy curtains drawn across a rail, fabric sliding with rings clicking along metal, medium room", 3),
      s("cloth-towel-snap", "Towel snap", "damp towel snapped hard through the air, sharp cracking whip with an airy tail, tiled room", 1.5),
      s("cloth-tent-canvas-wind", "Canvas in wind", "canvas tent walls buffeting in strong wind, deep fabric booming with rope creaks, outdoor, seamless loop", 8),
    ],
    recipes: [
      {
        label: "Body movement",
        prompt: "person shifting in a cotton jacket, soft fabric friction with seams stretching, very close mic, quiet room",
        why: "\"Person shifting\" gives the model a body to move; \"fabric rustle\" alone gives it a texture with nobody inside it.",
      },
      {
        label: "Leather",
        prompt: "leather jacket flexing as someone turns, taut creaking with a dry grain, very close mic",
        why: "Leather creaks rather than rustles — \"taut\" and \"grain\" push it away from cotton, which is the model's default fabric.",
      },
      {
        label: "Heavy drape",
        prompt: "heavy woollen cape swept around, broad low fabric whoosh with a settling drape, medium room",
        why: "\"Settling drape\" adds the tail that makes heavy fabric read as heavy; without it a cape sounds like a tea towel.",
      },
      {
        label: "Wind-loaded fabric",
        prompt: "canvas tent walls buffeting in strong wind, deep fabric booming with rope creaks, outdoor, seamless loop",
        why: "Large fabric under wind load booms at low frequencies, and \"booming\" is the word that finds that register rather than the surface rustle.",
      },
    ],
    craft: [
      {
        heading: "Name the garment, not the fibre",
        body: "\"Cotton\" on its own tells the model very little; \"a cotton jacket\" tells it a great deal, because a jacket implies seams, a lining, a certain size and a person wearing it. The same goes for canvas versus a tent, leather versus a leather jacket, wool versus a cape. Cloth is one of the categories where naming the object beats naming the material almost every time, because garments are what the training data actually contains.",
      },
      {
        heading: "Cloth is a movement layer, so give it a movement",
        body: "Static fabric makes no sound. Every prompt here contains a verb with an arc: shifting, flexing, swept, pulled, drawn, snapped. If a cloth generation comes back as a formless hiss, the usual cause is that the prompt described a state rather than an action. Adding a direction — up, across, around — and an endpoint — \"with a stop at the top\", \"with a settling drape\" — turns a texture into an event that can be cut to picture.",
      },
      {
        heading: "Hardware sells the costume",
        body: "The details that make clothing foley identifiable are rarely the fabric: they are the zip, the buckle, the curtain ring, the strap. These are small metallic events sitting on top of a broadband bed, and calling them out individually — \"metal buckle clicks\", \"rings clicking along metal\" — gives you something that cuts through a mix. A cloth layer with no hardware in it tends to disappear the moment there is music.",
      },
    ],
    faqs: faqs({
      question: "How do I build a full character movement layer?",
      answer:
        "Generate it in pieces and stack them. A convincing move is usually three renders: the cloth body from this collection, the footfall from the footsteps collection, and one hardware detail — a buckle, a zip, a strap. Generating each separately means you can time them independently to the animation, which is the thing a single library \"character move\" clip can never let you do.",
    }),
    related: ["footsteps", "paper", "weapon", "ambience", "whoosh", "impact"],
  },
};

const KEYBOARD: SfxCategory = {
  slug: "keyboard",
  name: "Keyboard & office",
  targetQuery: "keyboard typing sound effect",
  intent:
    "Video editors, app demo makers and game developers who need typing, mouse clicks and desk " +
    "foley — one of the highest-volume searches on every free library and almost always needed " +
    "at a specific length.",
  metaTitle: "Keyboard Typing Sound Effects — Generate Locally | Soundbox",
  metaDescription:
    "Generate keyboard typing, mouse clicks, mechanical key presses and office desk foley locally. Prompts for laptop, mechanical and vintage typewriters.",
  h1: "Keyboard and office sound effects you generate yourself",
  intro:
    "Typing is one of the most-searched sounds on every free library, and one of the most annoying " +
    "to source, because what you need is almost always \"exactly eleven seconds of typing that stops " +
    "on the beat\". Generating gets you the length you asked for. It also gets you the right keyboard: " +
    "a membrane laptop, a heavy mechanical board and a 1960s typewriter are three completely " +
    "different sounds that a search for \"typing\" flattens into one.",
  content: {
    samples: [
      s("keyboard-mechanical-typing", "Mechanical typing", "typing steadily on a mechanical keyboard with tactile switches, distinct clacking key presses, close mic, quiet office", 8),
      s("keyboard-laptop-typing", "Laptop typing", "typing on a laptop membrane keyboard, soft muted key taps at a steady pace, close mic, quiet room", 8),
      s("keyboard-single-key-press", "Single key", "single mechanical keyboard key pressed and released, crisp click with a bottom-out thock, very close mic, dry", 1),
      s("keyboard-enter-slam", "Enter key", "enter key struck hard on a mechanical keyboard, deep decisive clack, very close mic, dry", 1),
      s("keyboard-typewriter-line", "Typewriter", "vintage manual typewriter typing a line then the carriage return bell and lever, close mic, small office", 6),
      s("keyboard-mouse-click-double", "Mouse click", "computer mouse clicked twice in quick succession, tiny sharp plastic clicks, very close mic, dry", 1),
      s("keyboard-mouse-scroll", "Scroll wheel", "mouse scroll wheel turned through its detents, fine ratcheting ticks, very close mic, dry", 2),
      s("keyboard-desk-pen-click", "Pen click", "retractable ballpoint pen clicked repeatedly, sharp plastic snaps, very close mic, quiet room", 3),
      s("keyboard-frantic-typing", "Frantic typing", "someone typing very fast and erratically on a mechanical keyboard, dense overlapping key presses, close mic", 6),
      s("keyboard-office-desk-ambience", "Desk ambience", "quiet open-plan office ambience, distant typing, a phone ringing far away and low ventilation hum, seamless loop", 12),
    ],
    recipes: [
      {
        label: "Mechanical board",
        prompt: "typing steadily on a mechanical keyboard with tactile switches, distinct clacking key presses, close mic, quiet office",
        why: "\"Tactile switches\" is a real spec that maps onto a real sound — it gets you the click without the mushiness of a membrane board.",
      },
      {
        label: "Laptop board",
        prompt: "typing on a laptop membrane keyboard, soft muted key taps at a steady pace, close mic, quiet room",
        why: "\"Membrane\" and \"muted\" together are what stop the model reaching for the louder mechanical recordings it has more of.",
      },
      {
        label: "Pace as a control",
        prompt: "someone typing very fast and erratically on a mechanical keyboard, dense overlapping key presses, close mic",
        why: "Pace carries the character's state — steady reads as work, erratic reads as panic. It is a prompt word, not an edit.",
      },
      {
        label: "Single event",
        prompt: "single mechanical keyboard key pressed and released, crisp click with a bottom-out thock, very close mic, dry",
        why: "\"Pressed and released\" gets both halves of the key travel, which is what makes a UI click feel physical rather than sampled.",
      },
    ],
    craft: [
      {
        heading: "Length is the whole reason to generate this",
        body: "Typing is the clearest case for generating over downloading. A cut needs typing that runs for the exact duration of a shot and stops cleanly; a library gives you fourteen seconds when you needed nine, so you fade it and it sounds faded. Set the render length to the shot length and the problem disappears. This is also why every prompt here carries an explicit duration rather than leaving it to a default.",
      },
      {
        heading: "The board is the character",
        body: "A hacker scene, an office comedy and a period drama need three different keyboards, and the difference is not volume. Mechanical boards are bright, clicky and percussive with an audible bottom-out. Membrane laptops are dull, fast and close to silent. Typewriters are enormous, mechanical, and come with a carriage return that is itself a beat. Choosing deliberately — and saying so in the prompt — does more for a scene than any amount of processing.",
      },
      {
        heading: "Desk foley is what sells the office",
        body: "A room with only typing in it sounds like a sound effect. Real desks have pens, mice, mugs, chairs and a ventilation hum, and the small items are what make the space read as inhabited. Generate two or three of them separately and lay them under the typing at low level — the pen click and the scroll wheel in this collection exist for exactly that, and they are more useful as a bed than as a foreground.",
      },
    ],
    faqs: faqs({
      question: "Can I get typing that matches a specific words-per-minute?",
      answer:
        "Not precisely — the models respond to pace descriptions like \"steady\", \"fast\", \"erratic\" and \"hunt and peck\" rather than to a number. In practice that is enough, because what a scene needs is a character's state rather than a measurement. If you need genuine sync to what is on screen, generate a single key press and place it per keystroke; at that point you have complete control and it costs one render.",
    }),
    related: ["ui", "notification", "ambience", "paper", "clock", "machinery"],
  },
};

const CLOCK: SfxCategory = {
  slug: "clock",
  name: "Clocks & timers",
  targetQuery: "clock ticking sound effect",
  intent:
    "Editors building tension or marking time — ticking beds, alarm clocks, countdown timers and " +
    "chiming grandfather clocks, usually needed as a seamless loop.",
  metaTitle: "Clock Ticking Sound Effects — Generate Locally | Soundbox",
  metaDescription:
    "Generate clock ticking, alarm clocks, countdown timers and chimes locally. Loopable tension beds and one-shot alarms with real prompts.",
  h1: "Clock and timer sound effects you generate yourself",
  intro:
    "A ticking clock is the cheapest tension device in film, and it works because it is metronomic: " +
    "the audience starts counting without deciding to. That also makes it unforgiving, because a " +
    "loop that does not line up announces itself immediately. Generating your own means you can " +
    "render a tick at the tempo your scene actually needs rather than time-stretching somebody " +
    "else's and hearing the artefacts.",
  content: {
    samples: [
      s("clock-wall-tick-loop", "Wall clock tick", "wall clock ticking steadily once per second, dry mechanical tick with a small internal rattle, quiet room, seamless loop", 10),
      s("clock-grandfather-pendulum", "Grandfather clock", "large grandfather clock pendulum swinging, heavy slow wooden tock every second, hallway reverb, seamless loop", 10),
      s("clock-grandfather-chime", "Hour chime", "grandfather clock striking the hour, deep resonant chimes with a long decay in a wood-panelled hall", 10),
      s("clock-alarm-bell-ringing", "Alarm clock", "vintage twin-bell alarm clock ringing violently, hammer striking metal bells, bedside close mic", 5),
      s("clock-digital-alarm-beep", "Digital alarm", "digital alarm clock beeping in short insistent triplets, thin piezo tone, close mic, quiet bedroom", 5),
      s("clock-stopwatch-click", "Stopwatch", "mechanical stopwatch button clicked to start, then fine rapid ticking, very close mic, dry", 5),
      s("clock-kitchen-timer-wind", "Kitchen timer", "mechanical kitchen timer wound up and released, ratcheting then a fine ticking countdown, close mic", 6),
      s("clock-timer-final-bell", "Timer bell", "kitchen timer reaching zero and striking a single bright bell, close mic, kitchen reverb", 2),
      s("clock-tick-accelerating", "Accelerating tick", "clock ticking and gradually accelerating in tempo, mechanical ticks growing frantic, dry and close", 10),
      s("clock-bomb-countdown", "Countdown timer", "digital countdown timer beeping once per second with a rising pitch as it nears zero, tense and dry", 10),
    ],
    recipes: [
      {
        label: "Loopable tension bed",
        prompt: "wall clock ticking steadily once per second, dry mechanical tick with a small internal rattle, quiet room, seamless loop",
        why: "\"Once per second\" fixes the tempo and \"seamless loop\" tells the model to keep it even end to end, which is what makes it usable under a long scene.",
      },
      {
        label: "Weight and age",
        prompt: "large grandfather clock pendulum swinging, heavy slow wooden tock every second, hallway reverb, seamless loop",
        why: "\"Tock\" rather than \"tick\" is a real spectral instruction — it lands the sound an octave lower and reads as a much bigger mechanism.",
      },
      {
        label: "Rising urgency",
        prompt: "digital countdown timer beeping once per second with a rising pitch as it nears zero, tense and dry",
        why: "Building the escalation into the prompt saves an automation pass, and the model's version drifts naturally rather than in even steps.",
      },
      {
        label: "Mechanical alarm",
        prompt: "vintage twin-bell alarm clock ringing violently, hammer striking metal bells, bedside close mic",
        why: "Describing the mechanism — a hammer between two bells — is what produces the characteristic stutter that a generic \"alarm\" never has.",
      },
    ],
    craft: [
      {
        heading: "Tempo is a prompt word and it works",
        body: "Clocks are one of the few sound families where these models track an explicit rate, because \"once per second\" is both a common phrase in the training captions and an unambiguous physical description. Use it. If you need something other than one hertz, say the interval in words — \"twice per second\", \"a slow tick every two seconds\" — rather than trying to correct the timing afterwards, because time-stretching a tick changes its timbre audibly.",
      },
      {
        heading: "The room carries most of the dread",
        body: "The same tick is banal in a kitchen and menacing in an empty hallway, and the only difference is the reflection. Long, hard, empty spaces let each tick ring slightly and leave a gap of silence that the audience fills. If a ticking bed is not landing, change the space before you change the clock — \"hallway reverb\", \"large empty room\", \"wood-panelled hall\" — and keep the tick itself dry and simple.",
      },
      {
        heading: "Generate the ending, not just the loop",
        body: "Almost every use of a ticking bed ends with something: a bell, a stop, an alarm, a cut to silence. Libraries sell you the loop and leave you to find the ending somewhere else, which is why so many countdowns end with an obvious splice. Render the ending as its own short clip in the same session — the timer bell in this collection is exactly that — so the two share a character and cut together cleanly.",
      },
    ],
    faqs: faqs({
      question: "Will a generated tick actually loop seamlessly?",
      answer:
        "Close, but check it. Asking for a seamless loop makes the model keep the level and tempo even end to end, which removes the usual reason loops fail. It does not guarantee a sample-accurate join, so trim to a zero crossing on a tick boundary in your editor — for a metronomic sound that takes seconds, and it is the same step you would do with a purchased loop.",
    }),
    related: ["ambience", "horror", "notification", "cinematic", "keyboard", "alarm"],
  },
};

const BELL: SfxCategory = {
  slug: "bell",
  name: "Bells & chimes",
  targetQuery: "bell sound effect",
  intent:
    "Editors needing bells of a specific size and purpose — church bells, service bells, bicycle " +
    "bells, wind chimes, boxing bells — where the size of the bell is the whole character.",
  metaTitle: "Bell Sound Effects — Church, Chime, Ding | Soundbox",
  metaDescription:
    "Generate church bells, service bells, wind chimes, bicycle bells and boxing bells locally. Prompts that control size, metal and decay.",
  h1: "Bell and chime sound effects you generate yourself",
  intro:
    "Bells are pure resonance, which makes them the most forgiving family to generate and the " +
    "easiest to get subtly wrong. A bell's identity is almost entirely in its decay: how long it " +
    "rings, how the partials beat against each other as it fades, and whether the room joins in. " +
    "Get the decay right and even a rough render is convincing; get it wrong and no amount of " +
    "brightness will save it.",
  content: {
    samples: [
      s("bell-church-tower-single", "Church bell", "single large church bell tolling, deep bronze strike with a long beating decay, stone tower and open air", 10),
      s("bell-church-peal", "Full peal", "full peal of church bells ringing changes, overlapping bronze tones in a village, open air, distant", 12),
      s("bell-service-desk-ding", "Service bell", "hotel reception desk bell struck once, bright short ding with a clean metallic decay, lobby reverb", 3),
      s("bell-bicycle-ring", "Bicycle bell", "bicycle bell thumbed twice, bright thin metallic trill, close mic, outdoor street", 2),
      s("bell-wind-chimes-breeze", "Wind chimes", "metal wind chimes moving in a light breeze, random overlapping tuned tones, outdoor porch, seamless loop", 10),
      s("bell-boxing-round", "Boxing bell", "boxing ring bell struck three times to end a round, harsh bright clang, arena reverb with crowd behind", 5),
      s("bell-hand-bell-shake", "Hand bell", "brass hand bell shaken vigorously, rapid clapper strikes with a bright ringing wash, close mic", 3),
      s("bell-ship-bell-strike", "Ship's bell", "ship's bell struck twice on deck, bright brass ring with sea and wind behind, open outdoor", 4),
      s("bell-tibetan-singing-bowl", "Singing bowl", "Tibetan singing bowl struck once and left to ring, pure sustained tone with slow beating partials, quiet room", 12),
      s("bell-tubular-chime-strike", "Tubular chime", "orchestral tubular bell struck with a mallet, bright metallic strike with a very long shimmering decay, concert hall", 10),
    ],
    recipes: [
      {
        label: "Big bell",
        prompt: "single large church bell tolling, deep bronze strike with a long beating decay, stone tower and open air",
        why: "\"Beating decay\" names the slow interference between partials that only large bells produce — it is the single strongest size cue available.",
      },
      {
        label: "Small bell",
        prompt: "hotel reception desk bell struck once, bright short ding with a clean metallic decay, lobby reverb",
        why: "\"Short\" and \"clean\" are the small-bell equivalent: no beating, no wobble, gone in a second.",
      },
      {
        label: "Many bells at once",
        prompt: "full peal of church bells ringing changes, overlapping bronze tones in a village, open air, distant",
        why: "\"Ringing changes\" is the actual term for the pattern English peals use, and it produces overlapping non-repeating tones rather than a chord.",
      },
      {
        label: "Sustained tone",
        prompt: "Tibetan singing bowl struck once and left to ring, pure sustained tone with slow beating partials, quiet room",
        why: "\"Left to ring\" tells the model not to cut the tail, which is where all the character of this sound lives.",
      },
    ],
    craft: [
      {
        heading: "Decay length is size",
        body: "A hand bell rings for under a second, a church bell for ten or more, and nothing else about the sound communicates scale as clearly. This has a practical consequence: you must give the render enough seconds for the tail to complete. A large bell rendered into a three-second clip is not a large bell, it is a large bell with the interesting part removed. Every big-bell prompt here asks for ten seconds or more for that reason alone.",
      },
      {
        heading: "Bells beat, and that is the realism tell",
        body: "Real bells are not perfectly tuned. Their partials sit slightly apart, and as they decay they interfere, producing a slow wobble in the tail — the effect campanologists call beating. Synthetic bells lack it and sound sterile as a result. \"Beating decay\" and \"slow beating partials\" reliably summon it, and it is the fastest way to move a generation from sampled-keyboard to cast-bronze.",
      },
      {
        heading: "The room is part of the instrument",
        body: "More than almost any other sound, bells are heard through their surroundings — a tower, a hall, a village across fields. Distance matters as much as size: the same bell close is bright and metallic, and at two hundred metres is a warm low tone with the attack largely gone. If a bell sounds too aggressive, do not filter it, move it: add \"distant\" or \"heard across fields\" and let the model do the air absorption for you.",
      },
    ],
    faqs: faqs({
      question: "How do I get a bell that is clearly enormous?",
      answer:
        "Three things at once: a long render, an explicitly named large object, and beating in the decay. \"Single large church bell tolling, deep bronze strike with a long beating decay, stone tower and open air\" at ten or twelve seconds gets there. If it still sounds small, the render length is usually the culprit — the tail is where the size lives, and a short clip cuts it off before it can prove anything.",
    }),
    related: ["clock", "notification", "ambience", "metal", "crowd", "magic"],
  },
};

/* ================================================== Vehicles & transport */

const CAR: SfxCategory = {
  slug: "car",
  name: "Cars",
  targetQuery: "car sound effect",
  intent:
    "Editors and game developers covering road vehicles — doors, starts, skids, horns, passes — " +
    "where the specific event matters more than the make of car.",
  metaTitle: "Car Sound Effects — Engine, Door, Skid, Horn | Soundbox",
  metaDescription:
    "Generate car engine starts, door slams, tyre skids, horns and pass-bys locally. Prompts for interior and exterior perspectives.",
  h1: "Car sound effects you generate yourself",
  intro:
    "Car audio splits cleanly into two jobs: things the car does, and where you are standing when it " +
    "does them. The same engine is a completely different asset heard from the pavement, from the " +
    "driver's seat, or from a hundred metres down the road, and choosing that perspective is most " +
    "of the work. These prompts name it every time, because a library clip almost never tells you " +
    "which one you are getting.",
  content: {
    samples: [
      s("car-engine-start-idle", "Start and idle", "petrol car engine starting from cold, starter motor cranking then catching and settling into a rough idle, exterior close", 8),
      s("car-door-close-solid", "Door close", "car door closing solidly, dense thunk with a rubber seal compressing and a latch click, exterior, street", 2),
      s("car-tyre-skid-stop", "Tyre skid", "car braking hard on dry tarmac, tyres screeching and locking into a stop, outdoor street, wide", 4),
      s("car-horn-single-blast", "Horn", "car horn blasted once in city traffic, dual-tone honk with a street reverb tail, outdoor", 2),
      s("car-pass-by-fast", "Fast pass-by", "car passing the listener at speed on a wet road, doppler engine and tyre roar sweeping past, roadside", 5),
      s("car-interior-driving", "Interior driving", "interior of a car driving at motorway speed, muffled engine drone with tyre roar and wind, seamless loop", 12),
      s("car-gear-shift-rev", "Rev and shift", "sports car revving hard and shifting up through two gears, throaty exhaust bark, exterior close", 6),
      s("car-indicator-tick", "Indicator", "car indicator relay ticking steadily, dry mechanical clicks, interior close mic, seamless loop", 6),
      s("car-crash-head-on", "Crash", "car crashing head-on into a barrier, huge metal impact with glass shattering and debris scattering, street", 4),
      s("car-engine-fail-start", "Failing to start", "car engine failing to start, starter motor cranking repeatedly and dying, battery weakening, exterior close", 8),
    ],
    recipes: [
      {
        label: "Cold start",
        prompt: "petrol car engine starting from cold, starter motor cranking then catching and settling into a rough idle, exterior close",
        why: "Describing the three stages — crank, catch, settle — gets you a complete event instead of an engine that is simply on.",
      },
      {
        label: "Perspective as a control",
        prompt: "interior of a car driving at motorway speed, muffled engine drone with tyre roar and wind, seamless loop",
        why: "\"Interior\" and \"muffled\" together are what put the listener inside the cabin; without them the model renders the exterior every time.",
      },
      {
        label: "Pass-by",
        prompt: "car passing the listener at speed on a wet road, doppler engine and tyre roar sweeping past, roadside",
        why: "Naming the road surface changes the tyre noise more than the speed does — wet tarmac hisses, dry tarmac roars, gravel crunches.",
      },
      {
        label: "Door weight",
        prompt: "car door closing solidly, dense thunk with a rubber seal compressing and a latch click, exterior, street",
        why: "The rubber seal is the detail that makes a modern car door sound expensive; leaving it out gets you a tinny older one.",
      },
    ],
    craft: [
      {
        heading: "Decide where the microphone is first",
        body: "Interior, exterior close, and exterior distant are three different assets, and no amount of EQ turns one into another convincingly — the cabin is a small sealed space that removes the top end and adds its own resonance, and distance removes the transients rather than the treble. Write the perspective into every vehicle prompt as a matter of habit. It is the single most common reason a car sound refuses to sit in a scene.",
      },
      {
        heading: "Tyres carry the surface, engines carry the effort",
        body: "Two independent layers make up most driving audio. The engine tells you what the driver is doing — idling, accelerating, labouring, shifting — and the tyres tell you what the road is. Because they are independent, you can specify them separately: \"revving hard\" plus \"on a wet road\" gives you an aggressive car in the rain, which no single library clip is likely to contain. Prompting both explicitly is how you get a combination that does not exist as a recording.",
      },
      {
        heading: "Small mechanical details are what make it a car",
        body: "Indicator relays, seatbelt reels, handbrake ratchets, key fobs and latch clicks are tiny and instantly recognisable, and they cost one short render each. A scene assembled from these small events plus one interior bed will read as far more real than a single long drive-by, and it gives you something to cut on. The indicator loop here exists mostly to sit under dialogue and mark time.",
      },
    ],
    faqs: faqs({
      question: "Can I get a specific make and model of engine?",
      answer:
        "Not reliably, and it is worth not trying. These models respond well to descriptions of behaviour and character — \"throaty exhaust bark\", \"rough idle\", \"high-revving four cylinder\", \"heavy diesel clatter\" — and poorly to brand names, which carry no consistent acoustic meaning in the training captions. Describe how the engine behaves and it will get you closer than any badge.",
    }),
    related: ["engine", "machinery", "ambience", "impact", "explosion", "train"],
  },
};

const ENGINE: SfxCategory = {
  slug: "engine",
  name: "Engines & motors",
  targetQuery: "engine sound effect",
  intent:
    "Designers who need the motor itself rather than the vehicle around it — idles, revs, diesel " +
    "clatter, electric whine, outboards, generators — usually as a loopable bed.",
  metaTitle: "Engine Sound Effects — Idle, Rev, Diesel, Electric | Soundbox",
  metaDescription:
    "Generate engine idles, revs, diesel clatter and electric motor whine locally. Loopable beds and one-shot starts with prompts that control the character.",
  h1: "Engine and motor sound effects you generate yourself",
  intro:
    "An engine is a rhythm at a pitch, and once you hear it that way the prompts write themselves. " +
    "Cylinder count sets the pattern, load sets the pitch and strain, and fuel type sets the " +
    "texture — petrol is smooth, diesel clatters, electric hums with no rhythm at all. Everything " +
    "in this collection is a combination of those three, which is why it covers motorbikes, boats " +
    "and generators without needing a separate page for each.",
  content: {
    samples: [
      s("engine-diesel-idle-loop", "Diesel idle", "heavy diesel truck engine idling, rhythmic clattering combustion with a low rumble, exterior close, seamless loop", 10),
      s("engine-motorcycle-rev", "Motorcycle rev", "motorcycle engine revved hard twice then dropping back to idle, sharp exhaust bark, exterior close", 6),
      s("engine-electric-motor-whine", "Electric motor", "electric vehicle motor accelerating, smooth rising harmonic whine with no combustion, close exterior", 6),
      s("engine-outboard-boat", "Outboard motor", "small outboard boat motor running at speed, buzzing two-stroke with water slapping the hull, open water", 8),
      s("engine-lawnmower-cut", "Lawnmower", "petrol lawnmower engine running and bogging down as it cuts thick grass, exterior, garden", 8),
      s("engine-v8-muscle-idle", "V8 idle", "large V8 muscle car engine idling with a lumpy uneven cam, deep burbling exhaust, exterior close, seamless loop", 10),
      s("engine-start-cold-crank", "Cold crank", "large engine cranking on a weak battery, slow laboured turns before catching roughly, exterior close", 8),
      s("engine-jet-turbine-spool", "Turbine spool-up", "jet turbine spooling up from rest to full power, rising harmonic whine into a roaring blast, tarmac, distant", 10),
      s("engine-generator-load", "Generator under load", "portable petrol generator running steadily then dipping as load is applied, exterior, seamless loop", 10),
      s("engine-two-stroke-chainsaw-idle", "Two-stroke idle", "two-stroke engine idling unevenly, high buzzing exhaust note with irregular misfires, close mic, outdoor", 6),
    ],
    recipes: [
      {
        label: "Diesel",
        prompt: "heavy diesel truck engine idling, rhythmic clattering combustion with a low rumble, exterior close, seamless loop",
        why: "\"Clattering combustion\" is the diesel tell — it is mechanical noise on top of the exhaust note, and naming it separates diesel from petrol instantly.",
      },
      {
        label: "Electric",
        prompt: "electric vehicle motor accelerating, smooth rising harmonic whine with no combustion, close exterior",
        why: "\"No combustion\" is a negative instruction that works: it removes the rhythmic pulsing the model would otherwise add by default.",
      },
      {
        label: "Load and strain",
        prompt: "petrol lawnmower engine running and bogging down as it cuts thick grass, exterior, garden",
        why: "\"Bogging down\" gives you the drop in pitch and rise in effort that makes an engine sound like it is doing work rather than running free.",
      },
      {
        label: "Lumpy idle",
        prompt: "large V8 muscle car engine idling with a lumpy uneven cam, deep burbling exhaust, exterior close, seamless loop",
        why: "The uneven cam is why muscle cars burble; asking for the cause rather than the effect produces a much more characterful idle.",
      },
    ],
    craft: [
      {
        heading: "Cylinder count sets the rhythm",
        body: "An engine's identity is its firing pattern. A single-cylinder thumper is slow and uneven, a four is a smooth buzz, a V8 is a deep uneven burble, a turbine has no pattern at all — it is pure tone. You can prompt this directly, and it is a far more reliable lever than describing the vehicle: \"single-cylinder\", \"four cylinder\", \"V8\", \"turbine\" each produce a distinctly different result from otherwise identical prompts.",
      },
      {
        heading: "Load is what makes it dramatic",
        body: "A free-revving engine is boring; an engine under load is a performance. Load shows up as a drop in pitch, an increase in mechanical noise, and a sense of strain — and all three come from a single phrase like \"bogging down\", \"labouring\", \"under load\" or \"straining uphill\". If a vehicle scene feels flat, it is usually because the engine is running free when it should be working.",
      },
      {
        heading: "Loops need level, not just length",
        body: "An engine bed under a scene has to be even end to end or the loop point will be audible as a level jump. Asking for a \"seamless loop\" plus \"idling steadily\" gets you that evenness; asking for a rev inside a loop does not, because the rev is by definition a change. Keep the loops steady and generate the events — starts, revs, shifts, stops — as separate one-shots you can drop on top.",
      },
    ],
    faqs: faqs({
      question: "Can I generate a full acceleration from idle to top speed?",
      answer:
        "Yes, and it works better than you would expect if you write it as a journey with stages: \"engine starting from idle, accelerating hard through three gear changes, settling at cruise\". Give it ten or twelve seconds so each stage has room. What you will not get is frame-accurate sync to a specific animation — for that, generate the stages separately and place them, which is what a game engine would do anyway.",
    }),
    related: ["car", "machinery", "aircraft", "train", "sci-fi", "ambience"],
  },
};

const TRAIN: SfxCategory = {
  slug: "train",
  name: "Trains",
  targetQuery: "train sound effect",
  intent:
    "Editors covering rail — steam locomotives, modern trains, subway platforms, level crossings — " +
    "where period and perspective decide everything.",
  metaTitle: "Train Sound Effects — Steam, Subway, Crossing | Soundbox",
  metaDescription:
    "Generate steam locomotives, modern trains, subway ambience and level crossings locally. Prompts for interior, platform and trackside perspectives.",
  h1: "Train sound effects you generate yourself",
  intro:
    "Trains are period markers. A steam locomotive, a diesel express and a modern electric metro " +
    "say three different decades before a single line of dialogue lands, and audiences read them " +
    "instantly. They are also enormous, which means perspective matters more than usual: trackside, " +
    "on the platform and inside the carriage are entirely different sounds from the same train.",
  content: {
    samples: [
      s("train-steam-chuff-departing", "Steam departure", "steam locomotive departing a station, slow chuffing accelerating with wheel slip and a whistle, trackside, open air", 12),
      s("train-steam-whistle", "Steam whistle", "steam locomotive whistle blowing long and mournful, multi-tone brass with a valley echo, distant outdoor", 6),
      s("train-modern-passby-platform", "Platform pass-by", "modern electric train passing through a station without stopping, rising roar and doppler, platform perspective", 8),
      s("train-subway-interior", "Subway interior", "inside a subway carriage between stations, rhythmic rail clatter with motor whine and rattling panels, seamless loop", 12),
      s("train-level-crossing-bells", "Level crossing", "railway level crossing bells ringing and barriers lowering, roadside, outdoor, traffic waiting", 10),
      s("train-freight-slow-rumble", "Freight train", "long freight train rolling slowly past, endless wheel clatter and couplings knocking, trackside, distant horn", 12),
      s("train-brakes-squeal-stop", "Brakes squeal", "train braking into a station, steel wheels squealing sharply and grinding to a stop, platform reverb", 8),
      s("train-announcement-station", "Station ambience", "railway station concourse ambience, echoing announcements, footsteps and distant train movement, large hall", 12),
      s("train-doors-hiss-close", "Doors closing", "modern train doors beeping then hissing closed with a pneumatic thump, platform, close", 5),
      s("train-track-clatter-rhythm", "Track rhythm", "steady rhythmic clatter of wheels over rail joints at speed, trackside close, seamless loop", 10),
    ],
    recipes: [
      {
        label: "Steam",
        prompt: "steam locomotive departing a station, slow chuffing accelerating with wheel slip and a whistle, trackside, open air",
        why: "\"Wheel slip\" is the detail that makes a steam departure believable — the moment of lost traction is what the recordings all have and generic prompts miss.",
      },
      {
        label: "Modern electric",
        prompt: "modern electric train passing through a station without stopping, rising roar and doppler, platform perspective",
        why: "\"Without stopping\" implies speed, and \"platform perspective\" puts the listener beside the track rather than on it.",
      },
      {
        label: "Interior bed",
        prompt: "inside a subway carriage between stations, rhythmic rail clatter with motor whine and rattling panels, seamless loop",
        why: "\"Between stations\" is what keeps the bed steady — anything else and the model adds a stop, which ruins the loop.",
      },
      {
        label: "The rhythm alone",
        prompt: "steady rhythmic clatter of wheels over rail joints at speed, trackside close, seamless loop",
        why: "Isolating the rail joints gives you a rhythmic layer you can put under any train, which is far more reusable than a whole train.",
      },
    ],
    craft: [
      {
        heading: "Period is set by propulsion",
        body: "Steam chuffs and whistles; diesel clatters and horns; electric hums and whines. That single choice places a scene in a decade more reliably than any set dressing, and the models handle it well because the three sound families are genuinely distinct in the training data. State it explicitly — \"steam locomotive\", \"diesel locomotive\", \"modern electric train\" — rather than saying \"train\" and hoping.",
      },
      {
        heading: "Rail joints are the metronome",
        body: "The characteristic rhythm of a train is not the engine at all, it is wheels crossing gaps in the rail — which is why modern continuously welded track sounds so much smoother than older jointed track. If you want the classic clackety rhythm, ask for \"rail joints\" specifically. If you want a modern high-speed line, ask for a smooth continuous roar instead. Both are correct; they are just different decades.",
      },
      {
        heading: "Stations are reverb, tracks are not",
        body: "A station is a large hard enclosure with a long reverb tail and echoing announcements; open track has almost no reflection at all beyond ground bounce. Moving the same train between them changes it completely, and it is a one-word edit to the prompt. When a train sound feels wrong for a shot, check the space before you touch anything else — most mismatches are a trackside recording playing under a platform shot or the reverse.",
      },
    ],
    faqs: faqs({
      question: "How do I build a whole station scene?",
      answer:
        "Layer three renders: a station concourse bed for the room and the crowd, one train event for the action — an arrival, a pass-by, doors closing — and one small detail near the microphone, like a case wheeling past or an announcement. Generating them separately means you control the balance and the timing, and it is the same approach a production mixer would take with location recordings.",
    }),
    related: ["engine", "ambience", "crowd", "machinery", "car", "aircraft"],
  },
};

const AIRCRAFT: SfxCategory = {
  slug: "aircraft",
  name: "Aircraft",
  targetQuery: "airplane sound effect",
  intent:
    "Editors needing aviation — jets, propellers, helicopters, cabin interiors and flyovers — " +
    "usually at a specific distance, which is the hardest thing to find in a library.",
  metaTitle: "Airplane Sound Effects — Jet, Prop, Helicopter | Soundbox",
  metaDescription:
    "Generate jet engines, propeller aircraft, helicopters, cabin interiors and flyovers locally. Prompts that control distance and doppler.",
  h1: "Aircraft sound effects you generate yourself",
  intro:
    "Aircraft audio is mostly about distance. The same jet is a shriek on the tarmac, a roar at " +
    "five hundred metres, and a soft rumble overhead at altitude, and those are not the same clip " +
    "with a volume change — air absorption removes the high frequencies as distance grows, and the " +
    "doppler shift only exists if the aircraft is passing. These prompts treat distance as the " +
    "primary parameter, because in practice it is.",
  content: {
    samples: [
      s("aircraft-jet-takeoff-close", "Jet takeoff", "commercial jet taking off from close beside the runway, enormous rising turbine roar with a ground rumble, outdoor", 12),
      s("aircraft-jet-overhead-cruise", "High overhead", "jet airliner passing high overhead at cruise altitude, soft distant rumble with no transient detail, open sky", 12),
      s("aircraft-prop-plane-flyby", "Propeller flyby", "small propeller aircraft flying low past the listener, buzzing engine with a clear doppler drop, open countryside", 8),
      s("aircraft-helicopter-hover", "Helicopter hover", "helicopter hovering overhead, heavy rhythmic rotor thump with a turbine whine underneath, outdoor, seamless loop", 10),
      s("aircraft-helicopter-approach-depart", "Helicopter pass", "helicopter approaching from a distance, passing overhead loudly and receding, full doppler arc, open field", 12),
      s("aircraft-cabin-interior-cruise", "Cabin interior", "inside a passenger aircraft cabin at cruise, steady broadband air rush with a low engine drone, seamless loop", 12),
      s("aircraft-landing-gear-touchdown", "Touchdown", "aircraft landing gear touching down on a runway, tyre chirp and rumble with reverse thrust roaring, exterior", 8),
      s("aircraft-fighter-jet-lowpass", "Fighter jet", "military fighter jet passing low and fast, tearing afterburner roar arriving late with a violent doppler, open sky", 8),
      s("aircraft-drone-quadcopter", "Quadcopter", "small quadcopter drone hovering close then moving away, high buzzing rotors, outdoor, quiet park", 8),
      s("aircraft-airport-tarmac-ambience", "Tarmac ambience", "airport tarmac ambience, distant jets, ground vehicles and radio chatter, wide open outdoor, seamless loop", 12),
    ],
    recipes: [
      {
        label: "Close and violent",
        prompt: "commercial jet taking off from close beside the runway, enormous rising turbine roar with a ground rumble, outdoor",
        why: "\"Ground rumble\" is the low-frequency component you only get near the aircraft, and it is what makes close feel close.",
      },
      {
        label: "Distant and soft",
        prompt: "jet airliner passing high overhead at cruise altitude, soft distant rumble with no transient detail, open sky",
        why: "\"No transient detail\" is a negative instruction that models air absorption — distance removes the top end, and saying so beats filtering afterwards.",
      },
      {
        label: "Full doppler arc",
        prompt: "helicopter approaching from a distance, passing overhead loudly and receding, full doppler arc, open field",
        why: "Naming all three stages gets you a complete pass in one render rather than a hover you have to automate into a flyby.",
      },
      {
        label: "Rotor rhythm",
        prompt: "helicopter hovering overhead, heavy rhythmic rotor thump with a turbine whine underneath, outdoor, seamless loop",
        why: "Helicopters are two sounds stacked — a slow blade thump and a fast turbine whine — and naming both is what stops it sounding like a fan.",
      },
    ],
    craft: [
      {
        heading: "Distance is a filter you should not apply yourself",
        body: "Air absorbs high frequencies far more than low ones, so a distant aircraft is not a quiet close one — it is a fundamentally different spectrum with the attack smeared by travel time. Prompting the distance directly gets you that physics for free. Rolling off the top of a close recording gets you something that sounds muffled rather than far away, which is the usual reason a stock flyby refuses to sit behind a wide shot.",
      },
      {
        heading: "Doppler only exists if it passes",
        body: "A hovering helicopter has no pitch shift; a passing one has a pronounced one. Mixing these up is the most common aviation error in edits — a hover loop panned across the stereo field still reads as stationary because the pitch never moves. If the aircraft crosses frame, ask for the doppler explicitly and render the whole arc in one clip so the shift is continuous.",
      },
      {
        heading: "Interiors are air, not engines",
        body: "The dominant sound inside a cruising airliner is not the engines, it is boundary-layer air rushing over the fuselage — broad, smooth, almost pink noise, with the engine drone well beneath it. Prompting \"steady broadband air rush with a low engine drone\" produces something that immediately reads as a cabin, whereas prompting the engines produces something that sounds like standing outside one.",
      },
    ],
    faqs: faqs({
      question: "Why does my flyby sound like it never moves?",
      answer:
        "Because the prompt described a state rather than a journey. \"Helicopter flying\" gives the model a steady loop; \"approaching from a distance, passing overhead loudly and receding, full doppler arc\" gives it a trajectory. The other half is length — a pass needs eight to twelve seconds to be legible, and squeezing one into three gives you the middle of the arc with the approach and departure cut off.",
    }),
    related: ["engine", "ambience", "wind", "machinery", "sci-fi", "train"],
  },
};

export const FOLEY_AND_TRANSPORT: SfxCategory[] = [
  GLASS,
  METAL,
  WOOD,
  PAPER,
  CLOTH,
  KEYBOARD,
  CLOCK,
  BELL,
  CAR,
  ENGINE,
  TRAIN,
  AIRCRAFT,
];
