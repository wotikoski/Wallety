import { pgTable, uuid, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { groups } from "./groups";
import { banks } from "./banks";

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  // 'bank_account' | 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'other'
  type: text("type").notNull(),
  bankId: uuid("bank_id").references(() => banks.id),
  // Credit card invoice info: only meaningful when type === 'credit_card'.
  closingDay: integer("closing_day"), // 1-31, day of month the invoice closes
  dueDay: integer("due_day"),          // 1-31, day of month the invoice is due
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
