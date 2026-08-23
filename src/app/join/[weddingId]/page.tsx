import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { weddings, accessRequests } from "@/db/schema";
import { RequestAccessButton } from "@/components/RequestAccessButton";
import { SwitchToWeddingButton } from "@/components/SwitchToWeddingButton";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  const { userId, orgId } = await auth();

  const db = getDb();
  const wedding = await db.query.weddings.findFirst({ where: eq(weddings.id, weddingId) });
  if (!wedding) notFound();

  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: wedding.clerkOrgId });
  const weddingLabel = org.name ? `${org.name}'s wedding` : "This wedding";

  const alreadyMember = wedding.clerkOrgId === orgId;
  const existingRequest = alreadyMember
    ? undefined
    : await db.query.accessRequests.findFirst({
        where: and(eq(accessRequests.weddingId, weddingId), eq(accessRequests.requesterUserId, userId!)),
      });

  const heading = alreadyMember
    ? `You have access to ${weddingLabel}`
    : existingRequest?.status === "pending"
      ? `Access requested for ${weddingLabel}`
      : existingRequest?.status === "approved"
        ? `You're approved to view ${weddingLabel}`
        : `You need access to view ${weddingLabel}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-[22px] border border-border bg-surface p-7 text-center">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-coral-strong">
          I Do List
        </span>
        <h1 className="mb-4 text-2xl">{heading}</h1>

        {alreadyMember ? (
          <>
            <p className="mb-5 text-sm text-text-muted">You already have access to this wedding.</p>
            <Link href="/" className="btn-primary inline-block w-fit">
              Go to dashboard
            </Link>
          </>
        ) : existingRequest?.status === "pending" ? (
          <p className="text-sm text-text-muted">
            Your request is pending — the owner will need to approve it before you can view this wedding. In
            the meantime, you can keep planning your own wedding from your dashboard.
          </p>
        ) : existingRequest?.status === "approved" ? (
          <>
            <p className="mb-5 text-sm text-text-muted">
              Your request was approved! This will switch you from your own wedding to {weddingLabel}.
            </p>
            <SwitchToWeddingButton organizationId={wedding.clerkOrgId} />
          </>
        ) : (
          <>
            <p className="mb-5 text-sm text-text-muted">
              {existingRequest?.status === "denied"
                ? "Your previous request was denied. You can send another one."
                : "Request access, and the owner will get an email to approve or deny it. You can keep using your own wedding in the meantime."}
            </p>
            <RequestAccessButton weddingId={weddingId} label="Request access" />
          </>
        )}
      </div>
    </div>
  );
}
