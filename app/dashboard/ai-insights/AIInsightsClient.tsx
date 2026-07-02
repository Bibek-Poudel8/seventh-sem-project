"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Wand2,
  BrainCircuit,
  ArrowUpRight,
  Target,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DonutChart } from "@/components/charts/DonutChart";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Prediction {
  category: string;
  predicted_amount: number;
  avg_monthly: number;
  trend: "stable" | "up" | "down";
  months_of_data: number;
  confidence: "low" | "medium" | "high";
  method: string;
}

interface PredictionResponse {
  predictions: Prediction[];
  total_predicted: number;
  months_of_data: number;
  message: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Shopping & Retail": "#ec4899", // pink-500
  "Entertainment & Recreation": "#8b5cf6", // violet-500
  "Utilities & Bills": "#3b82f6", // blue-500
  "Miscellaneous": "#94a3b8", // slate-400
  "Food & Dining": "#f59e0b", // amber-500
  "Transport": "#10b981", // emerald-500
  "Health & Wellness": "#ef4444", // red-500
  "Education": "#6366f1", // indigo-500
  "Investment": "#22c55e", // green-500
  "Uncategorized": "#64748b", // slate-500
};

// Query function — separated so it can be typed cleanly
async function fetchAIInsights(): Promise<PredictionResponse> {
  const res = await fetch("/api/ai/predict");
  if (!res.ok) throw new Error("Failed to fetch AI insights");
  return res.json();
}

export function AIInsightsClient() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PredictionResponse, Error>({
    queryKey: ["ai-insights"],
    queryFn: fetchAIInsights,
    // AI predictions are expensive — treat data as fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Retry once before surfacing the error state
    retry: 1,
  });

  if (isLoading) return <LoadingSkeleton />;

  const errorMessage = isError ? (error?.message ?? "Something went wrong") : null;

  if (errorMessage || !data || data.predictions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="text-center">
            <p className="font-semibold">{errorMessage || "No Data Available"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {errorMessage ? "Please ensure the ML service is running." : "Try adding more transactions to see AI-powered predictions."}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.predictions.map((p) => ({
    category: p.category,
    amount: p.predicted_amount,
    color: CATEGORY_COLORS[p.category] || "#94a3b8",
    percentage: Math.round((p.predicted_amount / data.total_predicted) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BrainCircuit size={80} />
          </div>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Predicted Expense</p>
                <h2 className="text-3xl font-bold mt-1 tracking-tight">
                  NPR {data.total_predicted.toLocaleString()}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/20 border-none">
                    <Wand2 className="h-3 w-3 mr-1" />
                    AI Predicted
                  </Badge>
                  <p className="text-xs text-muted-foreground">{data.message}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-muted">
          <CardContent className="pt-6 flex flex-col justify-center h-full">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reliability Score</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-bold">
                {data.months_of_data > 3 ? "High" : data.months_of_data > 1 ? "Medium" : "Low"}
              </span>
              <span className="text-xs text-muted-foreground mb-1">Based on history</span>
            </div>
            <div className="mt-3 w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-full rounded-full ${data.months_of_data > 3 ? "bg-primary w-full" :
                  data.months_of_data > 1 ? "bg-amber-500 w-2/3" :
                    "bg-orange-500 w-1/3"
                  }`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Distribution Chart */}
        <Card className="lg:col-span-2 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Spending Distribution</CardTitle>
            <CardDescription>Predicted breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={chartData} />
          </CardContent>
        </Card>

        {/* Category List */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Category Forecasts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.predictions.map((p, i) => (
              <PredictionCard key={i} prediction={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const trendIcon = {
    up: <TrendingUp className="h-4 w-4 text-red-500" />,
    down: <TrendingDown className="h-4 w-4 text-emerald-500" />,
    stable: <Minus className="h-4 w-4 text-slate-400" />,
  };

  const confidenceStars: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  const starColor: Record<string, string> = {
    low: "text-orange-400",
    medium: "text-gray-400",
    high: "text-primary",
  };

  function Stars({ count }: { count: number }) {
    return (
      <span className={`text-sm tracking-wider ${starColor[prediction.confidence]}`}>
        {"★".repeat(count)}{"☆".repeat(3 - count)}
      </span>
    );
  }

  return (
    <Card className="group hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden relative">
      {/* <div
        className="absolute left-0 top-0 bottom-0 w-1 opacity-60 transition-all duration-300 group-hover:w-1.5"
        style={{ backgroundColor: CATEGORY_COLORS[prediction.category] || "#94a3b8" }}
      /> */}
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted shrink-0"
            style={{ color: CATEGORY_COLORS[prediction.category] || "#94a3b8" }}
          >
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm leading-none truncate">{prediction.category}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="flex items-center gap-1.5">
                <Stars count={confidenceStars[prediction.confidence]} />
                <span className={`text-[11px] font-semibold ${starColor[prediction.confidence]}`}>
                  {prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)}
                </span>
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Method: {prediction.method}</p>
                    <p className="text-xs">Based on {prediction.months_of_data} month(s) of data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">Predicted Spend</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold">NPR {prediction.predicted_amount.toLocaleString()}</span>
              {trendIcon[prediction.trend]}
            </div>
          </div>
          <div className="text-right text-[10px] text-muted-foreground">
            Avg: NPR {prediction.avg_monthly.toLocaleString()} / mo
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 md:col-span-2 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
        <div className="lg:col-span-3 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
