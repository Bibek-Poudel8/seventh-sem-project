import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { createNotification } from "@/services/notification.service";
import { NotificationType } from "@/generated/prisma/enums";

interface AnomalyResult {
  id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  anomaly_reason: string;
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      type: "EXPENSE",
      isDeleted: false,
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  if (transactions.length === 0) {
    return NextResponse.json([]);
  }

  const payload = {
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      category: t.category?.name ?? "Uncategorized",
      description: t.description ?? "",
    })),
  };

  const res = await fetch(`${ML_SERVICE_URL}/anomaly/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const results: AnomalyResult[] = await res.json();

  // Update anomaly fields in database for flagged transactions
  const anomalous = results.filter((r) => r.is_anomaly);

  await Promise.all(
    anomalous.map((r) =>
      prisma.transaction.update({
        where: { id: r.id },
        data: {
          isAnomaly: true,
          anomalyScore: r.anomaly_score,
          anomalyReason: r.anomaly_reason,
        },
      }),
    ),
  );
  if (anomalous.length > 0) {
    await createNotification({
      userId: session.user.id,
      type: NotificationType.SYSTEM,
      title: "Unusual Transaction Detected",
      message:
        "We have detected some unusual transactions in your recent activity. Please review them to ensure they are accurate.",
      // relatedEntityId:   transactionId,
      relatedEntityType: "Transaction",
    });
  }

  return NextResponse.json(results);
}
