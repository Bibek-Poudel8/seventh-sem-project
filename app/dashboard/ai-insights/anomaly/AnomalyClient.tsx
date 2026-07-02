"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  Search, 
  Zap, 
  RefreshCcw, 
  Calendar, 
  Tag, 
  CircleDollarSign,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Anomaly {
  id: string;
  userId: string;
  transactionId: string | null;
  score: number;
  reason: string;
  createdAt: string;
  transaction: {
    id: string;
    amount: string;
    date: string;
    description: string | null;
    category: {
      name: string;
      color: string | null;
    } | null;
  } | null;
}

export function AnomalyClient() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOlder, setShowOlder] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAnomalies = anomalies.filter(a => new Date(a.createdAt) >= today);
  const olderAnomalies = anomalies.filter(a => new Date(a.createdAt) < today);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/anomaly");
      if (!res.ok) throw new Error("Failed to fetch anomalies");
      const data = await res.json();
      setAnomalies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleScan = async () => {
    try {
      setScanning(true);
      const res = await fetch("/api/ai/anomaly/scan");
      if (!res.ok) throw new Error("Scan failed");
      await fetchAnomalies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  if (loading && !scanning) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header section with Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Anomalies</h2>
          <p className="text-muted-foreground">
            AI-powered detection of unusual spending patterns and potential errors.
          </p>
        </div>
        <Button 
          onClick={handleScan} 
          disabled={scanning}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105"
        >
          {scanning ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4 fill-current" />
              Scan for Anomalies
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {anomalies.length === 0 ? (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Anomalies Detected</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Your spending patterns appear consistent. Run a scan to analyze your recent transactions for any outliers.
              </p>
            </div>
            {!scanning && (
              <Button variant="outline" onClick={handleScan}>Run Initial Scan</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {todayAnomalies.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {todayAnomalies.map((anomaly) => (
                <AnomalyCard key={anomaly.id} anomaly={anomaly} />
              ))}
            </div>
          )}

          {olderAnomalies.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30"
                onClick={() => setShowOlder(!showOlder)}
              >
                {showOlder ? (
                  <>Hide Older Anomalies ({olderAnomalies.length}) <ChevronUp className="ml-1 h-4 w-4" /></>
                ) : (
                  <>Show Older Anomalies ({olderAnomalies.length}) <ChevronDown className="ml-1 h-4 w-4" /></>
                )}
              </Button>

              {showOlder && (
                <div className="grid grid-cols-1 gap-2">
                  {olderAnomalies.map((anomaly) => (
                    <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const [expanded, setExpanded] = useState(false);

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-red-500 hover:bg-red-600 border-none">High Risk</Badge>;
    if (score >= 0.5) return <Badge className="bg-amber-500 hover:bg-amber-600 border-none">Moderate</Badge>;
    return <Badge className="bg-blue-500 hover:bg-blue-600 border-none">Low Risk</Badge>;
  };

  const transaction = anomaly.transaction;

  return (
    <Card className="transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div
          className="flex items-center justify-between p-4 cursor-pointer select-none gap-3"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              anomaly.score >= 0.8 ? 'bg-red-100' :
              anomaly.score >= 0.5 ? 'bg-amber-100' :
              'bg-blue-100'
            }`}>
              <AlertTriangle className={`h-4 w-4 ${
                anomaly.score >= 0.8 ? 'text-red-500' :
                anomaly.score >= 0.5 ? 'text-amber-500' :
                'text-blue-500'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{anomaly.reason}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(anomaly.createdAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getScoreBadge(anomaly.score)}
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {expanded && (
          <div className="border-t border-muted p-4 space-y-4">
            <div className="bg-muted/40 rounded-xl p-4 border border-muted">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm leading-relaxed">{anomaly.reason}</p>
              </div>
            </div>

            {transaction ? (
              <div>
                <div className="p-4 rounded-xl border border-muted bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Details</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold text-base">NPR {parseFloat(transaction.amount).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(transaction.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    {transaction.category && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 px-1.5 font-normal"
                          style={{
                            backgroundColor: transaction.category.color + '20',
                            color: transaction.category.color || undefined,
                            borderColor: transaction.category.color + '40'
                          }}
                        >
                          {transaction.category.name}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {transaction.description && (
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      &quot;{transaction.description}&quot;
                    </p>
                  )}
                </div>

                <Button variant="outline" size="sm" className="w-full text-xs mt-3" onClick={() => window.location.href = '/dashboard/transactions'}>
                  View in Transactions
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No transaction details available.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
