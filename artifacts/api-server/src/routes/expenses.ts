import { Router } from "express";
import { db, expenseTable, tripsTable, categoriesTable } from "@workspace/db";
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
    expenseId: expenseTable.expenseId, tripId: expenseTable.tripId,
    categoryId: expenseTable.categoryId, categoryName: categoriesTable.categoryName,
    expenseAmount: expenseTable.expenseAmount, expenseDate: expenseTable.expenseDate,
    paymentMethod: expenseTable.paymentMethod,
  }).from(expenseTable)
    .innerJoin(categoriesTable, eq(expenseTable.categoryId, categoriesTable.categoryId))
    .where(eq(expenseTable.tripId, tripId));
  res.json(records.map((r) => ({ ...r, expenseAmount: parseFloat(String(r.expenseAmount)) })));
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { categoryId, expenseAmount, expenseDate, paymentMethod } = req.body;
  const [record] = await db.insert(expenseTable).values({ tripId, categoryId, expenseAmount: String(expenseAmount), expenseDate, paymentMethod }).returning();
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.categoryId, categoryId)).limit(1);
  res.status(201).json({ ...record, categoryName: cat?.categoryName ?? "", expenseAmount: parseFloat(String(record.expenseAmount)) });
});

router.patch("/:expenseId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const expenseId = parseInt(req.params.expenseId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { categoryId, expenseAmount, expenseDate, paymentMethod } = req.body;
  const [record] = await db.update(expenseTable).set({
    ...(categoryId && { categoryId }),
    ...(expenseAmount !== undefined && { expenseAmount: String(expenseAmount) }),
    ...(expenseDate && { expenseDate }),
    paymentMethod,
  }).where(and(eq(expenseTable.expenseId, expenseId), eq(expenseTable.tripId, tripId))).returning();
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.categoryId, record.categoryId)).limit(1);
  res.json({ ...record, categoryName: cat?.categoryName ?? "", expenseAmount: parseFloat(String(record.expenseAmount)) });
});

router.delete("/:expenseId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const expenseId = parseInt(req.params.expenseId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  await db.delete(expenseTable).where(and(eq(expenseTable.expenseId, expenseId), eq(expenseTable.tripId, tripId)));
  res.status(204).send();
});

export default router;
