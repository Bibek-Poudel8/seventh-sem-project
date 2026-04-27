import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

export default async function AIInsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-xl font-bold">AI Insights</h1>
        <p className="text-sm text-muted-foreground">ML-powered spending predictions and analysis</p>
      </div>
      <Card className="bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/5 border-indigo-500/20">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-14 w-14 rounded-full bg-indigo-500/15 flex items-center justify-center">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="h-7 w-7 text-indigo-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold">AI Engine Not Connected</p>
            <p className="text-sm text-muted-foreground mt-1">
              The Python ML prediction server is not yet available.
              <br />Once connected, you&apos;ll see spending forecasts and insights here.
            </p>
          </div>
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-500">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
