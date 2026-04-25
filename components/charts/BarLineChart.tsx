"use client";

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

export function BarLineChart({ data, currency = "NPR" }: BarLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        No trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
        />
        <Bar dataKey="income" name="Income" fill="#22C55E" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[3, 3, 0, 0]} />
        <Line
          type="monotone"
          dataKey="net"
          name="Net"
          stroke="#6366F1"
          strokeWidth={2}
          dot={{ r: 3, fill: "#6366F1" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
