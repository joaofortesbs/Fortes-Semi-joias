import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const privateProductCosts = mysqlTable("private_product_costs", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull().references(() => users.openId),
  productId: varchar("productId", { length: 64 }).notNull(),
  costBase: decimal("costBase", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerProductUnique: uniqueIndex("private_product_costs_owner_product_unique").on(table.ownerOpenId, table.productId),
}));

export type PrivateProductCost = typeof privateProductCosts.$inferSelect;
export type InsertPrivateProductCost = typeof privateProductCosts.$inferInsert;

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull().references(() => users.openId),
  resellerId: varchar("resellerId", { length: 64 }),
  origin: mysqlEnum("origin", ["direct", "reseller"]).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 12, scale: 2 }).notNull(),
  payload: json("payload").notNull(),
  saleDate: timestamp("saleDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrderRecord = typeof orders.$inferSelect;
export type InsertOrderRecord = typeof orders.$inferInsert;