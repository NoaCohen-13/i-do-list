import { eq, and, gte, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { todos, budgetItems, calendarEvents } from "@/db/schema";
import { requireWedding } from "@/lib/wedding";
import { AppShell } from "@/components/AppShell";
import { createTodo, deleteTodo, addCalendarEventAsTodo } from "@/app/(app)/actions";
import { TodoCheckbox, BudgetBookedCheckbox } from "@/components/TodoCheckbox";
import { DeleteButton } from "@/components/DeleteButton";

export default async function TodosPage() {
  const wedding = await requireWedding();
  const db = getDb();

  const allTodos = await db.query.todos.findMany({
    where: eq(todos.weddingId, wedding.id),
    orderBy: (t, { asc }) => [asc(t.dueDate), asc(t.createdAt)],
  });

  const allVendors = await db.query.budgetItems.findMany({
    where: eq(budgetItems.weddingId, wedding.id),
    orderBy: (b, { asc }) => [asc(b.category)],
  });
  const unbookedVendors = allVendors.filter((v) => !v.booked);

  const upcomingEvents = await db.query.calendarEvents.findMany({
    where: and(eq(calendarEvents.weddingId, wedding.id), gte(calendarEvents.startAt, new Date())),
    orderBy: [asc(calendarEvents.startAt)],
    limit: 5,
  });

  const activeTodos = allTodos.filter((t) => !t.done);
  const phases = new Map<string, typeof allTodos>();
  for (const t of activeTodos) {
    const key = t.phase ?? "Unsorted";
    const bucket = phases.get(key) ?? [];
    bucket.push(t);
    phases.set(key, bucket);
  }
  const done = allTodos.filter((t) => t.done).length;

  type CompletedItem = { id: string; title: string; kind: "todo" | "vendor" };
  const completedByCategory = new Map<string, CompletedItem[]>();
  for (const t of allTodos.filter((t) => t.done)) {
    const key = t.category ?? "Uncategorized";
    const bucket = completedByCategory.get(key) ?? [];
    bucket.push({ id: t.id, title: t.title, kind: "todo" });
    completedByCategory.set(key, bucket);
  }
  for (const v of allVendors.filter((v) => v.booked)) {
    const key = v.category;
    const bucket = completedByCategory.get(key) ?? [];
    bucket.push({ id: v.id, title: v.itemName, kind: "vendor" });
    completedByCategory.set(key, bucket);
  }

  return (
    <AppShell active="/todos">
      <header className="pt-9 pb-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-melon-strong">
          To-Do List
        </span>
        <h1 className="text-3xl">Organized by when it&apos;s due</h1>
        <p className="mt-2 text-text-muted">
          {allTodos.length} tasks · {done} done
          {unbookedVendors.length > 0 && ` · ${unbookedVendors.length} vendors still to book`}
        </p>
      </header>

      {upcomingEvents.length > 0 && (
        <div className="mb-7 overflow-hidden rounded-[22px] border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border bg-teal-soft px-5 py-4">
            <h3 className="text-[1.05rem]">Coming up</h3>
            <span className="text-[0.78rem] font-bold text-teal-strong">from your calendar</span>
          </div>
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
              <div className="flex-1">
                <div dir="auto" className="text-[0.92rem] font-semibold">
                  {event.title}
                </div>
                <div className="text-[0.78rem] text-text-muted">
                  {new Date(event.startAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {event.location && ` · ${event.location}`}
                </div>
              </div>
              {event.addedAsTodoAt ? (
                <span className="text-[0.78rem] font-bold text-text-muted">Added ✓</span>
              ) : (
                <form action={addCalendarEventAsTodo.bind(null, event.id)}>
                  <button type="submit" className="text-[0.78rem] font-bold text-melon-strong hover:underline">
                    Add as task
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {unbookedVendors.length > 0 && (
        <div className="mb-7 overflow-hidden rounded-[22px] border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border bg-coral-soft px-5 py-4">
            <h3 className="text-[1.05rem]">Vendors to book</h3>
            <span className="text-[0.78rem] font-bold text-coral-strong">from your budget</span>
          </div>
          {unbookedVendors.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
              <BudgetBookedCheckbox id={item.id} booked={item.booked} />
              <div dir="auto" className="flex-1 text-[0.92rem] font-semibold">
                {item.itemName}
                {item.vendorName && <span className="font-normal text-text-muted"> · {item.vendorName}</span>}
              </div>
              <span
                dir="auto"
                className="rounded-full bg-melon-soft px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-melon-strong"
              >
                {item.category}
              </span>
            </div>
          ))}
        </div>
      )}

      <form
        action={createTodo}
        className="mb-7 flex flex-wrap items-end gap-3 rounded-[20px] border border-dashed border-border-strong bg-surface p-4.5"
      >
        <Field label="Task">
          <input name="title" required className="input" placeholder="e.g. Book the florist" />
        </Field>
        <Field label="Phase">
          <input name="phase" className="input" placeholder="e.g. 3 months before" />
        </Field>
        <Field label="Category">
          <input name="category" className="input" placeholder="e.g. Vendors" />
        </Field>
        <Field label="Due date (for reminders)">
          <input name="dueDate" type="date" className="input" />
        </Field>
        <button type="submit" className="btn-primary">
          Add task
        </button>
      </form>

      {phases.size === 0 ? (
        <p className="rounded-[20px] border border-border bg-surface p-6 text-text-muted">
          No tasks yet — add your first one above.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {[...phases.entries()].map(([phase, items]) => (
            <div key={phase} className="overflow-hidden rounded-[22px] border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
                <h3 className="text-[1.05rem]">{phase}</h3>
                <span className="text-[0.78rem] font-bold text-text-muted">
                  {items.filter((i) => i.done).length} / {items.length} done
                </span>
              </div>
              {items.map((t) => (
                <div key={t.id} className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
                  <TodoCheckbox id={t.id} done={t.done} />
                  <div
                    dir="auto"
                    className={`flex-1 text-[0.92rem] font-semibold ${t.done ? "text-text-muted line-through" : ""}`}
                  >
                    {t.title}
                  </div>
                  {t.category && (
                    <span
                      dir="auto"
                      className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-teal-strong"
                    >
                      {t.category}
                    </span>
                  )}
                  <DeleteButton
                    action={deleteTodo.bind(null, t.id)}
                    confirmMessage={`Delete "${t.title}"? This can't be undone.`}
                    label="Delete task"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {completedByCategory.size > 0 && (
        <section className="mt-9">
          <h2 className="mb-3.5 text-xl">Completed ({done + allVendors.filter((v) => v.booked).length})</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            {[...completedByCategory.entries()].map(([category, items]) => (
              <div key={category} className="overflow-hidden rounded-[22px] border border-border bg-surface">
                <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
                  <h3 className="text-[1.05rem]">{category}</h3>
                  <span className="text-[0.78rem] font-bold text-text-muted">{items.length} done</span>
                </div>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0">
                    {item.kind === "todo" ? (
                      <TodoCheckbox id={item.id} done={true} />
                    ) : (
                      <BudgetBookedCheckbox id={item.id} booked={true} />
                    )}
                    <div dir="auto" className="flex-1 text-[0.92rem] font-semibold text-text-muted line-through">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
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
