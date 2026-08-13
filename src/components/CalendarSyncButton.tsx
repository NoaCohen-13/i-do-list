"use client";

import { useState, useTransition } from "react";
import { syncCalendarNow } from "@/app/(app)/actions";

export function CalendarSyncButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await syncCalendarNow();
        setMessage(`Synced ${result.eventsSynced} upcoming events.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sync failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handleClick} disabled={isPending} className="btn-primary w-fit">
        {isPending ? "Syncing…" : "Sync calendar now"}
      </button>
      {message && <p className="text-sm font-semibold text-melon-strong">{message}</p>}
      {error && <p className="text-sm font-semibold text-berry-strong">{error}</p>}
    </div>
  );
}
