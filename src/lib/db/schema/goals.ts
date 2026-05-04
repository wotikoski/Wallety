import { pgTable, uuid, text, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { groups } from "./groups";

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  targetDate: date("target_date").notNull(),
  savedAmount: numeric("saved_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  color: text("color").notNull().default("#6366f1"),
  emoji: text("emoji").notNull().default("🎯"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
