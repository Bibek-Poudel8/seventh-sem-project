"use client";
import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";

const CURRENCIES = ["NPR","USD","EUR","GBP","INR","JPY","AUD","CAD","SGD","CNY"];
const TIMEZONES = ["UTC","Asia/Kathmandu","Asia/Kolkata","Asia/Tokyo","Europe/London","America/New_York","America/Los_Angeles","Australia/Sydney"];

export default function ProfileTab({ user, profile }: { user: { name: string | null; email: string }; profile: { currency: string; timezone: string } | null }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Profile Information</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state?.success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" /> Profile updated successfully
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={user.name ?? ""} required />
            {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Email address</Label>
            <Input value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue={profile?.currency ?? "NPR"}>
                <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Select name="timezone" defaultValue={profile?.timezone ?? "UTC"}>
                <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending} className="gap-1.5">
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
