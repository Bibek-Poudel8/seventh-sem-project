import { NextRequest, NextResponse } from "next/server";
import { normalizeCategoryName } from "@/lib/transaction-categories";

// Must stay on the Node.js runtime (not Edge) — it streams a multipart
// file upload through to the FastAPI service, which Edge can't do.
export const runtime = "nodejs";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const forwardFormData = new FormData();
    forwardFormData.append("file", file);

    const mlResponse = await fetch(`${ML_SERVICE_URL}/ocr`, {
      method: "POST",
      body: forwardFormData,
    });

    if (!mlResponse.ok) {
      const errorBody = await mlResponse
        .json()
        .catch(() => ({ detail: "OCR service error" }));
      return NextResponse.json(
        { error: errorBody.detail || "Failed to process bill image" },
        { status: mlResponse.status }
      );
    }

    const result = await mlResponse.json();

    // ocr.py returns {description, amount, date, category, confidence,
    // method, ocr_confidence, ocr_low_confidence, raw_text}. category
    // comes from the same categorizer.predict() call the /categorize
    // route uses, so it needs the same normalization — otherwise
    // findCategoryByName() in TransactionForm.tsx can fail to match it
    // against the categories list whenever the model's raw string
    // doesn't exactly equal one of SYSTEM_TRANSACTION_CATEGORIES.
    const category =
      typeof result.category === "string"
        ? normalizeCategoryName(result.category)
        : "Uncategorized";

    const responseBody = {
      ...result,
      category,
    };

    // raw_text is intentionally excluded from this log — receipts can
    // contain partial card numbers, phone numbers, or addresses, and
    // there's no reason to persist that in server logs.
    console.log("[AI ocr] returned data", {
      description: responseBody.description,
      category: responseBody.category,
      confidence: responseBody.confidence,
      ocr_confidence: responseBody.ocr_confidence,
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("OCR route error:", error);
    return NextResponse.json(
      { error: "OCR service unavailable. Please enter transaction details manually." },
      { status: 503 }
    );
  }
}