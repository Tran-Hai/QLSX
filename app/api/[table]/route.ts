import { db } from "@/db";
import * as schema from "@/db/schema";
import { TABLE_WHITELIST, TABLE_KEY_MAP, TableName } from "@/lib/constants";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type AnyTable = any;

function getDb() {
  if (!db) throw new Error("DATABASE_URL not configured");
  return db;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    if (!TABLE_WHITELIST.includes(table as TableName)) {
      return Response.json({ error: "Invalid table" }, { status: 400 });
    }
    const key = TABLE_KEY_MAP[table] || table;
    const tbl: AnyTable = schema[key as keyof typeof schema];
    if (!tbl) {
      return Response.json({ error: "Invalid table schema" }, { status: 400 });
    }
    const d = getDb();
    const rows = await d.select().from(tbl);
    return Response.json(rows);
  } catch (err: any) {
    return Response.json({ error: err?.message || "Database error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    if (!TABLE_WHITELIST.includes(table as TableName)) {
      return Response.json({ error: "Invalid table" }, { status: 400 });
    }
    const body = await req.json();
    const key = TABLE_KEY_MAP[table] || table;
    const tbl: AnyTable = schema[key as keyof typeof schema];
    if (!tbl) {
      return Response.json({ error: "Invalid table schema" }, { status: 400 });
    }
    const d = getDb();
    const existing: any[] = body.id
      ? await d.select().from(tbl).where(eq(tbl.id, body.id))
      : [];
    if (existing.length > 0) {
      const result: any = await d.update(tbl).set(body).where(eq(tbl.id, body.id)).returning();
      return Response.json(result[0]);
    }
    const result: any = await d.insert(tbl).values(body).returning();
    return Response.json(result[0]);
  } catch (err: any) {
    return Response.json({ error: err?.message || "Database error" }, { status: 500 });
  }
}
