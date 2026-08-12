import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { guests } from "@/db/schema";
import { requireWedding } from "@/lib/wedding";
import { AppShell } from "@/components/AppShell";
import { createGuest, updateGuestRsvp, deleteGuest } from "@/app/(app)/actions";

const RSVP_STYLES: Record<string, string> = {
  confirmed: "bg-melon-soft text-melon-strong",
  pending: "bg-coral-soft text-coral-strong",
  declined: "bg-surface-3 text-text-muted",
};

export default async function GuestsPage() {
  const wedding = await requireWedding();
  const db = getDb();

  const allGuests = await db.query.guests.findMany({
    where: eq(guests.weddingId, wedding.id),
    orderBy: (g, { asc }) => [asc(g.groupName), asc(g.householdName)],
  });

  const groupTotals = await db
    .select({
      groupName: guests.groupName,
      households: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${guests.partySize}), 0)::int`,
    })
    .from(guests)
    .where(eq(guests.weddingId, wedding.id))
    .groupBy(guests.groupName)
    .orderBy(sql`coalesce(sum(${guests.partySize}), 0) desc`);

  const totalGuests = allGuests.reduce((sum, g) => sum + g.partySize, 0);
  const confirmed = allGuests.filter((g) => g.rsvpStatus === "confirmed").length;
  const pending = allGuests.filter((g) => g.rsvpStatus === "pending").length;
  const declined = allGuests.filter((g) => g.rsvpStatus === "declined").length;

  return (
    <AppShell active="/guests">
      <header className="pt-9 pb-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-teal-strong">
          Guest List
        </span>
        <h1 className="text-3xl">Who&apos;s celebrating with you</h1>
      </header>

      <div className="mb-5.5 flex flex-wrap gap-7 rounded-[20px] border border-border bg-surface-2 px-5.5 py-4.5">
        <Stat n={totalGuests} l="Guests" />
        <Stat n={allGuests.length} l="Households" />
        <Stat n={confirmed} l="Confirmed" />
        <Stat n={pending} l="Pending" />
        <Stat n={declined} l="Declined" />
      </div>

      {groupTotals.length > 0 && (
        <div className="mb-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {groupTotals.map((g) => (
            <div key={g.groupName ?? "ungrouped"} className="rounded-[18px] border border-border bg-surface p-4">
              <div className="mb-2 text-sm font-bold">{g.groupName ?? "Ungrouped"}</div>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-xl tabular-nums">{g.total}</span>
                <span className="text-[0.76rem] font-semibold text-text-muted">
                  {g.households} household{g.households === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        action={createGuest}
        className="mb-7 flex flex-wrap items-end gap-3 rounded-[20px] border border-dashed border-border-strong bg-surface p-4.5"
      >
        <Field label="Household">
          <input name="householdName" required className="input" placeholder="e.g. The Cohen Family" />
        </Field>
        <Field label="Party size">
          <input name="partySize" type="number" min={1} defaultValue={1} className="input w-20" />
        </Field>
        <Field label="Group">
          <input name="groupName" className="input" placeholder="e.g. Noa's Family" />
        </Field>
        <button type="submit" className="btn-primary">
          Add guest
        </button>
      </form>

      <div className="overflow-x-auto rounded-[20px] border border-border bg-surface">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="bg-surface-2">
              <Th>Household</Th>
              <Th>Party</Th>
              <Th>Group</Th>
              <Th>RSVP</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {allGuests.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-text-muted">
                  No guests yet — add your first household above, or import your spreadsheet.
                </td>
              </tr>
            ) : (
              allGuests.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-b-0 hover:bg-surface-2">
                  <Td>{g.householdName}</Td>
                  <Td className="tabular-nums">{g.partySize}</Td>
                  <Td className="text-text-muted">{g.groupName ?? "—"}</Td>
                  <Td>
                    <div className="flex gap-1">
                      {(["pending", "confirmed", "declined"] as const).map((status) => (
                        <form key={status} action={updateGuestRsvp.bind(null, g.id, status)}>
                          <button
                            type="submit"
                            className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide transition-opacity ${
                              RSVP_STYLES[status]
                            } ${g.rsvpStatus === status ? "" : "opacity-30 hover:opacity-70"}`}
                          >
                            {status}
                          </button>
                        </form>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <form action={deleteGuest.bind(null, g.id)}>
                      <button type="submit" className="text-text-muted hover:text-berry-strong" aria-label="Remove guest">
                        ✕
                      </button>
                    </form>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-2xl tabular-nums">{n}</span>
      <span className="text-[0.75rem] font-bold uppercase tracking-wide text-text-muted">{l}</span>
    </div>
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

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="border-b border-border px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-wide text-text-muted">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 text-[0.92rem] ${className}`}>{children}</td>;
}
