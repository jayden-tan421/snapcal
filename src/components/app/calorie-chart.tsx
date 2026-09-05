"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MealList } from "@/components/app/meal-list";
import { formatDateKeyLabel } from "@/lib/timezone";
import { playSound } from "@/lib/sound";
import type { DayTotal } from "@/lib/aggregate";
import type { Meal } from "@/lib/supabase/queries";

export function CalorieChart({
  week,
  month,
  goal,
  mealsByDate,
  timeZone,
}: {
  week: DayTotal[];
  month: DayTotal[];
  goal: number;
  /** This user's meals, keyed by local "YYYY-MM-DD" — lets tapping a bar
   *  show exactly what made up that day's total instead of just the
   *  number. */
  mealsByDate: Record<string, Meal[]>;
  timeZone: string;
}) {
  const [range, setRange] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const data = range === "week" ? week : month;

  const selectedMeals = selectedDate ? mealsByDate[selectedDate] ?? [] : [];
  const selectedItemCount = selectedMeals.reduce(
    (sum, meal) => sum + meal.items.length,
    0
  );
  const selectedCalories = selectedMeals.reduce(
    (sum, meal) => sum + meal.total_calories,
    0
  );

  return (
    <div className="rounded-3xl bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink-strong">
          Calories per day
        </h2>
        <Tabs value={range} onValueChange={(v) => setRange(v as "week" | "month")}>
          <TabsList className="h-8 bg-secondary">
            <TabsTrigger
              value="week"
              className="text-xs text-ink-strong/60 data-active:bg-element data-active:text-ink"
            >
              7 days
            </TabsTrigger>
            <TabsTrigger
              value="month"
              className="text-xs text-ink-strong/60 data-active:bg-element data-active:text-ink"
            >
              30 days
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <p className="mt-0.5 text-xs font-medium text-ink-strong/45">
        Tap a bar to see what made up that day&apos;s total.
      </p>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey={range === "week" ? "label" : "date"}
              tickFormatter={(v: string) =>
                range === "week" ? v : v.slice(8, 10)
              }
              tick={{ fill: "var(--ink-strong)", fontSize: 11, opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
              interval={range === "week" ? 0 : 3}
            />
            <YAxis
              tick={{ fill: "var(--ink-strong)", fontSize: 11, opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            {goal > 0 && (
              <ReferenceLine
                y={goal}
                stroke="var(--element)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
            )}
            <Tooltip
              cursor={{ fill: "var(--element)", fillOpacity: 0.08 }}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--ink-strong)",
                fontSize: 13,
              }}
              formatter={(value) => [`${value} kcal`, undefined]}
            />
            <Bar
              dataKey="calories"
              fill="var(--element)"
              radius={[6, 6, 0, 0]}
              className="cursor-pointer"
              onClick={(entry: { payload?: DayTotal }) => {
                const date = entry.payload?.date;
                if (!date) return;
                playSound("tap");
                setSelectedDate((prev) => (prev === date ? null : date));
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selectedDate && (
        <div className="mt-4 rounded-2xl bg-background/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-semibold text-ink-strong">
                {formatDateKeyLabel(selectedDate)}
              </p>
              <p className="text-xs font-medium text-ink-strong/50">
                {selectedMeals.length} meal{selectedMeals.length === 1 ? "" : "s"} ·{" "}
                {selectedItemCount} item{selectedItemCount === 1 ? "" : "s"} ·{" "}
                {Math.round(selectedCalories)} kcal
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              aria-label="Close day detail"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-strong/40 hover:bg-ink-strong/10 hover:text-ink-strong"
            >
              <X className="size-4" />
            </button>
          </div>
          <MealList
            meals={selectedMeals}
            timeZone={timeZone}
            emptyMessage="Nothing logged that day."
          />
        </div>
      )}
    </div>
  );
}
