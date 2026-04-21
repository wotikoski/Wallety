"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { GroupProvider } from "@/lib/hooks/useActiveGroup";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Always re-validate data when a component mounts or the window
            // regains focus. The 60 s staleTime was preventing dashboard /
            // recent-transactions from refreshing after mutations.
            staleTime: 0,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <GroupProvider>{children}</GroupProvider>
    </QueryClientProvider>
  );
}
