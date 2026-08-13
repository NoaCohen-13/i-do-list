import { and, eq, isNull, isNotNull, lte, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { weddings, todos, calendarEvents } from "@/db/schema";
import { sendReminderEmail } from "@/lib/send-email";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export async function sendDueReminders() {
  const db = getDb();
  const activeWeddings = await db.query.weddings.findMany({
    where: isNotNull(weddings.reminderEmails),
  });

  let todoReminders = 0;
  let eventReminders = 0;

  for (const wedding of activeWeddings) {
    const to = (wedding.reminderEmails ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (to.length === 0) continue;

    const horizon = new Date();
    horizon.setDate(horizon.getDate() + wedding.reminderDaysBefore);
    const horizonDateStr = horizon.toISOString().slice(0, 10);

    const dueTodos = await db.query.todos.findMany({
      where: and(
        eq(todos.weddingId, wedding.id),
        eq(todos.done, false),
        isNotNull(todos.dueDate),
        lte(todos.dueDate, horizonDateStr),
        isNull(todos.reminderSentAt)
      ),
    });

    for (const t of dueTodos) {
      try {
        await sendReminderEmail(
          to,
          `Reminder: ${t.title}`,
          `<p><strong>${t.title}</strong> is due ${t.dueDate}.</p>${
            t.category ? `<p>Category: ${t.category}</p>` : ""
          }<p>— I Do List</p>`
        );
        await db.update(todos).set({ reminderSentAt: new Date() }).where(eq(todos.id, t.id));
        todoReminders++;
      } catch (err) {
        console.error(`Failed to send reminder for todo ${t.id}:`, err);
      }
    }

    const now = new Date();
    const dueEvents = await db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.weddingId, wedding.id),
        gte(calendarEvents.startAt, now),
        lte(calendarEvents.startAt, horizon),
        isNull(calendarEvents.reminderSentAt)
      ),
    });

    for (const e of dueEvents) {
      try {
        await sendReminderEmail(
          to,
          `Upcoming: ${e.title}`,
          `<p><strong>${e.title}</strong> is coming up on ${formatDate(new Date(e.startAt))}.</p>${
            e.location ? `<p>Location: ${e.location}</p>` : ""
          }${e.notes ? `<p>${e.notes}</p>` : ""}<p>— I Do List</p>`
        );
        await db
          .update(calendarEvents)
          .set({ reminderSentAt: new Date() })
          .where(eq(calendarEvents.id, e.id));
        eventReminders++;
      } catch (err) {
        console.error(`Failed to send reminder for event ${e.id}:`, err);
      }
    }
  }

  return { todoReminders, eventReminders };
}
