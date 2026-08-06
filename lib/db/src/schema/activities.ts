import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { tripsTable } from "./trips";

export const activitiesTable = pgTable("activities", {
  activityId: serial("activity_id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.tripId),
  title: varchar("title", { length: 200 }).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  location: varchar("location", { length: 255 }),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  memo: text("memo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Activity = typeof activitiesTable.$inferSelect;
export type InsertActivity = typeof activitiesTable.$inferInsert;
