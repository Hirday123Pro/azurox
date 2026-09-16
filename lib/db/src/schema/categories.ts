import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable(
  "asset_categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameUnique: uniqueIndex("asset_categories_name_unique").on(table.name),
  }),
);

export type Category = typeof categoriesTable.$inferSelect;