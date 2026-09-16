import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, assetsTable, categoriesTable } from "@workspace/db";
import {
  CreateCategoryBody,
  CreateCategoryResponse,
  DeleteCategoryParams,
  ListCategoriesResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();
const DEFAULT_CATEGORIES = ["UI", "Scripts", "3D Models", "Maps"];

function serializeCategory(category: typeof categoriesTable.$inferSelect) {
  return {
    id: category.id,
    name: category.name,
    created_at: category.createdAt,
  };
}

router.get("/categories", async (_req, res): Promise<void> => {
  const [stored, assets] = await Promise.all([
    db.select().from(categoriesTable).orderBy(asc(categoriesTable.name)),
    db.select({ category: assetsTable.category }).from(assetsTable),
  ]);
  const names = new Set([...DEFAULT_CATEGORIES, ...stored.map((category) => category.name), ...assets.map((asset) => asset.category)]);
  const storedByName = new Map(stored.map((category) => [category.name, category]));
  const result = [...names].sort((a, b) => a.localeCompare(b)).map((name, index) => storedByName.get(name) ?? {
    id: -(index + 1),
    name,
    created_at: new Date(0),
  });
  res.json(ListCategoriesResponse.parse(result));
});

router.post("/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const name = parsed.data.name.trim();
  const existing = await db.select().from(categoriesTable);
  if ([...DEFAULT_CATEGORIES, ...existing.map((category) => category.name)].some((value) => value.toLowerCase() === name.toLowerCase())) {
    res.status(409).json({ error: "Category already exists" });
    return;
  }
  const [category] = await db.insert(categoriesTable).values({ name }).returning();
  res.status(201).json(CreateCategoryResponse.parse(serializeCategory(category)));
});

router.delete("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, params.data.id));
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const used = await db.select({ id: assetsTable.id }).from(assetsTable).where(eq(assetsTable.category, category.name));
  if (used.length) {
    res.status(409).json({ error: "Category is still assigned to assets" });
    return;
  }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, category.id));
  res.sendStatus(204);
});

export default router;