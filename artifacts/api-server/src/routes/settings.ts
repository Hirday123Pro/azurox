import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { GetPublicSettingsResponse, UpdateSiteSettingsBody, UpdateSiteSettingsResponse } from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const DEFAULT_SETTINGS = {
  order_discord_link: "",
  banners: [],
};

function serializeSettings(settings: typeof siteSettingsTable.$inferSelect) {
  return {
    order_discord_link: settings.orderDiscordLink,
    banners: settings.banners,
  };
}

async function getOrCreateSettings() {
  const [existing] = await db.select().from(siteSettingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(siteSettingsTable).values({
    orderDiscordLink: DEFAULT_SETTINGS.order_discord_link,
    banners: DEFAULT_SETTINGS.banners,
  }).returning();
  return created;
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(GetPublicSettingsResponse.parse(serializeSettings(settings)));
});

router.patch("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSiteSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = await getOrCreateSettings();
  const [updated] = await db.update(siteSettingsTable).set({
    orderDiscordLink: parsed.data.order_discord_link.trim(),
    banners: parsed.data.banners.map((banner) => ({
      ...banner,
      text: banner.text.trim(),
      href: banner.href.trim(),
    })),
    updatedAt: new Date(),
  }).where(eq(siteSettingsTable.id, current.id)).returning();
  res.json(UpdateSiteSettingsResponse.parse(serializeSettings(updated)));
});

export default router;