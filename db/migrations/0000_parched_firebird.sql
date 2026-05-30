CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"time" text DEFAULT '' NOT NULL,
	"project_id" text DEFAULT '' NOT NULL,
	"project_name" text DEFAULT '' NOT NULL,
	"item_id" text DEFAULT '' NOT NULL,
	"item_name" text DEFAULT '' NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"qty" real DEFAULT 0 NOT NULL,
	"action" text DEFAULT '' NOT NULL,
	"action_label" text DEFAULT '' NOT NULL,
	"actor_name" text DEFAULT '' NOT NULL,
	"actor_role" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cong_nhat" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"project_id" text DEFAULT '' NOT NULL,
	"project_name" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"workers" real DEFAULT 0 NOT NULL,
	"hours" real DEFAULT 8 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inst_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"project_id" text DEFAULT '' NOT NULL,
	"project_name" text DEFAULT '' NOT NULL,
	"item_id" text DEFAULT '' NOT NULL,
	"item_name" text DEFAULT '' NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"qty" real DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"tech_status" text DEFAULT '',
	"tech_note" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kho_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"project_id" text DEFAULT '' NOT NULL,
	"item_id" text DEFAULT '' NOT NULL,
	"qty" real DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaves" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text DEFAULT '' NOT NULL,
	"staff_name" text DEFAULT '' NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prod_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"project_id" text DEFAULT '' NOT NULL,
	"project_name" text DEFAULT '' NOT NULL,
	"item_id" text DEFAULT '' NOT NULL,
	"item_name" text DEFAULT '' NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"qty" real DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"prod_targets" jsonb DEFAULT '{}' NOT NULL,
	"inst_cfg" jsonb DEFAULT '{}' NOT NULL,
	"personnel" jsonb DEFAULT '{}' NOT NULL,
	"sx_deadlines" jsonb DEFAULT '{}' NOT NULL,
	"ld_deadlines" jsonb DEFAULT '{}' NOT NULL,
	"prod_batches" jsonb DEFAULT '{}' NOT NULL,
	"created_at" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'kt' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"type_id" text DEFAULT 'khac' NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"dept" text DEFAULT 'ql' NOT NULL,
	"icon" text DEFAULT '📌' NOT NULL,
	"project_id" text DEFAULT '' NOT NULL,
	"project_name" text DEFAULT '' NOT NULL,
	"assigned_to" text DEFAULT '' NOT NULL,
	"assigned_name" text DEFAULT '' NOT NULL,
	"due_date" text DEFAULT '' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"completed_date" text DEFAULT '',
	"created_at" text DEFAULT '' NOT NULL
);
