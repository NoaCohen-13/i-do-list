import { isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { weddings } from "@/db/schema";
import { syncWeddingFromGoogleSheet } from "@/lib/google-sheet-sync";

export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = getDb();
  const connected = await db.query.weddings.findMany({
    where: isNotNull(weddings.googleSheetId),
  });

  const results = await Promise.allSettled(
    connected.map((w) => syncWeddingFromGoogleSheet(w.id))
  );

  const summary = results.map((r, i) => ({
    weddingId: connected[i].id,
    ok: r.status === "fulfilled",
    ...(r.status === "fulfilled" ? r.value : { error: String(r.reason) }),
  }));

  return Response.json({ synced: summary.length, results: summary });
}
