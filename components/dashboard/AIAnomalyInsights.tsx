"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faTriangleExclamation,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

type AnomalyScanItem = {
  id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  anomaly_reason: string;
};

const VISIBLE_LIMIT = 3;

export default function AIAnomalyInsights() {
  const [results, setResults] = useState<AnomalyScanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAnomalies = async () => {
      try {
        const response = await fetch("/api/ai/anamoly/scan", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to scan anomalies");
        }

        const data = (await response.json()) as AnomalyScanItem[];
        if (!Array.isArray(data)) {
          setResults([]);
          return;
        }

        setResults(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Anomaly scan error:", error);
        }
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnomalies();

    return () => {
      controller.abort();
    };
  }, []);

  const anomalies = useMemo(
    () =>
      results
        .filter((item) => item.is_anomaly)
        .sort((a, b) => b.anomaly_score - a.anomaly_score),
    [results],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <div className="h-10 w-10 rounded-full bg-indigo-500/15 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="h-5 w-5 text-indigo-400 animate-spin"
          />
        </div>
        <div>
          <p className="text-sm font-medium">Scanning transactions...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Checking recent expenses for anomalies.
          </p>
        </div>
      </div>
    );
  }

  if (anomalies.length > 0) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 space-y-2">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
          <p className="text-sm font-semibold">Anamoly Detected</p>
        </div>

        <ul className="space-y-1.5">
          {anomalies.slice(0, VISIBLE_LIMIT).map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-red-500/20 bg-red-500/5 px-2.5 py-2"
            >
              <p className="text-xs text-red-800 dark:text-red-200 line-clamp-2">
                {item.anomaly_reason || "Unusual spending pattern detected."}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div className="h-10 w-10 rounded-full bg-indigo-500/15 flex items-center justify-center">
        <FontAwesomeIcon
          icon={faWandMagicSparkles}
          className="h-5 w-5 text-indigo-400"
        />
      </div>
      <div>
        <p className="text-sm font-medium">No anomalies detected</p>
        <p className="text-xs text-muted-foreground mt-1">
          Recent expenses look normal.
        </p>
      </div>
    </div>
  );
}
