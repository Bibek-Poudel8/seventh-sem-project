import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-xl font-bold">Data Export</h1>
        <p className="text-sm text-muted-foreground">Download your financial data</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Export Transactions
          </CardTitle>
          <CardDescription>Download all your transactions as a CSV file. Filters applied on the Transactions page will be respected.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <a href="/api/export/csv" download>
            <Button className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export All (CSV)</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
