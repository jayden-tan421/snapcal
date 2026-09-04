"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

/** A tap-to-expand section — used to keep secondary forms (like "New
 *  crossbet") out of the way until someone actually wants them. */
export function CollapsibleSection({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          playSound("tap");
          setOpen((o) => !o);
        }}
        className="flex w-full items-center justify-between rounded-2xl bg-background/40 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
          <Plus
            className={cn("size-4 transition-transform", open && "rotate-45")}
          />
          {label}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-ink-strong/50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
