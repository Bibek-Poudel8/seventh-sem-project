import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Python ML server not available yet — return null to trigger fallback UI
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(null);
}
