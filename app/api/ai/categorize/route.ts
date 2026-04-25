import { NextResponse } from "next/server";

// Python ML server is not available yet — return fallback
export async function POST() {
  return NextResponse.json({
    category: "Uncategorized",
    confidence: 0,
    suggested_categories: [],
  });
}
