import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",
  "confirmed",
  "declined",
]);

export const recordSourceEnum = pgEnum("record_source", [
  "manual",
  "sheet_sync",
  "import",
]);

export const weddings = pgTable("weddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: text("clerk_org_id").notNull().unique(),
  weddingDate: date("wedding_date"),
  venueName: text("venue_name"),
  googleSheetId: text("google_sheet_id"),
  googleSheetGuestsTab: text("google_sheet_guests_tab"),
  googleSheetBudgetTab: text("google_sheet_budget_tab"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  weddingId: uuid("wedding_id")
    .notNull()
    .references(() => weddings.id, { onDelete: "cascade" }),
  householdName: text("household_name").notNull(),
  partySize: integer("party_size").notNull().default(1),
  groupName: text("group_name"),
  notes: text("notes"),
  rsvpStatus: rsvpStatusEnum("rsvp_status").notNull().default("pending"),
  mealChoice: text("meal_choice"),
  tableNumber: text("table_number"),
  source: recordSourceEnum("source").notNull().default("manual"),
  externalRowKey: text("external_row_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const budgetItems = pgTable("budget_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  weddingId: uuid("wedding_id")
    .notNull()
    .references(() => weddings.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  itemName: text("item_name").notNull(),
  vendorName: text("vendor_name"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  committedCost: numeric("committed_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  source: recordSourceEnum("source").notNull().default("manual"),
  externalRowKey: text("external_row_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const todos = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),
  weddingId: uuid("wedding_id")
    .notNull()
    .references(() => weddings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  phase: text("phase"),
  category: text("category"),
  done: boolean("done").notNull().default(false),
  assignee: text("assignee"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
