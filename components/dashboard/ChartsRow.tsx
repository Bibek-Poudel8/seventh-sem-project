import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CategorySpendingCard from "@/components/dashboard/CategorySpendingCard";
import { BarLineChart } from "@/components/charts/BarLineChart";

export default function ChartsRow({
  categoryBreakdown,
  monthlyTrend,
  currency,
}: {
  categoryBreakdown: any;
  monthlyTrend: any;
  currency: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CategorySpendingCard initialData={categoryBreakdown} currency={currency} />

      <Card className="bg-muted/30 overflow-hidden flex flex-col">
        <CardHeader className="pb-0 px-4 pt-4 shrink-0">
          <CardTitle className="text-sm font-semibold">Monthly Financial Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 px-2 pt-3 pb-0">
          <BarLineChart data={monthlyTrend} currency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}
