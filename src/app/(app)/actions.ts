"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { todos, guests, budgetItems, weddings, calendarEvents, accessRequests } from "@/db/schema";
import { requireWedding, requireEditWedding } from "@/lib/wedding";
import { extractSheetId, syncWeddingFromGoogleSheet } from "@/lib/google-sheet-sync";
import { isFullyPaid } from "@/lib/budget";
import { sendAccessRequestEmail } from "@/lib/send-email";
import { getSiteUrl } from "@/lib/site-url";

export async function toggleTodo(id: string, done: boolean) {
  const wedding = await requireEditWedding();
  const db = getDb();
  await db
    .update(todos)
    .set({ done, updatedAt: new Date() })
    .where(and(eq(todos.id, id), eq(todos.weddingId, wedding.id)));
  revalidatePath("/");
  revalidatePath("/todos");
}

export async function reorderUpNext(items: { id: string; kind: "todo" | "vendor" }[]) {
  const wedding = await requireEditWedding();
  const db = getDb();
  await Promise.all(
    items.map((item, index) =>
      item.kind === "todo"
        ? db
            .update(todos)
            .set({ sortOrder: index })
            .where(and(eq(todos.id, item.id), eq(todos.weddingId, wedding.id)))
        : db
            .update(budgetItems)
            .set({ sortOrder: index })
            .where(and(eq(budgetItems.id, item.id), eq(budgetItems.weddingId, wedding.id)))
    )
  );
  revalidatePath("/");
}

