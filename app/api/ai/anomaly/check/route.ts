import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { createNotification } from "@/services/notification.service";
import { NotificationType } from "@/generated/prisma/client";

interface AnomalyResult {
  id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  anomaly_reason: string;
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transactionId } = await req.json();

  if (!transactionId) {
    return NextResponse.json(
      { error: "Missing transactionId" },
      { status: 400 },
    );
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { category: true },
  });

  if (!transaction || transaction.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 },
    );
  }

  const history = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      type: "EXPENSE",
      isDeleted: false,
      id: { not: transactionId },
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const payload = {
    transaction: {
      id: transaction.id,
      amount: Number(transaction.amount),
      date: transaction.date.toISOString(),
      category: transaction.category?.name ?? "Uncategorized",
      description: transaction.description ?? "",
    },
    history: history.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      category: t.category?.name ?? "Uncategorized",
      description: t.description ?? "",
    })),
  };

  const res = await fetch(`${ML_SERVICE_URL}/anomaly/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result: AnomalyResult = await res.json();

  if (result.is_anomaly) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        isAnomaly: true,
        anomalyScore: result.anomaly_score,
        anomalyReason: result.anomaly_reason,
      },
    });

    await createNotification({
      userId: session.user.id,
      type: NotificationType.SYSTEM,
      title: "Unusual Transaction Detected",
      message: result.anomaly_reason,
      relatedEntityId: transactionId,
      relatedEntityType: "Transaction",
    });
  }
  // await createNotification({
  //   userId: session.user.id,
  //   type: NotificationType.SYSTEM,
  //   title: "Unusual Transaction Detected",
  //   message: "ello",
  //   relatedEntityId: transactionId,
  //   relatedEntityType: "Transaction",
  // });

  return NextResponse.json(result);
}
