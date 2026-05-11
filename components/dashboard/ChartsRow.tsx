import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/DonutChart";
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DonutChart data={categoryBreakdown} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <BarLineChart data={monthlyTrend} currency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}
