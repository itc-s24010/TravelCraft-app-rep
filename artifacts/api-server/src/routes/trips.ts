import { Router } from "express";
import { db, tripsTable, budgetTable, expenseTable, categoriesTable, usersTable } from "@workspace/db";
import { eq, isNull, and, gte, lt, sql, desc } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

// Ensure user exists in DB (JIT provisioning)
async function ensureUser(userId: string, email?: string, name?: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(usersTable).values({
      userId,
      userName: name ?? "User",
      email: email ?? `${userId}@placeholder.local`,
    }).onConflictDoNothing();
  }
}

// GET /api/trips
router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  await ensureUser(userId);
  const trips = await db
    .select()
    .from(tripsTable)
    .where(and(eq(tripsTable.userId, userId), isNull(tripsTable.deletedAt)))
    .orderBy(desc(tripsTable.tripDate));
  res.json(trips);
});

// POST /api/trips
router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  await ensureUser(userId);
  const { title, tripDate, memo, companions } = req.body;
  if (!title || !tripDate) {
    res.status(400).json({ error: "title and tripDate are required" });
    return;
  }
  const [trip] = await db.insert(tripsTable).values({ userId, title, tripDate, memo, companions }).returning();
  res.status(201).json(trip);
});

// GET /api/trips/dashboard
router.get("/dashboard", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  await ensureUser(userId);
  const today = new Date().toISOString().split("T")[0];

  const trips = await db
    .select()
    .from(tripsTable)
    .where(and(eq(tripsTable.userId, userId), isNull(tripsTable.deletedAt)));

  const upcomingTrips = trips.filter((t) => t.tripDate >= today).length;
  const pastTrips = trips.filter((t) => t.tripDate < today).length;
  const recentTrips = [...trips].sort((a, b) => b.tripDate.localeCompare(a.tripDate)).slice(0, 5);

  // Total expense all time
  const expenseResult = await db
    .select({ total: sql<string>`coalesce(sum(e.expense_amount), 0)` })
    .from(expenseTable)
    .innerJoin(tripsTable, eq(expenseTable.tripId, tripsTable.tripId))
    .where(and(eq(tripsTable.userId, userId), isNull(tripsTable.deletedAt)));

  res.json({
    upcomingTrips,
    pastTrips,
    totalTrips: trips.length,
    totalExpenseAllTime: parseFloat(expenseResult[0]?.total ?? "0"),
    recentTrips,
  });
});

// GET /api/trips/:tripId
router.get("/:tripId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const [trip] = await db
    .select()
    .from(tripsTable)
    .where(and(eq(tripsTable.tripId, tripId), eq(tripsTable.userId, userId), isNull(tripsTable.deletedAt)))
    .limit(1);
  if (!trip) { res.status(404).json({ error: "Not found" }); return; }
  res.json(trip);
});

// PATCH /api/trips/:tripId
router.patch("/:tripId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const { title, tripDate, endDate, memo, companions } = req.body;
  const [trip] = await db
    .update(tripsTable)
    .set({
      ...(title && { title }),
      ...(tripDate && { tripDate }),
      ...(endDate !== undefined && { endDate: endDate ?? null }),
      memo,
      companions,
      updatedAt: new Date(),
    })
    .where(and(eq(tripsTable.tripId, tripId), eq(tripsTable.userId, userId), isNull(tripsTable.deletedAt)))
    .returning();
  if (!trip) { res.status(404).json({ error: "Not found" }); return; }
  res.json(trip);
});

// DELETE /api/trips/:tripId
router.delete("/:tripId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  await db
    .update(tripsTable)
    .set({ deletedAt: new Date() })
    .where(and(eq(tripsTable.tripId, tripId), eq(tripsTable.userId, userId)));
  res.status(204).send();
});

// GET /api/trips/:tripId/summary
router.get("/:tripId/summary", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);

  const [trip] = await db
    .select()
    .from(tripsTable)
    .where(and(eq(tripsTable.tripId, tripId), eq(tripsTable.userId, userId), isNull(tripsTable.deletedAt)))
    .limit(1);
  if (!trip) { res.status(404).json({ error: "Not found" }); return; }

  const budgets = await db
    .select({ categoryId: budgetTable.categoryId, categoryName: categoriesTable.categoryName, budgetAmount: budgetTable.budgetAmount })
    .from(budgetTable)
    .innerJoin(categoriesTable, eq(budgetTable.categoryId, categoriesTable.categoryId))
    .where(eq(budgetTable.tripId, tripId));

  const expenses = await db
    .select({ categoryId: expenseTable.categoryId, categoryName: categoriesTable.categoryName, expenseAmount: expenseTable.expenseAmount })
    .from(expenseTable)
    .innerJoin(categoriesTable, eq(expenseTable.categoryId, categoriesTable.categoryId))
    .where(eq(expenseTable.tripId, tripId));

  const allCategories = [...new Set([...budgets.map((b) => b.categoryId), ...expenses.map((e) => e.categoryId)])];
  const categoryBreakdown = allCategories.map((catId) => {
    const budget = budgets.filter((b) => b.categoryId === catId).reduce((s, b) => s + parseFloat(String(b.budgetAmount)), 0);
    const expense = expenses.filter((e) => e.categoryId === catId).reduce((s, e) => s + parseFloat(String(e.expenseAmount)), 0);
    const catName = (budgets.find((b) => b.categoryId === catId) ?? expenses.find((e) => e.categoryId === catId))?.categoryName ?? "";
    return { categoryId: catId, categoryName: catName, budget, expense };
  });

  const totalBudget = budgets.reduce((s, b) => s + parseFloat(String(b.budgetAmount)), 0);
  const totalExpense = expenses.reduce((s, e) => s + parseFloat(String(e.expenseAmount)), 0);

  res.json({ tripId, title: trip.title, tripDate: trip.tripDate, totalBudget, totalExpense, remaining: totalBudget - totalExpense, categoryBreakdown });
});

export default router;
