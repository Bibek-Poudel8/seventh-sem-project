"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTrashCan, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { deleteAccount } from "./actions";

export default function DataTab() {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FontAwesomeIcon icon={faDownload} className="h-4 w-4" /> Export Data</CardTitle>
          <CardDescription>Download all your transaction history</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <a href="/api/export/csv" download>
            <Button variant="outline" size="sm" className="gap-1.5"><FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" /> Export CSV</Button>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base opacity-50 flex items-center gap-2">Import Transactions</CardTitle>
          <CardDescription>Import from CSV file</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2"><FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" /> Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all data. This cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          {!confirming ? (
            <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>Delete Account</Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5 text-sm">
                <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>This will permanently delete your account, all transactions, budgets, and cannot be recovered.</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
                <form action={deleteAccount}>
                  <Button type="submit" variant="destructive" size="sm">Yes, Delete Everything</Button>
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
