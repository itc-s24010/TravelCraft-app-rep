import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("categories", {
  categoryId: serial("category_id").primaryKey(),
  categoryName: varchar("category_name", { length: 100 }).notNull(),
});

export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = typeof categoriesTable.$inferInsert;
