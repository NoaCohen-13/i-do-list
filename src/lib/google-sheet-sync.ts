import Papa from "papaparse";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { guests, budgetItems, weddings } from "@/db/schema";
import { parseGuestRows, parseBudgetRows } from "@/lib/sheet-parse";

export function extractSheetId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

async function fetchSheetCsv(sheetId: string, tabName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    tabName
  )}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Couldn't read tab "${tabName}" — make sure the sheet is shared as "Anyone with the link can view".`
    );
  }
  const text = await res.text();
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: false });
  return parsed.data as string[][];
}

export async function syncWeddingFromGoogleSheet(weddingId: string) {
  const db = getDb();
  const wedding = await db.query.weddings.findFirst({ where: eq(weddings.id, weddingId) });
  if (!wedding?.googleSheetId) {
    throw new Error("No Google Sheet connected yet.");
  }

  let guestsSynced = 0;
  let budgetSynced = 0;

  if (wedding.googleSheetGuestsTab) {
    const rows = await fetchSheetCsv(wedding.googleSheetId, wedding.googleSheetGuestsTab);
    const parsed = parseGuestRows(rows);
    for (const g of parsed) {
      const existing = await db.query.guests.findFirst({
        where: and(eq(guests.weddingId, weddingId), eq(guests.externalRowKey, g.rowKey)),
      });
      if (existing) {
        await db
          .update(guests)
          .set({
            householdName: g.householdName,
            partySize: g.partySize,
            groupName: g.groupName,
            notes: g.notes,
            updatedAt: new Date(),
          })
          .where(eq(guests.id, existing.id));
      } else {
        await db.insert(guests).values({
          weddingId,
          householdName: g.householdName,
          partySize: g.partySize,
          groupName: g.groupName,
          notes: g.notes,
          source: "sheet_sync",
          externalRowKey: g.rowKey,
        });
      }
      guestsSynced++;
    }
  }

  if (wedding.googleSheetBudgetTab) {
    const rows = await fetchSheetCsv(wedding.googleSheetId, wedding.googleSheetBudgetTab);
    const parsed = parseBudgetRows(rows);
    for (const b of parsed) {
      const existing = await db.query.budgetItems.findFirst({
        where: and(eq(budgetItems.weddingId, weddingId), eq(budgetItems.externalRowKey, b.rowKey)),
      });
      // Any payment at all (even just a deposit) means the vendor is
      // secured — auto-mark it booked. Never auto-unbook something that
      // was already booked (e.g. manually, or paid then refunded on paper).
      const autoBooked = b.paidAmount > 0;
      if (existing) {
        await db
          .update(budgetItems)
          .set({
            category: b.category,
            itemName: b.itemName,
            vendorName: b.vendorName,
            contactName: b.contactName,
            contactPhone: b.contactPhone,
            committedCost: String(b.committedCost),
            paidAmount: String(b.paidAmount),
            booked: existing.booked || autoBooked,
            notes: b.notes,
            updatedAt: new Date(),
          })
          .where(eq(budgetItems.id, existing.id));
      } else {
        await db.insert(budgetItems).values({
          weddingId,
          category: b.category,
          itemName: b.itemName,
          vendorName: b.vendorName,
          contactName: b.contactName,
          contactPhone: b.contactPhone,
          committedCost: String(b.committedCost),
          paidAmount: String(b.paidAmount),
          booked: autoBooked,
          notes: b.notes,
          source: "sheet_sync",
          externalRowKey: b.rowKey,
        });
      }
      budgetSynced++;
    }
  }

  await db.update(weddings).set({ lastSyncedAt: new Date() }).where(eq(weddings.id, weddingId));

  return { guestsSynced, budgetSynced };
}
