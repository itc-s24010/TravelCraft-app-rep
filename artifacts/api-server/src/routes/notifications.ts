import { Router } from "express";
import { db, notificationTable, tripsTable } from "@workspace/db";
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
  const records = await db.select().from(notificationTable).where(eq(notificationTable.tripId, tripId));
  res.json(records);
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { reminder, notificationDatetime, notificationType } = req.body;
  const [record] = await db.insert(notificationTable).values({
    tripId, reminder, notificationType,
    notificationDatetime: notificationDatetime ? new Date(notificationDatetime) : undefined,
  }).returning();
  res.status(201).json(record);
});

router.patch("/:notificationId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const notificationId = parseInt(req.params.notificationId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { reminder, notificationDatetime, notificationType } = req.body;
  const [record] = await db.update(notificationTable).set({
    reminder, notificationType,
    notificationDatetime: notificationDatetime ? new Date(notificationDatetime) : null,
  }).where(and(eq(notificationTable.notificationId, notificationId), eq(notificationTable.tripId, tripId))).returning();
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json(record);
});

router.delete("/:notificationId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const notificationId = parseInt(req.params.notificationId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  await db.delete(notificationTable).where(and(eq(notificationTable.notificationId, notificationId), eq(notificationTable.tripId, tripId)));
  res.status(204).send();
});

export default router;
