"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Camera, ImageUp, Loader2, Pencil, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/image-compress";
import { saveMealAction } from "@/lib/actions/meals";
import { playSound } from "@/lib/sound";
import type { Confidence, MealItem } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Stage = "choose" | "compressing" | "analyzing" | "review" | "manual";

const emptyItem = (): MealItem => ({
  name: "",
  estimated_grams: 0,
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
});

export function LogMealSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [items, setItems] = useState<MealItem[]>([]);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [source, setSource] = useState<"ai" | "manual">("manual");
  const [notes, setNotes] = useState("");
  const [isSaving, startSaving] = useTransition();
  // Shown as a persistent banner (not just a toast) when AI analysis fails
  // and we fall back to manual entry — a toast alone was easy to miss since
  // it auto-dismisses in a few seconds right as the sheet is also visually
  // transitioning to the manual-entry stage.
  const [analysisError, setAnalysisError] = useState<{
    title: string;
    description?: string;
  } | null>(null);

  function reset() {
    setStage("choose");
    setItems([]);
    setConfidence(null);
    setNotes("");
    setAnalysisError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  /** Falls back to a pre-filled manual-entry stage with a toast + persistent banner explaining why. */
  function fallBackToManual(title: string, description?: string) {
    toast.error(title, description ? { description } : undefined);
    playSound("error");
    setAnalysisError({ title, description });
    setItems([emptyItem()]);
    setSource("manual");
    setConfidence(null);
    setStage("manual");
  }

  async function handleFileSelected(file: File) {
    setAnalysisError(null);
    setStage("compressing");

    let compressed: File;
    try {
      compressed = await compressImage(file);
    } catch {
      toast.error("Couldn't process that photo", {
        description: "Try a different photo, or enter this meal manually.",
      });
      playSound("error");
      setStage("choose");
      return;
    }

    setStage("analyzing");

    let res: Response;
    try {
      const formData = new FormData();
      formData.append("image", compressed);
      res = await fetch("/api/analyze", { method: "POST", body: formData });
    } catch {
      // Network-level failure — fetch itself never completed.
      fallBackToManual(
        "Couldn't reach the server",
        "Check your connection and try again, or enter this meal manually."
      );
      return;
    }

    // The route always returns JSON, but a platform-level failure (e.g. a
    // proxy/timeout error page) could return something else — never let
    // that throw silently past the user without any explanation.
    let body: { analysis?: { items: MealItem[]; confidence: Confidence }; message?: string };
    try {
      body = await res.json();
    } catch {
      fallBackToManual(
        "Analysis failed",
        `Unexpected response from the server (${res.status}). Try again, or enter this meal manually.`
      );
      return;
    }

    if (!res.ok) {
      if (res.status === 429) {
        fallBackToManual(
          "Daily AI limit reached",
          "Try again tomorrow, or enter this meal manually."
        );
      } else if (res.status === 422) {
        fallBackToManual(
          "Couldn't read that photo",
          "Try a clearer shot, or enter it manually."
        );
      } else {
        fallBackToManual(
          "Analysis failed",
          body.message ?? "Try again, or enter this meal manually."
        );
      }
      return;
    }

    if (!body.analysis) {
      fallBackToManual(
        "Analysis failed",
        "Try again, or enter this meal manually."
      );
      return;
    }

    const analysis = body.analysis;
    setItems(analysis.items.length ? analysis.items : [emptyItem()]);
    setConfidence(analysis.confidence);
    setSource("ai");
    setStage("review");
  }

  function startManual() {
    setAnalysisError(null);
    setItems([emptyItem()]);
    setSource("manual");
    setConfidence(null);
    setStage("manual");
  }

  function updateItem(index: number, patch: Partial<MealItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein_g: acc.protein_g + (item.protein_g || 0),
      carbs_g: acc.carbs_g + (item.carbs_g || 0),
      fat_g: acc.fat_g + (item.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  function handleSave() {
    const cleanItems = items.filter((item) => item.name.trim() !== "");
    if (cleanItems.length === 0) {
      toast.error("Add at least one food item first.");
      playSound("error");
      return;
    }

    startSaving(async () => {
      const result = await saveMealAction({
        items: cleanItems,
        total_calories: totals.calories,
        total_protein_g: totals.protein_g,
        total_carbs_g: totals.carbs_g,
        total_fat_g: totals.fat_g,
        notes,
        source,
        confidence,
      });

      if (result.error) {
        toast.error("Couldn't save that meal", { description: result.error });
        playSound("error");
        return;
      }

      toast.success("Meal logged!");
      playSound("success");
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-none bg-card px-5 pb-8"
      >
        <SheetHeader className="px-0">
          <SheetTitle className="font-display text-xl text-ink-strong">
            {stage === "choose" && "Log a meal"}
            {stage === "compressing" && "Getting your photo ready…"}
            {stage === "analyzing" && "Analyzing your meal…"}
            {stage === "review" && "Review before saving"}
            {stage === "manual" && "Enter meal manually"}
          </SheetTitle>
        </SheetHeader>

        {stage === "choose" && (
          <div className="mt-2 flex flex-col gap-3">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
                e.target.value = "";
              }}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-4 rounded-2xl bg-element px-5 py-4 text-left text-ink shadow-[0_3px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-ink/15">
                <Camera className="size-5" />
              </span>
              <span>
                <span className="block font-display text-base font-semibold">
                  Snap a photo
                </span>
                <span className="block text-sm text-ink/80">
                  Let AI estimate calories and macros
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="flex items-center gap-4 rounded-2xl bg-secondary px-5 py-4 text-left text-ink-strong active:translate-y-0.5"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-ink-strong/10">
                <ImageUp className="size-5" />
              </span>
              <span>
                <span className="block font-display text-base font-semibold">
                  Upload a photo
                </span>
                <span className="block text-sm text-ink-strong/70">
                  Pick one from your library
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={startManual}
              className="flex items-center gap-4 rounded-2xl bg-secondary px-5 py-4 text-left text-ink-strong active:translate-y-0.5"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-ink-strong/10">
                <Pencil className="size-5" />
              </span>
              <span>
                <span className="block font-display text-base font-semibold">
                  Enter manually
                </span>
                <span className="block text-sm text-ink-strong/70">
                  Type in the numbers yourself
                </span>
              </span>
            </button>
          </div>
        )}

        {(stage === "compressing" || stage === "analyzing") && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="size-8 animate-spin text-element" />
            <p className="font-display text-sm font-medium text-ink-strong/80">
              {stage === "compressing"
                ? "Compressing photo…"
                : "Reading what's on your plate…"}
            </p>
          </div>
        )}

        {(stage === "review" || stage === "manual") && (
          <div className="mt-2 flex flex-col gap-4">
            {stage === "manual" && analysisError && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    {analysisError.title}
                  </p>
                  {analysisError.description && (
                    <p className="mt-0.5 text-sm font-medium text-destructive/80">
                      {analysisError.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {confidence && (
              <span
                className={cn(
                  "self-start rounded-full px-3 py-1 text-xs font-semibold",
                  confidence === "high" && "bg-element/15 text-element",
                  confidence === "medium" && "bg-element/10 text-ink-strong/70",
                  confidence === "low" && "bg-destructive/10 text-destructive"
                )}
              >
                AI confidence: {confidence}
              </span>
            )}

            <div className="flex flex-col gap-3">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-background/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      placeholder="Food item"
                      className="h-9 flex-1 bg-ink/60"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-strong/50 hover:bg-ink-strong/10 hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    <NumberField
                      label="grams"
                      value={item.estimated_grams}
                      onChange={(v) => updateItem(i, { estimated_grams: v })}
                    />
                    <NumberField
                      label="kcal"
                      value={item.calories}
                      onChange={(v) => updateItem(i, { calories: v })}
                    />
                    <NumberField
                      label="protein"
                      value={item.protein_g}
                      onChange={(v) => updateItem(i, { protein_g: v })}
                    />
                    <NumberField
                      label="carbs"
                      value={item.carbs_g}
                      onChange={(v) => updateItem(i, { carbs_g: v })}
                    />
                    <NumberField
                      label="fat"
                      value={item.fat_g}
                      onChange={(v) => updateItem(i, { fat_g: v })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-strong/25 py-2.5 text-sm font-medium text-ink-strong/70 hover:bg-ink-strong/5"
            >
              <Plus className="size-4" /> Add item
            </button>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything worth remembering about this meal"
                className="bg-ink/60"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-element px-4 py-3 text-ink">
              <span className="text-sm font-medium text-ink/80">Total</span>
              <span className="font-display text-lg font-semibold">
                {Math.round(totals.calories)} kcal
                <span className="ml-2 text-sm font-medium text-ink/80">
                  P{Math.round(totals.protein_g)} · C{Math.round(totals.carbs_g)} · F
                  {Math.round(totals.fat_g)}
                </span>
              </span>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-11 w-full rounded-full bg-element text-base font-semibold text-ink shadow-[0_3px_0_0_rgba(0,0,0,0.18)] hover:bg-element/90"
            >
              {isSaving ? "Saving…" : "Save meal"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[0.65rem] font-medium text-ink-strong/50">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        onFocus={(e) => e.target.select()}
        className="h-8 w-full rounded-md border border-input bg-ink/60 px-1.5 text-sm text-ink-strong outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </label>
  );
}
