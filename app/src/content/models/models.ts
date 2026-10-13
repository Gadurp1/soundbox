/**
 * Every model Soundbox can run, written up for `/models`.
 *
 * ## Where these facts come from
 *
 * - **Specs** (family, sample rate, channels, max duration, VRAM, weights
 *   globs, listed-vs-opt-in, verified) are transcribed from
 *   `server/src/models/audiocpp_models_catalog.json`. That file is the
 *   shipped catalog and the app's source of truth; a number here that
 *   disagrees with it is a bug in this file.
 * - **How the engine works** is from `docs/AUDIOCPP.md` and audio.cpp's own
 *   README (https://github.com/0xShug0/audio.cpp), read 2026-08-25.
 * - **Licences** were researched model by model on 2026-08-25 against
 *   upstream licence files, Hugging Face model cards and HF API metadata.
 *   Every finding carries the links it came from. Two secondary sources
 *   recur and are worth naming once:
 *   - the conversion table on
 *     https://huggingface.co/audio-cpp/audio.cpp-gguf, which lists an
 *     "Original model license" per GGUF package. It is the converter's
 *     label, not the rights-holder's, and where it disagrees with upstream
 *     we say so in `correction` and follow **upstream**, restrictively.
 *   - that repo's own terms: "Use and redistribution are governed by the
 *     corresponding original model license listed above."
 *
 * ## The rewrite
 *
 * This file previously described MOSS-SoundEffect v2.0, AudioLDM 2, Stable
 * Audio Open, TangoFlux and AudioGen, sourced from a Python backend
 * (`backend/src/soundbox/models/*.py`) that no longer exists, with
 * `uv pip install` instructions for virtualenvs and torch pins that apply to
 * nothing. None of those five models are in the catalog. Everything below is
 * a rebuild against what actually ships.
 *
 * ## The rule
 *
 * No licence claim without a link, and no guessing. Where a licence could not
 * be confirmed the entry says `commercial: "unknown"` and the page prints
 * "we could not confirm" — see `types.ts` for why that state exists, and
 * `docs/AUDIOCPP.md`'s note that omitting a licence means "Unspecified / not
 * commercial", because a wrong permissive default is worse than an honest
 * unknown.
 */

import type { LicenseFinding, ModelContent, ModelLink } from "./types";

// ---------------------------------------------------------------------------
// Link helpers
// ---------------------------------------------------------------------------

const hf = (repo: string): ModelLink => ({
  label: `${repo} on Hugging Face`,
  href: `https://huggingface.co/${repo}`,
});

const gh = (path: string, label?: string): ModelLink => ({
  label: label ?? `${path} on GitHub`,
  href: `https://github.com/${path}`,
});

/** The converter's own licence table. Cited on every entry because it is what
 *  the *converted GGUF we actually download* claims, which is a different
 *  claim from the upstream rights-holder's. */
const GGUF_TABLE: ModelLink = {
  label: "audio.cpp GGUF table — licence per converted package",
  href: "https://huggingface.co/audio-cpp/audio.cpp-gguf",
};

const APACHE_TEXT: ModelLink = {
  label: "Apache License 2.0, full text",
  href: "https://www.apache.org/licenses/LICENSE-2.0",
};

/** Every catalog entry downloads from the shared conversion repo unless it
 *  names its own; this is the repo id the specs table shows. */
const GGUF_REPO = "audio-cpp/audio.cpp-gguf";

// ---------------------------------------------------------------------------
// Licence findings shared by several models
// ---------------------------------------------------------------------------

/** Apache-2.0, verified from the upstream repo. Genuinely unconditional for
 *  commercial use — the only recurring nuance is that a model card's "please
 *  don't clone voices" paragraph is *not* part of Apache-2.0, and we say so
 *  on the entries where such a paragraph exists. */
function apache2(sources: ModelLink[], output?: string): LicenseFinding {
  return {
    name: "Apache License 2.0",
    commercial: "yes",
    summary:
      "Apache-2.0. Commercial use is permitted outright, with no revenue cap and no research-only carve-out. You must keep the copyright and licence notices when you redistribute the weights themselves.",
    conditions: [],
    output:
      output ??
      "Apache-2.0 says nothing about generated output and asserts no rights over it. The audio you make is yours as far as this licence is concerned — which is not the same as saying it is free of every other claim.",
    gated: "no",
    sources: [...sources, APACHE_TEXT, GGUF_TABLE],
    readByUs: true,
  };
}

function mit(sources: ModelLink[], summaryExtra = ""): LicenseFinding {
  return {
    name: "MIT License",
    commercial: "yes",
    summary: `MIT. Commercial use permitted, no threshold, no field-of-use restriction; keep the copyright notice when redistributing the weights.${summaryExtra ? ` ${summaryExtra}` : ""}`,
    conditions: [],
    output:
      "MIT has no output clause and claims nothing over what the model generates.",
    gated: "no",
    sources: [...sources, GGUF_TABLE],
    readByUs: true,
  };
}

/**
 * The Stability AI Community License, shared by all three Stable Audio 3.0
 * entries. The revenue figure is the one clause everybody needs and nobody
 * remembers, so it is quoted rather than paraphrased.
 */
const STABILITY_COMMUNITY: LicenseFinding = {
  name: "Stability AI Community License Agreement",
  commercial: "conditional",
  summary:
    "Free to use commercially — including selling what you make — while you or your organisation are under USD $1,000,000 in annual revenue. Above that you need an Enterprise licence from Stability AI. Note the threshold is measured against your total annual revenue, not just revenue from the model.",
  conditions: [
    'Section III: "If at any time You or Your Affiliate(s), either individually or in aggregate, generate more than USD $1,000,000 in annual revenue" you must obtain an Enterprise License.',
    "The weights are gated on Hugging Face: you accept the terms with your own account and supply your own access token. Soundbox cannot and will not do that for you.",
    "The models embed a pre-trained T5Gemma text encoder redistributed under the Gemma Terms of Use, which you accept as part of the same gate. The Gemma terms were not reviewed for this page, so what they add is not documented here.",
  ],
  output:
    'Separate clause, and a favourable one. Section IV(c)(iii): "As between You and Stability AI, You own any outputs generated from the Models or Derivative Works to the extent permitted by applicable law." Stability\'s own FAQ says you may therefore use those outputs at your discretion. Output ownership is not written as depending on the $1M threshold — the threshold governs your right to run the model. That last sentence is a reading of the two clauses together, not something the licence states in those words.',
  gated: "yes",
  sources: [
    { label: "Stability AI licence FAQ (the $1M figure)", href: "https://stability.ai/license" },
    {
      label: "Stability AI Community License Agreement, full text",
      href: "https://stability.ai/community-license-agreement",
    },
    GGUF_TABLE,
  ],
  readByUs: true,
};

/** ACE-Step 1.5, both variants. The catalog's own entry is wrong and the
 *  correction is on the page rather than quietly patched. */
const ACE_STEP_MIT: LicenseFinding = {
  name: "MIT License",
  commercial: "yes",
  summary:
    "MIT, and unusually clean for a music model. Commercial use permitted with no threshold. The project also states its training data was licensed, royalty-free, public-domain or synthetic, which is the question that actually bites with music generators — though that is a claim on the model card, not a term of the licence.",
  conditions: [],
  output:
    "MIT contains no output clause. The model card asserts generated music may be used commercially; treat that as the publisher's stated intent rather than a contractual grant, because there is no separate output-terms document to rely on.",
  gated: "no",
  sources: [
    {
      label: "ACE-Step-1.5 LICENSE (MIT, © 2026 ACEStep)",
      href: "https://github.com/ace-step/ACE-Step-1.5/blob/main/LICENSE",
    },
    hf("ACE-Step/acestep-v15-base"),
    GGUF_TABLE,
  ],
  readByUs: true,
  correction:
    'The shipped catalog entry says "Apache-2.0 (unverified)". That is wrong on both counts: the LICENSE file in ace-step/ACE-Step-1.5 is MIT, and it is now verified. Both are permissive and permit commercial use, so nobody was misled about what they could do — but the name was incorrect, and the 1.5 models live in the ACE-Step-1.5 repo, not the older ace-step/ACE-Step one the shipped catalog links to.',
};

/** Qwen3 TTS, all four variants: same licence, verified per-repo. */
function qwen3Tts(repo: string): LicenseFinding {
  return apache2(
    [hf(repo), gh("QwenLM/Qwen3", "Qwen3 upstream project")],
    "Apache-2.0 claims nothing over output. The Qwen3 TTS cards carry no acceptable-use policy and no voice-cloning consent clause at all, which means obtaining consent for any reference voice you supply is entirely your own responsibility rather than a licence condition.",
  );
}

/** Pocket TTS, all five language entries. The weights and the *voices* are
 *  two different licence questions, which is the interesting part. */
function pocketTts(language: string): LicenseFinding {
  return {
    name: "CC-BY-4.0 (weights) + MIT (code)",
    commercial: "conditional",
    summary:
      "The weights are CC-BY-4.0 and the code is MIT, so commercial use is permitted with attribution. Two things complicate it: the upstream repo is gated (auto-approved, but you accept prohibited-use terms to get the files), and the bundled speaker voices carry their own separate licences.",
    conditions: [
      "Attribution, per CC-BY-4.0.",
      'The gate prompt prohibits "voice impersonation or cloning without explicit and lawful consent", and misinformation or deception including presenting generated audio as a genuine recording. Kyutai disclaims all liability for non-compliant use.',
      "The voices are licensed separately from the model. Kyutai's kyutai/tts-voices repo is per-collection: voice-zero and voice-donations are CC0, vctk and cml-tts are CC-BY-4.0, but expresso and ears are CC-BY-NC-4.0 — non-commercial. Which collection a given speaker id comes from decides whether your use is commercial-safe.",
    ],
    output:
      "No output-ownership clause and no watermarking statement found on the model card. No output terms could be confirmed either way.",
    gated: "yes",
    sources: [
      hf("kyutai/pocket-tts"),
      gh("kyutai-labs/pocket-tts"),
      { label: "kyutai/tts-voices — per-collection voice licences", href: "https://huggingface.co/kyutai/tts-voices" },
      GGUF_TABLE,
    ],
    readByUs: true,
    correction: `The ${language} package's speaker ids (alba, cosette, eponine, fantine, javert, marius, peter_yearsley and the rest) look like public-domain LibriVox readers and Les Misérables characters, which would put them in the CC0 voice-zero collection. The per-name mapping could not be confirmed: the voice-zero collection is not a fetchable Hugging Face repo, and there is a separate CC-BY-4.0 "alba-mackenna" collection that muddies at least one of those names. Treat the individual voice licences as unconfirmed.`,
  };
}

/** Irodori TTS, all three variants. */
function irodoriTts(repo: string): LicenseFinding {
  return {
    ...mit([hf(repo), gh("Aratako/Irodori-TTS")]),
    output:
      "MIT claims nothing over output, but two card-level facts matter in practice: the VoiceDesign and v4 models embed SilentCipher invisible watermarks in what they generate, and the card notes a text-described voice can resemble a real person as a probabilistic artifact rather than by design. Neither is a licence term.",
    conditions: [],
    summary:
      "MIT, verified on the upstream repo and the model cards. Commercial use permitted with no threshold. The cards add an ethics section — no cloning a real person's voice without explicit consent, no deepfakes — which is stated intent, not a term of MIT.",
  };
}

/** dots.tts SOAR and MF — Apache-2.0 and confirmed. Edit is deliberately
 *  *not* built from this; see its own entry. */
function dotsTts(repo: string): LicenseFinding {
  return apache2(
    [hf(repo), gh("studio-dots-ai/dots.tts")],
    'Apache-2.0 asserts nothing over output. The card asks users not to impersonate, mislead or violate consent, and to disclose synthetic audio — advisory, not a licence condition.',
  );
}

// ---------------------------------------------------------------------------
// The catalog
// ---------------------------------------------------------------------------

