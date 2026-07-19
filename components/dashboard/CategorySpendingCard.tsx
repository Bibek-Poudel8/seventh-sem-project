"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DonutChart } from "@/components/charts/DonutChart";
import { fetchCategoryBreakdownAction } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

export default function CategorySpendingCard({
  initialData,
  currency,
}: {
  initialData: any;
  currency: string;
}) {
  // Generate month options first so we can use the first one as default
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label, value };
  });

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(months[0].value);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [year, month] = selectedMonth.split("-").map(Number);
        // Start of month
        const start = new Date(year, month - 1, 1);
        // End of month
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        
        const newData = await fetchCategoryBreakdownAction(
          start.toISOString(),
          end.toISOString()
        );
        
        if (isMounted) setData(newData);
      } catch (e) {
        console.error("Failed to fetch category breakdown:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [selectedMonth, initialData]);

  return (
    <Card className="bg-muted/30 flex flex-col h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Spending by Category</CardTitle>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[140px] h-7 text-xs bg-background/50">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className={cn("transition-opacity duration-200 h-full", loading ? "opacity-50 pointer-events-none" : "opacity-100")}>
          <DonutChart data={data} currency={currency} />
        </div>
      </CardContent>
    </Card>
  );
}
