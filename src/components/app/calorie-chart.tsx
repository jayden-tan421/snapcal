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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DayTotal } from "@/lib/aggregate";

export function CalorieChart({
  week,
  month,
  goal,
}: {
  week: DayTotal[];
  month: DayTotal[];
  goal: number;
}) {
  const [range, setRange] = useState<"week" | "month">("week");
  const data = range === "week" ? week : month;

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
            <Bar dataKey="calories" fill="var(--element)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
