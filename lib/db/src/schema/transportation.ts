import { pgTable, serial, integer, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { tripsTable } from "./trips";

export const transportationTable = pgTable("transportation", {
  transportationId: serial("transportation_id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.tripId),
  transportationType: varchar("transportation_type", { length: 50 }).notNull(),
  departurePlace: varchar("departure_place", { length: 100 }).notNull(),
  arrivalPlace: varchar("arrival_place", { length: 100 }).notNull(),
  departureTime: timestamp("departure_time", { withTimezone: true }).notNull(),
  arrivalTime: timestamp("arrival_time", { withTimezone: true }).notNull(),
  fare: numeric("fare", { precision: 12, scale: 2 }).notNull(),
});

export type Transportation = typeof transportationTable.$inferSelect;
export type InsertTransportation = typeof transportationTable.$inferInsert;
