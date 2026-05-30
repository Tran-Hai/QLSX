import { db } from "@/db";
import * as schema from "@/db/schema";

function getDb() {
  if (!db) throw new Error("DATABASE_URL not configured");
  return db;
}

export async function GET() {
  try {
    const d = getDb();
    const [p, pl, il, ke, s, t, cn, l] = await Promise.all([
      d.select().from(schema.projects),
      d.select().from(schema.prodLogs),
      d.select().from(schema.instLogs),
      d.select().from(schema.khoEntries),
      d.select().from(schema.staff),
      d.select().from(schema.tasks),
      d.select().from(schema.congNhat),
      d.select().from(schema.leaves),
    ]);
    return Response.json({
      projects: p.length,
      prodLogs: pl.length,
      instLogs: il.length,
      khoEntries: ke.length,
      staff: s.length,
      tasks: t.length,
      congNhat: cn.length,
      leaves: l.length,
    });
  } catch (err: any) {
    return Response.json({ error: err?.message || "Database error" }, { status: 500 });
  }
}
