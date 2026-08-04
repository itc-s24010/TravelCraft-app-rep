import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { tripsTable } from "./trips";

export const accommodationTable = pgTable("accommodation", {
  accommodationId: serial("accommodation_id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.tripId),
  accommodationName: varchar("accommodation_name", { length: 200 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
  checkOut: timestamp("check_out", { withTimezone: true }).notNull(),
  reservationNumber: varchar("reservation_number", { length: 100 }),
});

export type Accommodation = typeof accommodationTable.$inferSelect;
export type InsertAccommodation = typeof accommodationTable.$inferInsert;
