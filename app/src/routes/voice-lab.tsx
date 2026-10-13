/**
 * Voice Lab — where a voice is made, named and kept.
 *
 * The Studio (`/voice`) is about a script; this page is about the cast. They
 * used to be one screen, with the library squeezed into a 20rem aside, which
 * made creating a voice feel like a side-effect of writing a line. Curating a
 * voice deserves the page: you are choosing what something sounds like, and
 * that decision is made by *listening*, not by reading a row in a list.
 *
 * So the two things this page adds over the old aside are room and ears. Room:
 * a responsive grid instead of a narrow column, with the reference clip and the
 * notes visible at a glance. Ears: a test read per voice, so a clone can be
 * judged before it is committed to a script — the whole reason someone opens
 * this page twice.
 *
 * Everything here writes through the same voice endpoints the Studio reads, so
 * a voice added mid-script and a voice added here are the same object; there is
 * no "lab copy" of anything.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ImageIcon,
  Loader2Icon,
  MicIcon,
  PlusIcon,
  Trash2Icon,
  UserRoundIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/search-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  AddVoiceDialog,
  ErrorPanel,
  JobResult,
  VoiceCard,
  isReady,
} from "@/components/voice-shared";
import { VoiceAvatar } from "@/components/voice-avatar";
import { useJobStream } from "@/hooks/use-job-stream";
import {
  useConvertVoice,
  useDeleteVoice,
  useModels,
  useSounds,
  useSpeak,
  useUpdateVoice,
  useImageStatus,
  useVoiceArtwork,
  useVoices,
} from "@/lib/queries";
import type { Model, Voice } from "@/lib/api";

/** Below this many voices the search box is pure chrome — you can see them all
 *  at once, so filtering costs a row of UI and saves nothing. */
const SEARCH_THRESHOLD = 6;

type KindFilter = "all" | "clone" | "builtin";

/** Case-insensitive match against the two fields a voice actually carries any
 *  memorable words in. */
function matchesQuery(voice: Voice, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    voice.name.toLowerCase().includes(q) ||
    (voice.notes ?? "").toLowerCase().includes(q)
  );
}

/** Search box + kind tabs. Deliberately a local twin of models.tsx's
 *  `SearchFilterBar` rather than an import: that one is typed to a model's
 *  `category` and lives with the model list's column geometry. Copying the
 *  20 lines keeps the two pages looking identical without coupling them. */
