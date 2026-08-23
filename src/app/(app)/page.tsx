import { sql, eq, and, gte, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { guests, budgetItems, todos, calendarEvents } from "@/db/schema";
import { requireWedding, canEditWedding } from "@/lib/wedding";
import { AppShell } from "@/components/AppShell";
import { StatCard, Ring } from "@/components/StatCard";
import { TodoCheckbox, BudgetBookedCheckbox } from "@/components/TodoCheckbox";
import { tagColor } from "@/lib/tag-color";

function formatDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const wedding = await requireWedding();
  const canEdit = await canEditWedding(wedding);
  const db = getDb();

  const [todoStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where ${todos.done})::int`,
    })
    .from(todos)
    .where(eq(todos.weddingId, wedding.id));

  const [vendorStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where ${budgetItems.booked})::int`,
    })
    .from(budgetItems)
    .where(eq(budgetItems.weddingId, wedding.id));

  const combinedTotal = todoStats.total + vendorStats.total;
  const combinedDone = todoStats.done + vendorStats.done;

  const [guestStats] = await db
    .select({
      households: sql<number>`count(*)::int`,
      guests: sql<number>`coalesce(sum(${guests.partySize}), 0)::int`,
    })
    .from(guests)
    .where(eq(guests.weddingId, wedding.id));

  const [budgetStats] = await db
    .select({
      committed: sql<number>`coalesce(sum(${budgetItems.committedCost}), 0)::numeric`,
      paid: sql<number>`coalesce(sum(${budgetItems.paidAmount}), 0)::numeric`,
    })
    .from(budgetItems)
    .where(eq(budgetItems.weddingId, wedding.id));

  const upNextTodos = await db.query.todos.findMany({
    where: and(eq(todos.weddingId, wedding.id), eq(todos.done, false)),
    orderBy: (t, { asc }) => [asc(t.dueDate), asc(t.createdAt)],
    limit: 5,
  });
  const upNextVendors = await db.query.budgetItems.findMany({
    where: and(eq(budgetItems.weddingId, wedding.id), eq(budgetItems.booked, false)),
    orderBy: (b, { asc }) => [asc(b.category)],
    limit: 5,
  });
  const upNext = [
    ...upNextTodos.map((t) => ({ kind: "todo" as const, id: t.id, title: t.title, tag: t.category, done: t.done })),
    ...upNextVendors.map((v) => ({ kind: "vendor" as const, id: v.id, title: v.itemName, tag: v.category, done: v.booked })),
  ].slice(0, 5);

  const upcomingEvents = await db.query.calendarEvents.findMany({
    where: and(eq(calendarEvents.weddingId, wedding.id), gte(calendarEvents.startAt, new Date())),
    orderBy: [asc(calendarEvents.startAt)],
    limit: 3,
  });

  const todoPct = combinedTotal > 0 ? combinedDone / combinedTotal : 0;
  const committed = Number(budgetStats.committed);
  const paid = Number(budgetStats.paid);
  const budgetPct = committed > 0 ? paid / committed : 0;

  const daysToGo = wedding.weddingDate
    ? Math.ceil(
        (new Date(`${wedding.weddingDate}T00:00:00`).getTime() - Date.now()) / 86400000
      )
    : null;

  return (
    <AppShell active="/">
      <section className="grid gap-10 pb-10 pt-0 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <span className="mb-3.5 block font-bold text-xs uppercase tracking-widest text-berry-strong">
            {wedding.weddingDate ? formatDate(wedding.weddingDate) : "Date coming soon"}
          </span>
          <h1 className="text-[clamp(2.4rem,4.5vw,3.6rem)]">
            {wedding.venueName ? (
              <>Your wedding at {wedding.venueName}</>
            ) : (
              <>Your wedding</>
            )}
          </h1>
          <p className="mt-3.5 text-text-muted">
            Everything you both need to plan it, in one shared place.
          </p>
        </div>
        <div className="rounded-[26px] border border-border bg-gradient-to-br from-melon-soft to-surface p-7">
          {daysToGo !== null ? (
            <>
              <div className="font-display text-[3.6rem] leading-none tabular-nums text-melon-strong">
                {daysToGo}
              </div>
              <div className="mt-1 font-semibold text-text-muted">days to go</div>
            </>
          ) : (
            <>
              <div className="text-3xl">📅</div>
              <div className="mt-2 font-semibold text-text-muted">No date set yet</div>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Starter Checklist"
          value={`${combinedDone} / ${combinedTotal}`}
          sub={combinedTotal > 0 ? `${Math.round(todoPct * 100)}% complete` : "Nothing added yet"}
          ring={<Ring pct={todoPct} color="var(--melon)" />}
        />
        <StatCard
          title="Guest List"
          value={`${guestStats.guests} guests`}
          sub={`${guestStats.households} households`}
        />
        <StatCard
          title="Budget Paid"
          value={`₪${paid.toLocaleString()}`}
          sub={committed > 0 ? `of ₪${committed.toLocaleString()} committed · ${Math.round(budgetPct * 100)}%` : "Nothing budgeted yet"}
          ring={<Ring pct={budgetPct} color="var(--berry)" />}
        />
      </section>

      {upcomingEvents.length > 0 && (
        <section className="mt-9">
          <h2 className="mb-3.5 text-xl">Upcoming events</h2>
          <div className="overflow-hidden rounded-[22px] border border-border bg-surface">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3.5 border-b border-border px-4.5 py-3.5 last:border-b-0"
              >
                <div dir="auto" className="flex-1 font-bold">
                  {event.title}
                </div>
                <div className="text-[0.82rem] font-semibold text-text-muted">
                  {new Date(event.startAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {event.location && ` · ${event.location}`}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-9">
        <h2 className="mb-3.5 text-xl">Up next</h2>
        <div className="overflow-hidden rounded-[22px] border border-border bg-surface">
          {upNext.length === 0 ? (
            <p className="p-6 text-text-muted">
              No open tasks yet — add some on the To-Dos page.
            </p>
          ) : (
            upNext.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3.5 border-b border-border px-4.5 py-3.5 last:border-b-0"
              >
                {t.kind === "todo" ? (
                  <TodoCheckbox id={t.id} done={t.done} readOnly={!canEdit} />
                ) : (
                  <BudgetBookedCheckbox id={t.id} booked={t.done} readOnly={!canEdit} />
                )}
                <div dir="auto" className="flex-1 font-bold">
                  {t.title}
                </div>
                {t.tag && (
                  <span
                    dir="auto"
                    className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${tagColor(t.tag)}`}
                  >
                    {t.tag}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
