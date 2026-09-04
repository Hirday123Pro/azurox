import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db, assetsTable } from "@workspace/db";
import {
  CreateAssetBody,
  CreateAssetResponse,
  DeleteAssetParams,
  GetAssetParams,
  GetAssetResponse,
  GetMarketplaceSummaryResponse,
  ListAssetsQueryParams,
  ListAssetsResponse,
  UpdateAssetBody,
  UpdateAssetParams,
  UpdateAssetResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

function serializeAsset(asset: typeof assetsTable.$inferSelect) {
  return {
    id: asset.id,
    title: asset.title,
    description: asset.description,
    price: asset.price,
    currency: asset.currency,
    robux_price: asset.robuxPrice ?? (asset.currency === "Robux" ? asset.price : null),
    dollar_price: asset.dollarPrice ?? (asset.currency === "USD" ? asset.price : null),
    price_display: asset.priceDisplay ?? asset.currency,
    category: asset.category,
    image_urls: asset.imageUrls,
    discord_link: asset.discordLink,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
  };
}

router.get("/assets", async (req, res): Promise<void> => {
  const query = ListAssetsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, category, sort } = query.data;
  const orderBy =
    sort === "oldest"
      ? asc(assetsTable.createdAt)
      : sort === "price_low"
        ? asc(assetsTable.price)
        : sort === "price_high"
          ? desc(assetsTable.price)
          : desc(assetsTable.createdAt);

  const rows = await db.select().from(assetsTable).orderBy(orderBy);
  const normalizedSearch = search?.trim().toLowerCase();
  const filtered = rows.filter((asset) => {
    const matchesCategory = !category || asset.category === category;
    const haystack = `${asset.title} ${asset.description} ${asset.category}`.toLowerCase();
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });

  res.json(ListAssetsResponse.parse(filtered.map(serializeAsset)));
});

router.post("/assets", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [asset] = await db
    .insert(assetsTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      currency: parsed.data.currency,
      robuxPrice: parsed.data.robux_price,
      dollarPrice: parsed.data.dollar_price,
      priceDisplay: parsed.data.price_display,
      category: parsed.data.category,
      imageUrls: parsed.data.image_urls,
      discordLink: parsed.data.discord_link,
    })
    .returning();

  res.status(201).json(CreateAssetResponse.parse(serializeAsset(asset)));
});

router.get("/assets/:id", async (req, res): Promise<void> => {
  const params = GetAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [asset] = await db
    .select()
    .from(assetsTable)
    .where(eq(assetsTable.id, params.data.id));
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.json(GetAssetResponse.parse(serializeAsset(asset)));
});

router.patch("/assets/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAssetParams.safeParse(req.params);
  const body = UpdateAssetBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [asset] = await db
    .update(assetsTable)
    .set({
      ...(body.data.title !== undefined ? { title: body.data.title } : {}),
      ...(body.data.description !== undefined ? { description: body.data.description } : {}),
      ...(body.data.price !== undefined ? { price: body.data.price } : {}),
      ...(body.data.currency !== undefined ? { currency: body.data.currency } : {}),
      ...(body.data.robux_price !== undefined ? { robuxPrice: body.data.robux_price } : {}),
      ...(body.data.dollar_price !== undefined ? { dollarPrice: body.data.dollar_price } : {}),
      ...(body.data.price_display !== undefined ? { priceDisplay: body.data.price_display } : {}),
      ...(body.data.category !== undefined ? { category: body.data.category } : {}),
      ...(body.data.image_urls !== undefined ? { imageUrls: body.data.image_urls } : {}),
      ...(body.data.discord_link !== undefined ? { discordLink: body.data.discord_link } : {}),
      updatedAt: new Date(),
    })
    .where(eq(assetsTable.id, params.data.id))
    .returning();

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.json(UpdateAssetResponse.parse(serializeAsset(asset)));
});

router.delete("/assets/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [asset] = await db
    .delete(assetsTable)
    .where(eq(assetsTable.id, params.data.id))
    .returning();
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/marketplace/summary", async (_req, res): Promise<void> => {
  const rows = await db.select().from(assetsTable);
  const categories = new Set(rows.map((asset) => asset.category));
  const newest = rows.reduce<Date | null>(
    (latest, asset) => (!latest || asset.createdAt > latest ? asset.createdAt : latest),
    null,
  );
  res.json(
    GetMarketplaceSummaryResponse.parse({
      asset_count: rows.length,
      category_count: categories.size,
      newest_asset: newest,
    }),
  );
});

export default router;