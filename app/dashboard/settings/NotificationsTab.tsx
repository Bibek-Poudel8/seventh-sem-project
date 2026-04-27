"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

const NOTIFICATIONS = [
  { id: "budget_exceeded", label: "Budget limit reached", description: "Alert when you exceed a budget" },
  { id: "budget_warning", label: "Budget 75% warning", description: "Alert when spending hits 75% of budget" },
  { id: "weekly_summary", label: "Weekly spending summary", description: "Weekly digest of your spending" },
  { id: "ai_insight", label: "New AI insight available", description: "When the AI engine has new predictions" },
  { id: "transaction_added", label: "Transaction added", description: "Confirmation after each transaction" },
];

export default function NotificationsTab({ profile }: { profile: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FontAwesomeIcon icon={faBell} className="h-4 w-4" /> Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <Label htmlFor={n.id} className="font-medium cursor-pointer">{n.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
            </div>
            <Switch id={n.id} defaultChecked />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
