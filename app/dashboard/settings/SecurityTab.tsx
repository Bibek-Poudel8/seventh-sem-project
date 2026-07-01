"use client";
import { useActionState, useState } from "react";
import { changePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCircleCheck,
  faShieldHalved,
  faLock,
  faEye,
  faEyeSlash,
  faKey,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import { Shield, Fingerprint, CheckCircle2 } from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "Contains a letter", pass: /[a-zA-Z]/.test(password) },
    { label: "Contains a number", pass: /[0-9]/.test(password) },
    { label: "Contains a symbol", pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const barColors = [
    "bg-destructive",
    "bg-destructive",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-emerald-500",
  ];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? barColors[score] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-y-1 gap-x-3">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`text-xs flex items-center gap-1 ${
              c.pass
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            }`}
          >
            <span
              className={`inline-block size-1.5 rounded-full ${
                c.pass ? "bg-emerald-500" : "bg-muted-foreground/40"
              }`}
            />
            {c.label}
          </span>
        ))}
        {score > 0 && (
          <span
            className={`text-xs font-semibold ml-auto ${
              score <= 1
                ? "text-destructive"
                : score === 2
                ? "text-orange-500"
                : score === 3
                ? "text-yellow-600"
                : "text-emerald-600"
            }`}
          >
            {labels[score]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SecurityTab({
  hasPassword,
  providers,
  userEmail,
}: {
  hasPassword: boolean;
  providers: string[];
  userEmail: string;
}) {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="space-y-5">
      {/* Connected Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4 text-primary" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            External providers linked to{" "}
            <span className="font-medium text-foreground">{userEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {providers.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
              <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4 shrink-0" />
              No OAuth providers connected — using email &amp; password only.
            </div>
          ) : (
            providers.map((p) => (
              <div
                key={p}
                className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-background border">
                    <FontAwesomeIcon icon={faLink} className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold capitalize">{p}</p>
                    <p className="text-xs text-muted-foreground">OAuth 2.0</p>
                  </div>
                </div>
                <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-none">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      {hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>
              Use a strong password with letters, numbers, and symbols
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              {state?.success && (
                <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 shrink-0" />
                  Password changed successfully!
                </div>
              )}
              {state?.message && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  {state.message}
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    required
                    className="pr-10 h-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    <FontAwesomeIcon
                      icon={showCurrent ? faEyeSlash : faEye}
                      className="h-3.5 w-3.5"
                    />
                  </button>
                </div>
                {state?.errors?.currentPassword && (
                  <p className="text-xs text-destructive">
                    {(state.errors as Record<string, string[]>).currentPassword[0]}
                  </p>
                )}
              </div>

              <Separator />

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    required
                    className="pr-10 h-10"
                    placeholder="Choose a strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    <FontAwesomeIcon
                      icon={showNew ? faEyeSlash : faEye}
                      className="h-3.5 w-3.5"
                    />
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
                {state?.errors?.newPassword && (
                  <p className="text-xs text-destructive">
                    {(state.errors as Record<string, string[]>).newPassword[0]}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    className="pr-10 h-10"
                    placeholder="Repeat your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    <FontAwesomeIcon
                      icon={showConfirm ? faEyeSlash : faEye}
                      className="h-3.5 w-3.5"
                    />
                  </button>
                </div>
                {state?.errors?.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {(state.errors as Record<string, string[]>).confirmPassword[0]}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={pending} className="gap-2 min-w-36">
                  {pending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="h-3.5 w-3.5 animate-spin"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faLock} className="h-3.5 w-3.5" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 2FA */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-violet-500" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="mt-1">
                Add an extra layer of security with TOTP or SMS verification
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-3">
            <Shield className="h-5 w-5 text-violet-400 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Two-factor authentication with authenticator apps (TOTP) will be
              available in an upcoming release.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
