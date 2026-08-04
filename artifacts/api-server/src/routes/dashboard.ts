import { Router } from "express";
import { db, tripsTable, expenseTable } from "@workspace/db";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const today = new Date().toISOString().split("T")[0];

  const trips = await db
    .select()
    .from(tripsTable)
    .where(and(eq(tripsTable.userId, userId), isNull(tripsTable.deletedAt)))
    .orderBy(desc(tripsTable.tripDate));

  const upcomingTrips = trips.filter((t) => t.tripDate >= today).length;
  const pastTrips = trips.filter((t) => t.tripDate < today).length;
  const recentTrips = trips.slice(0, 5);

  // Sum expenses via subquery on trip IDs the user owns
  const userTripIds = trips.map((t) => t.tripId);

  let totalExpenseAllTime = 0;
  if (userTripIds.length > 0) {
    const expenseResult = await db
      .select({ total: sql<string>`coalesce(sum(${expenseTable.expenseAmount}), 0)` })
      .from(expenseTable)
      .where(sql`${expenseTable.tripId} = ANY(ARRAY[${sql.join(userTripIds.map(id => sql`${id}`), sql`, `)}]::int[])`);
    totalExpenseAllTime = parseFloat(expenseResult[0]?.total ?? "0");
  }

  res.json({
    upcomingTrips,
    pastTrips,
    totalTrips: trips.length,
    totalExpenseAllTime,
    recentTrips,
  });
});

export default router;
