import { pgTable, uuid, integer, numeric, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { groups } from "./groups";
import { categories } from "./categories";

/**
 * Monthly spending budget for a single category.
 * One row per (user|group, category, year, month).
 */
export const categoryBudgets = pgTable(
  "category_budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id),
    categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqUserCat: uniqueIndex("uniq_category_budget_user").on(
      table.userId,
      table.categoryId,
      table.year,
      table.month,
    ),
  }),
);

export type CategoryBudget = typeof categoryBudgets.$inferSelect;
export type NewCategoryBudget = typeof categoryBudgets.$inferInsert;