export const MODELS: ModelContent[] = [
  // -------------------------------------------------------------------------
  // Sound effects
  // -------------------------------------------------------------------------
  {
    slug: "stable-audio-3-sfx",
    catalogId: "audiocpp-stable-audio-3-sfx",
    name: "Stable Audio 3.0 SFX",
    vendor: "Stability AI",
    category: "sfx",
    tier: "listed",
    verified: true,
    capabilities: ["generation"],
    metaTitle: "Stable Audio 3.0 SFX — run it locally | Soundbox",
    metaDescription:
      "Stability AI's sound-effect model, run through audio.cpp from a quantised GGUF: 44.1kHz stereo, ~2.5 GB VRAM, Stability Community License with a $1M revenue cap.",
    tagline: "The default sound-effect model: 44.1kHz stereo, eight steps, about 2.5 GB of VRAM.",
    distinctiveness:
      "This is the model Soundbox reaches for first, and the one the prompting advice in the README is written against. Running it through audio.cpp's C++/ggml runtime from a quantised GGUF rather than through torch buys a much smaller footprint and removes the Python stack entirely; the cost is that the model reloads on every generation, so a batch of short clips pays that overhead each time. It answers to physical description — material, action, space — not to mood words.",
    spec: {
      vendor: "Stability AI",
      family: "stable_audio",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Stable-Audio-3-Small-SFX-GGUF/stable-audio-3-small-sfx-q8_0.gguf"],
      maxDurationS: 120,
      sampleRate: 44100,
      channels: 2,
      vramEstimateMb: 2500,
    },
    license: STABILITY_COMMUNITY,
    downloadSize: "~2 GB",
    quirks: [
      "The upstream weights are gated. Accept Stability's terms on your own Hugging Face account and put an access token in Settings before Soundbox can download anything.",
      "Defaults are 8 steps at CFG 1.0, and the catalog caps CFG at 3.0. This is a few-step model; pushing guidance hard makes it worse, not more literal.",
      "No negative prompt. No family on the audio.cpp path exposes one, so the composer does not show that field for this model.",
    ],
    sources: [
      hf("stabilityai/stable-audio-3-small-sfx"),
      gh("Stability-AI/stable-audio-3", "Stable Audio 3 inference code (MIT)"),
      GGUF_TABLE,
    ],
  },

  // -------------------------------------------------------------------------
  // Music
  // -------------------------------------------------------------------------
  {
    slug: "stable-audio-3-small-music",
    catalogId: "audiocpp-stable-audio-3-small-music",
    name: "Stable Audio 3.0 Small Music",
    vendor: "Stability AI",
    category: "music",
    tier: "listed",
    verified: true,
    capabilities: ["generation"],
    metaTitle: "Stable Audio 3.0 Small Music — run it locally | Soundbox",
    metaDescription:
      "The music-tuned sibling of Stable Audio 3.0 SFX: same loader, same GGUF repo, different fine-tune. Stability Community License, $1M revenue cap, gated weights.",
    tagline: "Same loader and footprint as the SFX model, fine-tuned for music instead.",
    distinctiveness:
      "Mechanically identical to the SFX entry — same stable_audio loader, same conversion repo, same 2.5 GB and same eight-step defaults — and different only in the fine-tune. Instrumental: it takes no lyrics. If you want sung vocals, ACE-Step or MiniMax Music 3 are the entries to look at instead.",
    spec: {
      vendor: "Stability AI",
      family: "stable_audio",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Stable-Audio-3-Small-Music-GGUF/stable-audio-3-small-music-q8_0.gguf"],
      maxDurationS: 120,
      sampleRate: 44100,
      channels: 2,
      vramEstimateMb: 2500,
    },
    license: STABILITY_COMMUNITY,
    downloadSize: "~2 GB",
    quirks: [
      "Gated upstream, exactly like the SFX model: your own Hugging Face account, your own token.",
      "No lyrics support. It is an instrumental model on this path.",
    ],
    sources: [
      hf("stabilityai/stable-audio-3-small-music"),
      gh("Stability-AI/stable-audio-3", "Stable Audio 3 inference code (MIT)"),
      GGUF_TABLE,
    ],
  },
  {
    slug: "ace-step",
    catalogId: "audiocpp-ace-step",
    name: "ACE-Step 1.5 Turbo",
    vendor: "ACE Studio / StepFun",
    category: "music",
    tier: "listed",
    verified: true,
    capabilities: ["generation", "lyrics", "extend", "cover", "repaint"],
    metaTitle: "ACE-Step 1.5 Turbo — lyrics-conditioned music locally | Soundbox",
    metaDescription:
      "Lyrics-conditioned vocal music at 48kHz stereo through audio.cpp, with extend, cover and repaint. MIT licensed — verified, correcting the shipped catalog's Apache-2.0 label.",
    tagline: "Sings. Distilled for few-step sampling, and the only listed model that can extend, cover and repaint.",
    distinctiveness:
      "The most capable entry in the catalog by a distance: it is lyrics-conditioned, so the prompt sets genre and production while the lyrics are what gets sung, and it is the only listed model that also does the three audio-to-audio routes — extend a clip past its end with the original preserved sample-for-sample, re-render a clip in a new style at its original length, or regenerate a window inside it. The turbo variant is distilled for few-step sampling, which is what makes all of that usable at eight steps.",
    spec: {
      vendor: "ACE Studio / StepFun",
      family: "ace_step",
      hfRepo: GGUF_REPO,
      weightsGlob: ["ACE-Step1.5-GGUF/turbo/ace-step-1.5-turbo-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 48000,
      channels: 2,
      vramEstimateMb: 4000,
    },
    license: ACE_STEP_MIT,
    downloadSize: "~3.5 GB",
    quirks: [
      "48kHz, unlike everything else here. Splitting an ACE-Step render into stems means resampling to 44.1kHz first, because htdemucs accepts nothing else — Soundbox does that for you.",
      "Extend is implemented as a repaint whose window starts past the end of the source. That is why the original survives bit-for-bit instead of being re-rendered.",
      "Distilled: 8 steps at CFG 1.0 is the intended operating point, not a compromise.",
    ],
    sources: [
      gh("ace-step/ACE-Step-1.5", "ACE-Step 1.5 upstream project"),
      hf("ACE-Step/acestep-v15-xl-turbo"),
      GGUF_TABLE,
    ],
  },
  {
    slug: "minimax-music3",
    catalogId: "audiocpp-minimax-music3",
    name: "MiniMax Music 3",
    vendor: "MiniMax",
    category: "music",
    tier: "listed",
    verified: true,
    capabilities: ["generation", "lyrics"],
    metaTitle: "MiniMax Music 3 — lyrics-conditioned music locally | Soundbox",
    metaDescription:
      "A five-component package model rather than one GGUF, run locally through audio.cpp. MiniMax Music 3 Community License: commercial use under $20M revenue, with attribution.",
    tagline: "Lyrics-conditioned, ~10 GB of VRAM, and the only entry that loads a package of five components.",
    distinctiveness:
      "The heaviest listed model and the one with the most unusual shape. Every other entry is one GGUF file; this one is a directory that audio.cpp resolves five components from — condition encoder, language model, flow transformer, RVQ depth decoder, vocoder — plus tokenizer and config JSON. Its licence is also the one most likely to catch a real business: commercial use is fine, but it is capped by revenue and it requires you to display the model's name in your product's interface.",
    spec: {
      vendor: "MiniMax",
      family: "minimax_music3",
      hfRepo: "audio-cpp/MiniMax-Music3-GGUF",
      weightsGlob: [
        "config.json",
        "config/**",
        "tokenizer/**",
        "language_model_q4_0.gguf",
        "transformer_q4_0.gguf",
        "rvq_depth_decoder_q8_0.gguf",
        "condition_encoder.gguf",
        "vocoder.gguf",
      ],
      maxDurationS: 120,
      sampleRate: 44100,
      channels: 2,
      vramEstimateMb: 10000,
    },
    license: {
      name: "MiniMax-Music3 Community License",
      commercial: "conditional",
      summary:
        "Commercial use is permitted but conditioned three ways: a revenue cap, a mandatory attribution notice in your product's UI, and safeguards if you offer it as a hosted service. Read it before you ship — the attribution duty in particular is easy to miss and easy to comply with.",
      conditions: [
        'Prior written authorisation from MiniMax is required "if the aggregate yearly revenue generated from such products and services … exceeds 20 million US dollars".',
        'Attribution: "You shall prominently display ‘MiniMax-Music3’ on the user interface of commercial product or service that uses the Software."',
        'If you host it for others, you must implement "reasonable and proportionate technical and organizational safeguards" against violating uses and outputs.',
      ],
      output:
        "The licence makes no explicit grant or assignment of output ownership. Its Acceptable Use Policy does restrict output: no IP-infringing content, no disinformation, and content published publicly must be clearly labelled as machine-generated. No explicit “MiniMax claims no rights over outputs” sentence appears in the Music 3 licence — that language appears in MiniMax's H3 licence, not this one, so do not assume it carries across.",
      gated: "no",
      sources: [
        {
          label: "MiniMax-Music3 LICENSE (upstream)",
          href: "https://huggingface.co/MiniMaxAI/MiniMax-Music3/blob/main/LICENSE",
        },
        hf("MiniMaxAI/MiniMax-Music3"),
        hf("audio-cpp/MiniMax-Music3-GGUF"),
      ],
      readByUs: true,
      correction:
        'The shipped catalog entry admits the licence was "not read" and asks you to treat it as conditional. It is conditional, and now it has been read: the conditions are the $20M revenue cap, the UI attribution notice, and hosted-service safeguards.',
    },
    downloadSize: "~8.5 GB",
    quirks: [
      "It refuses to run without lyrics at all. When you give none, Soundbox supplies an explicit [instrumental] marker rather than surfacing an error you could do nothing about.",
      "Component filenames are compiled into the audio.cpp binary and checked before any option is parsed, so no --session-option or --load-option can redirect them. The catalog entry mirrors audio.cpp 0.6.1's minimax_music3_q4_0 package exactly, mixed quantisation and all.",
      "~10 GB of VRAM. This is the entry most likely to fall back to CPU on a modest card, which shows up as generation being far slower than expected.",
    ],
    sources: [
      hf("MiniMaxAI/MiniMax-Music3"),
      gh("MiniMax-AI/MiniMax-Music3", "MiniMax Music 3 upstream project"),
      hf("audio-cpp/MiniMax-Music3-GGUF"),
    ],
  },
  {
    slug: "ace-step-base",
    catalogId: "audiocpp-ace-step-base",
    name: "ACE-Step 1.5 Base",
    vendor: "ACE Studio / StepFun",
    category: "music",
    tier: "extra",
    verified: false,
    capabilities: ["generation", "lyrics", "extend", "cover", "repaint"],
    metaTitle: "ACE-Step 1.5 Base — the non-distilled sibling | Soundbox",
    metaDescription:
      "The base fine-tune the ACE-Step turbo was distilled from: slower, wants real guidance and roughly 3x the steps, same MIT licence. Opt-in and untested here.",
    tagline: "What the turbo was distilled from — slower, needs real guidance, higher ceiling.",
    distinctiveness:
      "Same ace_step loader, same conversion repo, the non-distilled fine-tune. It wants roughly three times the steps and real guidance — 27 steps at CFG 4.0 are its defaults, against the turbo's 8 at 1.0 — and in exchange you get the quality ceiling the turbo was distilled down from. Worth trying when a turbo render is nearly right but thin.",
    spec: {
      vendor: "ACE Studio / StepFun",
      family: "ace_step",
      hfRepo: GGUF_REPO,
      weightsGlob: ["ACE-Step1.5-GGUF/base/ace-step-1.5-base-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 48000,
      channels: 2,
      vramEstimateMb: 4000,
    },
    license: ACE_STEP_MIT,
    downloadSize: "~3.5 GB",
    quirks: [
      "The shared ace_step advanced-params row caps num_inference_steps at 20, but that ceiling belongs to the turbo. The main Steps field passes through unclamped, which is what you want here.",
      "Never run end-to-end through this adapter. Unlike the turbo entry, not even generation has been tested.",
    ],
    sources: [
      gh("ace-step/ACE-Step-1.5", "ACE-Step 1.5 upstream project"),
      hf("ACE-Step/acestep-v15-base"),
      GGUF_TABLE,
    ],
  },
  {
    slug: "stable-audio-3-medium",
    catalogId: "audiocpp-stable-audio-3-medium",
    name: "Stable Audio 3.0 Medium",
    vendor: "Stability AI",
    category: "music",
    tier: "extra",
    verified: false,
    capabilities: ["generation"],
    metaTitle: "Stable Audio 3.0 Medium — the 2B sibling | Soundbox",
    metaDescription:
      "The larger Stable Audio 3.0, ~5 GB VRAM, same stable_audio loader and same Stability Community License. Opt-in and untested here.",
    tagline: "The 2B sibling of the Small models: twice the VRAM, same loader, same licence.",
    distinctiveness:
      "Larger than the two Small entries at roughly 5 GB of VRAM, and otherwise identical in how it is driven. Note that the fourth member of the Stable Audio 3.0 family, Large, is not open-weight at all — it is API and enterprise only — so this is the biggest one you can run locally.",
    spec: {
      vendor: "Stability AI",
      family: "stable_audio",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Stable-Audio-3-Medium-GGUF/stable-audio-3-medium-q8_0.gguf"],
      maxDurationS: 120,
      sampleRate: 44100,
      channels: 2,
      vramEstimateMb: 5000,
    },
    license: STABILITY_COMMUNITY,
    downloadSize: "~4 GB",
    quirks: [
      "Gated upstream like the rest of the family.",
      "Opt-in and untested here — the numbers below are read off the catalog, not measured.",
    ],
    sources: [
      hf("stabilityai/stable-audio-3-medium"),
      gh("Stability-AI/stable-audio-3", "Stable Audio 3 inference code (MIT)"),
      GGUF_TABLE,
    ],
  },
  {
    slug: "heartmula",
    catalogId: "audiocpp-heartmula",
    name: "HeartMuLa",
    vendor: "HeartMuLa",
    category: "music",
    tier: "extra",
    verified: false,
    capabilities: ["generation"],
    metaTitle: "HeartMuLa — music generation via audio.cpp | Soundbox",
    metaDescription:
      "Music generation through the heartmula loader. Apache-2.0 per the upstream README and the HF tag — an upgrade on the shipped catalog's 'Unknown'. Opt-in and untested here.",
    tagline: "Apache-2.0 music generation — permissively licensed, but nobody here has run it.",
    distinctiveness:
      "A 3B open-source music model with its own codec and transcriptor released alongside it. The shipped catalog calls this the least verified entry it has, and that remains true of the numbers — every default below was read off a sibling rather than measured. The licence, at least, is now checked, and it is the most permissive of any music model in this catalog.",
    spec: {
      vendor: "HeartMuLa",
      family: "heartmula",
      hfRepo: GGUF_REPO,
      weightsGlob: ["HeartMuLa-GGUF/heartmula-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 2,
      vramEstimateMb: 4000,
    },
    license: {
      name: "Apache License 2.0",
      commercial: "yes",
      summary:
        "Apache-2.0, per the upstream README and the license tag on the model repo, and corroborated by audio.cpp's conversion table. Commercial use permitted with no threshold.",
      conditions: [],
      output: "Apache-2.0 has no output clause. No separate output or acceptable-use document was found.",
      gated: "no",
      sources: [
        gh("HeartMuLa/heartlib", "HeartMuLa upstream project"),
        hf("HeartMuLa/HeartMuLa-oss-3B"),
        APACHE_TEXT,
        GGUF_TABLE,
      ],
      readByUs: false,
      correction:
        'The shipped catalog says the licence is "Unknown" and the vendor "Unverified". Both are now better than that, with a caveat: the Apache-2.0 claim comes from the repository README and the Hugging Face licence tag, but the LICENSE file itself would not load, so the licence text has not been reviewed on this one. No company behind the project could be identified — "HeartMuLa" is the only name it can be attributed to.',
    },
    downloadSize: null,
    quirks: [
      "Every numeric default in the specs table is inherited, not measured. Check them against the model card before real use.",
      "Opt-in: switch it on in Settings before it appears in the picker.",
    ],
    sources: [
      gh("HeartMuLa/heartlib", "HeartMuLa upstream project"),
      hf("HeartMuLa/HeartMuLa-oss-3B"),
      { label: "HeartMuLa paper (arXiv)", href: "https://arxiv.org/pdf/2601.10547" },
    ],
  },
  {
    slug: "minimax-h3",
    catalogId: "audiocpp-minimax-h3",
    name: "MiniMax H3",
    vendor: "MiniMax",
    category: "music",
    tier: "extra",
    verified: false,
    capabilities: ["generation"],
    metaTitle: "MiniMax H3 — the 36 GB outlier | Soundbox",
    metaDescription:
      "The largest entry in the catalog by far, and the one whose licence excludes the US, EU, UK and South Korea outright. Opt-in, untested, and gated upstream.",
    tagline: "~36 GB of VRAM, and a licence that excludes the US, EU, UK and South Korea by name.",
    distinctiveness:
      "The outlier of the catalog in every direction. It needs roughly 36 GB of VRAM — an order of magnitude more than the Stable Audio entries — and it is not really an audio model at all: upstream it is a very large omni-modal model that generates video with native audio, catalogued here for its audio side. Its licence is also the only one in this catalog with a geographic exclusion, and that exclusion covers most of the people likely to be reading this.",
    spec: {
      vendor: "MiniMax",
      family: "minimax_h3",
      hfRepo: GGUF_REPO,
      weightsGlob: [
        "MiniMax-H3-Q4-GGUF/configuration.json",
        "MiniMax-H3-Q4-GGUF/FL2VA/processor/**",
        "MiniMax-H3-Q4-GGUF/text_encoder_q4_k.gguf",
        "MiniMax-H3-Q4-GGUF/dit.gguf",
        "MiniMax-H3-Q4-GGUF/audio_vae_folded_f16.gguf",
        "MiniMax-H3-Q4-GGUF/video_vae.gguf",
      ],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 2,
      vramEstimateMb: 35900,
    },
    license: {
      name: "MiniMax H3 Community License Agreement",
      commercial: "conditional",
      summary:
        "Commercial use is permitted under a revenue cap and an attribution duty, like MiniMax Music 3 — but with an additional restriction that dominates everything else: the licence's “Applicable Territory” is the world minus the EU, the UK, South Korea and the USA. If you are in one of those, you need a separate application to MiniMax before you use it at all.",
      conditions: [
        "Territory: the EU, UK, South Korea and USA are excluded from the standard grant; the model card carries a separate application form for those regions.",
        "Prior written authorisation required above US$20M yearly revenue.",
        'Attribution: you must "prominently display ‘MiniMax H3’ on the user interface".',
        "The weights are gated: you accept the Community License Agreement on Hugging Face to download them.",
      ],
      output:
        "This licence does answer the output question, and favourably: MiniMax “claims no rights over the Outputs you generate”, while making you “entirely responsible for the Outputs and any subsequent use thereof”. Two restrictions ride along: outputs may not be used to improve competing AI models, and machine-generated content must be disclosed in public settings.",
      gated: "yes",
      sources: [
        {
          label: "MiniMax H3 LICENSE (upstream)",
          href: "https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE",
        },
        {
          label: "MiniMax's own Q&A about the H3 licence",
          href: "https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/docs/QA-about-License.md",
        },
        hf("MiniMaxAI/MiniMax-H3"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog lists this licence as "Unknown". It is not unknown — it is the MiniMax H3 Community License, and it is the most restrictive licence in this catalog for a reader in the US, UK, EU or South Korea.',
    },
    downloadSize: "~8.45 GB of a 58 GB repo",
    quirks: [
      "A package model living under a prefix in the shared repo, so the catalog entry needs weights_root to point --model at the right subdirectory.",
      "The repo it lives in is 58 GB; the entry pulls about 8.45 GB of it. That bounded download is the entire reason weights_glob accepts a list.",
      "~36 GB of VRAM. On anything smaller this falls back to CPU, where it is not practically usable.",
    ],
    sources: [
      hf("MiniMaxAI/MiniMax-H3"),
      gh("MiniMax-AI/MiniMax-H3", "MiniMax H3 upstream project"),
      GGUF_TABLE,
    ],
  },

  // -------------------------------------------------------------------------
  // Utility — separation
  // -------------------------------------------------------------------------
  {
    slug: "htdemucs-sep",
    catalogId: "audiocpp-htdemucs-sep",
    name: "HTDemucs stem separation",
    vendor: "Meta AI (Demucs)",
    category: "utility",
    tier: "extra",
    verified: false,
    capabilities: ["separation"],
    metaTitle: "HTDemucs stem separation — locally via audio.cpp | Soundbox",
    metaDescription:
      "Splits a mix into vocals, drums, bass and other. The code is MIT; the pretrained weights are research-only per the maintainer — a distinction the shipped catalog got wrong.",
    tagline: "Four stems — vocals, drums, bass, other. MIT code, but research-only weights.",
    distinctiveness:
      "Not a generator: it takes a sound you already have and pulls it apart, and you run it from a sound's “Split into stems” action rather than from a prompt. It is also the entry where the difference between a code licence and a weights licence bites hardest, and where the shipped catalog was wrong.",
    spec: {
      vendor: "Meta AI (Demucs)",
      family: "htdemucs",
      hfRepo: GGUF_REPO,
      weightsGlob: ["HTDemucs-GGUF/htdemucs-q8_0.gguf"],
      maxDurationS: 600,
      sampleRate: 44100,
      channels: 2,
      vramEstimateMb: 3000,
    },
    license: {
      name: "MIT (code) / research-only (weights)",
      commercial: "no",
      summary:
        "The Demucs repository is MIT, and that is what everyone repeats — including audio.cpp's conversion table and, until now, this catalog. But the MIT licence covers the code. Demucs' maintainer has stated plainly that it does not cover the pretrained weights, which are provided for scientific purposes only. Since the weights are the thing you download and run, it is treated here as non-commercial.",
      conditions: [
        'Maintainer statement, verbatim: "The model weights are not covered by the MIT license, and are provided only for scientific purposes."',
        "The upstream README is silent on the weights, which is why the MIT label spread so widely. Third-party mirrors relabel the weights MIT; that relabelling is not backed by any statement from the rights-holder that could be found.",
      ],
      output:
        "Neither the licence nor the README says anything about separated output. Note that the rights in stems you extract are mostly governed by the rights in the audio you fed in, not by this model's licence at all — separating a track you do not have rights to does not create rights in the pieces.",
      gated: "no",
      sources: [
        {
          label: 'Maintainer: weights "provided only for scientific purposes"',
          href: "https://github.com/facebookresearch/demucs/issues/327#issuecomment-1134828611",
        },
        gh("facebookresearch/demucs", "Demucs upstream project (MIT code)"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "MIT (unverified)" with commercial use "yes". That is wrong, and this page is the correction: MIT is the licence on the code, and the maintainer has said in as many words that it does not extend to the weights. The widely repeated claim that the v4 weights are CC-BY-NC-4.0 also could not be confirmed — Demucs v1 was, but no current upstream page states it for HTDemucs. The confirmed constraint is "scientific purposes only", which is why this is shown as non-commercial rather than conditional.',
    },
    downloadSize: null,
    quirks: [
      "Requires exactly 44.1kHz. Anything else fails with a sample-rate mismatch, so Soundbox resamples the source first — a 48kHz ACE-Step render being split is the common case.",
      "The source goes in as the audio input, not the reference input. The reference input is for voice conversion and style transfer; using it here fails with an unrelated-sounding contract error.",
      "Stem names and count are read back from whatever the output directory contains rather than assumed, because this has not been run end-to-end here. htdemucs emits vocals, drums, bass and other.",
    ],
    sources: [
      gh("facebookresearch/demucs", "Demucs upstream project"),
      GGUF_TABLE,
    ],
  },
  {
    slug: "bs-roformer-sep",
    catalogId: "audiocpp-bs-roformer-sep",
    name: "BS-RoFormer stem separation",
    vendor: "Community (BS-RoFormer)",
    category: "utility",
    tier: "extra",
    verified: false,
    capabilities: ["separation"],
    metaTitle: "BS-RoFormer stem separation — locally via audio.cpp | Soundbox",
    metaDescription:
      "Band-split RoFormer separation. The reference code is MIT, but the checkpoint's own licence is undeclared upstream and could not be confirmed.",
    tagline: "MIT reference code, and a checkpoint whose licence nobody upstream has ever declared.",
    distinctiveness:
      "The separation family with the least licence discipline anywhere in this catalog. The reference implementation is MIT and the widely used training repo is MIT, but the actual checkpoints are listed by author across GitHub releases and Hugging Face with no licence stated for any of them, and third-party mirrors fill the gap by inventing tags. That is a real gap, not a formality, and it is not papered over here.",
    spec: {
      vendor: "Community (BS-RoFormer)",
      family: "bs_roformer",
      hfRepo: GGUF_REPO,
      weightsGlob: ["BS-RoFormer-ep368-GGUF/bs-roformer-ep368-q8_0.gguf"],
      maxDurationS: 600,
      sampleRate: 44100,
      channels: 2,
      vramEstimateMb: 3000,
    },
    license: {
      name: "Unconfirmed (MIT code; checkpoint licence undeclared)",
      commercial: "unknown",
      summary:
        "No licence could be confirmed for these weights. The reference implementation and the training repo are both MIT, and audio.cpp's conversion table labels this package Apache-2.0 — but the upstream checkpoint list declares no licence for any of its models, and no statement from whoever trained this checkpoint could be found. Two secondary labels that disagree with each other is not a licence.",
      conditions: [
        "Treat as unlicensed until you get an answer from the checkpoint's author. The argument that a release asset inherits its repository's MIT licence is a rationalisation seen on mirror cards, not an upstream statement.",
      ],
      output:
        "No output clause found anywhere in this family. As with any separator, what you may do with the stems is governed mainly by your rights in the audio you fed in.",
      gated: "no",
      sources: [
        gh("lucidrains/BS-RoFormer", "Reference implementation (MIT, code only, no weights)"),
        {
          label: "ZFTurbo's checkpoint list — no licence declared for any entry",
          href: "https://github.com/ZFTurbo/Music-Source-Separation-Training/blob/main/docs/pretrained_models.md",
        },
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown", and after going and looking, "Unknown" is still the accurate answer — but for a specific reason now: it is not that nobody has written the licence down somewhere it could not be found, it is that the people distributing these checkpoints have never declared one. Note also that audio.cpp\'s table calls this package Apache-2.0 while the MIT reference code and the undeclared checkpoint say otherwise; those could not be reconciled, so no claim is made.',
    },
    downloadSize: null,
    quirks: [
      "Untested end-to-end here. Both the weights glob and the licence need confirming before real use.",
      "Same input rules as htdemucs: source goes in as the audio input, and Soundbox resamples to the model's rate first.",
    ],
    sources: [
      gh("lucidrains/BS-RoFormer", "Reference implementation"),
      gh("ZFTurbo/Music-Source-Separation-Training", "The training repo the checkpoints come from"),
      GGUF_TABLE,
    ],
  },
  {
    slug: "mel-band-roformer-sep",
    catalogId: "audiocpp-mel-band-roformer-sep",
    name: "Mel-Band RoFormer stem separation",
    vendor: "Community (Mel-Band RoFormer)",
    category: "utility",
    tier: "extra",
    verified: false,
    capabilities: ["separation"],
    metaTitle: "Mel-Band RoFormer separation — locally via audio.cpp | Soundbox",
    metaDescription:
      "Mel-band RoFormer vocal separation. The author's Hugging Face repo tags the checkpoint MIT, but there is no LICENSE file upstream — better than its sibling, still not airtight.",
    tagline: "The vocal-separation sibling. Author-tagged MIT, though only as repo metadata.",
    distinctiveness:
      "Same lineage as BS-RoFormer and the same mel_band_roformer loader, but with better licence provenance: the checkpoint's own author tags their Hugging Face repo MIT, rather than leaving it undeclared. That is an author-controlled statement, which is why this one is treated as usable where its sibling is not.",
    spec: {
      vendor: "Community (Mel-Band RoFormer)",
      family: "mel_band_roformer",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Mel-Band-RoFormer-GGUF/mel-band-roformer-q8_0.gguf"],
      maxDurationS: 600,
      sampleRate: 44100,
      channels: 2,
      vramEstimateMb: 3000,
    },
    license: {
      name: "MIT (repo metadata, no LICENSE file)",
      commercial: "conditional",
      summary:
        "The checkpoint author's Hugging Face repo carries an MIT licence tag, and audio.cpp's conversion table agrees. That is a real statement from the person who owns the weights, so commercial use is probably fine — but it is a metadata field rather than a licence file, and the upstream GitHub repo states no licence at all. It is shown as conditional to mark that gap, not because the licence itself has conditions.",
      conditions: [
        "The only licence statement found is a Hugging Face card tag. There is no LICENSE file in the author's GitHub repo.",
        "A redistributor's card describes this checkpoint as GPL-3.0 at release and relicensed to MIT in April 2026. That account is consistent with the current MIT tag, but it could only be verified from the redistributor, not from the author.",
      ],
      output: "No output clause found. Your rights in the stems follow your rights in the source audio.",
      gated: "no",
      sources: [
        hf("KimberleyJSN/melbandroformer"),
        gh("KimberleyJensen/Mel-Band-Roformer-Vocal-Model", "Upstream repo (no licence file)"),
        gh("lucidrains/BS-RoFormer", "Reference implementation (MIT)"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown". The weights author tags them MIT. This stops short of a clean yes because a card tag is weaker evidence than a licence file, and there is no licence file.',
    },
    downloadSize: null,
    quirks: [
      "Untested end-to-end here.",
      "Same input rules as the other separators — audio input, not reference input, and resampled to the model's rate first.",
    ],
    sources: [
      hf("KimberleyJSN/melbandroformer"),
      gh("lucidrains/BS-RoFormer", "Reference implementation"),
      GGUF_TABLE,
    ],
  },

  // -------------------------------------------------------------------------
  // Voice — text-to-speech and voice conversion
  //
  // Every entry below is opt-in except where noted, and this is the part of
  // the catalog where the licences are least uniform and the consent question
  // is sharpest. Several of these models will clone a voice from a few
  // seconds of reference audio; almost none of their licences require you to
  // have the speaker's permission, which makes it your problem rather than
  // nobody's.
  // -------------------------------------------------------------------------
  {
    slug: "vibevoice",
    catalogId: "audiocpp-vibevoice",
    name: "VibeVoice 1.5B",
    vendor: "Microsoft",
    category: "voice",
    tier: "extra",
    verified: true,
    capabilities: ["tts"],
    metaTitle: "VibeVoice 1.5B — long-form TTS locally | Soundbox",
    metaDescription:
      "Microsoft's MIT-licensed 1.5B speech model, run through audio.cpp. The only voice entry anyone here has actually run — and the only one whose code Microsoft pulled.",
    tagline: "MIT-licensed, up to ten minutes of speech, and the one voice model that has actually been run end-to-end here.",
    distinctiveness:
      "The only entry in the voice half of this catalog that anyone here has run end-to-end, and the only one built for genuinely long output — 600 seconds against everything else's 60. It is also the one with a complicated story: Microsoft removed the inference code from GitHub after finding misuse, later restoring the repo without the synthesis code, while the weights stayed up. The licence is MIT; the model card says it is intended for research rather than commercial deployment. Those two statements are in tension and you should know that before you rely on either.",
    spec: {
      vendor: "Microsoft",
      family: "vibevoice",
      hfRepo: GGUF_REPO,
      weightsGlob: ["VibeVoice-1.5B-GGUF/vibevoice-1.5b-q8_0.gguf"],
      maxDurationS: 600,
      sampleRate: 24000,
      channels: 1,
      vramEstimateMb: 3000,
    },
    license: {
      name: "MIT License",
      commercial: "conditional",
      summary:
        "The licence is MIT, which permits commercial use outright — confirmed from Hugging Face's own metadata. But the model card states the model is intended for research only and not for commercial deployment. A non-binding intent statement does not override a licence grant, and is not presented here as doing so; nor is this shown as a clean green when the publisher has said in writing what they want.",
      conditions: [
        "MIT itself imposes only the notice requirement.",
        "The model card's research-only framing is the publisher's stated intent, not a licence term. Weigh it as a signal about support and future availability rather than as a restriction.",
        "The card prohibits impersonating a voice without explicit, recorded consent, disinformation, and real-time voice conversion.",
      ],
      output:
        "Generated audio carries an audible AI disclaimer plus an imperceptible watermark by design. There is no ownership claim over output, but that watermark is a fact about the audio you get, which matters if the output is meant to pass as a recording.",
      gated: "no",
      sources: [
        hf("microsoft/VibeVoice-1.5B"),
        {
          label: "The discussion where the code removal is confirmed",
          href: "https://huggingface.co/microsoft/VibeVoice-1.5B/discussions/28",
        },
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "MIT (unverified)". MIT is now verified. It has been moved from an unqualified commercial "yes" to conditional to reflect the model card\'s research-only language and Microsoft\'s withdrawal of the inference code, neither of which is a licence term but both of which are things you would want to know.',
    },
    downloadSize: null,
    quirks: [
      "24kHz mono, the lowest sample rate in the catalog. Fine for speech, obvious if you mix it against 44.1kHz material.",
      "Verified: someone here has run it end-to-end. That is a claim about this adapter working, not about quality.",
    ],
    sources: [hf("microsoft/VibeVoice-1.5B"), gh("microsoft/VibeVoice"), GGUF_TABLE],
  },
  {
    slug: "chatterbox",
    catalogId: "audiocpp-chatterbox",
    name: "Chatterbox",
    vendor: "Resemble AI",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Chatterbox — MIT-licensed TTS locally | Soundbox",
    metaDescription:
      "Resemble AI's Chatterbox, run through audio.cpp. Plain MIT with no revenue cap — one of the cleanest licences in the voice half of this catalog.",
    tagline: "Plain MIT, no cap, no gate — the least encumbered voice model here.",
    distinctiveness:
      "Licensing-wise this is the easy one: MIT, ungated, no revenue threshold, no research carve-out. The thing to know is that Resemble embeds their Perth neural watermark in everything it generates, described as surviving MP3 compression and editing — a design decision rather than a licence term, and one that matters if you intended the output to be indistinguishable from a recording.",
    spec: {
      vendor: "Resemble AI",
      family: "chatterbox",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Chatterbox-GGUF/chatterbox-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3000,
    },
    license: {
      ...mit([hf("ResembleAI/chatterbox"), gh("resemble-ai/chatterbox")]),
      output:
        "MIT claims nothing over output. But every generation is watermarked with Resemble's Perth neural watermark, which the project says survives compression and editing. Nobody is claiming your audio; they are marking it.",
      conditions: [],
    },
    downloadSize: null,
    quirks: [
      "Opt-in and untested here — the numbers in the specs table are catalogued, not measured.",
      'The card\'s only conduct guidance is an informal "don\'t use this model to do bad things". That is not a licence term, and it is not a consent requirement either — supplying reference audio you have the right to use is on you.',
    ],
    sources: [hf("ResembleAI/chatterbox"), gh("resemble-ai/chatterbox"), GGUF_TABLE],
  },
  {
    slug: "fish-audio",
    catalogId: "audiocpp-fish-audio",
    name: "Fish Audio S2 Pro",
    vendor: "Fish Audio",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Fish Audio S2 Pro — research licence, locally | Soundbox",
    metaDescription:
      "Fish Audio S2 Pro through audio.cpp. Research and non-commercial only: commercial use needs a separate written agreement, and the weights are gated behind a non-commercial checkbox.",
    tagline: "Research and non-commercial only, and gated behind a checkbox that says so.",
    distinctiveness:
      "One of the clearest non-commercial entries in the catalog, and unusually explicit about it: the download gate itself makes you tick a box agreeing to non-commercial use only, so there is no ambiguity to discover later. Commercial use is defined broadly enough to include internal business operations and indirect revenue, not just selling the audio.",
    spec: {
      vendor: "Fish Audio",
      family: "fish_audio",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Fish-Audio-S2-Pro-GGUF/fish-audio-s2-pro-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3000,
    },
    license: {
      name: "Fish Audio Research License Agreement",
      commercial: "no",
      summary:
        'Research and non-commercial use only. "Any use of the Fish Audio Materials or Derivative Works for a Commercial Purpose requires a separate written license agreement from Fish Audio." Commercial Purpose is defined broadly — internal business operations and indirect revenue count.',
      conditions: [
        "Commercial use requires a written agreement with Fish Audio (business@fish.audio).",
        "The weights are gated: you supply country and date and tick a box agreeing to non-commercial use only, plus a DMCA/legal-compliance consent.",
        "You may not use the materials or their outputs to create or improve any other foundational generative AI model.",
      ],
      output:
        'You own the outputs "to the extent permitted by applicable law" — but owning them does not license the non-commercial restriction away, and the no-training-on-outputs clause applies to them specifically. This is the only model in the catalog that contractually bars using its output to train another generative model.',
      gated: "yes",
      sources: [
        {
          label: "Fish Audio Research License Agreement, full text",
          href: "https://huggingface.co/fishaudio/s2-pro/blob/main/LICENSE.md",
        },
        hf("fishaudio/s2-pro"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown" and treats this as conditional. It is not unknown and it is not merely conditional: it is a research licence that forbids commercial use without a signed agreement.',
    },
    downloadSize: null,
    quirks: ["Opt-in, untested here, and gated upstream behind a non-commercial agreement."],
    sources: [hf("fishaudio/s2-pro"), gh("fishaudio"), GGUF_TABLE],
  },
  {
    slug: "index-tts2",
    catalogId: "audiocpp-index-tts2",
    name: "IndexTTS2",
    vendor: "bilibili",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "IndexTTS2 — bilibili's speech model locally | Soundbox",
    metaDescription:
      "IndexTTS2 through audio.cpp. Its Hugging Face repo declares no licence at all; the upstream project now ships the bilibili Model Use License. Treat it as bilibili-licensed.",
    tagline: "The Hugging Face repo declares no licence at all — assume the bilibili agreement applies.",
    distinctiveness:
      "The odd one in bilibili's lineup. Its Hugging Face repo has no licence field and its card has no licence section, while the upstream GitHub project now carries the bilibili Model Use License Agreement. Blog posts calling IndexTTS2 Apache-2.0 appear to describe the older v1 era. This could not be resolved from any authoritative page, so the more restrictive of the two readings is pointed to.",
    spec: {
      vendor: "bilibili",
      family: "index_tts2",
      hfRepo: GGUF_REPO,
      weightsGlob: ["IndexTTS2-GGUF/index-tts2-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3000,
    },
    license: {
      name: "bilibili Model Use License Agreement (inferred)",
      commercial: "unknown",
      summary:
        "Which licence governs these weights could not be confirmed. The Hugging Face repo carries no licence metadata and no licence section. The upstream repository's current LICENSE is the bilibili Model Use License Agreement, and audio.cpp's conversion table also labels this package that way — so that is the most likely answer, but nothing on the weights repo itself says so.",
      conditions: [
        "If the bilibili agreement does govern, its conditions are the ones described on the IndexTTS2.5 page: a scale cap, notice retention, and a no-endorsement statement for modifications.",
        "Widely repeated claims that IndexTTS2 is Apache-2.0 are not supported by any current authoritative page that could be reached.",
      ],
      output:
        "No output clause could be confirmed for this specific model. If the bilibili agreement applies, its terms about outputs and high-risk use apply with it.",
      gated: "no",
      sources: [
        hf("IndexTeam/IndexTTS-2"),
        {
          label: "The upstream project's current LICENSE (bilibili Model Use License)",
          href: "https://github.com/index-tts/index-tts/blob/main/LICENSE",
        },
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown". After looking, "unknown" remains the accurate answer for this particular repo — but it is a documented unknown now: the weights repo declares nothing, and the project it came from declares the bilibili agreement. Prefer IndexTTS2.5, whose licence is unambiguous.',
    },
    downloadSize: null,
    quirks: [
      "Opt-in and untested here.",
      "If you want this family with a licence you can actually read, use IndexTTS2.5 instead.",
    ],
    sources: [hf("IndexTeam/IndexTTS-2"), gh("index-tts/index-tts"), GGUF_TABLE],
  },
  {
    slug: "index-tts2-5",
    catalogId: "audiocpp-index-tts2-5",
    name: "IndexTTS2.5",
    vendor: "bilibili",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "IndexTTS2.5 — bilibili Model Use License | Soundbox",
    metaDescription:
      "IndexTTS2.5 through audio.cpp. Commercial use permitted below 100M monthly users or RMB 1bn revenue — a Llama-style scale cap most projects will never reach.",
    tagline: "Commercial use is fine below 100M monthly users or RMB 1bn revenue.",
    distinctiveness:
      "The successor to IndexTTS2 and, unlike it, unambiguously licensed. The cap is the Llama-shaped kind: written authorisation is needed only if you exceeded 100 million monthly active users in the preceding month or a billion RMB in annual revenue, which is to say almost nobody reading this. The card is also unusually direct that it does not check whether the speaker in your reference clip consented, and that getting that consent is your job.",
    spec: {
      vendor: "bilibili",
      family: "index_tts2",
      hfRepo: GGUF_REPO,
      weightsGlob: ["IndexTTS2.5-GGUF/index-tts2_5-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 4200,
    },
    license: {
      name: "bilibili Model Use License Agreement",
      commercial: "conditional",
      summary:
        "Commercial use is permitted with a scale cap and some housekeeping. Separate written authorisation is required only above 100 million monthly active users in the preceding calendar month or RMB 1 billion in annual revenue.",
      conditions: [
        "Written authorisation required above 100M MAU in the preceding calendar month, or RMB 1bn annual revenue.",
        "Retain copyright notices and a copy of the licence, and bind downstream recipients to the same terms.",
        "State that your modifications are not endorsed by the rights-holder.",
        "You are responsible for obtaining rights to any third-party data or weights you combine with it.",
        "You may not use the model to improve other AI models, except IndexTTS2 itself or non-commercial models.",
      ],
      output:
        'The model and its outputs are provided "as is" with no warranty. Prohibited output includes anything unlawful, false information, and discriminatory or privacy-infringing content; high-risk deployment (medical, autonomous driving, military, critical infrastructure) puts regulatory compliance on you. The model card is explicit that it does not verify a reference speaker\'s consent and that obtaining it is the user\'s responsibility.',
      gated: "no",
      sources: [
        {
          label: "bilibili Model Use License Agreement, full text",
          href: "https://huggingface.co/IndexTeam/IndexTTS-2.5/blob/main/LICENSE",
        },
        hf("IndexTeam/IndexTTS-2.5"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction: 'The shipped catalog says "Unknown". It is the bilibili Model Use License Agreement, and its text has been reviewed.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("IndexTeam/IndexTTS-2.5"), gh("index-tts/index-tts"), GGUF_TABLE],
  },
  {
    slug: "higgs-audio-tts",
    catalogId: "audiocpp-higgs-audio-tts",
    name: "Higgs Audio v3 TTS 4B",
    vendor: "Boson AI",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Higgs Audio v3 TTS 4B — creator grant, locally | Soundbox",
    metaDescription:
      "Boson AI's 4B speech model through audio.cpp. Research and non-commercial by default, with a Creator Use Grant that permits monetised creative work if you credit them.",
    tagline: "Non-commercial by default — with a carve-out that lets creators monetise if they credit it.",
    distinctiveness:
      "The most interestingly shaped licence in the catalog. The default is research and non-commercial: deploying it in production, behind a hosted API, or inside a product needs a commercial licence from Boson AI. But a Creator Use Grant sits on top of that and lets individual creators produce creative content — including monetised podcasts, video and social posts — for free, provided they credit Boson AI's Higgs Audio in the audio or prominently in accompanying text. Which side of that line you are on is the whole question.",
    spec: {
      vendor: "Boson AI",
      family: "higgs_audio_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Higgs-Audio-v3-TTS-4B-GGUF/higgs-audio-v3-tts-4b-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3000,
    },
    license: {
      name: "Boson Higgs TTS 3 Research and Non-Commercial License",
      commercial: "conditional",
      summary:
        "Research and non-commercial by default. A separate commercial licence from Boson AI is required to deploy it in production, offer it as a hosted API, embed it in a product, or resell it. The Creator Use Grant is the exception: monetised creative content is permitted for free with attribution.",
      conditions: [
        "Product, API, hosted-service and resale use require a separate commercial licence from Boson AI.",
        "Creator Use Grant: monetised creative content is allowed if you credit Boson AI's Higgs Audio in the audio itself or prominently in accompanying text.",
        "The acceptable-use terms prohibit voice cloning without consent, impersonation, fraud, election deception and biometric surveillance.",
      ],
      output:
        "Where legally required, AI-generated audio must be disclosed. The Creator Use Grant's attribution requirement is itself an obligation attached to what you publish, which makes this one of the few entries where the output carries a duty rather than just the weights.",
      gated: "no",
      sources: [
        {
          label: "Boson Higgs TTS 3 Research and Non-Commercial License",
          href: "https://huggingface.co/bosonai/higgs-audio-v3-tts-4b/blob/main/LICENSE",
        },
        hf("bosonai/higgs-audio-v3-tts-4b"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown". It is Boson AI\'s research and non-commercial licence with a Creator Use Grant. Note the naming mismatch you will hit if you go looking: the model is "Higgs Audio v3 TTS 4B" and the licence is named for "Higgs TTS 3".',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("bosonai/higgs-audio-v3-tts-4b"), gh("boson-ai/higgs-audio"), GGUF_TABLE],
  },
  {
    slug: "vevo2",
    catalogId: "audiocpp-vevo2",
    name: "Vevo2",
    vendor: "Amphion",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts", "voice-conversion"],
    metaTitle: "Vevo2 — non-commercial weights, locally | Soundbox",
    metaDescription:
      "Vevo2 from the Amphion project through audio.cpp. The code is MIT but the checkpoints are CC-BY-NC-ND-4.0: non-commercial, no derivatives, attribution required.",
    tagline: "MIT code, CC-BY-NC-ND weights. The weights are what you run, so: non-commercial.",
    distinctiveness:
      "A textbook case of the code-versus-weights split. Amphion's toolkit is MIT, which is what a quick search will tell you, but the Vevo2 checkpoints are published CC-BY-NC-ND-4.0 — non-commercial, attribution required, and read strictly, no distributing derivatives, which would cover redistributing a fine-tune. The MIT code licence does not rescue that; the checkpoints are the binding constraint.",
    spec: {
      vendor: "Amphion",
      family: "vevo2",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Vevo2-GGUF/vevo2-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 4000,
    },
    license: {
      name: "CC-BY-NC-ND-4.0 (weights) / MIT (code)",
      commercial: "no",
      summary:
        "The weights are CC-BY-NC-ND-4.0: non-commercial only, attribution required, and no derivative works distributed. The Amphion code around them is MIT, which is a different thing and does not loosen the weights' terms.",
      conditions: [
        "Non-commercial use only.",
        "Attribution required.",
        "No-derivatives: read strictly, this bars distributing a fine-tune or other modified checkpoint.",
      ],
      output:
        "Plain CC-BY-NC-ND has no acceptable-use policy and claims no rights over model output. No consent clause or output statement was found on either the Amphion README or the weights card; both were checked.",
      gated: "no",
      sources: [
        hf("RMSnow/Vevo2"),
        {
          label: "Amphion LICENSE (MIT — the code, not the weights)",
          href: "https://github.com/open-mmlab/Amphion/blob/main/LICENSE",
        },
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown" and "conditional". The real answer is stricter than conditional: these weights are non-commercial. The shipped catalog also once listed Vevo2 as a music generator; the 0.6.1 loader registry says it registers tts, vc, s2s and svc and no gen task at all, which is why it appears here as a voice model.',
    },
    downloadSize: null,
    quirks: [
      "This entry drives it as text-to-speech. The vevo2 family also registers voice conversion, speech-to-speech and singing voice conversion.",
      "Opt-in and untested here.",
    ],
    sources: [
      hf("RMSnow/Vevo2"),
      gh("open-mmlab/Amphion", "Amphion — the project Vevo2 comes from"),
      GGUF_TABLE,
    ],
  },
  {
    slug: "neutts-2e",
    catalogId: "audiocpp-neutts-2e",
    name: "NeuTTS 2E",
    vendor: "Neuphonic",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "NeuTTS 2E — $5M revenue cap | Soundbox",
    metaDescription:
      "Neuphonic's NeuTTS 2E through audio.cpp. The sources disagree: the conversion table says Apache-2.0, the upstream repo ships a custom licence with a $5M revenue cap.",
    tagline: "Two sources, two different licences. The stricter one is followed here: a $5M revenue cap.",
    distinctiveness:
      "The entry where the sources contradict each other most sharply. audio.cpp's conversion table labels this package Apache-2.0. The upstream Neuphonic repository ships a custom licence — the NeuTTS Open License v1.0 — that caps commercial use at $5M annual revenue and gates the download. Where a converter's label and the rights-holder's own licence file disagree, the rights-holder wins, so the cap is shown.",
    spec: {
      vendor: "Neuphonic",
      family: "neutts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["NeuTTS-2E-GGUF/neutts-2e-orig.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3700,
    },
    license: {
      name: "NeuTTS Open License v1.0",
      commercial: "conditional",
      summary:
        "Commercial use is permitted below the licence's Threshold, defined as USD $5,000,000 in annual revenue; a legal entity above it needs a commercial licence from Neuphonic. Non-profits are exempt for research and non-commercial purposes.",
      conditions: [
        'The licence states that commercial use "by a Legal Entity that exceeds the Threshold is not licensed", with the Threshold set at USD $5,000,000 annual revenue.',
        "The upstream weights are gated: you accept conditions and share contact details to get the files.",
        "Do not generalise from Neuphonic's other models. neutts-air is plain Apache-2.0 and the Nano models are 'other'; 2E is the restricted tier of the lineup.",
      ],
      output:
        "No formal acceptable-use policy. Every audio file NeuTTS generates carries a Perth perceptual watermark by default — relevant if you plan to ship the audio, and a fact about the output rather than a claim on it.",
      gated: "yes",
      sources: [
        {
          label: "NeuTTS Open License v1.0, full text",
          href: "https://huggingface.co/neuphonic/neutts-2e/blob/main/LICENSE",
        },
        hf("neuphonic/neutts-2e"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        "audio.cpp's conversion table lists this package as Apache-2.0, and the shipped catalog lists it as Unknown. Neither matches the upstream licence file, which is a custom licence with a $5M revenue cap and a download gate. The upstream terms are followed and the restriction is shown; if you need Apache-2.0 terms for this family, that is neutts-air, not 2E.",
    },
    downloadSize: null,
    quirks: ["Opt-in, untested here, and gated upstream."],
    sources: [hf("neuphonic/neutts-2e"), gh("neuphonic/neutts"), GGUF_TABLE],
  },
  {
    slug: "supertonic-3",
    catalogId: "audiocpp-supertonic-3",
    name: "Supertonic 3",
    vendor: "Supertone",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Supertonic 3 — Open RAIL-M, locally | Soundbox",
    metaDescription:
      "Supertone's Supertonic 3 through audio.cpp: ~800 MB of VRAM, BigScience Open RAIL-M, with use restrictions that travel into anything you redistribute.",
    tagline: "The lightest voice model here at ~800 MB — licensed Open RAIL-M, restrictions and all.",
    distinctiveness:
      "The smallest footprint of any voice model in this catalog by a wide margin, and the only one licensed Open RAIL-M. RAIL is worth understanding rather than skimming: it permits commercial use, but it attaches a list of prohibited uses that you must pass through to everyone you redistribute to. It is also the only licence here that makes non-consensual voice cloning an actual licence violation rather than a line in a model card.",
    spec: {
      vendor: "Supertone",
      family: "supertonic",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Supertonic-3-GGUF/supertonic-3-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 800,
    },
    license: {
      name: "BigScience Open RAIL-M License",
      commercial: "conditional",
      summary:
        "Open RAIL-M permits commercial use, but binds you — and every downstream recipient — to the use restrictions in its Attachment A, which you must pass through in any redistribution or derivative. The sample code is separately MIT.",
      conditions: [
        "You must pass the Attachment A use restrictions through to anyone you redistribute the model or a derivative to.",
        "Attachment A prohibits, among other things: violating applicable law; harming minors; generating false information intended to cause harm; generating content without disclaiming that it is machine-generated; defamation and harassment; impersonation or deepfakes without consent; automated decision-making affecting legal rights; discrimination; medical advice; and predictive-policing applications.",
      ],
      output:
        'Unusually explicit and unusually favourable: "Licensor claims no rights in the Output You generate using the Model. You are accountable for the Output you generate and its subsequent uses." Note the disclosure restriction cuts the other way — generating content without disclaiming that it is machine-generated is a prohibited use.',
      gated: "no",
      sources: [
        {
          label: "Supertonic 3 LICENSE (Open RAIL-M)",
          href: "https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE",
        },
        hf("Supertone/supertonic-3"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction: 'The shipped catalog says "Unknown". It is the BigScience Open RAIL-M licence, © 2026 Supertone Inc.',
    },
    downloadSize: null,
    quirks: [
      "~800 MB of VRAM — this is the one to try first if your GPU is small.",
      "Opt-in and untested here.",
    ],
    sources: [hf("Supertone/supertonic-3"), gh("supertone-inc/supertonic"), GGUF_TABLE],
  },
  {
    slug: "dramabox",
    catalogId: "audiocpp-dramabox",
    name: "DramaBox",
    vendor: "Resemble AI / Lightricks",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "DramaBox — LTX-2 Community License | Soundbox",
    metaDescription:
      "DramaBox through audio.cpp: ~21 GB of VRAM and the LTX-2 Community License, which caps free commercial use at $10M revenue and bars training on its output.",
    tagline: "~21 GB of VRAM, a $10M revenue cap, and outputs you may not train on.",
    distinctiveness:
      "Heavier than every other voice model here by a factor of five, and licensed by someone other than who you would expect: DramaBox is a fine-tune of Lightricks' LTX-2, so the weights carry the LTX-2 Community License even though Resemble published the model and the inference code is MIT. That licence has the most output-side obligations of anything in this catalog.",
    spec: {
      vendor: "Resemble AI / Lightricks",
      family: "dramabox",
      hfRepo: GGUF_REPO,
      weightsGlob: ["DramaBox-GGUF/dramabox-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 21100,
    },
    license: {
      name: "LTX-2 Community License Agreement",
      commercial: "conditional",
      summary:
        "Free commercial use below $10,000,000 in annual revenue. At or above that you are a “Commercial Entity” under the licence and must obtain a paid commercial licence from Lightricks — with liquidated damages set at double the fees owed if you do not. The licensor is Lightricks, not Resemble.",
      conditions: [
        "Entities at or above USD $10,000,000 annual revenue must obtain a paid commercial licence from Lightricks.",
        "Attachment A carries roughly twenty use restrictions (harm to minors, false information, impersonation, automated decision-making, discrimination, malware, military, competitive use), and downstream agreements must pass them through.",
        "The inference code is MIT, but the weights are what carry the LTX-2 terms.",
      ],
      output:
        'Three real constraints on what you generate. Machine-generated content must carry an "expressly and intelligibly" stated disclaimer that it is machine generated. Outputs may not be used to train, improve or fine-tune any other machine-learning model, other than LTX-2 derivatives. And every output of the upstream inference path is watermarked with Resemble Perth by default.',
      gated: "no",
      sources: [
        {
          label: "LTX-2 Community License Agreement, full text",
          href: "https://huggingface.co/ResembleAI/Dramabox/blob/main/LICENSE",
        },
        hf("ResembleAI/Dramabox"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown" and lists the vendor as "Unverified". It is the LTX-2 Community License, and the licensor is Lightricks Ltd — DramaBox is an adapter fine-tune of Lightricks\' LTX-2, published by Resemble AI.',
    },
    downloadSize: null,
    quirks: [
      "~21 GB of VRAM. Only the MiniMax H3 entry asks for more.",
      "Opt-in and untested here.",
    ],
    sources: [hf("ResembleAI/Dramabox"), gh("resemble-ai/DramaBox"), GGUF_TABLE],
  },
  {
    slug: "omnivoice",
    catalogId: "audiocpp-omnivoice",
    name: "OmniVoice",
    vendor: "k2-fsa",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "OmniVoice — non-commercial weights | Soundbox",
    metaDescription:
      "OmniVoice through audio.cpp. Apache-2.0 code but CC-BY-NC weights, because of its training data — so commercial use is out, whatever the conversion table says.",
    tagline: "Apache-2.0 code, CC-BY-NC weights. Non-commercial, and easy to get wrong.",
    distinctiveness:
      "Another split-licence trap, and a well-signposted one: the project states outright that while the code is Apache-2.0, the pre-trained weights are CC-BY-NC because of constraints from their training data. audio.cpp's conversion table lists this package as Apache-2.0, which is the code's licence rather than the weights'. The weights are the thing you download.",
    spec: {
      vendor: "k2-fsa",
      family: "omnivoice",
      hfRepo: GGUF_REPO,
      weightsGlob: ["OmniVoice-GGUF/omnivoice-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 1800,
    },
    license: {
      name: "CC-BY-NC (weights) / Apache-2.0 (code)",
      commercial: "no",
      summary:
        "The pre-trained weights are CC-BY-NC — non-commercial only — which the project attributes to constraints from its training data. The code is Apache-2.0. Forks inherit the weights restriction.",
      conditions: [
        "Non-commercial use of the weights only; attribution required.",
        'The card prohibits "unauthorized voice cloning, voice impersonation, fraud, scams, or any other illegal or unethical activities".',
        "One caveat about the source: the model card has no machine-readable licence field, so the CC-BY-NC statement is prose in the card body. That is the rights-holder speaking, but it is prose, not metadata.",
      ],
      output:
        "No ownership or watermarking statement found on the card. No output terms could be confirmed either way.",
      gated: "no",
      sources: [hf("k2-fsa/OmniVoice"), gh("k2-fsa/OmniVoice"), GGUF_TABLE],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown". The weights are non-commercial. Note that audio.cpp\'s conversion table labels this package Apache-2.0 — that is the code licence, and following it would put you on the wrong side of the weights\' terms.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("k2-fsa/OmniVoice"), gh("k2-fsa/OmniVoice"), GGUF_TABLE],
  },
  {
    slug: "seed-vc",
    catalogId: "audiocpp-seed-vc",
    name: "Seed-VC voice conversion",
    vendor: "Plachtaa (Seed-VC)",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["voice-conversion"],
    metaTitle: "Seed-VC voice conversion — GPL-3.0 | Soundbox",
    metaDescription:
      "Seed-VC through audio.cpp. GPL-3.0 on both code and weights — the only copyleft licence in this catalog, and a real constraint if you ship closed source.",
    tagline: "The only copyleft entry here: GPL-3.0 on the code and the weights alike.",
    distinctiveness:
      "The one licence in this catalog that can reach back into your own software. GPL-3.0 permits commercial use, but distributing a derivative work or an application linked against it obliges you to release the corresponding source under GPL-3.0 too. Running it internally or behind a hosted service is fine — this is GPL, not AGPL — but shipping it inside a closed-source product is not a decision to make casually.",
    spec: {
      vendor: "Plachtaa (Seed-VC)",
      family: "seed_vc",
      hfRepo: GGUF_REPO,
      weightsGlob: ["SeedVC-MLX-GGUF/seed-vc-mlx-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 2500,
    },
    license: {
      name: "GNU General Public License v3.0",
      commercial: "conditional",
      summary:
        "GPL-3.0 on both the code and the weights repo. Commercial use is permitted, but the copyleft obligation is the point: distribute a derivative or an application built on it and you must offer the corresponding source under GPL-3.0.",
      conditions: [
        "Strong copyleft: distributing a derivative work triggers the source-release obligation.",
        "This is GPL-3.0, not AGPL, so a hosted service you do not distribute does not trigger it.",
        "The obligation attaches to your software, not to the audio — see the output note.",
      ],
      output:
        "GPL does not claim rights over the output of a program, and there is no output clause here. Converting a voice does not put your audio under the GPL; linking your application against the model might put your application under it.",
      gated: "no",
      sources: [
        {
          label: "Seed-VC LICENSE (GPL-3.0)",
          href: "https://github.com/Plachtaa/seed-vc/blob/main/LICENSE",
        },
        hf("Plachta/Seed-VC"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown". It is GPL-3.0, on both the code and the weights repo — the only copyleft licence anywhere in this catalog, and the one most likely to matter to whoever is embedding Soundbox rather than using it.',
    },
    downloadSize: null,
    quirks: [
      "Voice conversion, not text-to-speech: it takes source audio and a reference voice.",
      "Opt-in and untested here.",
    ],
    sources: [gh("Plachtaa/seed-vc"), hf("Plachta/Seed-VC"), GGUF_TABLE],
  },
  {
    slug: "rvc",
    catalogId: "audiocpp-rvc",
    name: "RVC voice conversion",
    vendor: "RVC-Project",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["voice-conversion"],
    metaTitle: "RVC voice conversion — MIT, locally | Soundbox",
    metaDescription:
      "Retrieval-based Voice Conversion through audio.cpp. MIT on both code and weights, with the caveat that RVC bundles third-party components that were not separately checked.",
    tagline: "MIT on both code and weights — with bundled components not separately checked.",
    distinctiveness:
      "The best-known open voice-conversion stack, and rare in this half of the catalog for having the same permissive licence on the code and the weights. The upstream project also notes its base model was trained on the openly licensed VCTK set, which is the provenance question that usually goes unanswered. The caveat is compositional: RVC bundles third-party pieces — ContentVec/HuBERT, RMVPE — whose own licences were not separately verified.",
    spec: {
      vendor: "RVC-Project",
      family: "rvc",
      hfRepo: GGUF_REPO,
      weightsGlob: ["RVC-GGUF/rvc-f16.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3200,
    },
    license: {
      ...mit([
        {
          label: "RVC LICENSE (MIT)",
          href: "https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI/blob/main/LICENSE",
        },
        hf("lj1995/VoiceConversionWebUI"),
      ]),
      commercial: "conditional",
      summary:
        "MIT on the code and MIT tagged on the weights repo — no divergence found, which is unusual here. It is shown as conditional for one reason only: RVC bundles third-party components (ContentVec/HuBERT, RMVPE) whose upstream licences were not verified, and the MIT grant on RVC does not speak for them.",
      conditions: [
        "The bundled ContentVec/HuBERT and RMVPE components have their own upstream licences, which were not checked here. Check them before shipping.",
      ],
      correction:
        'The shipped catalog says "Unknown". Both the code and the weights are MIT. The remaining uncertainty is about RVC\'s dependencies, not about RVC.',
    },
    downloadSize: null,
    quirks: [
      "Voice conversion, not text-to-speech.",
      "Opt-in and untested here.",
    ],
    sources: [
      gh("RVC-Project/Retrieval-based-Voice-Conversion-WebUI"),
      hf("lj1995/VoiceConversionWebUI"),
      GGUF_TABLE,
    ],
  },
  {
    slug: "miocodec-vc",
    catalogId: "audiocpp-miocodec-vc",
    name: "MioCodec voice conversion",
    vendor: "Aratako",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["voice-conversion"],
    metaTitle: "MioCodec — MIT neural audio codec | Soundbox",
    metaDescription:
      "MioCodec through audio.cpp: ~700 MB of VRAM, MIT licensed. Upstream it is the neural audio codec behind MioTTS rather than a voice-conversion model.",
    tagline: "The smallest entry in the catalog at ~700 MB. MIT, and really a codec.",
    distinctiveness:
      "The lightest thing in the catalog, and one that needs a correction: upstream, MioCodec is a neural audio codec — the 25 Hz tokenizer that MioTTS is built on — rather than a voice-conversion model in its own right. The shipped catalog drives it through the vc task. The licence is straightforwardly MIT on both code and weights.",
    spec: {
      vendor: "Aratako",
      family: "miocodec",
      hfRepo: GGUF_REPO,
      weightsGlob: ["MioCodec-25Hz-44.1kHz-v2-GGUF/miocodec-25hz-44khz-v2-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 700,
    },
    license: {
      ...mit([gh("Aratako/MioCodec"), hf("Aratako/MioCodec-25Hz-44.1kHz-v2")]),
      correction:
        'The shipped catalog says "Unknown" and lists the vendor as "Unverified". Both the GitHub project and the weights card are MIT, and the author is Aratako — the same author as the Irodori and MioTTS entries. Separately: upstream this is a codec, not a voice-conversion model. The repo credits kanade-tokenizer, AliasingFreeNeuralAudioSynthesis and XCodec2 as inspirations, whether any code was carried across from them was not checked.',
    },
    downloadSize: null,
    quirks: [
      "~700 MB — the smallest download here.",
      "Opt-in and untested here.",
    ],
    sources: [gh("Aratako/MioCodec"), hf("Aratako/MioCodec-25Hz-44.1kHz-v2"), GGUF_TABLE],
  },
  {
    slug: "confucius4-tts",
    catalogId: "audiocpp-confucius4-tts",
    name: "Confucius4 TTS",
    vendor: "NetEase Youdao",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Confucius4 TTS — Apache-2.0, 14 languages | Soundbox",
    metaDescription:
      "NetEase Youdao's Confucius4 TTS through audio.cpp. Apache-2.0 and unencumbered — with no consent clause at all despite advertising unconstrained voice cloning.",
    tagline: "Apache-2.0 across 14 languages — and no consent clause anywhere, despite the cloning.",
    distinctiveness:
      "Permissively licensed and multilingual, and the entry where the absence of an acceptable-use policy is itself the finding. The card advertises unconstrained zero-shot voice cloning and cross-lingual voice transfer without a reference transcript, and carries no consent requirement, no AUP and no output disclaimer that could be found. Read that as something that could not be found rather than as permission granted.",
    spec: {
      vendor: "NetEase Youdao",
      family: "confucius4_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Confucius4-TTS-GGUF/confucius4-tts-orig.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 9300,
    },
    license: {
      ...apache2(
        [hf("netease-youdao/Confucius4-TTS"), gh("netease-youdao/Confucius4-TTS")],
        "Apache-2.0 asserts nothing over output. No acceptable-use policy, consent requirement or output disclaimer was found on the model card at all — which, for a model advertising unconstrained voice cloning, is a gap rather than a permission. Consent for any voice you clone is entirely your own responsibility.",
      ),
      correction: 'The shipped catalog says "Unknown". It is Apache-2.0, per the model repo and the conversion table.',
    },
    downloadSize: null,
    quirks: [
      "~9.3 GB of VRAM — one of the heavier speech models here.",
      "Opt-in and untested here.",
    ],
    sources: [hf("netease-youdao/Confucius4-TTS"), gh("netease-youdao/Confucius4-TTS"), GGUF_TABLE],
  },
  {
    slug: "inflect-micro-v2",
    catalogId: "audiocpp-inflect-micro-v2",
    name: "Inflect Micro v2",
    vendor: "Owen Song",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Inflect Micro v2 — 9M parameters, Apache-2.0 | Soundbox",
    metaDescription:
      "A 9.36M-parameter speech model with one fixed synthetic voice, Apache-2.0, ~400 MB of VRAM. No reference audio, so no cloning question at all.",
    tagline: "9.36M parameters, ~400 MB, one fixed synthetic voice. Apache-2.0.",
    distinctiveness:
      "By far the smallest model in the catalog and the only one where the voice-cloning question simply does not arise: it has one fixed synthetic English voice and takes no reference audio or external model at inference. Apache-2.0, ~400 MB of VRAM. If you want speech on a machine that cannot run anything else, this is the entry.",
    spec: {
      vendor: "Owen Song",
      family: "inflect_v2",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Inflect-Micro-v2-GGUF/inflect-micro-v2-orig.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 400,
    },
    license: {
      ...apache2(
        [hf("owensong/Inflect-Micro-v2"), gh("owenawsong/Inflect")],
        'Apache-2.0 claims nothing over output. The card asks that you "disclose synthetic speech where the context could otherwise mislead", and notes the model is not validated for medical, legal, emergency or accessibility-critical use. Advisory, not licence terms.',
      ),
      conditions: [
        "The training corpus is not redistributed and the corpus-generation pipeline is closed, so the data provenance is not independently checkable. Third-party components are listed in the project's THIRD_PARTY_NOTICES.md, which was not reviewed here.",
      ],
      correction: 'The shipped catalog says "Unknown" and the vendor "Unverified". It is Apache-2.0, published by Owen Song.',
    },
    downloadSize: null,
    quirks: [
      "One fixed English voice. No reference audio, no cloning, no voice selection.",
      "Opt-in and untested here.",
    ],
    sources: [hf("owensong/Inflect-Micro-v2"), gh("owenawsong/Inflect"), GGUF_TABLE],
  },
  {
    slug: "voxcpm2",
    catalogId: "audiocpp-voxcpm2",
    name: "VoxCPM2",
    vendor: "OpenBMB",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "VoxCPM2 — Apache-2.0 speech from OpenBMB | Soundbox",
    metaDescription:
      "OpenBMB's VoxCPM2 through audio.cpp. Apache-2.0 on weights and code, with the model card explicitly stating it is free for commercial use.",
    tagline: "Apache-2.0 on weights and code, and the card says commercial use is fine.",
    distinctiveness:
      "One of the few entries whose publisher states in plain words on the model card that it is free for commercial use, rather than leaving you to infer it from a tag. The card's prohibitions — no impersonation, no fraud, no disinformation, label AI-generated content — sit in the card text rather than in Apache-2.0, so they are norms the publisher is asking you to follow rather than conditions you are agreeing to.",
    spec: {
      vendor: "OpenBMB",
      family: "voxcpm2",
      hfRepo: GGUF_REPO,
      weightsGlob: ["VoxCPM2-GGUF/voxcpm2-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3600,
    },
    license: {
      ...apache2(
        [hf("openbmb/VoxCPM2"), gh("OpenBMB/VoxCPM")],
        'Apache-2.0 claims nothing over output. The card adds advisory guidance — "strictly forbidden to use for impersonation, fraud, or disinformation" and "AI-generated content should be clearly labeled" — which is the publisher\'s norm rather than an enforceable licence condition. There is no mechanism verifying consent for reference audio.',
      ),
      correction: 'The shipped catalog says "Unknown". Weights and code are both Apache-2.0.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("openbmb/VoxCPM2"), gh("OpenBMB/VoxCPM"), GGUF_TABLE],
  },
  {
    slug: "moss-tts-local",
    catalogId: "audiocpp-moss-tts-local",
    name: "MOSS TTS Local v1.5",
    vendor: "OpenMOSS",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "MOSS TTS Local v1.5 — Apache-2.0 | Soundbox",
    metaDescription:
      "OpenMOSS's 4B local speech transformer through audio.cpp. Apache-2.0 across the whole MOSS-TTS family, with no acceptable-use policy attached.",
    tagline: "The 4B half of OpenMOSS's pair. Apache-2.0, ~8.6 GB of VRAM.",
    distinctiveness:
      "The larger of the two OpenMOSS entries here — upstream it is MOSS-TTS-Local-Transformer-v1.5, a 4B model. The whole MOSS-TTS family is Apache-2.0 by an explicit statement in the project README rather than by a tag alone, and no acceptable-use policy, consent clause or output terms were found attached to any of it.",
    spec: {
      vendor: "OpenMOSS",
      family: "moss_tts_local",
      hfRepo: GGUF_REPO,
      weightsGlob: ["MOSS-TTS-Local-v1.5-GGUF/moss-tts-local-v1.5-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 8600,
    },
    license: {
      ...apache2([hf("OpenMOSS-Team/MOSS-TTS-Local-Transformer-v1.5"), gh("OpenMOSS/MOSS-TTS")]),
      correction:
        'The shipped catalog says "Unknown". The MOSS-TTS project README states plainly that "Models in MOSS-TTS Family are licensed under the Apache License 2.0".',
    },
    downloadSize: null,
    quirks: ["~8.6 GB of VRAM.", "Opt-in and untested here."],
    sources: [hf("OpenMOSS-Team/MOSS-TTS-Local-Transformer-v1.5"), gh("OpenMOSS/MOSS-TTS"), GGUF_TABLE],
  },
  {
    slug: "moss-tts-nano",
    catalogId: "audiocpp-moss-tts-nano",
    name: "MOSS TTS Nano 100M",
    vendor: "OpenMOSS",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "MOSS TTS Nano 100M — Apache-2.0, ~600 MB | Soundbox",
    metaDescription:
      "The 100M-parameter member of OpenMOSS's MOSS-TTS family, ~600 MB of VRAM, Apache-2.0 like the rest of the family.",
    tagline: "100M parameters, ~600 MB of VRAM, same Apache-2.0 as its 4B sibling.",
    distinctiveness:
      "The small end of the MOSS-TTS family: about a fortieth of the parameters of the Local v1.5 entry, at roughly a fourteenth of the VRAM. Same family licence, same absence of any acceptable-use policy. A reasonable second choice after Supertonic and Inflect if you are fitting speech onto a small card.",
    spec: {
      vendor: "OpenMOSS",
      family: "moss_tts_nano",
      hfRepo: GGUF_REPO,
      weightsGlob: ["MOSS-TTS-Nano-100M-GGUF/moss-tts-nano-100m-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 600,
    },
    license: {
      ...apache2([hf("OpenMOSS-Team/MOSS-TTS-Nano-100M"), gh("OpenMOSS/MOSS-TTS")]),
      correction:
        'The shipped catalog says "Unknown". The model card defers to the project\'s root LICENSE, which the MOSS-TTS README states is Apache-2.0 for the whole family.',
    },
    downloadSize: null,
    quirks: ["~600 MB of VRAM.", "Opt-in and untested here."],
    sources: [hf("OpenMOSS-Team/MOSS-TTS-Nano-100M"), gh("OpenMOSS/MOSS-TTS"), GGUF_TABLE],
  },
  {
    slug: "miotts",
    catalogId: "audiocpp-miotts",
    name: "MioTTS 1.7B",
    vendor: "Aratako",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "MioTTS 1.7B — Apache-2.0, Qwen3-based | Soundbox",
    metaDescription:
      "MioTTS 1.7B through audio.cpp. Apache-2.0, built on Qwen3-1.7B-Base (also Apache-2.0), so nothing restrictive is inherited from the base model.",
    tagline: "Apache-2.0 on top of an Apache-2.0 base — no inherited restrictions.",
    distinctiveness:
      "Worth noting for its lineage rather than its size: MioTTS is built on Qwen3-1.7B-Base, which is itself Apache-2.0, so unlike several models here it inherits nothing restrictive from what it was built on. It uses the same author's MioCodec as its tokenizer — the codec that also appears in this catalog as its own entry.",
    spec: {
      vendor: "Aratako",
      family: "miotts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["MioTTS-1.7B-GGUF/miotts-1.7b-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 2800,
    },
    license: {
      ...apache2(
        [hf("Aratako/MioTTS-1.7B"), gh("Aratako/MioTTS-Inference")],
        'Apache-2.0 claims nothing over output, and no watermarking is mentioned. The card asks users not to clone real voices "especially non-consenting individuals" for deceptive or harmful purposes, and states that users are solely responsible for legal compliance — advisory, not licence terms.',
      ),
      correction: 'The shipped catalog says "Unknown" and the vendor "Unverified". It is Apache-2.0, by Aratako.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("Aratako/MioTTS-1.7B"), gh("Aratako/MioTTS-Inference"), GGUF_TABLE],
  },
  {
    slug: "irodori-tts-500m-v3",
    catalogId: "audiocpp-irodori-tts-500m-v3",
    name: "Irodori TTS 500M v3",
    vendor: "Aratako",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Irodori TTS 500M v3 — MIT, ~1.5 GB | Soundbox",
    metaDescription:
      "The smallest Irodori TTS variant, MIT licensed, ~1.5 GB of VRAM, through audio.cpp with no Python stack.",
    tagline: "The compact Irodori: MIT, ~1.5 GB of VRAM.",
    distinctiveness:
      "The base member of a three-model Japanese TTS family, all MIT and all by the same author as MioTTS and MioCodec. The smallest and least demanding of the three; the VoiceDesign and v4 siblings add text-described voices and, with them, watermarking.",
    spec: {
      vendor: "Aratako",
      family: "irodori_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Irodori-TTS-500M-v3-GGUF/irodori-tts-500m-v3-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 1500,
    },
    license: {
      ...irodoriTts("Aratako/Irodori-TTS-500M-v3"),
      correction: 'The shipped catalog says "Unknown". It is MIT, per the upstream repo and the model card.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("Aratako/Irodori-TTS-500M-v3"), gh("Aratako/Irodori-TTS"), GGUF_TABLE],
  },
  {
    slug: "irodori-tts-600m-v3-voicedesign",
    catalogId: "audiocpp-irodori-tts-600m-v3-voicedesign",
    name: "Irodori TTS 600M v3 VoiceDesign",
    vendor: "Aratako",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Irodori TTS 600M v3 VoiceDesign — MIT | Soundbox",
    metaDescription:
      "Describe a voice in text rather than supplying a reference clip. MIT licensed, and it watermarks what it generates with SilentCipher.",
    tagline: "Describe the voice in words instead of supplying a clip. MIT, and watermarked.",
    distinctiveness:
      "The VoiceDesign variant takes a text description of a voice rather than a reference recording, which sidesteps the consent question at the input — you are not cloning anyone — while raising a different one the card addresses directly: a described voice can end up resembling a real person as a probabilistic artifact of the latent space rather than by intent. It also embeds SilentCipher invisible watermarks in its output.",
    spec: {
      vendor: "Aratako",
      family: "irodori_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Irodori-TTS-600M-v3-VoiceDesign-GGUF/irodori-tts-600m-v3-voicedesign-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 1700,
    },
    license: {
      ...irodoriTts("Aratako/Irodori-TTS-600M-v3-VoiceDesign"),
      conditions: [
        "The model composes third-party components — llm-jp-3-150m for tokenizer and embeddings, a DACVAE codec, and SilentCipher watermarking — whose own licences were not separately verified. If MIT-only matters to you, check those.",
      ],
      correction: 'The shipped catalog says "Unknown". It is MIT, per the upstream repo and the model card.',
    },
    downloadSize: null,
    quirks: [
      "Watermarks its output with SilentCipher by design.",
      "Opt-in and untested here.",
    ],
    sources: [hf("Aratako/Irodori-TTS-600M-v3-VoiceDesign"), gh("Aratako/Irodori-TTS"), GGUF_TABLE],
  },
  {
    slug: "irodori-tts-v4-small",
    catalogId: "audiocpp-irodori-tts-v4-small",
    name: "Irodori TTS v4 Small",
    vendor: "Aratako",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Irodori TTS v4 Small — MIT, and already superseded | Soundbox",
    metaDescription:
      "The newest Irodori variant in the shipped catalog, MIT licensed — though its own model card points at a newer v4.1 Small that this catalog does not carry.",
    tagline: "The newest Irodori carried here — and its own card points at a newer one.",
    distinctiveness:
      "Built on the VoiceDesign model rather than on the 500M base, and the largest of the three Irodori entries at ~1.9 GB. Its own model card says a v4.1 Small supersedes it upstream; the shipped catalog does not carry that one, which is the kind of drift a catalogued model accumulates when nobody has run it.",
    spec: {
      vendor: "Aratako",
      family: "irodori_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Irodori-TTS-v4-Small-GGUF/irodori-tts-v4-small-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 1900,
    },
    license: {
      ...irodoriTts("Aratako/Irodori-TTS-v4-Small"),
      correction:
        'The shipped catalog says "Unknown". It is MIT, confirmed from the repo metadata. Separately: the upstream card states this model is superseded by Irodori-TTS-v4.1-Small, which the shipped catalog does not list.',
    },
    downloadSize: null,
    quirks: [
      "Watermarks its output with SilentCipher, like the VoiceDesign model it is built on.",
      "Opt-in and untested here.",
    ],
    sources: [hf("Aratako/Irodori-TTS-v4-Small"), gh("Aratako/Irodori-TTS"), GGUF_TABLE],
  },
  {
    slug: "dots-tts-soar",
    catalogId: "audiocpp-dots-tts-soar",
    name: "Dots TTS SOAR",
    vendor: "rednote HiLab",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Dots TTS SOAR — Apache-2.0 | Soundbox",
    metaDescription:
      "The SOAR variant of rednote HiLab's dots.tts, Apache-2.0 and ungated, run locally through audio.cpp.",
    tagline: "Apache-2.0 and ungated, one of three dots.tts variants here.",
    distinctiveness:
      "One of three dots.tts variants in the catalog, all sharing the dots_tts loader. SOAR and MF are cleanly Apache-2.0 on their own repos; the Edit variant is not, which is why it has its own warning. The card's conduct guidance — no impersonation, disclose synthetic audio, use consent-aware reference policies — is advisory rather than licensed.",
    spec: {
      vendor: "rednote HiLab",
      family: "dots_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["DotTTS-SOAR-GGUF/dots-tts-soar-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3600,
    },
    license: {
      ...dotsTts("rednote-hilab/dots.tts-soar"),
      correction: 'The shipped catalog says "Unknown". This variant is Apache-2.0 on its own repo.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("rednote-hilab/dots.tts-soar"), gh("studio-dots-ai/dots.tts"), GGUF_TABLE],
  },
  {
    slug: "dots-tts-mf",
    catalogId: "audiocpp-dots-tts-mf",
    name: "Dots TTS MF",
    vendor: "rednote HiLab",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Dots TTS MF — Apache-2.0 | Soundbox",
    metaDescription:
      "The MF variant of rednote HiLab's dots.tts, Apache-2.0 with the licence linked from the model card itself, run locally through audio.cpp.",
    tagline: "Apache-2.0, with the licence linked from the card rather than just tagged.",
    distinctiveness:
      "The MF variant, and the best-documented of the three on the licence question: its card links the Apache-2.0 text directly rather than relying on a metadata tag. Same loader and same footprint as SOAR.",
    spec: {
      vendor: "rednote HiLab",
      family: "dots_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["DotTTS-MF-GGUF/dots-tts-mf-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3600,
    },
    license: {
      ...dotsTts("rednote-hilab/dots.tts-mf"),
      correction: 'The shipped catalog says "Unknown". This variant is Apache-2.0, linked from its own model card.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("rednote-hilab/dots.tts-mf"), gh("studio-dots-ai/dots.tts"), GGUF_TABLE],
  },
  {
    slug: "dots-tts-edit",
    catalogId: "audiocpp-dots-tts-edit",
    name: "Dots TTS Edit",
    vendor: "rednote HiLab",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Dots TTS Edit — licence unresolved | Soundbox",
    metaDescription:
      "The Edit variant of dots.tts declares 'other' with no licence name, link or LICENSE file, while its siblings are Apache-2.0. Its terms could not be confirmed.",
    tagline: "Its siblings are Apache-2.0. This one declares 'other' and names nothing.",
    distinctiveness:
      "The genuine unknown of the dots.tts trio, and a good illustration of why a sibling's licence is not simply copied across. SOAR and MF are Apache-2.0 on their own repos. Edit declares “other” with no licence name, no licence link and no LICENSE file, and lives under a different Hugging Face organisation than the other two. The upstream README says dots.tts checkpoints are Apache-2.0 without carving Edit out — so Apache-2.0 is the likely intent, and the repo itself contradicts it.",
    spec: {
      vendor: "rednote HiLab",
      family: "dots_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["DotTTS-Edit-GGUF/dots-tts-edit-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3600,
    },
    license: {
      name: 'Unresolved — declared "other", unnamed',
      commercial: "unknown",
      summary:
        "This model's licence could not be confirmed. Its Hugging Face repo declares “other” with no licence name and no licence link, and there is no LICENSE file in it — the repo's files were enumerated and the licence path returns nothing. Its own card only says to see the repository licence metadata, which is the thing that declares nothing.",
      conditions: [
        "The upstream dots.tts README states that code and released checkpoints are Apache-2.0, without carving out Edit. That makes Apache-2.0 the likely intent — but the repo's own metadata says “other”, and the contradiction is not resolved here in the publisher's favour on their behalf.",
        "Ask rednote HiLab before any commercial use. If you want this family with terms you can read, use SOAR or MF.",
      ],
      output:
        "The card asks users not to impersonate people, mislead listeners, violate consent or create unlawful content, and to disclose synthetic or edited audio. Since the licence cannot be identified, whether any of that is contractual cannot be stated.",
      gated: "no",
      sources: [
        hf("dots-studio/dots.tts.edit"),
        gh("studio-dots-ai/dots.tts", "Upstream README (says Apache-2.0 for checkpoints)"),
        GGUF_TABLE,
      ],
      readByUs: true,
      correction:
        'The shipped catalog says "Unknown", and having gone and looked, unknown is still right — with detail. audio.cpp\'s conversion table labels this package Apache-2.0, matching the other two variants, but the weights repo declares "other" and names no licence at all. Note also that Edit lives under the dots-studio organisation on Hugging Face rather than rednote-hilab.',
    },
    downloadSize: null,
    quirks: [
      "The only dots.tts variant whose licence could not be established.",
      "Opt-in and untested here.",
    ],
    sources: [hf("dots-studio/dots.tts.edit"), gh("studio-dots-ai/dots.tts"), GGUF_TABLE],
  },
  {
    slug: "qwen3-tts-0-6b-base",
    catalogId: "audiocpp-qwen3-tts-0-6b-base",
    name: "Qwen3 TTS 0.6B Base",
    vendor: "Alibaba",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Qwen3 TTS 0.6B Base — Apache-2.0 | Soundbox",
    metaDescription:
      "The smallest Qwen3 TTS variant, Apache-2.0 and ungated like the rest of the family, run locally through audio.cpp.",
    tagline: "The small Qwen3 TTS. Apache-2.0, ungated, ~2.5 GB.",
    distinctiveness:
      "The entry point to a family of four in this catalog, all sharing the qwen3_tts loader and all Apache-2.0 — each repo was checked individually rather than assuming the family, because size tiers sometimes differ in licence, and here they do not. There is no separate Qwen licence in play for these.",
    spec: {
      vendor: "Alibaba",
      family: "qwen3_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Qwen3-TTS-12Hz-0.6B-Base-GGUF/qwen3-tts-12hz-0.6b-base-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 2500,
    },
    license: {
      ...qwen3Tts("Qwen/Qwen3-TTS-12Hz-0.6B-Base"),
      correction:
        'The shipped catalog says "Unknown". It is Apache-2.0 — verified on this specific repo, not inferred from the family. Note the tokenizer is a separate repo (Qwen/Qwen3-TTS-Tokenizer-12Hz), also Apache-2.0.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("Qwen/Qwen3-TTS-12Hz-0.6B-Base"), gh("QwenLM/Qwen3"), GGUF_TABLE],
  },
  {
    slug: "qwen3-tts-1-7b-base",
    catalogId: "audiocpp-qwen3-tts-1-7b-base",
    name: "Qwen3 TTS 1.7B Base",
    vendor: "Alibaba",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Qwen3 TTS 1.7B Base — Apache-2.0 | Soundbox",
    metaDescription:
      "The 1.7B Qwen3 TTS base model, Apache-2.0 and ungated, run locally through audio.cpp with no Python stack.",
    tagline: "The larger Qwen3 TTS base model. Apache-2.0, ungated, ~3.3 GB.",
    distinctiveness:
      "Same family and same licence as the 0.6B, with roughly three times the parameters. This is the one to start from if you want the Qwen3 TTS family at its most general — the CustomVoice and VoiceDesign entries are specialisations of the same size class.",
    spec: {
      vendor: "Alibaba",
      family: "qwen3_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Qwen3-TTS-12Hz-1.7B-Base-GGUF/qwen3-tts-12hz-1.7b-base-q8_0_v2.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3300,
    },
    license: {
      ...qwen3Tts("Qwen/Qwen3-TTS-12Hz-1.7B-Base"),
      correction: 'The shipped catalog says "Unknown". It is Apache-2.0, verified on this repo.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("Qwen/Qwen3-TTS-12Hz-1.7B-Base"), gh("QwenLM/Qwen3"), GGUF_TABLE],
  },
  {
    slug: "qwen3-tts-1-7b-customvoice",
    catalogId: "audiocpp-qwen3-tts-1-7b-customvoice",
    name: "Qwen3 TTS 1.7B CustomVoice",
    vendor: "Alibaba",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Qwen3 TTS 1.7B CustomVoice — Apache-2.0 | Soundbox",
    metaDescription:
      "The voice-cloning variant of Qwen3 TTS 1.7B. Apache-2.0 — which means no consent clause, so the consent question is entirely yours.",
    tagline: "Clones a voice from a reference. Apache-2.0, which means no consent clause at all.",
    distinctiveness:
      "The reference-conditioned variant of the 1.7B model. Its licence is the same clean Apache-2.0 as the rest of the family, and that is precisely the thing to notice: Apache-2.0 imposes no consent requirement, so nothing in the terms of this model stops you cloning a voice you have no right to. That obligation is entirely yours.",
    spec: {
      vendor: "Alibaba",
      family: "qwen3_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Qwen3-TTS-12Hz-1.7B-CustomVoice-GGUF/qwen3-tts-12hz-1.7b-customvoice-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3400,
    },
    license: {
      ...qwen3Tts("Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice"),
      correction: 'The shipped catalog says "Unknown". It is Apache-2.0, verified on this repo.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice"), gh("QwenLM/Qwen3"), GGUF_TABLE],
  },
  {
    slug: "qwen3-tts-1-7b-voicedesign",
    catalogId: "audiocpp-qwen3-tts-1-7b-voicedesign",
    name: "Qwen3 TTS 1.7B VoiceDesign",
    vendor: "Alibaba",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Qwen3 TTS 1.7B VoiceDesign — Apache-2.0 | Soundbox",
    metaDescription:
      "Describe a voice in text rather than cloning one. Apache-2.0 and ungated, run locally through audio.cpp.",
    tagline: "Describe the voice instead of cloning it. Apache-2.0, ungated.",
    distinctiveness:
      "The text-described-voice variant of the 1.7B model — the same idea as Irodori's VoiceDesign, in a family with a cleaner licence. Describing a voice rather than supplying a reference clip is the version of this technology with the fewest consent problems attached, which is worth preferring where it does the job.",
    spec: {
      vendor: "Alibaba",
      family: "qwen3_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: ["Qwen3-TTS-12Hz-1.7B-VoiceDesign-GGUF/qwen3-tts-12hz-1.7b-voicedesign-q8_0.gguf"],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 3400,
    },
    license: {
      ...qwen3Tts("Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"),
      correction: 'The shipped catalog says "Unknown". It is Apache-2.0, verified on this repo.',
    },
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [hf("Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"), gh("QwenLM/Qwen3"), GGUF_TABLE],
  },
  {
    slug: "pocket-tts",
    catalogId: "audiocpp-pocket-tts",
    name: "Pocket TTS — English",
    vendor: "Kyutai",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Pocket TTS English — CC-BY-4.0 weights | Soundbox",
    metaDescription:
      "Kyutai's Pocket TTS with 26 bundled speakers. CC-BY-4.0 weights, MIT code — but each voice carries its own licence, and some collections are non-commercial.",
    tagline: "26 named speakers, CC-BY-4.0 weights — and each voice has its own licence.",
    distinctiveness:
      "The only entry in the catalog that ships a named voice list — 26 of them — and the only one where the licence question has two layers. The weights are CC-BY-4.0 and the code is MIT, which is straightforward. The voices are licensed separately, per collection: Kyutai's voice repository ranges from CC0 through CC-BY-4.0 to CC-BY-NC-4.0, so which speaker you pick can decide whether your use is commercial-safe.",
    spec: {
      vendor: "Kyutai",
      family: "pocket_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: [
        "PocketTTS-GGUF/english/pocket-tts-english-q8_0.gguf",
        "PocketTTS-GGUF/english/embeddings/**",
      ],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 2000,
    },
    license: pocketTts("English"),
    downloadSize: null,
    quirks: [
      "The entry pulls a speaker-embedding directory alongside the GGUF, which is why its weights glob is a list.",
      "Opt-in and untested here.",
    ],
    sources: [
      hf("kyutai/pocket-tts"),
      gh("kyutai-labs/pocket-tts"),
      { label: "kyutai/tts-voices — the voices' own licences", href: "https://huggingface.co/kyutai/tts-voices" },
      GGUF_TABLE,
    ],
  },
  {
    slug: "pocket-tts-german",
    catalogId: "audiocpp-pocket-tts-german",
    name: "Pocket TTS — German",
    vendor: "Kyutai",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Pocket TTS German — CC-BY-4.0 weights | Soundbox",
    metaDescription:
      "The German Pocket TTS package. Same CC-BY-4.0 weights and MIT code as the English entry, same per-voice licensing caveat.",
    tagline: "The German package. Same weights licence, same per-voice caveat.",
    distinctiveness:
      "One of five language packages Kyutai publishes that this catalog carries. Mechanically identical to the English entry — same loader, same footprint, same speaker list — and it inherits the same two-layer licence question, where the weights are clear and the individual voices are not.",
    spec: {
      vendor: "Kyutai",
      family: "pocket_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: [
        "PocketTTS-GGUF/german/pocket-tts-german-q8_0.gguf",
        "PocketTTS-GGUF/german/embeddings/**",
      ],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 2000,
    },
    license: pocketTts("German"),
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [
      hf("kyutai/pocket-tts"),
      gh("kyutai-labs/pocket-tts"),
      { label: "kyutai/tts-voices — the voices' own licences", href: "https://huggingface.co/kyutai/tts-voices" },
      GGUF_TABLE,
    ],
  },
  {
    slug: "pocket-tts-italian",
    catalogId: "audiocpp-pocket-tts-italian",
    name: "Pocket TTS — Italian",
    vendor: "Kyutai",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Pocket TTS Italian — CC-BY-4.0 weights | Soundbox",
    metaDescription:
      "The Italian Pocket TTS package. Same CC-BY-4.0 weights and MIT code as the English entry, same per-voice licensing caveat.",
    tagline: "The Italian package. Same weights licence, same per-voice caveat.",
    distinctiveness:
      "One of five Pocket TTS language packages in this catalog, identical in shape to the English entry and carrying the same split between a clear weights licence and voices whose individual terms could not be pinned down.",
    spec: {
      vendor: "Kyutai",
      family: "pocket_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: [
        "PocketTTS-GGUF/italian/pocket-tts-italian-q8_0.gguf",
        "PocketTTS-GGUF/italian/embeddings/**",
      ],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 2000,
    },
    license: pocketTts("Italian"),
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [
      hf("kyutai/pocket-tts"),
      gh("kyutai-labs/pocket-tts"),
      { label: "kyutai/tts-voices — the voices' own licences", href: "https://huggingface.co/kyutai/tts-voices" },
      GGUF_TABLE,
    ],
  },
  {
    slug: "pocket-tts-portuguese",
    catalogId: "audiocpp-pocket-tts-portuguese",
    name: "Pocket TTS — Portuguese",
    vendor: "Kyutai",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Pocket TTS Portuguese — CC-BY-4.0 weights | Soundbox",
    metaDescription:
      "The Portuguese Pocket TTS package. Same CC-BY-4.0 weights and MIT code as the English entry, same per-voice licensing caveat.",
    tagline: "The Portuguese package. Same weights licence, same per-voice caveat.",
    distinctiveness:
      "One of five Pocket TTS language packages in this catalog, identical in shape to the English entry and carrying the same split between a clear weights licence and voices whose individual terms could not be pinned down.",
    spec: {
      vendor: "Kyutai",
      family: "pocket_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: [
        "PocketTTS-GGUF/portuguese/pocket-tts-portuguese-q8_0.gguf",
        "PocketTTS-GGUF/portuguese/embeddings/**",
      ],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 2000,
    },
    license: pocketTts("Portuguese"),
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [
      hf("kyutai/pocket-tts"),
      gh("kyutai-labs/pocket-tts"),
      { label: "kyutai/tts-voices — the voices' own licences", href: "https://huggingface.co/kyutai/tts-voices" },
      GGUF_TABLE,
    ],
  },
  {
    slug: "pocket-tts-spanish",
    catalogId: "audiocpp-pocket-tts-spanish",
    name: "Pocket TTS — Spanish",
    vendor: "Kyutai",
    category: "voice",
    tier: "extra",
    verified: false,
    capabilities: ["tts"],
    metaTitle: "Pocket TTS Spanish — CC-BY-4.0 weights | Soundbox",
    metaDescription:
      "The Spanish Pocket TTS package. Same CC-BY-4.0 weights and MIT code as the English entry, same per-voice licensing caveat.",
    tagline: "The Spanish package. Same weights licence, same per-voice caveat.",
    distinctiveness:
      "One of five Pocket TTS language packages in this catalog, identical in shape to the English entry and carrying the same split between a clear weights licence and voices whose individual terms could not be pinned down.",
    spec: {
      vendor: "Kyutai",
      family: "pocket_tts",
      hfRepo: GGUF_REPO,
      weightsGlob: [
        "PocketTTS-GGUF/spanish/pocket-tts-spanish-q8_0.gguf",
        "PocketTTS-GGUF/spanish/embeddings/**",
      ],
      maxDurationS: 60,
      sampleRate: 44100,
      channels: 1,
      vramEstimateMb: 2000,
    },
    license: pocketTts("Spanish"),
    downloadSize: null,
    quirks: ["Opt-in and untested here."],
    sources: [
      hf("kyutai/pocket-tts"),
      gh("kyutai-labs/pocket-tts"),
      { label: "kyutai/tts-voices — the voices' own licences", href: "https://huggingface.co/kyutai/tts-voices" },
      GGUF_TABLE,
    ],
  },
];

/** Stable ordering for the hub's category sections. */
export const MODEL_CATEGORY_ORDER = ["sfx", "music", "voice", "utility"] as const;

export function getModel(slug: string | undefined): ModelContent | undefined {
  if (!slug) return undefined;
  return MODELS.find((model) => model.slug === slug);
}

/** Counts the hub quotes in its own header. Derived rather than written down,
 *  because a hand-maintained "46 models" line is a lie waiting to happen. */
export const MODEL_STATS = {
  total: MODELS.length,
  listed: MODELS.filter((m) => m.tier === "listed").length,
  runByUs: MODELS.filter((m) => m.verified).length,
  unconfirmedLicence: MODELS.filter((m) => m.license.commercial === "unknown").length,
  nonCommercial: MODELS.filter((m) => m.license.commercial === "no").length,
};
