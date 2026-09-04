export function CalorieHero({
  consumed,
  goal,
  burned = 0,
}: {
  consumed: number;
  goal: number;
  /** Calories burned from today's logged activities — added on top of the
   *  goal, same as most fitness trackers ("eat more on days you exercise"),
   *  per the app's own netting setting. */
  burned?: number;
}) {
  const adjustedGoal = goal + burned;
  const remaining = Math.max(0, adjustedGoal - consumed);
  const pct =
    adjustedGoal > 0 ? Math.min(100, Math.round((consumed / adjustedGoal) * 100)) : 0;

  return (
    <div className="rounded-3xl bg-element p-6 text-ink shadow-[0_10px_30px_-12px_rgba(198,68,70,0.55)]">
      <p className="text-sm font-medium text-ink/80">Today&apos;s calories</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-6xl font-semibold tracking-tight">
          {Math.round(consumed)}
        </span>
        {goal > 0 && (
          <span className="text-lg font-medium text-ink/75">
            / {adjustedGoal} kcal
          </span>
        )}
      </div>
      {burned > 0 && (
        <p className="mt-0.5 text-xs font-medium text-ink/70">
          {goal} goal + {Math.round(burned)} burned today
        </p>
      )}

      {goal > 0 && (
        <>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-ink/20">
            <div
              className="h-full rounded-full bg-ink transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-ink/80">
            {remaining > 0
              ? `${Math.round(remaining)} kcal left today`
              : "Goal reached for today"}
          </p>
        </>
      )}
    </div>
  );
}
