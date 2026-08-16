"use client";

import { useState, useTransition } from "react";

const CONFETTI_COLORS = ["#EF4B6E", "#FF8360", "#7A1F4B", "#3E9C90"];

export function Checkbox({
  done,
  onToggle,
}: {
  done: boolean;
  onToggle: (next: boolean) => void | Promise<void>;
}) {
  const [optimisticDone, setOptimisticDone] = useState(done);
  const [burstKey, setBurstKey] = useState(0);
  const [, startTransition] = useTransition();
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function handleClick() {
    const next = !optimisticDone;
    setOptimisticDone(next);
    if (next && !reduceMotion) setBurstKey((k) => k + 1);
    startTransition(() => {
      onToggle(next);
    });
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={optimisticDone}
      onClick={handleClick}
      className={`relative flex h-5 w-5 flex-none cursor-pointer items-center justify-center rounded-lg border-2 transition-colors ${
        optimisticDone ? "border-melon bg-melon" : "border-border-strong bg-surface"
      }`}
    >
      {optimisticDone && (
        <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
          <path
            d="M4 10l4 4 8-8"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {burstKey > 0 && (
        <span key={burstKey} className="pointer-events-none absolute inset-0">
          {CONFETTI_COLORS.map((c, i) => (
            <span
              key={i}
              className="confetti-piece absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-[2px]"
              style={{
                backgroundColor: c,
                // @ts-expect-error custom property for keyframe
                "--dx": `${Math.cos((i / 4) * Math.PI * 2) * 26}px`,
                "--dy": `${Math.sin((i / 4) * Math.PI * 2) * 26 - 10}px`,
              }}
            />
          ))}
        </span>
      )}
    </button>
  );
}

export function TodoCheckbox({ id, done }: { id: string; done: boolean }) {
  return (
    <Checkbox
      done={done}
      onToggle={async (next) => {
        const { toggleTodo } = await import("@/app/(app)/actions");
        toggleTodo(id, next);
      }}
    />
  );
}

export function BudgetBookedCheckbox({ id, booked }: { id: string; booked: boolean }) {
  return (
    <Checkbox
      done={booked}
      onToggle={async (next) => {
        const { toggleBudgetItemBooked } = await import("@/app/(app)/actions");
        toggleBudgetItemBooked(id, next);
      }}
    />
  );
}
