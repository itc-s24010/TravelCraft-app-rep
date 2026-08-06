import { pgTable, serial, text, varchar, date, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const tripsTable = pgTable("trips", {
  tripId: serial("trip_id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.userId),
  title: varchar("title", { length: 200 }).notNull(),
  tripDate: date("trip_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  memo: text("memo"),
  companions: varchar("companions", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Trip = typeof tripsTable.$inferSelect;
export type InsertTrip = typeof tripsTable.$inferInsert;
