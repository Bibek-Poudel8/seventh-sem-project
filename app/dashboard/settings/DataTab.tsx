"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faTrashCan,
  faTriangleExclamation,
  faDatabase,
  faShieldHalved,
  faReceipt,
  faChartPie,
  faSpinner,
  faTableColumns,
} from "@fortawesome/free-solid-svg-icons";
import { FileJson2, FileSpreadsheet, Info, Upload } from "lucide-react";
import { deleteAccount } from "./actions";

const EXPORT_FORMATS = [
  {
    id: "csv",
    label: "CSV",
    description: "Spreadsheet-compatible format",
    icon: <FileSpreadsheet className="h-5 w-5 text-primary" />,
    url: "/api/export/csv",
    ext: ".csv",
  },
  {
    id: "json",
    label: "JSON",
    description: "Machine-readable structured data",
    icon: <FileJson2 className="h-5 w-5 text-primary" />,
    url: "/api/export/json",
    ext: ".json",
  },
];

export default function DataTab({
  txnCount,
  budgetCount,
  userEmail,
}: {
  txnCount: number;
  budgetCount: number;
  userEmail: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const confirmPhrase = "delete my account";
  const canDelete = confirmText.toLowerCase() === confirmPhrase;

  return (
    <div className="space-y-5">
      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FontAwesomeIcon icon={faDatabase} className="h-4 w-4 text-primary" />
            Account Overview
          </CardTitle>
          <CardDescription>A summary of your stored data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Transactions",
                value: txnCount.toLocaleString(),
                faIcon: faReceipt,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                label: "Active Budgets",
                value: budgetCount.toLocaleString(),
                faIcon: faChartPie,
                color: "text-violet-500",
                bg: "bg-violet-500/10",
              },
              {
                label: "Data Storage",
                value: "Local DB",
                faIcon: faShieldHalved,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3"
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${stat.bg}`}
                >
                  <FontAwesomeIcon
                    icon={stat.faIcon}
                    className={`h-4 w-4 ${stat.color}`}
                  />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FontAwesomeIcon icon={faDownload} className="h-4 w-4 text-primary" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download all your transactions, budgets, and financial records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPORT_FORMATS.map((fmt) => (
              <a
                key={fmt.id}
                href={fmt.url}
                download={`transactions${fmt.ext}`}
              >
                <div className="flex items-center gap-4 rounded-xl border bg-muted/20 px-4 py-4 hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    {fmt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Export {fmt.label}</p>
                    <p className="text-xs text-muted-foreground">{fmt.description}</p>
                  </div>
                  <FontAwesomeIcon
                    icon={faDownload}
                    className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </div>
              </a>
            ))}
          </div>

          <div className="flex items-start gap-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 px-3.5 py-3 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>
              Exports include all non-deleted transactions and active budgets. Files are
              generated in real-time and include data up to the current moment.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Import (coming soon) */}
      <Card className="opacity-70">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Transactions
              </CardTitle>
              <CardDescription className="mt-1">
                Bulk import from a CSV or bank statement file
              </CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            <FontAwesomeIcon
              icon={faTableColumns}
              className="h-8 w-8 mb-2 opacity-30"
            />
            <p className="mt-2">
              CSV and bank statement import will be available in a future update.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete{" "}
                  <strong>{userEmail}</strong> and all associated data including{" "}
                  <strong>{txnCount.toLocaleString()} transactions</strong> and{" "}
                  <strong>{budgetCount} budgets</strong>. This cannot be undone.
                </p>
              </div>
            </div>

            {!confirming ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirming(true)}
                className="gap-2"
              >
                <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
                Delete My Account
              </Button>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3.5 py-3 text-sm">
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="h-4 w-4 text-destructive shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-destructive">
                      This action is irreversible.
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      All your transactions, budgets, categories, and account data will
                      be permanently deleted.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Type{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">
                      {confirmPhrase}
                    </code>{" "}
                    to confirm:
                  </p>
                  <Input
                    placeholder={confirmPhrase}
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConfirming(false);
                      setConfirmText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <form
                    action={async () => {
                      setDeleteLoading(true);
                      await deleteAccount();
                    }}
                  >
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                      disabled={!canDelete || deleteLoading}
                      className="gap-2"
                    >
                      {deleteLoading ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="h-3.5 w-3.5 animate-spin"
                        />
                      ) : (
                        <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
                      )}
                      Yes, Delete Everything
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