function SearchFilterBar({
  query,
  onQueryChange,
  kind,
  onKindChange,
  showKinds,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  kind: KindFilter;
  onKindChange: (k: KindFilter) => void;
  showKinds: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 @sm:flex-row @sm:items-center">
      <SearchInput value={query} onChange={onQueryChange} placeholder="Search voices…" />
      {showKinds && (
        <Tabs value={kind} onValueChange={(v) => onKindChange(v as KindFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="clone">Cloned</TabsTrigger>
            <TabsTrigger value="builtin">Built-in</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </div>
  );
}

/**
 * The test read, inline under whichever card is being auditioned.
 *
 * One panel with a single open target rather than one panel per card: the model
 * choice and the test line are the same for every voice you try (that is the
 * point — you are comparing voices, not scripts), and N mounted job streams for
 * N cards would each hold their own socket. Keeping the state here and
 * rendering into the selected card's footer means the controls sit next to the
 * voice they belong to while only one read is ever in flight.
 */
function TryItPanel({
  voice,
  models,
  line,
  onLineChange,
  onClose,
}: {
  voice: Voice;
  models: Model[];
  line: string;
  onLineChange: (v: string) => void;
  onClose: () => void;
}) {
  const [jobId, setJobId] = useState<string | null>(null);
  const speak = useSpeak();
  const { job } = useJobStream(jobId);

  // No model picker: a voice names the model it speaks through, so the read
  // has nothing left to choose. The only voice that still falls back is a
  // clone saved before voices carried a model — its clip works anywhere, so
  // the first ready model reads it.
  const pinned = voice.model_id ?? null;
  const model = pinned ? models.find((m) => m.id === pinned) : models[0];

  const submit = () => {
    if (!model || !line.trim()) return;
    speak.mutate(
      { model: model.id, lines: [{ text: line.trim(), voice_id: voice.id }] },
      { onSuccess: (ref) => setJobId(ref.job_id) },
    );
  };

  return (
    <div className="border-border/60 mt-2 space-y-2 rounded-lg border border-dashed p-2.5">
      {!model ? (
        <p className="text-muted-foreground text-xs">
          {pinned
            ? `${pinned} isn't installed, so this voice can't be previewed.`
            : "No text-to-speech model is ready."}{" "}
          <Link to="/models" className="text-foreground underline underline-offset-4">
            Go to Models
          </Link>
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {/* The model is stated, not offered — it came with the voice. */}
            <p className="text-muted-foreground flex-1 truncate text-xs">
              Reads through {model.name}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close test read"
            >
              <XIcon />
            </Button>
          </div>

          <Textarea
            className="min-h-14 text-sm"
            value={line}
            placeholder="A short line to hear this voice say…"
            onChange={(e) => onLineChange(e.target.value)}
          />

          <Button
            size="sm"
            className="w-full"
            disabled={!line.trim() || speak.isPending}
            onClick={submit}
          >
            <MicIcon />
            {speak.isPending ? "Starting…" : "Read it"}
          </Button>

          <JobResult job={job} />
        </>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- convert */

/**
 * Re-voice an existing sound: keep the performance, change the speaker.
 *
 * Moved here from the old Voice Studio when that page became a script editor,
 * and left alone when that editor became the Script Builder.
 * It never really belonged beside a script — a conversion has no script, it
 * has a clip — and it depends on exactly what this page is for, which is
 * cloned voices with reference audio behind them.
 */
function VoiceConvertPanel({ models, voices }: { models: Model[]; voices: Voice[] }) {
  const ready = models.filter(isReady);
  const [modelId, setModelId] = useState<string>("");
  const [soundId, setSoundId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  const sounds = useSounds({ limit: 100, offset: 0 });
  const convert = useConvertVoice();
  const { job } = useJobStream(jobId);

  // No conversion model installed is not an error state worth a panel — the
  // section simply isn't applicable, so it stays out of the way.
  if (ready.length === 0) return null;

  const model = ready.find((m) => m.id === modelId) ?? ready[0];
  // Conversion works by matching reference audio, which a builtin doesn't
  // have — the backend rejects them outright, so they never reach the picker.
  const clones = voices.filter((v) => v.kind === "clone");
  const items = sounds.data?.items ?? [];

  const submit = () => {
    if (!soundId || !voiceId) return;
    convert.mutate(
      { model: model.id, source_sound_id: soundId, voice_id: voiceId },
      { onSuccess: (ref) => setJobId(ref.job_id) },
    );
  };

  return (
    <div className="border-border space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="font-heading text-sm font-semibold tracking-tight">Convert a voice</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Keep the performance, change the speaker: a sound from your Library is re-sung in
          one of your cloned voices.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56 space-y-1.5">
          <Label htmlFor="voice-vc-model">Model</Label>
          <Select value={model.id} onValueChange={setModelId}>
            <SelectTrigger id="voice-vc-model" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ready.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-56 flex-1 space-y-1.5">
          <Label htmlFor="voice-vc-source">Source sound</Label>
          <Select value={soundId} onValueChange={setSoundId}>
            <SelectTrigger id="voice-vc-source" className="w-full">
              <SelectValue placeholder={sounds.isLoading ? "Loading…" : "Pick a sound"} />
            </SelectTrigger>
            <SelectContent>
              {items.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48 space-y-1.5">
          <Label htmlFor="voice-vc-target">Target voice</Label>
          <Select value={voiceId} onValueChange={setVoiceId} disabled={!clones.length}>
            <SelectTrigger id="voice-vc-target" className="w-full">
              <SelectValue placeholder={clones.length ? "Pick a voice" : "No clones"} />
            </SelectTrigger>
            <SelectContent>
              {clones.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {/* Radix renders the chosen item's own children inside
                      `SelectValue`, so putting the avatar here puts it in the
                      closed trigger too — one change, both states. */}
                  <span className="flex items-center gap-2">
                    <VoiceAvatar voice={v} className="size-5 rounded-full" />
                    {v.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Only cloned voices can be a conversion target — the model needs the reference clip to
        match against, which a built-in voice has no equivalent of.
      </p>

      <Button disabled={!soundId || !voiceId || convert.isPending} onClick={submit}>
        <UserRoundIcon />
        {convert.isPending ? "Starting…" : "Convert"}
      </Button>

      <JobResult job={job} />
    </div>
  );
}

export function VoiceLabPage() {
  const voices = useVoices();
  const models = useModels();

  const update = useUpdateVoice();
  const remove = useDeleteVoice();
  const drawing = useVoiceArtwork();
  // `ready` already folds in mode, engine and model — the card asks one
  // question rather than re-deriving the rule the server settled.
  const imageReady = useImageStatus().data?.ready ?? false;

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Voice | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [deleting, setDeleting] = useState<Voice | null>(null);

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");

  /** Which card's test read is open, plus the line shared across every
   *  audition. No model here any more: it comes with the voice. */
  const [trying, setTrying] = useState<string | null>(null);
  const [tryLine, setTryLine] = useState("The quick brown fox jumps over the lazy dog.");

  const ttsModels = useMemo(
    () => (models.data ?? []).filter((m) => m.task === "tts"),
    [models.data],
  );
  const readyTts = useMemo(() => ttsModels.filter(isReady), [ttsModels]);
  const vcModels = useMemo(
    () => (models.data ?? []).filter((m) => m.task === "vc"),
    [models.data],
  );

  const all = voices.data ?? [];
  const filtered = all.filter(
    (v) => (kind === "all" || v.kind === kind) && matchesQuery(v, query),
  );
  const showFilters = all.length >= SEARCH_THRESHOLD;

  const openEdit = (voice: Voice) => {
    setNameDraft(voice.name);
    setNotesDraft(voice.notes ?? "");
    setEditing(voice);
  };

  return (
    <div className="@container space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Voice Lab</h1>
          <p className="text-muted-foreground text-sm">
            A voice is a speaker you can point a script at — either cloned from a
            clip of someone talking, or one of the named voices a model already
            ships. Make them here, hear them here, then use them in the{" "}
            <Link
              to="/studio?builder=script"
              className="text-foreground underline underline-offset-4"
            >
              Script Builder
            </Link>
            .
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <PlusIcon />
          Add voice
        </Button>
      </div>

      {models.isError && (
        <ErrorPanel title="Could not load the model catalog" error={models.error} />
      )}

      {/* Voices can still be created and curated with no TTS model on disk —
          only the test read needs one — so this is a note, not a blocking empty
          state like the Studio's. */}
      {!models.isLoading && !models.isError && readyTts.length === 0 && (
        <p className="border-border/70 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm">
          No text-to-speech model is installed, so voices can be saved but not
          previewed here.{" "}
          <Link to="/models" className="text-foreground underline underline-offset-4">
            Go to Models
          </Link>
          .
        </p>
      )}

      {showFilters && (
        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          kind={kind}
          onKindChange={setKind}
          showKinds
        />
      )}

      {voices.isLoading ? (
        <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : voices.isError ? (
        <ErrorPanel title="Could not load voices" error={voices.error} />
      ) : all.length === 0 ? (
        <div className="border-border/70 text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-16 text-center">
          <div className="bg-muted flex size-11 items-center justify-center rounded-full">
            <UsersRoundIcon className="text-muted-foreground/70 size-5" aria-hidden="true" />
          </div>
          <p className="text-foreground text-sm font-medium">No voices yet</p>
          <p className="max-w-md text-sm">
            There are three ways to get one: <strong>upload</strong> a few seconds
            of clean, single-speaker audio to clone; <strong>record</strong> a clip
            straight from your microphone; or save one of the{" "}
            <strong>built-in</strong> voices a text-to-speech model already ships.
          </p>
          <Button className="mt-1" onClick={() => setAddOpen(true)}>
            <PlusIcon />
            Add your first voice
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed px-6 py-12 text-center text-sm">
          No voices match.{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setKind("all");
            }}
            className="text-foreground underline underline-offset-4"
          >
            Clear the filters
          </button>
          .
        </div>
      ) : (
        <div className="grid items-start gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {filtered.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-expanded={trying === voice.id}
                    onClick={() =>
                      setTrying((current) => (current === voice.id ? null : voice.id))
                    }
                  >
                    <MicIcon />
                    Try it
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(voice)}>
                    Edit
                  </Button>
                  {/* Only offered when artwork is actually configured — a
                      button that always fails is worse than no button. The
                      avatar is drawn from the voice's notes, which is also why
                      the empty-notes case falls back to the name. */}
                  {imageReady && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={drawing.isPending}
                      onClick={() => drawing.mutate(voice.id)}
                    >
                      {drawing.isPending && drawing.variables === voice.id ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <ImageIcon />
                      )}
                      {voice.artwork ? "Redraw" : "Avatar"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive ml-auto"
                    onClick={() => setDeleting(voice)}
                  >
                    Delete
                  </Button>
                </>
              }
              footer={
                trying === voice.id ? (
                  <TryItPanel
                    voice={voice}
                    models={readyTts}
                    line={tryLine}
                    onLineChange={setTryLine}
                    onClose={() => setTrying(null)}
                  />
                ) : null
              }
            />
          ))}
        </div>
      )}

      {/* Conversion lives here rather than in the Studio because it is a
          voice operation, not a writing one: it takes a performance that
          already exists and puts a different speaker behind it, which is the
          same kind of work as cloning one — and it needs the clone voices this
          page is about. */}
      <VoiceConvertPanel models={vcModels} voices={all} />

      <AddVoiceDialog open={addOpen} onOpenChange={setAddOpen} ttsModels={ttsModels} />

      {/* ------------------------------------------- rename + notes, one dialog */}
      {/* Rename and notes were separate concerns in the old aside (only rename
          was reachable at all). They are one form here because they are the
          only editable fields a voice has, and a dialog per field is two trips
          for one thought. */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit voice</DialogTitle>
            <DialogDescription>
              The name is how this voice appears in the script editor. Notes are
              for you — accent, tone, where the clip came from.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="voice-lab-name">Name</Label>
              <Input
                id="voice-lab-name"
                value={nameDraft}
                autoFocus
                onChange={(e) => setNameDraft(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="voice-lab-notes">Notes</Label>
              <Input
                id="voice-lab-notes"
                value={notesDraft}
                placeholder="optional"
                onChange={(e) => setNotesDraft(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              disabled={!nameDraft.trim() || update.isPending}
              onClick={() => {
                if (!editing) return;
                update.mutate(
                  {
                    id: editing.id,
                    patch: {
                      name: nameDraft.trim(),
                      notes: notesDraft.trim() || null,
                    },
                  },
                  { onSuccess: () => setEditing(null) },
                );
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------- delete */}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              {deleting?.kind === "clone"
                ? "The reference clip is removed too. Sounds already read in this voice are unaffected."
                : "Removes the saved entry. The model keeps the built-in voice itself."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (!deleting) return;
                remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
              }}
            >
              <Trash2Icon />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
