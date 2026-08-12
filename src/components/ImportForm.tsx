"use client";

import { useRef, useState, useTransition } from "react";
import { importSpreadsheet } from "@/app/(app)/actions";

export function ImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await importSpreadsheet(formData);
      if (result.ok) {
        setMessage(`Imported ${result.count} rows from "${result.sheetName}".`);
        formRef.current?.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <label className="flex flex-col gap-1 text-[0.78rem] font-bold text-text-muted">
        File (.xlsx or .csv)
        <input name="file" type="file" accept=".xlsx,.xls,.csv" required className="input" />
      </label>
      <label className="flex flex-col gap-1 text-[0.78rem] font-bold text-text-muted">
        This file contains
        <select name="kind" className="input">
          <option value="guests">Guest list</option>
          <option value="budget">Budget</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[0.78rem] font-bold text-text-muted">
        Sheet/tab name (optional)
        <input name="sheetName" className="input" placeholder="Defaults to first sheet" />
      </label>
      <div className="sm:col-span-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Importing…" : "Import"}
        </button>
        {message && <p className="mt-2 text-sm font-semibold text-melon-strong">{message}</p>}
        {error && <p className="mt-2 text-sm font-semibold text-berry-strong">{error}</p>}
      </div>
    </form>
  );
}
