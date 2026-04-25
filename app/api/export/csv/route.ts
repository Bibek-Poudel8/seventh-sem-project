import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportCSV } from "@/services/export.service";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    type: (searchParams.get("type") as "INCOME" | "EXPENSE") ?? undefined,
  };

  const csv = await exportCSV(session.user.id, filters);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions-${Date.now()}.csv"`,
    },
  });
}
