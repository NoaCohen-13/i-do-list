import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { weddings, accessRequests } from "@/db/schema";

/**
 * Every authenticated route lives inside a Clerk organization (one org = one
 * wedding). This resolves the current org to its `weddings` row, creating it
 * on first visit since there's no webhook wiring org creation -> DB yet.
 */
export async function requireWedding() {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/session-tasks/choose-organization");
  }

  const db = getDb();
  const existing = await db.query.weddings.findFirst({
    where: eq(weddings.clerkOrgId, orgId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(weddings)
    .values({ clerkOrgId: orgId })
    .returning();
  return created;
}

/**
 * Members who joined via Clerk's native org-invite (e.g. a partner) have no
 * `accessRequests` row at all and default to full edit access. Only a row
 * with an explicit "viewer" grant — created by our own request/approve flow
 * — restricts someone to read-only.
 */
export async function canEditWedding(wedding: { id: string }) {
  const { orgRole, userId } = await auth();
  if (orgRole === "org:admin") return true;
  if (!userId) return false;

  const db = getDb();
  const record = await db.query.accessRequests.findFirst({
    where: and(
      eq(accessRequests.weddingId, wedding.id),
      eq(accessRequests.requesterUserId, userId),
      eq(accessRequests.status, "approved")
    ),
  });
  return record?.role !== "viewer";
}

export async function requireEditWedding() {
  const wedding = await requireWedding();
  if (!(await canEditWedding(wedding))) {
    throw new Error("You have view-only access to this wedding.");
  }
  return wedding;
}
