"use server";

import { getCachedCategoryBreakdown } from "@/lib/query-cache";
import { auth } from "@/auth";

export async function fetchCategoryBreakdownAction(startIso: string, endIso: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const start = new Date(startIso);
  const end = new Date(endIso);
  
  return getCachedCategoryBreakdown(session.user.id, start, end);
}
