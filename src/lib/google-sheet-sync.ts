import Papa from "papaparse";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { guests, budgetItems, weddings } from "@/db/schema";
import { parseGuestRows, parseBudgetRows } from "@/lib/sheet-parse";
import { isFullyPaid } from "@/lib/budget";

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
      // Upsert on the (weddingId, externalRowKey) unique index so a row is
      // matched to its existing record atomically — no separate
      // lookup-then-insert/update race, and no chance of a key-format
      // change silently re-inserting rows that already exist.
      await db
        .insert(guests)
        .values({
          weddingId,
          householdName: g.householdName,
          partySize: g.partySize,
          groupName: g.groupName,
          notes: g.notes,
          source: "sheet_sync",
          externalRowKey: g.rowKey,
        })
        .onConflictDoUpdate({
          target: [guests.weddingId, guests.externalRowKey],
          set: {
            householdName: g.householdName,
            partySize: g.partySize,
            groupName: g.groupName,
            notes: g.notes,
            updatedAt: new Date(),
          },
        });
      guestsSynced++;
    }

    // Rows removed or renamed in the sheet since the last sync leave a
    // stale record behind under the old key (a rename produces a new key,
    // orphaning the old one) — prune anything sheet-sourced that the
    // current sheet no longer accounts for. Manually-added/imported rows
    // (different `source`) are untouched. Skip if the sheet came back
    // empty so a transient fetch hiccup can't wipe out real data.
    const guestKeys = parsed.map((g) => g.rowKey);
    if (guestKeys.length > 0) {
      await db
        .delete(guests)
        .where(
          and(eq(guests.weddingId, weddingId), eq(guests.source, "sheet_sync"), notInArray(guests.externalRowKey, guestKeys))
        );
    }
  }

  if (wedding.googleSheetBudgetTab) {
    const rows = await fetchSheetCsv(wedding.googleSheetId, wedding.googleSheetBudgetTab);
    const parsed = parseBudgetRows(rows);
    for (const b of parsed) {
      // Only auto-mark booked once the item is fully paid off. Never
      // auto-unbook something that was already booked (e.g. manually).
      const autoBooked = isFullyPaid(b.committedCost, b.paidAmount);
      await db
        .insert(budgetItems)
        .values({
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
        })
        .onConflictDoUpdate({
          target: [budgetItems.weddingId, budgetItems.externalRowKey],
          set: {
            category: b.category,
            itemName: b.itemName,
            vendorName: b.vendorName,
            contactName: b.contactName,
            contactPhone: b.contactPhone,
            committedCost: String(b.committedCost),
            paidAmount: String(b.paidAmount),
            // Reference the pre-conflict row's own `booked` column so an
            // existing true never flips back to false.
            booked: sql`${budgetItems.booked} OR ${autoBooked}`,
            notes: b.notes,
            updatedAt: new Date(),
          },
        });
      budgetSynced++;
    }

    const budgetKeys = parsed.map((b) => b.rowKey);
    if (budgetKeys.length > 0) {
      await db
        .delete(budgetItems)
        .where(
          and(
            eq(budgetItems.weddingId, weddingId),
            eq(budgetItems.source, "sheet_sync"),
            notInArray(budgetItems.externalRowKey, budgetKeys)
          )
        );
    }
  }

  await db.update(weddings).set({ lastSyncedAt: new Date() }).where(eq(weddings.id, weddingId));

  return { guestsSynced, budgetSynced };
}
