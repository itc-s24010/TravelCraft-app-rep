import { Router } from "express";
import { db, transportationTable, tripsTable } from "@workspace/db";
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
  const records = await db.select().from(transportationTable).where(eq(transportationTable.tripId, tripId));
  res.json(records.map((r) => ({ ...r, fare: parseFloat(String(r.fare)) })));
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { transportationType, departurePlace, arrivalPlace, departureTime, arrivalTime, fare } = req.body;
  const [record] = await db.insert(transportationTable).values({
    tripId, transportationType, departurePlace, arrivalPlace,
    departureTime: new Date(departureTime), arrivalTime: new Date(arrivalTime), fare: String(fare),
  }).returning();
  res.status(201).json({ ...record, fare: parseFloat(String(record.fare)) });
});

router.get("/:transportationId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const transportationId = parseInt(req.params.transportationId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const [record] = await db.select().from(transportationTable)
    .where(and(eq(transportationTable.transportationId, transportationId), eq(transportationTable.tripId, tripId)))
    .limit(1);
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...record, fare: parseFloat(String(record.fare)) });
});

router.patch("/:transportationId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const transportationId = parseInt(req.params.transportationId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  const { transportationType, departurePlace, arrivalPlace, departureTime, arrivalTime, fare } = req.body;
  const [record] = await db.update(transportationTable).set({
    ...(transportationType && { transportationType }),
    ...(departurePlace && { departurePlace }),
    ...(arrivalPlace && { arrivalPlace }),
    ...(departureTime && { departureTime: new Date(departureTime) }),
    ...(arrivalTime && { arrivalTime: new Date(arrivalTime) }),
    ...(fare !== undefined && { fare: String(fare) }),
  }).where(and(eq(transportationTable.transportationId, transportationId), eq(transportationTable.tripId, tripId))).returning();
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...record, fare: parseFloat(String(record.fare)) });
});

router.delete("/:transportationId", requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const tripId = parseInt(req.params.tripId);
  const transportationId = parseInt(req.params.transportationId);
  if (!await checkTripOwnership(tripId, userId)) { res.status(404).json({ error: "Trip not found" }); return; }
  await db.delete(transportationTable).where(and(eq(transportationTable.transportationId, transportationId), eq(transportationTable.tripId, tripId)));
  res.status(204).send();
});

export default router;
