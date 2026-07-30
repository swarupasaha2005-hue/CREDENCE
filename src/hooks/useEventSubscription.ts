"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { eventService } from "../lib/services/event-service";

/**
 * Mounts the single, app-wide EventService subscription. Must be mounted exactly once
 * (see QueryProvider) -- EventService.start() is idempotent so re-mounts are harmless,
 * but stop() is called on unmount to guarantee the polling timer is never leaked.
 */
export function useEventSubscription(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    eventService.start(queryClient);
    return () => eventService.stop();
  }, [queryClient]);
}
