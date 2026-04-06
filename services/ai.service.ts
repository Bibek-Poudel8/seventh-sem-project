// All AI calls go through this service. The Python ML server is not yet ready,
// so all calls return graceful fallbacks.

export async function categorizeTransaction(
  description: string,
  amount: number,
  merchant?: string
): Promise<{ category: string; confidence: number; suggested_categories: string[] }> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/ai/categorize`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount, merchant }),
      }
    );
    if (!res.ok) throw new Error("AI service unavailable");
    return res.json();
  } catch {
    return { category: "Uncategorized", confidence: 0, suggested_categories: [] };
  }
}

export async function getPredictions(userId: string): Promise<{
  predicted_spending: Record<string, number>;
  risk_categories: string[];
  monthly_forecast: number;
  insight: string;
} | null> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/ai/predict`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }
    );
    if (!res.ok) throw new Error("AI service unavailable");
    return res.json();
  } catch {
    return null;
  }
}
