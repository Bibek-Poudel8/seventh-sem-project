"use client";
import { useActionState } from "react";
import { changePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, ShieldCheck, Lock } from "lucide-react";

export default function SecurityTab({ hasPassword, providers }: { hasPassword: boolean; providers: string[] }) {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <div className="space-y-4">
      {/* Connected providers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {providers.length === 0
            ? <p className="text-sm text-muted-foreground">No OAuth providers connected</p>
            : providers.map(p => (
                <div key={p} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm capitalize font-medium">{p}</span>
                  <Badge variant="secondary">Connected</Badge>
                </div>
              ))
          }
        </CardContent>
      </Card>

      {/* Change Password */}
      {hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              {state?.success && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-600">
                  <CheckCircle className="h-4 w-4" /> Password changed successfully
                </div>
              )}
              {state?.message && (
                <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.message}</div>
              )}
              {["currentPassword","newPassword","confirmPassword"].map(field => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={field}>{field === "currentPassword" ? "Current password" : field === "newPassword" ? "New password" : "Confirm new password"}</Label>
                  <Input id={field} name={field} type="password" required />
                  {state?.errors?.[field as keyof typeof state.errors] && <p className="text-xs text-destructive">{(state.errors as Record<string, string[]>)[field][0]}</p>}
                </div>
              ))}
              <div className="flex justify-end">
                <Button type="submit" disabled={pending} className="gap-1.5">
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 2FA placeholder */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
          <CardDescription>Extra layer of security for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
