import { pgTable, serial, integer, numeric, date, varchar } from "drizzle-orm/pg-core";
import { tripsTable } from "./trips";
import { categoriesTable } from "./categories";

export const expenseTable = pgTable("expense", {
  expenseId: serial("expense_id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.tripId),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.categoryId),
  expenseAmount: numeric("expense_amount", { precision: 12, scale: 2 }).notNull(),
  expenseDate: date("expense_date", { mode: "string" }).notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }),
});

export type Expense = typeof expenseTable.$inferSelect;
export type InsertExpense = typeof expenseTable.$inferInsert;
