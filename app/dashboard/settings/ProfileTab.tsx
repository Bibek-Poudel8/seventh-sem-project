"use client";
import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCircleCheck,
  faUser,
  faEnvelope,
  faGlobe,
  faCoins,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const CURRENCIES = [
  { code: "NPR", name: "Nepali Rupee" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "AED", name: "UAE Dirham" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
  { value: "Asia/Kathmandu", label: "Asia/Kathmandu — NPT (UTC+5:45)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata — IST (UTC+5:30)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo — JST (UTC+9:00)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai — CST (UTC+8:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore — SGT (UTC+8:00)" },
  { value: "Asia/Dubai", label: "Asia/Dubai — GST (UTC+4:00)" },
  { value: "Europe/London", label: "Europe/London — GMT/BST" },
  { value: "Europe/Paris", label: "Europe/Paris — CET (UTC+1:00)" },
  { value: "Europe/Berlin", label: "Europe/Berlin — CET (UTC+1:00)" },
  { value: "America/New_York", label: "America/New_York — EST/EDT" },
  { value: "America/Chicago", label: "America/Chicago — CST/CDT" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles — PST/PDT" },
  { value: "Australia/Sydney", label: "Australia/Sydney — AEST (UTC+10:00)" },
];

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function ProfileTab({
  user,
  profile,
}: {
  user: { name: string | null; email: string; image?: string | null };
  profile: { currency: string; timezone: string } | null;
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const initials = getInitials(user.name, user.email);

  return (
    <div className="space-y-6">
      {/* Avatar / Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-primary" />
            Profile Identity
          </CardTitle>
          <CardDescription>Your public-facing name and avatar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="size-16 text-xl">
                {user.image && <AvatarImage src={user.image} alt={user.name ?? "avatar"} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-green-500 border-2 border-background" title="Online" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">{user.name ?? "No name set"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Avatar is auto-generated from your name initials
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription>Update your display name, currency, and timezone</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-5">
            {state?.success && (
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}
            {state?.errors && Object.keys(state.errors).length > 0 && (
              <div className="flex items-center gap-2.5 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 shrink-0" />
                <span>Please fix the errors below before saving.</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUser} className="h-3 w-3 text-muted-foreground" />
                Full name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="Enter your full name"
                required
                className="h-10"
              />
              {state?.errors?.name && (
                <p className="text-xs text-destructive">{state.errors.name[0]}</p>
              )}
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3 text-muted-foreground" />
                Email address
              </Label>
              <div className="relative">
                <Input
                  value={user.email}
                  disabled
                  className="bg-muted/50 pr-24"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  read only
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed directly. Contact support if needed.
              </p>
            </div>

            <Separator />

            {/* Currency & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCoins} className="h-3 w-3 text-muted-foreground" />
                  Currency
                </Label>
                <Select name="currency" defaultValue={profile?.currency ?? "NPR"}>
                  <SelectTrigger id="currency" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="font-mono font-semibold">{c.code}</span>
                        <span className="text-muted-foreground ml-1.5">— {c.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone" className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faGlobe} className="h-3 w-3 text-muted-foreground" />
                  Timezone
                </Label>
                <Select name="timezone" defaultValue={profile?.timezone ?? "UTC"}>
                  <SelectTrigger id="timezone" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={pending} className="gap-2 min-w-28">
                {pending ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
