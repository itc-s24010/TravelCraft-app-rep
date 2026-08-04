import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { tripsTable } from "./trips";

export const notificationTable = pgTable("notification", {
  notificationId: serial("notification_id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.tripId),
  reminder: varchar("reminder", { length: 255 }),
  notificationDatetime: timestamp("notification_datetime", { withTimezone: true }),
  notificationType: varchar("notification_type", { length: 30 }),
});

export type Notification = typeof notificationTable.$inferSelect;
export type InsertNotification = typeof notificationTable.$inferInsert;
