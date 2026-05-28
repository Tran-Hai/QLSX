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
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;
  if (!TABLE_WHITELIST.includes(table as TableName)) {
    return Response.json({ error: "Invalid table" }, { status: 400 });
  }
  const key = TABLE_KEY_MAP[table] || table;
  const tbl: AnyTable = schema[key as keyof typeof schema];
  const rows: any[] = await getDb().select().from(tbl).where(eq(tbl.id, id));
  if (!rows.length) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(rows[0]);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;
  if (!TABLE_WHITELIST.includes(table as TableName)) {
    return Response.json({ error: "Invalid table" }, { status: 400 });
  }
  const body = await req.json();
  const key = TABLE_KEY_MAP[table] || table;
  const tbl: AnyTable = schema[key as keyof typeof schema];
  const d = getDb();
  const result: any = await d.update(tbl).set(body).where(eq(tbl.id, id)).returning();
  if (!result.length) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(result[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;
  if (!TABLE_WHITELIST.includes(table as TableName)) {
    return Response.json({ error: "Invalid table" }, { status: 400 });
  }
  const key = TABLE_KEY_MAP[table] || table;
  const tbl: AnyTable = schema[key as keyof typeof schema];
  await getDb().delete(tbl).where(eq(tbl.id, id));
  return Response.json({ success: true });
}
