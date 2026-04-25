"use client";
import { useActionState } from "react";
import { updatePreferences } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";

interface Profile {
  theme?: string;
  weekStartsOn?: number;
  dateFormat?: string;
  defaultTransactionType?: string;
  notifyBudgetWarningPct?: number;
}

export default function PreferencesTab({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState(updatePreferences, undefined);
  const [notifyPct, setNotifyPct] = useState(profile?.notifyBudgetWarningPct ?? 80);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Preferences</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          {state?.success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" /> Preferences saved
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Theme</Label>
              <Select name="theme" defaultValue={profile?.theme ?? "SYSTEM"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIGHT">Light</SelectItem>
                  <SelectItem value="DARK">Dark</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Week starts on</Label>
              <Select name="weekStartsOn" defaultValue={String(profile?.weekStartsOn ?? 1)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date format</Label>
              <Select name="dateFormat" defaultValue={profile?.dateFormat ?? "DD/MM/YYYY"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Default transaction type</Label>
              <Select name="defaultTransactionType" defaultValue={profile?.defaultTransactionType ?? "EXPENSE"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Budget warning threshold: <span className="font-bold text-primary">{notifyPct}%</span></Label>
            <input type="hidden" name="notifyBudgetWarningPct" value={notifyPct} />
            <Slider
              min={50} max={100} step={5}
              value={[notifyPct]}
              onValueChange={([v]) => setNotifyPct(v)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Get notified when spending reaches this % of a budget</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending} className="gap-1.5">
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Preferences
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
