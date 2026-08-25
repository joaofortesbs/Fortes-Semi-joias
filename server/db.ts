import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, orders, privateProductCosts, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertPrivateProductCost(ownerOpenId: string, productId: string, costBase: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const value = costBase.toFixed(2);
  await db.insert(privateProductCosts).values({ ownerOpenId, productId, costBase: value }).onDuplicateKeyUpdate({ set: { costBase: value } });
  return { productId, costBase: value };
}

export async function createPersistedOrder(ownerOpenId: string, input: { id: string; origin: "direct" | "reseller"; resellerId?: string; status: string; total: number; commission: number; saleDate: Date; payload: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const existing = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.id, input.id), eq(orders.ownerOpenId, ownerOpenId))).limit(1);
  if (existing[0]) return { id: existing[0].id, duplicate: true };
  await db.insert(orders).values({ id: input.id, ownerOpenId, origin: input.origin, resellerId: input.resellerId, status: input.status, total: input.total.toFixed(2), commission: input.commission.toFixed(2), saleDate: input.saleDate, payload: input.payload });
  return { id: input.id, duplicate: false };
}

export async function listPersistedOrders(ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  return db.select().from(orders).where(eq(orders.ownerOpenId, ownerOpenId)).orderBy(desc(orders.saleDate));
}

const orderStatusSequence = ["pending", "approved", "paid", "separating", "shipped", "delivered"];
function isValidOrderTransition(from: string, to: string) { if (from === to) return true; if (from === "cancelled" || from === "delivered") return false; if (to === "cancelled") return true; return orderStatusSequence.indexOf(to) >= orderStatusSequence.indexOf(from); }

export async function updatePersistedOrderStatus(ownerOpenId: string, id: string, status: string, payload: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const current = await db.select({ status: orders.status, payload: orders.payload }).from(orders).where(and(eq(orders.id, id), eq(orders.ownerOpenId, ownerOpenId))).limit(1);
  if (!current[0]) throw new Error("Pedido não encontrado.");
  if (!isValidOrderTransition(current[0].status, status)) throw new Error("Transição de status inválida para este pedido.");
  if (current[0].status !== status) await db.update(orders).set({ status, payload }).where(and(eq(orders.id, id), eq(orders.ownerOpenId, ownerOpenId)));
  return { id, status };
}

export async function getPrivateProductCost(ownerOpenId: string, productId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const result = await db.select({ productId: privateProductCosts.productId, costBase: privateProductCosts.costBase }).from(privateProductCosts).where(eq(privateProductCosts.ownerOpenId, ownerOpenId)).limit(1000);
  const match = result.find(item => item.productId === productId);
  return match ? { productId: match.productId, costBase: Number(match.costBase) } : null;
}

