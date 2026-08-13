import { isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { weddings } from "@/db/schema";
import { syncWeddingCalendar } from "@/lib/calendar-sync";
import { sendDueReminders } from "@/lib/reminders";

export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = getDb();
  const withCalendars = await db.query.weddings.findMany({
    where: isNotNull(weddings.icalUrl),
  });

  const calendarResults = await Promise.allSettled(
    withCalendars.map((w) => syncWeddingCalendar(w.id))
  );

  const reminderResult = await sendDueReminders();

  return Response.json({
    calendarsSynced: calendarResults.filter((r) => r.status === "fulfilled").length,
    calendarErrors: calendarResults.filter((r) => r.status === "rejected").length,
    ...reminderResult,
  });
}
