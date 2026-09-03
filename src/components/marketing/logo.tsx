import { cn } from "@/lib/utils";

export function Logo({
  className,
  onElement = false,
}: {
  className?: string;
  /** Pass true when the logo sits on an --element (red) background. */
  onElement?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-display text-xl font-semibold tracking-tight",
        onElement ? "text-ink" : "text-ink-strong",
        className
      )}
    >
      Snap
      <span className={onElement ? "text-ink/70" : "text-element"}>Cal</span>
    </span>
  );
}
