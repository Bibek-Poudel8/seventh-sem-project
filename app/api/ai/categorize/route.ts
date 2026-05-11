import { NextRequest, NextResponse } from "next/server";
import { normalizeCategoryName } from "@/lib/transaction-categories";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description) {
    return NextResponse.json({ error: "Missing description" }, { status: 400 });
  }

  const res = await fetch(`${ML_SERVICE_URL}/categorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to categorize transaction" },
      { status: 502 },
    );
  }

  const result = await res.json();
  const category =
    typeof result.category === "string"
      ? normalizeCategoryName(result.category)
      : "Uncategorized";

  const responseBody = {
    ...result,
    category,
  };

  console.log("[AI categorize] returned data", {
    description,
    data: responseBody,
  });

  return NextResponse.json(responseBody);
}
