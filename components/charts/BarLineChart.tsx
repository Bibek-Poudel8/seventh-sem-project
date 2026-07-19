"use client";

import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface BarLineChartProps {
  data: MonthlyTrendData[];
  currency?: string;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
  currency = "NPR",
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-sm space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-medium">
              {currency} {p.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── % change cell ────────────────────────────────────────────────────────────
//
// null  = no previous data or divide-by-zero  → render "—"
// 0     = no change                           → render "0%"  (muted, no arrow)
// +n    = increase                            → render "▲ n%"
// -n    = decrease                            → render "▼ n%"
//
// invertSign: true for Expenses — spending ↑ (positive delta) is semantically bad.

function ChangeCell({
  delta,
}: {
  delta: number | null;
}) {
  const mono: React.CSSProperties = {
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  };

  if (delta === null || delta === 0) {
    return (
      <span className="text-xs text-muted-foreground/50" style={mono}>
        —
      </span>
    );
  }

  const color = delta > 0 ? "text-emerald-500" : "text-rose-500";
  const arrow = delta > 0 ? "▲" : "▼";

  return (
    <span className={`text-xs font-medium ${color}`} style={mono}>
      {arrow}&thinsp;{Math.abs(delta)}%
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute period-over-period % change.
 * Returns null when `previous` is 0 or undefined (genuine no-data → show "—").
 */
function pctChange(current: number, previous: number | undefined): number | null {
  if (previous === undefined) return null;
  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function BarLineChart({ data, currency = "NPR" }: BarLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        No trend data available
      </div>
    );
  }

  // Determine whether the series spans multiple years by checking the
  // two-digit year suffix in the `month` label (e.g. "Feb 26"). If the set of
  // year tokens has more than one value, show the year on X-axis labels.
  const yearTokens = new Set(data.map((d) => {
    const parts = String(d.month).trim().split(" ");
    return parts.length > 1 ? parts[parts.length - 1] : "";
  }));
  const showYear = yearTokens.size > 1;

  // Helper to format X axis ticks: "Feb 26" → "Feb" (or keep year when needed)
  const formatMonthTick = (label: string) => {
    if (!label) return "";
    const parts = String(label).trim().split(" ");
    if (parts.length === 1) return parts[0];
    const month = parts.slice(0, parts.length - 1).join(" ");
    const year = parts[parts.length - 1];
    return showYear ? `${month} ${year}` : month;
  };

  // The trend array always contains the last N calendar months in order.
  // The last entry is the most recent (current) month; the one before it
  // is the immediately preceding month — the natural comparison target.
  const latest = data[data.length - 1];
  const prev   = data.length >= 2 ? data[data.length - 2] : null;

  // Round to a whole number, thousands-separated, no decimals.
  const fmt = (v: number) =>
    `${currency}\u00a0${Math.round(v).toLocaleString()}`;

  // Compute month-over-month deltas from the trend data.
  // pctChange() returns null when previous is 0 → "—" in UI.
  const incomeChange  = pctChange(latest.income,   prev?.income);
  const expenseChange = pctChange(latest.expenses, prev?.expenses);
  const netChange = pctChange(latest.net, prev?.net);

  const monoStyle: React.CSSProperties = {
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  };

  const summaryRows = [
    { label: "Income",      value: fmt(latest.income),   delta: incomeChange },
    { label: "Expenses",    value: fmt(latest.expenses), delta: expenseChange },
    { label: "Net Savings", value: fmt(latest.net),      delta: netChange },
  ];

  return (
    <div className="flex flex-col h-full w-full">

      {/* ── Chart — flex-1 claims all remaining height ── */}
      <div className="flex-1 min-h-0 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatMonthTick}
              interval={0}
              height={28}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingTop: "6px" }}
            />
            <Bar dataKey="income"   name="Income"   fill="#22C55E" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[3, 3, 0, 0]} />
            <Line
              type="monotone"
              dataKey="net"
              name="Net"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ r: 4, fill: "#6366F1" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Monthly Summary footer ──────────────────────────────────────────── */}
      <div className="border-t border-border/40 px-4 pt-3 pb-4 shrink-0">

        {/* Section heading — visually subordinate to the card title */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70 mb-3 select-none">
          Monthly Summary
        </p>

        {/*
          3-column CSS grid:  [label]  [value]  [Δ%]
          - label  → stretches to fill remaining space
          - value  → auto-width, right-aligned, tabular-nums
          - change → minimum width so arrows always align across rows
          All columns share the same monospace stack for digit alignment.
        */}
        <div
          className="grid gap-y-3"
          style={{ gridTemplateColumns: "1fr auto auto", columnGap: "1.25rem" }}
        >
          {summaryRows.map(({ label, value, delta }) => (
            <React.Fragment key={label}>

              {/* Col 1 — label */}
              <span
                className="text-sm text-muted-foreground self-center"
                style={monoStyle}
              >
                {label}
              </span>

              {/* Col 2 — amount */}
              <span
                className="text-sm font-semibold text-foreground text-right self-center tabular-nums"
                style={monoStyle}
              >
                {value}
              </span>

              {/* Col 3 — percent change */}
              <div className="text-right self-center min-w-[3.5rem]">
                <ChangeCell delta={delta} />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
