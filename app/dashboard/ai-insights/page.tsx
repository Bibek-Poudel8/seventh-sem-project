import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AIInsightsClient } from "./AIInsightsClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default async function AIInsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground">
            Machine learning analysis of your spending patterns and future forecasts.
          </p></div>
        <Link href="/dashboard/ai-insights/anomaly" className="cursor-pointer"><Button className="cursor-pointer">Scan and View anomalies<ChevronRight className="hover:translate-x-1" /></Button></Link>
      </div>

      <AIInsightsClient />
    </div>
  );
}