export async function createTodo(formData: FormData) {
  const wedding = await requireEditWedding();
  const db = getDb();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await db.insert(todos).values({
    weddingId: wedding.id,
    title,
    phase: String(formData.get("phase") || "") || null,
    category: String(formData.get("category") || "") || null,
    dueDate: String(formData.get("dueDate") || "") || null,
  });
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function deleteTodo(id: string) {
  const wedding = await requireEditWedding();
  const db = getDb();
  await db.delete(todos).where(and(eq(todos.id, id), eq(todos.weddingId, wedding.id)));
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function createGuest(formData: FormData) {
  const wedding = await requireEditWedding();
  const db = getDb();
  const householdName = String(formData.get("householdName") || "").trim();
  if (!householdName) return;
  await db.insert(guests).values({
    weddingId: wedding.id,
    householdName,
    partySize: Number(formData.get("partySize") || 1),
    groupName: String(formData.get("groupName") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  });
  revalidatePath("/guests");
  revalidatePath("/");
}

export async function updateGuestRsvp(id: string, rsvpStatus: "pending" | "confirmed" | "declined") {
  const wedding = await requireEditWedding();
  const db = getDb();
  await db
    .update(guests)
    .set({ rsvpStatus, updatedAt: new Date() })
    .where(and(eq(guests.id, id), eq(guests.weddingId, wedding.id)));
  revalidatePath("/guests");
  revalidatePath("/");
}

export async function deleteGuest(id: string) {
  const wedding = await requireEditWedding();
  const db = getDb();
  await db.delete(guests).where(and(eq(guests.id, id), eq(guests.weddingId, wedding.id)));
  revalidatePath("/guests");
  revalidatePath("/");
}

export async function createBudgetItem(formData: FormData) {
  const wedding = await requireEditWedding();
  const db = getDb();
  const itemName = String(formData.get("itemName") || "").trim();
  if (!itemName) return;
  const committedCost = Number(formData.get("committedCost") || 0);
  const paidAmount = Number(formData.get("paidAmount") || 0);
  await db.insert(budgetItems).values({
    weddingId: wedding.id,
    category: String(formData.get("category") || "Other"),
    itemName,
    vendorName: String(formData.get("vendorName") || "") || null,
    committedCost: String(committedCost),
    paidAmount: String(paidAmount),
    booked: isFullyPaid(committedCost, paidAmount),
  });
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function updateBudgetItem(id: string, formData: FormData) {
  const wedding = await requireEditWedding();
  const db = getDb();
  const committedCost = Number(formData.get("committedCost") || 0);
  const paidAmount = Number(formData.get("paidAmount") || 0);
  await db
    .update(budgetItems)
    .set({
      vendorName: String(formData.get("vendorName") || "").trim() || null,
      committedCost: String(committedCost),
      paidAmount: String(paidAmount),
      notes: String(formData.get("notes") || "").trim() || null,
      booked: isFullyPaid(committedCost, paidAmount) ? true : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(budgetItems.id, id), eq(budgetItems.weddingId, wedding.id)));
  revalidatePath("/budget");
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function toggleBudgetItemBooked(id: string, booked: boolean) {
  const wedding = await requireEditWedding();
  const db = getDb();
  await db
    .update(budgetItems)
    .set({ booked, updatedAt: new Date() })
    .where(and(eq(budgetItems.id, id), eq(budgetItems.weddingId, wedding.id)));
  revalidatePath("/budget");
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function deleteBudgetItem(id: string) {
  const wedding = await requireEditWedding();
  const db = getDb();
  await db.delete(budgetItems).where(and(eq(budgetItems.id, id), eq(budgetItems.weddingId, wedding.id)));
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function updateWeddingSettings(formData: FormData) {
  const wedding = await requireEditWedding();
  const db = getDb();

  const weddingDate = String(formData.get("weddingDate") || "") || null;
  const venueName = String(formData.get("venueName") || "").trim() || null;
  const sheetUrl = String(formData.get("sheetUrl") || "").trim();
  const guestsTab = String(formData.get("guestsTab") || "").trim() || null;
  const budgetTab = String(formData.get("budgetTab") || "").trim() || null;

  const googleSheetId = sheetUrl ? extractSheetId(sheetUrl) : null;
  const icalUrl = String(formData.get("icalUrl") || "").trim() || null;
  const reminderEmails = String(formData.get("reminderEmails") || "").trim() || null;
  const reminderDaysBefore = Number(formData.get("reminderDaysBefore") || 3);

  await db
    .update(weddings)
    .set({
      weddingDate,
      venueName,
      googleSheetId,
      googleSheetGuestsTab: guestsTab,
      googleSheetBudgetTab: budgetTab,
      icalUrl,
      reminderEmails,
      reminderDaysBefore,
    })
    .where(eq(weddings.id, wedding.id));

  revalidatePath("/", "layout");
}

export async function syncNow() {
  const wedding = await requireEditWedding();
  const result = await syncWeddingFromGoogleSheet(wedding.id);
  revalidatePath("/guests");
  revalidatePath("/budget");
  revalidatePath("/");
  return result;
}

export async function syncCalendarNow() {
  const wedding = await requireEditWedding();
  const { syncWeddingCalendar } = await import("@/lib/calendar-sync");
  const result = await syncWeddingCalendar(wedding.id);
  revalidatePath("/settings");
  return result;
}

export async function addCalendarEventAsTodo(eventId: string) {
  const wedding = await requireEditWedding();
  const db = getDb();
  const event = await db.query.calendarEvents.findFirst({
    where: and(eq(calendarEvents.id, eventId), eq(calendarEvents.weddingId, wedding.id)),
  });
  if (!event || event.addedAsTodoAt) return;

  await db.insert(todos).values({
    weddingId: wedding.id,
    title: event.title,
    dueDate: new Date(event.startAt).toISOString().slice(0, 10),
  });
  await db.update(calendarEvents).set({ addedAsTodoAt: new Date() }).where(eq(calendarEvents.id, eventId));

  revalidatePath("/todos");
  revalidatePath("/");
}

export async function requestAccess(weddingId: string) {
  const { userId, orgId } = await auth();
  if (!userId) return { ok: false as const, error: "Not signed in." };

  const db = getDb();
  const wedding = await db.query.weddings.findFirst({ where: eq(weddings.id, weddingId) });
  if (!wedding) return { ok: false as const, error: "Wedding not found." };
  if (wedding.clerkOrgId === orgId) return { ok: false as const, error: "You already have access." };

  const user = await currentUser();
  const requesterEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
  const requesterName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  await db
    .insert(accessRequests)
    .values({ weddingId, requesterUserId: userId, requesterEmail, requesterName, status: "pending" })
    .onConflictDoUpdate({
      target: [accessRequests.weddingId, accessRequests.requesterUserId],
      set: { status: "pending", requesterEmail, requesterName, respondedAt: null, createdAt: new Date() },
    });

  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: wedding.clerkOrgId });
  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId: wedding.clerkOrgId,
  });
  // publicUserData.identifier is the member's email for this app's email/password Clerk setup.
  const adminEmails = memberships.data
    .filter((m) => m.role === "org:admin" && m.publicUserData?.identifier)
    .map((m) => m.publicUserData!.identifier);

  if (adminEmails.length > 0) {
    await sendAccessRequestEmail(
      adminEmails,
      requesterName ?? "",
      requesterEmail,
      org.name ? `${org.name}'s wedding` : "a wedding",
      `${getSiteUrl()}/requests`
    );
  }

  revalidatePath(`/join/${weddingId}`);
  return { ok: true as const };
}

export async function approveAccessRequest(requestId: string, role: "viewer" | "editor") {
  const wedding = await requireWedding();
  const { orgRole } = await auth();
  if (orgRole !== "org:admin") return;

  const db = getDb();
  const request = await db.query.accessRequests.findFirst({ where: eq(accessRequests.id, requestId) });
  if (!request || request.weddingId !== wedding.id) return;

  const client = await clerkClient();
  await client.organizations.createOrganizationMembership({
    organizationId: wedding.clerkOrgId,
    userId: request.requesterUserId,
    role: "org:member",
  });

  await db
    .update(accessRequests)
    .set({ status: "approved", role, respondedAt: new Date() })
    .where(eq(accessRequests.id, requestId));
  revalidatePath("/requests");
}

export async function denyAccessRequest(requestId: string) {
  const wedding = await requireWedding();
  const { orgRole } = await auth();
  if (orgRole !== "org:admin") return;

  const db = getDb();
  const request = await db.query.accessRequests.findFirst({ where: eq(accessRequests.id, requestId) });
  if (!request || request.weddingId !== wedding.id) return;

  await db
    .update(accessRequests)
    .set({ status: "denied", respondedAt: new Date() })
    .where(eq(accessRequests.id, requestId));
  revalidatePath("/requests");
}

export async function importSpreadsheet(formData: FormData) {
  const wedding = await requireEditWedding();
  const db = getDb();
  const file = formData.get("file") as File | null;
  const kind = String(formData.get("kind") || "guests");
  const sheetName = String(formData.get("sheetName") || "").trim() || null;

  if (!file || file.size === 0) {
    return { ok: false as const, error: "Choose a file first." };
  }

  const XLSX = await import("xlsx");
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const targetSheet = sheetName && workbook.SheetNames.includes(sheetName)
    ? sheetName
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheet];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  if (kind === "guests") {
    const { parseGuestRows } = await import("@/lib/sheet-parse");
    const parsed = parseGuestRows(rows);
    for (const g of parsed) {
      await db.insert(guests).values({
        weddingId: wedding.id,
        householdName: g.householdName,
        partySize: g.partySize,
        groupName: g.groupName,
        notes: g.notes,
        source: "import",
      });
    }
    revalidatePath("/guests");
    revalidatePath("/");
    return { ok: true as const, count: parsed.length, sheetName: targetSheet };
  } else {
    const { parseBudgetRows } = await import("@/lib/sheet-parse");
    const parsed = parseBudgetRows(rows);
    for (const b of parsed) {
      await db.insert(budgetItems).values({
        weddingId: wedding.id,
        category: b.category,
        itemName: b.itemName,
        vendorName: b.vendorName,
        contactName: b.contactName,
        contactPhone: b.contactPhone,
        committedCost: String(b.committedCost),
        paidAmount: String(b.paidAmount),
        booked: isFullyPaid(b.committedCost, b.paidAmount),
        notes: b.notes,
        source: "import",
      });
    }
    revalidatePath("/budget");
    revalidatePath("/");
    return { ok: true as const, count: parsed.length, sheetName: targetSheet };
  }
}
