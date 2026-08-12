"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { todos, guests, budgetItems, weddings } from "@/db/schema";
import { requireWedding } from "@/lib/wedding";
import { extractSheetId, syncWeddingFromGoogleSheet } from "@/lib/google-sheet-sync";

export async function toggleTodo(id: string, done: boolean) {
  const wedding = await requireWedding();
  const db = getDb();
  await db
    .update(todos)
    .set({ done, updatedAt: new Date() })
    .where(and(eq(todos.id, id), eq(todos.weddingId, wedding.id)));
  revalidatePath("/");
  revalidatePath("/todos");
}

export async function createTodo(formData: FormData) {
  const wedding = await requireWedding();
  const db = getDb();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await db.insert(todos).values({
    weddingId: wedding.id,
    title,
    phase: String(formData.get("phase") || "") || null,
    category: String(formData.get("category") || "") || null,
  });
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function deleteTodo(id: string) {
  const wedding = await requireWedding();
  const db = getDb();
  await db.delete(todos).where(and(eq(todos.id, id), eq(todos.weddingId, wedding.id)));
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function createGuest(formData: FormData) {
  const wedding = await requireWedding();
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
  const wedding = await requireWedding();
  const db = getDb();
  await db
    .update(guests)
    .set({ rsvpStatus, updatedAt: new Date() })
    .where(and(eq(guests.id, id), eq(guests.weddingId, wedding.id)));
  revalidatePath("/guests");
  revalidatePath("/");
}

export async function deleteGuest(id: string) {
  const wedding = await requireWedding();
  const db = getDb();
  await db.delete(guests).where(and(eq(guests.id, id), eq(guests.weddingId, wedding.id)));
  revalidatePath("/guests");
  revalidatePath("/");
}

export async function createBudgetItem(formData: FormData) {
  const wedding = await requireWedding();
  const db = getDb();
  const itemName = String(formData.get("itemName") || "").trim();
  if (!itemName) return;
  await db.insert(budgetItems).values({
    weddingId: wedding.id,
    category: String(formData.get("category") || "Other"),
    itemName,
    vendorName: String(formData.get("vendorName") || "") || null,
    committedCost: String(formData.get("committedCost") || "0"),
    paidAmount: String(formData.get("paidAmount") || "0"),
  });
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function deleteBudgetItem(id: string) {
  const wedding = await requireWedding();
  const db = getDb();
  await db.delete(budgetItems).where(and(eq(budgetItems.id, id), eq(budgetItems.weddingId, wedding.id)));
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function updateWeddingSettings(formData: FormData) {
  const wedding = await requireWedding();
  const db = getDb();

  const weddingDate = String(formData.get("weddingDate") || "") || null;
  const venueName = String(formData.get("venueName") || "").trim() || null;
  const sheetUrl = String(formData.get("sheetUrl") || "").trim();
  const guestsTab = String(formData.get("guestsTab") || "").trim() || null;
  const budgetTab = String(formData.get("budgetTab") || "").trim() || null;

  const googleSheetId = sheetUrl ? extractSheetId(sheetUrl) : null;

  await db
    .update(weddings)
    .set({
      weddingDate,
      venueName,
      googleSheetId,
      googleSheetGuestsTab: guestsTab,
      googleSheetBudgetTab: budgetTab,
    })
    .where(eq(weddings.id, wedding.id));

  revalidatePath("/", "layout");
}

export async function syncNow() {
  const wedding = await requireWedding();
  const result = await syncWeddingFromGoogleSheet(wedding.id);
  revalidatePath("/guests");
  revalidatePath("/budget");
  revalidatePath("/");
  return result;
}
