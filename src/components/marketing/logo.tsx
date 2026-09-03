import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  onElement = false,
  iconOnly = false,
}: {
  className?: string;
  /** Pass true when the logo sits on an --element (red) background. */
  onElement?: boolean;
  /** Pass true to show just the icon mark, no wordmark text. */
  iconOnly?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/icon.svg"
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0 rounded-[7px]"
        priority
      />
      {!iconOnly && (
        <span
          className={cn(
            "font-display text-xl font-semibold tracking-tight",
            onElement ? "text-ink" : "text-ink-strong"
          )}
        >
          Snap
          <span className={onElement ? "text-ink/70" : "text-element"}>
            Cal
          </span>
        </span>
      )}
    </span>
  );
}
