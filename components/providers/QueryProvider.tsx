"use client";

/**
 * QueryProvider.tsx
 *
 * Client-side wrapper that provides TanStack Query's QueryClientProvider
 * to the entire app tree. Must be a client component because it manages
 * the QueryClient instance state.
 */

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // getQueryClient() returns the same browser singleton on every render,
  // so this is safe to call directly here without useState.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
