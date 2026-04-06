import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";

export default async function PaymentMethodsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-xl font-bold">Payment Methods</h1>
        <p className="text-sm text-muted-foreground">Manage your wallets, accounts, and cards</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <CreditCard className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-semibold">Payment Methods</p>
            <p className="text-sm text-muted-foreground mt-1">Track multiple accounts and wallets</p>
          </div>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
