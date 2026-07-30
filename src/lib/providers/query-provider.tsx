"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useEventSubscription } from "../../hooks/useEventSubscription";

/** Mounted once inside QueryClientProvider so it can reach the QueryClient via context. */
function EventSubscriptionBridge() {
  useEventSubscription();
  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <EventSubscriptionBridge />
      {children}
    </QueryClientProvider>
  );
}
