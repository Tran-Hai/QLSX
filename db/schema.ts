import { pgTable, text, real, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  location: text("location").notNull().default(""),
  prodTargets: jsonb("prod_targets").notNull().default("{}"),
  instCfg: jsonb("inst_cfg").notNull().default("{}"),
  personnel: jsonb("personnel").notNull().default("{}"),
  sxDeadlines: jsonb("sx_deadlines").notNull().default("{}"),
  ldDeadlines: jsonb("ld_deadlines").notNull().default("{}"),
  prodBatches: jsonb("prod_batches").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(""),
});

export const prodLogs = pgTable("prod_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull().default(""),
  projectId: text("project_id").notNull().default(""),
  projectName: text("project_name").notNull().default(""),
  itemId: text("item_id").notNull().default(""),
  itemName: text("item_name").notNull().default(""),
  unit: text("unit").notNull().default(""),
  qty: real("qty").notNull().default(0),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
});

export const instLogs = pgTable("inst_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull().default(""),
  projectId: text("project_id").notNull().default(""),
  projectName: text("project_name").notNull().default(""),
  itemId: text("item_id").notNull().default(""),
  itemName: text("item_name").notNull().default(""),
  unit: text("unit").notNull().default(""),
  qty: real("qty").notNull().default(0),
  note: text("note").notNull().default(""),
  techStatus: text("tech_status").default(""),
  techNote: text("tech_note").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
});

export const khoEntries = pgTable("kho_entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull().default(""),
  projectId: text("project_id").notNull().default(""),
  itemId: text("item_id").notNull().default(""),
  qty: real("qty").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default("kt"),
  phone: text("phone").notNull().default(""),
  note: text("note").notNull().default(""),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  typeId: text("type_id").notNull().default("khac"),
  name: text("name").notNull().default(""),
  dept: text("dept").notNull().default("ql"),
  icon: text("icon").notNull().default("📌"),
  projectId: text("project_id").notNull().default(""),
  projectName: text("project_name").notNull().default(""),
  assignedTo: text("assigned_to").notNull().default(""),
  assignedName: text("assigned_name").notNull().default(""),
  dueDate: text("due_date").notNull().default(""),
  priority: text("priority").notNull().default("normal"),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("todo"),
  completedDate: text("completed_date").default(""),
  createdAt: text("created_at").notNull().default(""),
});

export const congNhat = pgTable("cong_nhat", {
  id: text("id").primaryKey(),
  date: text("date").notNull().default(""),
  projectId: text("project_id").notNull().default(""),
  projectName: text("project_name").notNull().default(""),
  description: text("description").notNull().default(""),
  workers: real("workers").notNull().default(0),
  hours: real("hours").notNull().default(8),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
});

export const leaves = pgTable("leaves", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().default(""),
  staffName: text("staff_name").notNull().default(""),
  date: text("date").notNull().default(""),
  reason: text("reason").notNull().default(""),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(""),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default(sql`'{}'::jsonb`),
  updatedAt: text("updated_at").notNull().default(""),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().default(""),
  projectName: text("project_name").notNull().default(""),
  itemId: text("item_id").notNull().default(""),
  itemName: text("item_name").notNull().default(""),
  unit: text("unit").notNull().default(""),
  supplier: text("supplier").notNull().default(""),
  totalQty: real("total_qty").notNull().default(0),
  deliveredQty: real("delivered_qty").notNull().default(0),
  expectedDate: text("expected_date").notNull().default(""),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("cho_bao_gia"),
  createdAt: text("created_at").notNull().default(""),
});

export const activityLogs = pgTable("activity_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull().default(""),
  time: text("time").notNull().default(""),
  projectId: text("project_id").notNull().default(""),
  projectName: text("project_name").notNull().default(""),
  itemId: text("item_id").notNull().default(""),
  itemName: text("item_name").notNull().default(""),
  unit: text("unit").notNull().default(""),
  qty: real("qty").notNull().default(0),
  action: text("action").notNull().default(""),
  actionLabel: text("action_label").notNull().default(""),
  actorName: text("actor_name").notNull().default(""),
  actorRole: text("actor_role").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
});
