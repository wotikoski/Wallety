import { pgTable, uuid, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { groups } from "./groups";

export const monthlyBudgets = pgTable("monthly_budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  plannedIncome: numeric("planned_income", { precision: 14, scale: 2 }).notNull().default("0"),
  plannedFixedExpenses: numeric("planned_fixed_expenses", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MonthlyBudget = typeof monthlyBudgets.$inferSelect;
export type NewMonthlyBudget = typeof monthlyBudgets.$inferInsert;
