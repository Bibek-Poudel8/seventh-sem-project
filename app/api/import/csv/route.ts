import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";
import { TransactionType } from "@/generated/prisma/client";

type CsvRow = {
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  paymentMethod: string;
  notes: string;
};

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV file is empty or missing rows.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const index = (name: string) => headers.indexOf(name.toLowerCase());

  const requiredHeaders = ["date", "description", "type", "amount"];
  for (const header of requiredHeaders) {
    if (index(header) === -1) {
      throw new Error(`Missing required CSV column: ${header}`);
    }
  }

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const read = (name: string) => {
      const cellIndex = index(name);
      return cellIndex >= 0 ? (cells[cellIndex] ?? "") : "";
    };

    const typeRaw = read("type").toUpperCase();
    if (typeRaw !== "INCOME" && typeRaw !== "EXPENSE") {
      throw new Error(`Invalid transaction type: ${read("type")}`);
    }

    const amount = Number(read("amount"));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${read("amount")}`);
    }

    return {
      date: read("date"),
      description: read("description"),
      category: read("category"),
      type: typeRaw as TransactionType,
      amount,
      paymentMethod: read("payment method"),
      notes: read("notes"),
    };
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No CSV file was uploaded." },
      { status: 400 },
    );
  }

  const csvText = await file.text();
  const rows = parseCsv(csvText);

  let importedCount = 0;

  for (const row of rows) {
    const description = row.description.trim();
    if (!description) {
      throw new Error("Each row must include a description.");
    }

    const categoryName = row.category.trim();
    let categoryId: string | undefined;

    if (categoryName) {
      const category = await prisma.category.upsert({
        where: {
          userId_name_type: {
            userId: session.user.id,
            name: categoryName,
            type: row.type,
          },
        },
        create: {
          userId: session.user.id,
          name: categoryName,
          type: row.type,
          isSystem: false,
        },
        update: {},
      });
      categoryId = category.id;
    }

    const paymentMethodName = row.paymentMethod.trim();
    let paymentMethodId: string | undefined;

    if (paymentMethodName) {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: { userId: session.user.id, name: paymentMethodName },
      });
      paymentMethodId = paymentMethod?.id;
    }

    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        description,
        amount: row.amount,
        type: row.type,
        date: new Date(row.date),
        categoryId,
        paymentMethodId,
        notes: row.notes.trim() || null,
      },
    });

    importedCount += 1;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");

  return NextResponse.json({ importedCount });
}
