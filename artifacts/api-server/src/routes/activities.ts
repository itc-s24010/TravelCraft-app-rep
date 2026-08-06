import { Router } from "express";
import { db, activitiesTable, tripsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router({ mergeParams: true });

async function checkTripOwnership(tripId: number, userId: string) {
  const [trip] = await db
    .select()
    .from(tripsTable)
    .where(and(eq(tripsTable.tripId, tripId), eq(tripsTable.userId, userId), isNull(tripsTable.deletedAt)))
    .limit(1);
  return trip ?? null;
}

// GET /trips/:tripId/activities
router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const records = await db.select().from(activitiesTable).where(eq(activitiesTable.tripId, tripId));
  res.json(records);
});

// POST /trips/:tripId/activities
router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { title, activityType, location, startTime, endTime, memo } = req.body;
  if (!title || !activityType) { res.status(400).json({ error: "title and activityType are required" }); return; }
  const [record] = await db.insert(activitiesTable).values({
    tripId,
    title,
    activityType,
    location: location ?? null,
    startTime: startTime ? new Date(startTime) : null,
    endTime: endTime ? new Date(endTime) : null,
    memo: memo ?? null,
  }).returning();
  res.status(201).json(record);
});

// GET /trips/:tripId/activities/:activityId
router.get("/:activityId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const activityId = parseInt(req.params.activityId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const [record] = await db.select().from(activitiesTable)
    .where(and(eq(activitiesTable.activityId, activityId), eq(activitiesTable.tripId, tripId)))
    .limit(1);
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json(record);
});

// PATCH /trips/:tripId/activities/:activityId
router.patch("/:activityId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const activityId = parseInt(req.params.activityId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { title, activityType, location, startTime, endTime, memo } = req.body;
  const [record] = await db.update(activitiesTable).set({
    ...(title && { title }),
    ...(activityType && { activityType }),
    ...(location !== undefined && { location }),
    ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
    ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
    ...(memo !== undefined && { memo }),
  }).where(and(eq(activitiesTable.activityId, activityId), eq(activitiesTable.tripId, tripId))).returning();
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json(record);
});

// DELETE /trips/:tripId/activities/:activityId
router.delete("/:activityId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const activityId = parseInt(req.params.activityId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  await db.delete(activitiesTable).where(and(eq(activitiesTable.activityId, activityId), eq(activitiesTable.tripId, tripId)));
  res.status(204).send();
});

export default router;
