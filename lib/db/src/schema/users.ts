import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  userId: text("user_id").primaryKey(), // Clerk user ID
  userName: varchar("user_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
