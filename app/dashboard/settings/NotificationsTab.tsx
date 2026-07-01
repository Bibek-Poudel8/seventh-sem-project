"use client";
import { useActionState } from "react";
import { updateNotificationPreferences } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faTriangleExclamation,
  faCalendarWeek,
  faBrain,
  faReceipt,
  faCircleCheck,
  faSpinner,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { SearchCheck, TrendingUp } from "lucide-react";
import { useState } from "react";

interface NotifItem {
  id: string;
  label: string;
  description: string;
  iconNode?: React.ReactNode;
  faIcon?: typeof faBell;
  defaultOn: boolean;
}

interface NotifGroup {
  label: string;
  description: string;
  items: NotifItem[];
}

function getNotifPrefs(profile: unknown): Record<string, boolean> {
  if (!profile || typeof profile !== "object") return {};
  const p = profile as { pushSubscription?: string | null };
  if (!p.pushSubscription) return {};
  try {
    const parsed = JSON.parse(p.pushSubscription);
    return (parsed?.notifPrefs as Record<string, boolean>) ?? {};
  } catch {
    return {};
  }
}

export default function NotificationsTab({ profile }: { profile: unknown }) {
  const [state, action, pending] = useActionState(updateNotificationPreferences, undefined);
  const savedPrefs = getNotifPrefs(profile);

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    budget_exceeded: savedPrefs.budget_exceeded ?? true,
    budget_warning: savedPrefs.budget_warning ?? true,
    weekly_summary: savedPrefs.weekly_summary ?? true,
    ai_insight: savedPrefs.ai_insight ?? true,
    transaction_added: savedPrefs.transaction_added ?? false,
    monthly_report: savedPrefs.monthly_report ?? true,
    anomaly_detected: savedPrefs.anomaly_detected ?? true,
  });

  const groups: NotifGroup[] = [
    {
      label: "Budget Alerts",
      description: "Stay on top of your spending limits",
      items: [
        {
          id: "budget_exceeded",
          label: "Budget limit exceeded",
          description: "Notify when you go over a budget",
          faIcon: faTriangleExclamation,
          defaultOn: true,
        },
        {
          id: "budget_warning",
          label: "Budget warning",
          description: "Alert when spending hits your warning threshold",
          faIcon: faChartLine,
          defaultOn: true,
        },
      ],
    },
    {
      label: "AI & Insights",
      description: "Intelligent alerts powered by your finance AI",
      items: [
        {
          id: "ai_insight",
          label: "New AI insight",
          description: "When the AI engine discovers a new spending insight",
          faIcon: faBrain,
          defaultOn: true,
        },
        {
          id: "anomaly_detected",
          label: "Anomaly detected",
          description: "Alert when an unusual transaction is flagged",
          iconNode: <SearchCheck className="h-3.5 w-3.5" />,
          defaultOn: true,
        },
      ],
    },
    {
      label: "Reports & Summaries",
      description: "Regular financial digests and reports",
      items: [
        {
          id: "weekly_summary",
          label: "Weekly spending summary",
          description: "A weekly digest of your spending and income",
          faIcon: faCalendarWeek,
          defaultOn: true,
        },
        {
          id: "monthly_report",
          label: "Monthly report",
          description: "Full monthly financial breakdown",
          iconNode: <TrendingUp className="h-3.5 w-3.5" />,
          defaultOn: true,
        },
      ],
    },
    {
      label: "Transaction Activity",
      description: "Confirmations and transaction-level updates",
      items: [
        {
          id: "transaction_added",
          label: "Transaction confirmation",
          description: "Confirmation notification after each new transaction",
          faIcon: faReceipt,
          defaultOn: false,
        },
      ],
    },
  ];

  const allEnabled = Object.values(prefs).every(Boolean);

  function toggleAll() {
    const newVal = !allEnabled;
    setPrefs(Object.fromEntries(Object.keys(prefs).map((k) => [k, newVal])));
  }

  return (
    <div className="space-y-5">
      {/* Global summary card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <FontAwesomeIcon icon={faBell} className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Notification Preferences</p>
                <p className="text-xs text-muted-foreground">
                  {Object.values(prefs).filter(Boolean).length} of{" "}
                  {Object.keys(prefs).length} alerts enabled
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {allEnabled ? "Disable all" : "Enable all"}
              </span>
              <Switch checked={allEnabled} onCheckedChange={toggleAll} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Groups */}
      <form action={action} className="space-y-4">
        {/* Submit hidden off-values so unchecked switches persist */}
        {Object.entries(prefs)
          .filter(([, v]) => !v)
          .map(([k]) => (
            <input key={k} type="hidden" name={k} value="off" />
          ))}

        {state?.success && (
          <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 shrink-0" />
            Notification preferences saved!
          </div>
        )}

        {groups.map((group) => (
          <Card key={group.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </CardTitle>
              <CardDescription className="text-xs">{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 pt-0">
              {group.items.map((item, idx) => (
                <div key={item.id}>
                  {idx > 0 && <Separator className="my-0" />}
                  <div className="flex items-center justify-between rounded-lg px-2 py-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          prefs[item.id]
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.iconNode ? (
                          item.iconNode
                        ) : item.faIcon ? (
                          <FontAwesomeIcon icon={item.faIcon} className="h-3.5 w-3.5" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Label
                          htmlFor={item.id}
                          className="text-sm font-medium cursor-pointer leading-none"
                        >
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={item.id}
                      name={item.id}
                      checked={prefs[item.id]}
                      onCheckedChange={(v) =>
                        setPrefs((p) => ({ ...p, [item.id]: v }))
                      }
                      value="on"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="gap-2 min-w-36">
            {pending ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
