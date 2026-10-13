/**
 * The three questions a repaint asks, and the two places that ask them.
 *
 * Repainting is offered from the waveform editor (drag out a range, hit the
 * brush) and from the timeline's right-click menu (mark a span on the ruler,
 * right-click a clip). Both are the same request — this window, this
 * description, this much freedom — so the controls live here rather than in
 * each surface, where they would drift apart the first time one of them
 * gained a knob.
 *
 * The editor shows them in its own popover, next to the DSP tools; the
 * timeline shows them in a dialog (see `RepaintDialog`), because the gesture
 * that opened it was a menu click and a menu that starts a minutes-long
 * render with no chance to say what you wanted is the thing people complain
 * about.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

export type RepaintMode = "balanced" | "conservative" | "aggressive";

export interface RepaintOptions {
  /** What should be there instead. Empty rerolls the source's own prompt. */
  prompt: string;
  strength: number;
  mode: RepaintMode;
}

export const DEFAULT_REPAINT: RepaintOptions = {
  prompt: "",
  strength: 0.7,
  mode: "balanced",
};

export function RepaintControls({
  value,
  onChange,
  placeholder,
  idPrefix = "repaint",
}: {
  value: RepaintOptions;
  onChange: (next: RepaintOptions) => void;
  /** The source's own prompt, shown as the placeholder — it is what happens
   *  if the box is left alone, so it belongs where the answer would go. */
  placeholder?: string;
  /** Distinguishes the label/field pairing when both surfaces are mounted. */
  idPrefix?: string;
}) {
  const patch = (part: Partial<RepaintOptions>) => onChange({ ...value, ...part });

  return (
    <>
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-normal" htmlFor={`${idPrefix}-prompt`}>
          What should be there
        </Label>
        <Textarea
          id={`${idPrefix}-prompt`}
          rows={2}
          maxLength={2000}
          value={value.prompt}
          onChange={(e) => patch({ prompt: e.target.value })}
          placeholder={placeholder || "Leave empty to reroll the same description"}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <Label className="text-muted-foreground text-xs font-normal">Strength</Label>
          <span className="text-xs font-medium tabular-nums">{value.strength.toFixed(2)}</span>
        </div>
        <div className="mt-2">
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[value.strength]}
            onValueChange={(v) => patch({ strength: v[0] })}
          />
        </div>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          Low keeps the original performance and varies it; high replaces what
          was there.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-normal">Mode</Label>
        <Select value={value.mode} onValueChange={(v) => patch({ mode: v as RepaintMode })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conservative">Conservative — follow the surrounding bars</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="aggressive">Aggressive — follow the new description</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

/**
 * The same controls as a dialog, for a caller that reached them from a menu.
 *
 * Resets every time it opens: the window is different each time, and a
 * strength left over from the last clip is a setting nobody chose for this
 * one.
 */
export function RepaintDialog({
  open,
  onOpenChange,
  description,
  placeholder,
  value,
  onChange,
  onConfirm,
  busy = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which seconds of what — the caller knows, this does not. */
  description: string;
  placeholder?: string;
  value: RepaintOptions;
  onChange: (next: RepaintOptions) => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repaint</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RepaintControls
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            idPrefix="repaint-dialog"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            Repaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
