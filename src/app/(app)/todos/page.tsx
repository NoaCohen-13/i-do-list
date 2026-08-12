import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { todos } from "@/db/schema";
import { requireWedding } from "@/lib/wedding";
import { AppShell } from "@/components/AppShell";
import { createTodo, deleteTodo } from "@/app/(app)/actions";
import { TodoCheckbox } from "@/components/TodoCheckbox";

export default async function TodosPage() {
  const wedding = await requireWedding();
  const db = getDb();

  const allTodos = await db.query.todos.findMany({
    where: eq(todos.weddingId, wedding.id),
    orderBy: (t, { asc }) => [asc(t.dueDate), asc(t.createdAt)],
  });

  const phases = new Map<string, typeof allTodos>();
  for (const t of allTodos) {
    const key = t.phase ?? "Unsorted";
    const bucket = phases.get(key) ?? [];
    bucket.push(t);
    phases.set(key, bucket);
  }
  const done = allTodos.filter((t) => t.done).length;

  return (
    <AppShell active="/todos">
      <header className="pt-9 pb-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-melon-strong">
          To-Do List
        </span>
        <h1 className="text-3xl">Organized by when it&apos;s due</h1>
        <p className="mt-2 text-text-muted">
          {allTodos.length} tasks · {done} done
        </p>
      </header>

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
                  <div className={`flex-1 text-[0.92rem] font-semibold ${t.done ? "text-text-muted line-through" : ""}`}>
                    {t.title}
                  </div>
                  {t.category && (
                    <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-teal-strong">
                      {t.category}
                    </span>
                  )}
                  <form action={deleteTodo.bind(null, t.id)}>
                    <button type="submit" className="text-text-muted hover:text-berry-strong" aria-label="Delete task">
                      ✕
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ))}
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
