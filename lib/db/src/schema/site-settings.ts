import { sql } from "drizzle-orm";
import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type SiteBanner = {
  id: string;
  text: string;
  href: string;
  enabled: boolean;
};

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  orderDiscordLink: text("order_discord_link").notNull().default(""),
  banners: jsonb("banners").$type<SiteBanner[]>().notNull().default(sql`'[]'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;