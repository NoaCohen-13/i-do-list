import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { accessRequests } from "@/db/schema";
import { requireWedding } from "@/lib/wedding";
import { AppShell } from "@/components/AppShell";
import { approveAccessRequest, denyAccessRequest } from "@/app/(app)/actions";

export default async function RequestsPage() {
  const wedding = await requireWedding();
  const { orgRole } = await auth();

  if (orgRole !== "org:admin") {
    return (
      <AppShell active="/requests">
        <header className="pt-9 pb-6">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-coral-strong">
            Requests
          </span>
          <h1 className="text-3xl">Who wants to view your wedding</h1>
        </header>
        <p className="rounded-[20px] border border-border bg-surface p-6 text-text-muted">
          Only the wedding owner can manage access requests.
        </p>
      </AppShell>
    );
  }

  const db = getDb();
  const requests = await db.query.accessRequests.findMany({
    where: eq(accessRequests.weddingId, wedding.id),
    orderBy: [desc(accessRequests.createdAt)],
  });

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <AppShell active="/requests">
      <header className="pt-9 pb-6">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-coral-strong">
          Requests
        </span>
        <h1 className="text-3xl">Who wants to view your wedding</h1>
        <p className="mt-2 text-text-muted">
          Approve someone as a viewer (read-only) or editor (same full access as you).
        </p>
      </header>

      {pending.length === 0 ? (
        <p className="rounded-[20px] border border-border bg-surface p-6 text-text-muted">
          No pending requests.
        </p>
      ) : (
        <div className="mb-9 overflow-hidden rounded-[22px] border border-border bg-surface">
          <div className="border-b border-border bg-surface-2 px-5 py-4">
            <h3 className="text-[1.05rem]">Pending ({pending.length})</h3>
          </div>
          {pending.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
              <div className="flex-1">
                <div className="text-[0.92rem] font-semibold">{r.requesterName || r.requesterEmail}</div>
                {r.requesterName && <div className="text-[0.78rem] text-text-muted">{r.requesterEmail}</div>}
              </div>
              <form action={approveAccessRequest.bind(null, r.id, "viewer")}>
                <button
                  type="submit"
                  className="cursor-pointer rounded-full border border-border-strong px-3.5 py-2 text-sm font-bold hover:bg-surface-2"
                >
                  Approve as viewer
                </button>
              </form>
              <form action={approveAccessRequest.bind(null, r.id, "editor")}>
                <button type="submit" className="btn-primary">
                  Approve as editor
                </button>
              </form>
              <form action={denyAccessRequest.bind(null, r.id)}>
                <button type="submit" className="cursor-pointer text-[0.85rem] font-bold text-berry hover:text-red-600">
                  Deny
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="mb-3.5 text-xl">History</h2>
          <div className="overflow-hidden rounded-[22px] border border-border bg-surface">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0">
                <div className="flex-1 text-[0.92rem] font-semibold text-text-muted">
                  {r.requesterName || r.requesterEmail}
                </div>
                <span
                  className={`text-[0.78rem] font-bold ${
                    r.status === "approved" ? "text-teal-strong" : "text-berry"
                  }`}
                >
                  {r.status === "approved" ? `Approved · ${r.role === "editor" ? "Editor" : "Viewer"}` : "Denied"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
