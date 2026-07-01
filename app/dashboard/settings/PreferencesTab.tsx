"use client";
import { useActionState } from "react";
import { updatePreferences } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCircleCheck,
  faSun,
  faMoon,
  faDesktop,
  faCalendarDays,
  faArrowRightArrowLeft,
  faChartPie,
} from "@fortawesome/free-solid-svg-icons";
import { LayoutGrid } from "lucide-react";
import { useState } from "react";

interface Profile {
  theme?: string;
  weekStartsOn?: number;
  dateFormat?: string;
  defaultTransactionType?: string;
  notifyBudgetWarningPct?: number;
}

const THEME_OPTIONS = [
  {
    value: "LIGHT",
    label: "Light",
    icon: faSun,
    desc: "Always use light mode",
  },
  {
    value: "DARK",
    label: "Dark",
    icon: faMoon,
    desc: "Always use dark mode",
  },
  {
    value: "SYSTEM",
    label: "System",
    icon: faDesktop,
    desc: "Follow OS preference",
  },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", preview: "25/07/2025" },
  { value: "MM/DD/YYYY", preview: "07/25/2025" },
  { value: "YYYY-MM-DD", preview: "2025-07-25" },
  { value: "DD MMM YYYY", preview: "25 Jul 2025" },
  { value: "MMM DD, YYYY", preview: "Jul 25, 2025" },
];

export default function PreferencesTab({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState(updatePreferences, undefined);
  const [notifyPct, setNotifyPct] = useState(profile?.notifyBudgetWarningPct ?? 80);
  const [selectedTheme, setSelectedTheme] = useState(profile?.theme ?? "SYSTEM");

  return (
    <div className="space-y-5">
      {/* Theme Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FontAwesomeIcon icon={faSun} className="h-4 w-4 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Choose how the dashboard looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedTheme(opt.value)}
                className={`relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-center transition-all hover:bg-muted/50 cursor-pointer ${
                  selectedTheme === opt.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-muted/20"
                }`}
              >
                {selectedTheme === opt.value && (
                  <div className="absolute top-2 right-2 size-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-primary-foreground" />
                  </div>
                )}
                <div
                  className={`flex size-10 items-center justify-center rounded-full transition-colors ${
                    selectedTheme === opt.value
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <FontAwesomeIcon icon={opt.icon} className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display & Defaults Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            Display &amp; Defaults
          </CardTitle>
          <CardDescription>
            Adjust date formats, week start, and default transaction settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-6">
            {/* Hidden fields */}
            <input type="hidden" name="theme" value={selectedTheme} />
            <input type="hidden" name="notifyBudgetWarningPct" value={notifyPct} />

            {state?.success && (
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 shrink-0" />
                Preferences saved successfully!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Format */}
              <div className="space-y-2">
                <Label htmlFor="dateFormat" className="flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    className="h-3 w-3 text-muted-foreground"
                  />
                  Date format
                </Label>
                <Select
                  name="dateFormat"
                  defaultValue={profile?.dateFormat ?? "DD/MM/YYYY"}
                >
                  <SelectTrigger id="dateFormat" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        <span className="font-mono text-sm">{f.value}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({f.preview})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Week Start */}
              <div className="space-y-2">
                <Label htmlFor="weekStartsOn" className="flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    className="h-3 w-3 text-muted-foreground"
                  />
                  Week starts on
                </Label>
                <Select
                  name="weekStartsOn"
                  defaultValue={String(profile?.weekStartsOn ?? 1)}
                >
                  <SelectTrigger id="weekStartsOn" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default Transaction Type */}
              <div className="space-y-2">
                <Label
                  htmlFor="defaultTransactionType"
                  className="flex items-center gap-1.5"
                >
                  <FontAwesomeIcon
                    icon={faArrowRightArrowLeft}
                    className="h-3 w-3 text-muted-foreground"
                  />
                  Default transaction type
                </Label>
                <Select
                  name="defaultTransactionType"
                  defaultValue={profile?.defaultTransactionType ?? "EXPENSE"}
                >
                  <SelectTrigger id="defaultTransactionType" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">
                      <span className="text-destructive font-medium">Expense</span>
                    </SelectItem>
                    <SelectItem value="INCOME">
                      <span className="text-emerald-600 font-medium">Income</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Budget Warning Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faChartPie}
                    className="h-3 w-3 text-muted-foreground"
                  />
                  Budget warning threshold
                </Label>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {notifyPct}%
                </span>
              </div>
              <Slider
                min={50}
                max={100}
                step={5}
                value={[notifyPct]}
                onValueChange={([v]) => setNotifyPct(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50% (alert early)</span>
                <span>100% (alert when exceeded)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You&apos;ll receive a warning when spending reaches{" "}
                <strong>{notifyPct}%</strong> of any budget limit.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={pending} className="gap-2 min-w-36">
                {pending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="h-3.5 w-3.5 animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
