import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AIInsightsClient } from "./AIInsightsClient";

export default async function AIInsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">
          Machine learning analysis of your spending patterns and future forecasts.
        </p>
      </div>

      <AIInsightsClient />
    </div>
  );
}
