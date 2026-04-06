"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";

interface DonutSlice {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

interface DonutChartProps {
  data: DonutSlice[];
  currency?: string;
}

const CustomTooltip = ({
  active,
  payload,
  currency = "NPR",
}: {
  active?: boolean;
  payload?: Array<{ payload: DonutSlice }>;
  currency?: string;
}) => {
  if (active && payload?.length) {
    const { category, amount, percentage } = payload[0].payload;
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-sm">
        <p className="font-semibold">{category}</p>
        <p className="text-muted-foreground">
          {currency} {amount.toLocaleString()} ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export function DonutChart({ data, currency = "NPR" }: DonutChartProps) {
  const router = useRouter();
  const total = data.reduce((s, d) => s + d.amount, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        No expense data for this period
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="amount"
            nameKey="category"
            onClick={(entry: any) =>
              router.push(
                `/dashboard/transactions?category=${encodeURIComponent(entry.category)}`
              )
            }
            className="cursor-pointer"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="-mt-4 flex flex-col items-center justify-center">
        <p className="text-xs text-muted-foreground">Total spend</p>
        <p className="text-lg font-bold">
          {currency} {total.toLocaleString()}
        </p>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-1.5">
        {data.map((item, i) => (
          <button
            key={i}
            onClick={() =>
              router.push(
                `/dashboard/transactions?category=${encodeURIComponent(item.category)}`
              )
            }
            className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50 transition-colors text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {currency} {item.amount.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-xs w-8 text-right">
                {item.percentage}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
