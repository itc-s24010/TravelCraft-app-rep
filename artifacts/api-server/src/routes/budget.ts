import { Router } from "express";
import { db, budgetTable, tripsTable, categoriesTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router({ mergeParams: true });

async function checkTripOwnership(tripId: number, userId: string) {
  const [trip] = await db.select().from(tripsTable)
    .where(and(eq(tripsTable.tripId, tripId), eq(tripsTable.userId, userId), isNull(tripsTable.deletedAt))).limit(1);
  return trip ?? null;
}

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const records = await db.select({
    budgetId: budgetTable.budgetId, tripId: budgetTable.tripId,
    categoryId: budgetTable.categoryId, categoryName: categoriesTable.categoryName,
    budgetAmount: budgetTable.budgetAmount,
  }).from(budgetTable)
    .innerJoin(categoriesTable, eq(budgetTable.categoryId, categoriesTable.categoryId))
    .where(eq(budgetTable.tripId, tripId));
  res.json(records.map((r) => ({ ...r, budgetAmount: parseFloat(String(r.budgetAmount)) })));
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { categoryId, budgetAmount } = req.body;
  const [record] = await db.insert(budgetTable).values({ tripId, categoryId, budgetAmount: String(budgetAmount) }).returning();
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.categoryId, categoryId)).limit(1);
  res.status(201).json({ ...record, categoryName: cat?.categoryName ?? "", budgetAmount: parseFloat(String(record.budgetAmount)) });
});

router.patch("/:budgetId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const budgetId = parseInt(req.params.budgetId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { budgetAmount } = req.body;
  const [record] = await db.update(budgetTable).set({ budgetAmount: String(budgetAmount) })
    .where(and(eq(budgetTable.budgetId, budgetId), eq(budgetTable.tripId, tripId))).returning();
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.categoryId, record.categoryId)).limit(1);
  res.json({ ...record, categoryName: cat?.categoryName ?? "", budgetAmount: parseFloat(String(record.budgetAmount)) });
});

router.delete("/:budgetId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const budgetId = parseInt(req.params.budgetId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  await db.delete(budgetTable).where(and(eq(budgetTable.budgetId, budgetId), eq(budgetTable.tripId, tripId)));
  res.status(204).send();
});

export default router;
