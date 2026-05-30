CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text DEFAULT '' NOT NULL,
	"project_name" text DEFAULT '' NOT NULL,
	"item_id" text DEFAULT '' NOT NULL,
	"item_name" text DEFAULT '' NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"supplier" text DEFAULT '' NOT NULL,
	"total_qty" real DEFAULT 0 NOT NULL,
	"delivered_qty" real DEFAULT 0 NOT NULL,
	"expected_date" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'cho_bao_gia' NOT NULL,
	"created_at" text DEFAULT '' NOT NULL
);
