import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  const categories = await db.select().from(categoriesTable);
  res.json(categories.map((c) => ({ categoryId: c.categoryId, categoryName: c.categoryName })));
});

export default router;
