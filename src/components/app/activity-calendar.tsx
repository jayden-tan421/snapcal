import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Server-rendered month calendar — every interactive bit (day cells, month
 * nav) is a plain <Link> that updates the ?month=/&day= URL params, so no
 * client JS is needed here at all; the History page re-renders server-side
 * with the newly selected month/day.
 */
export function ActivityCalendar({
  monthKey,
  selectedDay,
  todayKey,
  activityDates,
}: {
  /** "YYYY-MM" */
  monthKey: string;
  /** "YYYY-MM-DD", if a day is currently selected */
  selectedDay?: string;
  /** "YYYY-MM-DD" for today, to outline it distinctly */
  todayKey: string;
  /** Dates within this month that already have a logged activity */
  activityDates: Set<string>;
}) {
  const monthStart = new Date(`${monthKey}-01T00:00:00`);
  const gridStart = startOfWeek(startOfMonth(monthStart));
  const gridEnd = endOfWeek(endOfMonth(monthStart));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const prevMonthKey = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonthKey = format(addMonths(monthStart, 1), "yyyy-MM");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`?tab=activity&month=${prevMonthKey}`}
          aria-label="Previous month"
          className="flex size-8 items-center justify-center rounded-full text-ink-strong/60 hover:bg-ink-strong/10 hover:text-ink-strong"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <p className="font-display text-base font-semibold text-ink-strong">
          {format(monthStart, "MMMM yyyy")}
        </p>
        <Link
          href={`?tab=activity&month=${nextMonthKey}`}
          aria-label="Next month"
          className="flex size-8 items-center justify-center rounded-full text-ink-strong/60 hover:bg-ink-strong/10 hover:text-ink-strong"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-strong/40">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const inMonth = dayKey.slice(0, 7) === monthKey;
          const isToday = dayKey === todayKey;
          const isSelected = dayKey === selectedDay;
          const hasActivity = activityDates.has(dayKey);

          if (!inMonth) {
            return <span key={dayKey} aria-hidden />;
          }

          return (
            <Link
              key={dayKey}
              href={`?tab=activity&month=${monthKey}&day=${dayKey}`}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-medium transition-colors",
                isSelected
                  ? "bg-element text-ink"
                  : isToday
                    ? "border border-element text-ink-strong"
                    : "text-ink-strong/80 hover:bg-ink-strong/10"
              )}
            >
              {day.getDate()}
              <span
                className={cn(
                  "size-1 rounded-full",
                  hasActivity && (isSelected ? "bg-ink" : "bg-element"),
                  !hasActivity && "bg-transparent"
                )}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
