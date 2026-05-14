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
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          {anomalies.map((anomaly) => (
            <AnomalyCard key={anomaly.id} anomaly={anomaly} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-red-500 hover:bg-red-600 border-none">High Risk</Badge>;
    if (score >= 0.5) return <Badge className="bg-amber-500 hover:bg-amber-600 border-none">Moderate</Badge>;
    return <Badge className="bg-blue-500 hover:bg-blue-600 border-none">Low Risk</Badge>;
  };

  const transaction = anomaly.transaction;

  return (
    <Card className="group hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left indicator bar */}
          <div 
            className={`w-full md:w-1.5 h-1.5 md:h-auto ${
              anomaly.score >= 0.8 ? 'bg-red-500' : 
              anomaly.score >= 0.5 ? 'bg-amber-500' : 
              'bg-blue-500'
            }`} 
          />
          
          <div className="flex-1 p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <AlertTriangle className={`h-5 w-5 ${
                      anomaly.score >= 0.8 ? 'text-red-500' : 
                      anomaly.score >= 0.5 ? 'text-amber-500' : 
                      'text-blue-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg leading-none">Potential Anomaly Detected</h4>
                      {getScoreBadge(anomaly.score)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Detected on {new Date(anomaly.createdAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/40 rounded-xl p-4 border border-muted">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{anomaly.reason}</p>
                  </div>
                </div>
              </div>

              {transaction && (
                <div className="md:w-72 space-y-3">
                  <div className="p-4 rounded-xl border border-muted bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Details</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
                      <p className="text-xs text-muted-foreground mt-3 italic line-clamp-1">
                        "{transaction.description}"
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => window.location.href = '/dashboard/transactions'}>
                      View in Transactions
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
