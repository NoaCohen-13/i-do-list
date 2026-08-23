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
  uniqueIndex,
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

export const accessRequestStatusEnum = pgEnum("access_request_status", [
  "pending",
  "approved",
  "denied",
]);

export const accessRoleEnum = pgEnum("access_role", ["viewer", "editor"]);

export const weddings = pgTable("weddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: text("clerk_org_id").notNull().unique(),
  weddingDate: date("wedding_date"),
  venueName: text("venue_name"),
  googleSheetId: text("google_sheet_id"),
  googleSheetGuestsTab: text("google_sheet_guests_tab"),
  googleSheetBudgetTab: text("google_sheet_budget_tab"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  icalUrl: text("ical_url"),
  lastCalendarSyncedAt: timestamp("last_calendar_synced_at", { withTimezone: true }),
  reminderEmails: text("reminder_emails"),
  reminderDaysBefore: integer("reminder_days_before").notNull().default(3),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const guests = pgTable(
  "guests",
  {
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
  },
  (table) => [
    // Lets sync upsert on conflict instead of check-then-insert, so a
    // sheet row can never be inserted twice under the same key.
    uniqueIndex("guests_wedding_external_row_key_idx").on(table.weddingId, table.externalRowKey),
  ]
);

export const budgetItems = pgTable(
  "budget_items",
  {
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
    booked: boolean("booked").notNull().default(false),
    notes: text("notes"),
    source: recordSourceEnum("source").notNull().default("manual"),
    externalRowKey: text("external_row_key"),
    sortOrder: integer("sort_order"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("budget_items_wedding_external_row_key_idx").on(table.weddingId, table.externalRowKey),
  ]
);

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
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  finalReminderSentAt: timestamp("final_reminder_sent_at", { withTimezone: true }),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accessRequests = pgTable(
  "access_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weddingId: uuid("wedding_id")
      .notNull()
      .references(() => weddings.id, { onDelete: "cascade" }),
    requesterUserId: text("requester_user_id").notNull(),
    requesterEmail: text("requester_email").notNull(),
    requesterName: text("requester_name"),
    status: accessRequestStatusEnum("status").notNull().default("pending"),
    role: accessRoleEnum("role"), // null while pending; set by the owner on approval
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    // Re-requesting after a denial reuses the same row instead of piling up duplicates.
    uniqueIndex("access_requests_wedding_requester_idx").on(table.weddingId, table.requesterUserId),
  ]
);

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  weddingId: uuid("wedding_id")
    .notNull()
    .references(() => weddings.id, { onDelete: "cascade" }),
  uid: text("uid").notNull(),
  title: text("title").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  location: text("location"),
  notes: text("notes"),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  finalReminderSentAt: timestamp("final_reminder_sent_at", { withTimezone: true }),
  addedAsTodoAt: timestamp("added_as_todo_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
