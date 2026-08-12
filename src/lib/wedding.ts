import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { weddings } from "@/db/schema";

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
