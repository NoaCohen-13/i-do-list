import ical from "node-ical";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { calendarEvents, weddings } from "@/db/schema";

// node-ical fields can come back as a plain string or as
// { val, params } when the ICS property carries parameters (e.g. TZID).
function textValue(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "val" in v) return String((v as { val: unknown }).val);
  return String(v);
}

export async function syncWeddingCalendar(weddingId: string) {
  const db = getDb();
  const wedding = await db.query.weddings.findFirst({ where: eq(weddings.id, weddingId) });
  if (!wedding?.icalUrl) {
    throw new Error("No calendar connected yet.");
  }

  const res = await fetch(wedding.icalUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Couldn't read the calendar — check the iCal link is still valid.");
  }
  const text = await res.text();
  const parsed = ical.sync.parseICS(text);

  const now = Date.now();
  const oneYearOut = now + 365 * 86400000;
  let synced = 0;

  for (const key in parsed) {
    const component = parsed[key];
    if (!component || component.type !== "VEVENT") continue;
    const event = component;
    if (!event.start) continue;

    const startAt = new Date(event.start as Date);
    // Only keep upcoming events within a year — no point caching the past
    // or the distant future.
    if (startAt.getTime() < now - 86400000 || startAt.getTime() > oneYearOut) continue;

    const uid = event.uid ?? key;
    const existing = await db.query.calendarEvents.findFirst({
      where: and(eq(calendarEvents.weddingId, weddingId), eq(calendarEvents.uid, uid)),
    });

    const values = {
      title: textValue(event.summary) ?? "Untitled event",
      startAt,
      location: textValue(event.location) ?? null,
      notes: textValue(event.description) ?? null,
    };

    if (existing) {
      await db
        .update(calendarEvents)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(calendarEvents.id, existing.id));
    } else {
      await db.insert(calendarEvents).values({ weddingId, uid, ...values });
    }
    synced++;
  }

  await db.update(weddings).set({ lastCalendarSyncedAt: new Date() }).where(eq(weddings.id, weddingId));

  return { eventsSynced: synced };
}
