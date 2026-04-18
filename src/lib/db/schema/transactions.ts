import {
  pgTable, uuid, text, boolean, timestamp, date, numeric, integer, index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { groups } from "./groups";
import { categories } from "./categories";
import { paymentMethods } from "./payment-methods";
import { banks } from "./banks";

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id),

    date: date("date").notNull(),
    type: text("type").notNull(), // 'income' | 'expense'
    categoryId: uuid("category_id").references(() => categories.id),
    description: text("description").notNull(),
    value: numeric("value", { precision: 14, scale: 2 }).notNull(),

    paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
    bankId: uuid("bank_id").references(() => banks.id),

    // Installments
    installmentGroupId: uuid("installment_group_id"),
    installmentCurrent: integer("installment_current"),
    installmentTotal: integer("installment_total"),
    installmentValue: numeric("installment_value", { precision: 14, scale: 2 }),

    isPaid: boolean("is_paid").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    isFixed: boolean("is_fixed").notNull().default(false),
    recurrenceGroupId: uuid("recurrence_group_id"),

    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    groupDateIdx: index("idx_transactions_group_date").on(table.groupId, table.date),
    userDateIdx: index("idx_transactions_user_date").on(table.userId, table.date),
    installmentIdx: index("idx_transactions_installment").on(table.installmentGroupId),
    categoryIdx: index("idx_transactions_category").on(table.categoryId),
    paymentIdx: index("idx_transactions_payment").on(table.paymentMethodId),
  }),
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
