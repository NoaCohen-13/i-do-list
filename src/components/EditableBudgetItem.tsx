"use client";

import { useState } from "react";
import { BudgetBookedCheckbox } from "@/components/TodoCheckbox";
import { DeleteButton } from "@/components/DeleteButton";
import { updateBudgetItem } from "@/app/(app)/actions";

type BudgetItem = {
  id: string;
  itemName: string;
  vendorName: string | null;
  committedCost: string;
  paidAmount: string;
  notes: string | null;
  booked: boolean;
};

export function EditableBudgetItem({
  item,
  onDelete,
}: {
  item: BudgetItem;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="text-sm">
      <div className="flex items-center gap-2">
        <BudgetBookedCheckbox id={item.id} booked={item.booked} />
        <button
          type="button"
          dir="auto"
          onClick={() => setOpen((v) => !v)}
          className={`flex-1 text-start ${item.booked ? "text-text-muted line-through" : ""}`}
        >
          {item.itemName}
          {item.vendorName && <span className="text-text-muted"> · {item.vendorName}</span>}
        </button>
        <span className="tabular-nums text-text-muted whitespace-nowrap">
          {Number(item.committedCost) > 0 ? `₪${Number(item.committedCost).toLocaleString()}` : "—"}
        </span>
        <DeleteButton
          action={onDelete.bind(null, item.id)}
          confirmMessage={`Remove "${item.itemName}"? This can't be undone.`}
          label="Remove item"
        />
      </div>

      {open && (
        <form
          action={async (formData) => {
            await updateBudgetItem(item.id, formData);
            setOpen(false);
          }}
          className="mt-2 grid gap-2 rounded-xl border border-dashed border-border-strong bg-surface-2 p-3 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-[0.72rem] font-bold text-text-muted">
            Vendor
            <input name="vendorName" defaultValue={item.vendorName ?? ""} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-[0.72rem] font-bold text-text-muted">
            Committed ₪
            <input
              name="committedCost"
              type="number"
              step="0.01"
              defaultValue={item.committedCost}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.72rem] font-bold text-text-muted">
            Paid ₪
            <input name="paidAmount" type="number" step="0.01" defaultValue={item.paidAmount} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-[0.72rem] font-bold text-text-muted sm:col-span-2">
            Notes
            <textarea name="notes" defaultValue={item.notes ?? ""} className="input" rows={2} />
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="btn-primary">
              Save
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-bold text-text-muted">
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
