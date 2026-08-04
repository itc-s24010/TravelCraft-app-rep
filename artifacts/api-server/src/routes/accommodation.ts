import { Router } from "express";
import { db, accommodationTable, tripsTable } from "@workspace/db";
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

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const records = await db.select().from(accommodationTable).where(eq(accommodationTable.tripId, tripId));
  res.json(records);
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { accommodationName, address, checkIn, checkOut, reservationNumber } = req.body;
  const [record] = await db.insert(accommodationTable).values({
    tripId, accommodationName, address,
    checkIn: new Date(checkIn), checkOut: new Date(checkOut), reservationNumber,
  }).returning();
  res.status(201).json(record);
});

router.get("/:accommodationId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const accommodationId = parseInt(req.params.accommodationId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const [record] = await db.select().from(accommodationTable)
    .where(and(eq(accommodationTable.accommodationId, accommodationId), eq(accommodationTable.tripId, tripId)))
    .limit(1);
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json(record);
});

router.patch("/:accommodationId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const accommodationId = parseInt(req.params.accommodationId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { accommodationName, address, checkIn, checkOut, reservationNumber } = req.body;
  const [record] = await db.update(accommodationTable).set({
    ...(accommodationName && { accommodationName }),
    ...(address && { address }),
    ...(checkIn && { checkIn: new Date(checkIn) }),
    ...(checkOut && { checkOut: new Date(checkOut) }),
    reservationNumber,
  }).where(and(eq(accommodationTable.accommodationId, accommodationId), eq(accommodationTable.tripId, tripId))).returning();
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json(record);
});

router.delete("/:accommodationId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const accommodationId = parseInt(req.params.accommodationId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  await db.delete(accommodationTable).where(and(eq(accommodationTable.accommodationId, accommodationId), eq(accommodationTable.tripId, tripId)));
  res.status(204).send();
});

export default router;
