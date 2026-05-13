"use client";

import { useEffect, useRef } from "react";

type PredictOnLoadProps = {
  enabled?: boolean;
};

export function PredictOnLoad({ enabled = true }: PredictOnLoadProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!enabled || hasRun.current) {
      return;
    }

    hasRun.current = true;

    const controller = new AbortController();

    void fetch("/api/ai/predict", {
      method: "GET",
      signal: controller.signal,
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json();
        console.log("/api/ai/predict response:", data);
      })
      .catch((error) => {
        console.error("/api/ai/predict request failed:", error);
      });

    return () => {
      controller.abort();
    };
  }, [enabled]);

  return null;
}