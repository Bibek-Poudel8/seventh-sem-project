import { NextRequest, NextResponse } from "next/server";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${ML_SERVICE_URL}/categorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      category: data.category,
      confidence: data.confidence,
      method: data.method,
    });
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json(
      { error: "Failed to categorize transaction" },
      { status: 500 }
    );
  }
}
