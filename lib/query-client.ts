/**
 * query-client.ts
 *
 * Singleton QueryClient factory for TanStack Query.
 * Keeping this in a separate module ensures a single instance is shared
 * across all client components in the app.
 */

import { QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes — no refetch during this window
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 10 minutes (useful on back-navigation)
        gcTime: 10 * 60 * 1000,
        // Retry once on failure before showing error state
        retry: 1,
        // Don't re-fetch just because the user switched tabs
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Returns a QueryClient instance.
 * - On the server: always creates a new instance (no shared state between requests).
 * - In the browser: reuses the same instance across renders.
 */
export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: new client each time
    return makeQueryClient();
  }

  // Browser: reuse existing client or create one
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}
