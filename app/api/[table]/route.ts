import { db } from "@/db";
import * as schema from "@/db/schema";
import { TABLE_WHITELIST, TableName } from "@/lib/constants";
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
  const { table } = await params;
  if (!TABLE_WHITELIST.includes(table as TableName)) {
    return Response.json({ error: "Invalid table" }, { status: 400 });
  }
  const tbl: AnyTable = schema[table as keyof typeof schema];
  const rows = await getDb().select().from(tbl);
  return Response.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  if (!TABLE_WHITELIST.includes(table as TableName)) {
    return Response.json({ error: "Invalid table" }, { status: 400 });
  }
  const body = await req.json();
  const tbl: AnyTable = schema[table as keyof typeof schema];
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
}
