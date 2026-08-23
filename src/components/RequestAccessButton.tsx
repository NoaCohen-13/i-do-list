"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestAccess } from "@/app/(app)/actions";

export function RequestAccessButton({ weddingId, label }: { weddingId: string; label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await requestAccess(weddingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handleClick} disabled={isPending} className="btn-primary w-fit">
        {isPending ? "Sending…" : label}
      </button>
      {error && <p className="text-sm font-semibold text-berry-strong">{error}</p>}
    </div>
  );
}
