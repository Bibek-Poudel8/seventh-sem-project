"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const range = searchParams.get("range") || "thisMonth";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    if (value !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`?${params.toString()}`);
  };

  const handleCustomDateChange = (type: "from" | "to", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set(type, value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Select value={range} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[180px] h-9">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select range" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7days">Last 7 Days</SelectItem>
          <SelectItem value="last30days">Last 30 Days</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="lastMonth">Last Month</SelectItem>
          <SelectItem value="thisYear">This Year</SelectItem>
          <SelectItem value="lastYear">Last Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {range === "custom" && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
          <Input
            type="date"
            value={from}
            onChange={(e) => handleCustomDateChange("from", e.target.value)}
            className="w-36 h-9 text-xs"
          />
          <span className="text-muted-foreground text-xs font-medium">to</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => handleCustomDateChange("to", e.target.value)}
            className="w-36 h-9 text-xs"
          />
        </div>
      )}
    </div>
  );
}
