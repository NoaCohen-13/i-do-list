import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { budgetItems } from "@/db/schema";
import { requireWedding } from "@/lib/wedding";
import { AppShell } from "@/components/AppShell";
import { createBudgetItem, deleteBudgetItem } from "@/app/(app)/actions";
import { BudgetBookedCheckbox } from "@/components/TodoCheckbox";

export default async function BudgetPage() {
  const wedding = await requireWedding();
  const db = getDb();

  const items = await db.query.budgetItems.findMany({
    where: eq(budgetItems.weddingId, wedding.id),
    orderBy: (b, { asc }) => [asc(b.category), asc(b.itemName)],
  });

  const byCategory = new Map<string, { committed: number; paid: number; items: typeof items }>();
  for (const item of items) {
    const key = item.category;
    const bucket = byCategory.get(key) ?? { committed: 0, paid: 0, items: [] };
    bucket.committed += Number(item.committedCost);
    bucket.paid += Number(item.paidAmount);
    bucket.items.push(item);
    byCategory.set(key, bucket);
  }

  const totalCommitted = items.reduce((s, i) => s + Number(i.committedCost), 0);
  const totalPaid = items.reduce((s, i) => s + Number(i.paidAmount), 0);
  const pct = totalCommitted > 0 ? totalPaid / totalCommitted : 0;

  return (
    <AppShell active="/budget">
      <header className="pt-9 pb-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-berry-strong">
          Budget
        </span>
        <h1 className="text-3xl">Every shekel, accounted for</h1>
      </header>

      <div className="mb-7 flex flex-wrap items-center gap-8 rounded-[22px] border border-border bg-surface p-6.5">
        <div>
          <div className="text-sm font-bold text-text-muted">Paid so far</div>
          <div className="font-display text-3xl tabular-nums">
            ₪{totalPaid.toLocaleString()}{" "}
            <span className="text-base font-semibold text-text-muted">
              of ₪{totalCommitted.toLocaleString()} committed
            </span>
          </div>
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-berry to-melon"
              style={{ width: `${Math.min(100, pct * 100)}%` }}
            />
          </div>
          {totalCommitted > 0 && (
            <div className="mt-2 text-sm font-semibold text-text-muted">
              {Math.round(pct * 100)}% paid · ₪{(totalCommitted - totalPaid).toLocaleString()} balance due
            </div>
          )}
        </div>
      </div>

      <form
        action={createBudgetItem}
        className="mb-7 flex flex-wrap items-end gap-3 rounded-[20px] border border-dashed border-border-strong bg-surface p-4.5"
      >
        <Field label="Category">
          <input name="category" required className="input" placeholder="e.g. Venue" />
        </Field>
        <Field label="Item">
          <input name="itemName" required className="input" placeholder="e.g. Photographer" />
        </Field>
        <Field label="Vendor">
          <input name="vendorName" className="input" placeholder="Optional" />
        </Field>
        <Field label="Committed ₪">
          <input name="committedCost" type="number" step="0.01" defaultValue={0} className="input w-28" />
        </Field>
        <Field label="Paid ₪">
          <input name="paidAmount" type="number" step="0.01" defaultValue={0} className="input w-28" />
        </Field>
        <button type="submit" className="btn-primary">
          Add item
        </button>
      </form>

      {byCategory.size === 0 ? (
        <p className="rounded-[20px] border border-border bg-surface p-6 text-text-muted">
          No budget items yet — add your first one above, or import your spreadsheet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...byCategory.entries()].map(([category, bucket]) => {
            const catPct = bucket.committed > 0 ? bucket.paid / bucket.committed : 0;
            return (
              <div key={category} className="rounded-[20px] border border-border bg-surface p-4.5">
                <div className="mb-2.5 flex items-baseline justify-between">
                  <span className="font-bold text-[0.95rem]">{category}</span>
                  <span className="rounded-full bg-melon-soft px-2.5 py-0.5 text-[0.74rem] font-bold text-melon-strong">
                    {bucket.committed > 0 ? `${Math.round(catPct * 100)}% paid` : "Not started"}
                  </span>
                </div>
                <div className="mb-2 flex justify-between text-[0.82rem] font-semibold text-text-muted">
                  <span>Committed ₪{bucket.committed.toLocaleString()}</span>
                  <b className="text-text">₪{bucket.paid.toLocaleString()}</b>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-coral" style={{ width: `${Math.min(100, catPct * 100)}%` }} />
                </div>
                <ul className="mt-3 space-y-2">
                  {bucket.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-sm">
                      <BudgetBookedCheckbox id={item.id} booked={item.booked} />
                      <span className={`flex-1 ${item.booked ? "text-text-muted line-through" : ""}`}>
                        {item.itemName}
                        {item.vendorName && <span className="text-text-muted"> · {item.vendorName}</span>}
                      </span>
                      <span className="tabular-nums text-text-muted whitespace-nowrap">
                        {Number(item.committedCost) > 0
                          ? `₪${Number(item.committedCost).toLocaleString()}`
                          : "—"}
                      </span>
                      <form action={deleteBudgetItem.bind(null, item.id)}>
                        <button type="submit" className="text-text-muted hover:text-berry-strong" aria-label="Remove item">
                          ✕
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[0.78rem] font-bold text-text-muted">
      {label}
      {children}
    </label>
  );
}
