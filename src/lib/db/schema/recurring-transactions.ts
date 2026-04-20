import {
  pgTable, uuid, text, boolean, timestamp, date, numeric, index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { groups } from "./groups";
import { categories } from "./categories";
import { paymentMethods } from "./payment-methods";
import { banks } from "./banks";

/**
 * A recurring transaction template. Materialization happens in
 * `/api/recurring/materialize` which generates concrete rows in the
 * `transactions` table for every due occurrence up to today.
 *
 * Use this for truly recurring entries (salário, aluguel, streaming) where
 * the number of occurrences is unknown. Installments (N fixed parcels)
 * keep their upfront-generated model.
 */
export const recurringTransactions = pgTable(
  "recurring_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id),

    // Template fields (copied into each materialized transaction)
    type: text("type").notNull(), // 'income' | 'expense'
    categoryId: uuid("category_id").references(() => categories.id),
    description: text("description").notNull(),
    value: numeric("value", { precision: 14, scale: 2 }).notNull(),
    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
    bankId: uuid("bank_id").references(() => banks.id),
    notes: text("notes"),

    // Recurrence rule
    frequency: text("frequency").notNull(), // 'monthly' | 'weekly' | 'yearly'
    dayOfMonth: text("day_of_month"), // 1-31 or 'last' for monthly
    startDate: date("start_date").notNull(),
    endDate: date("end_date"), // null = indefinite

    // Scheduling state
    lastGeneratedDate: date("last_generated_date"), // inclusive
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userActiveIdx: index("idx_recurring_user_active").on(table.userId, table.isActive),
    groupActiveIdx: index("idx_recurring_group_active").on(table.groupId, table.isActive),
  }),
);

export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type NewRecurringTransaction = typeof recurringTransactions.$inferInsert;
