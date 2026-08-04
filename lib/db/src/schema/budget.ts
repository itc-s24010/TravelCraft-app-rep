import { pgTable, serial, integer, numeric } from "drizzle-orm/pg-core";
import { tripsTable } from "./trips";
import { categoriesTable } from "./categories";

export const budgetTable = pgTable("budget", {
  budgetId: serial("budget_id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.tripId),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.categoryId),
  budgetAmount: numeric("budget_amount", { precision: 12, scale: 2 }).notNull(),
});

export type Budget = typeof budgetTable.$inferSelect;
export type InsertBudget = typeof budgetTable.$inferInsert;
