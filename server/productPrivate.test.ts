import { describe, expect, it, vi } from "vitest";

const privateCosts = new Map<string, number>();
vi.mock("./db", () => ({
  getPrivateProductCost: vi.fn(async (ownerOpenId: string, productId: string) => {
    const value = privateCosts.get(`${ownerOpenId}:${productId}`);
    return value === undefined ? null : { productId, costBase: value };
  }),
  upsertPrivateProductCost: vi.fn(async (ownerOpenId: string, productId: string, costBase: number) => {
    privateCosts.set(`${ownerOpenId}:${productId}`, costBase);
    return { productId, costBase: costBase.toFixed(2) };
  }),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 1, openId: `${role}-private-test`, email: `${role}@example.test`, name: role, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("productPrivate", () => {
  it("bloqueia revendedora antes de acessar o banco privado", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.productPrivate.getCost({ productId: "product-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("persiste o custo-base para a Gestora e o recupera em uma nova chamada", async () => {
    const managerCaller = appRouter.createCaller(contextFor("admin"));
    await managerCaller.productPrivate.saveCost({ productId: "product-reload", costBase: 48.5 });
    const nextSessionCaller = appRouter.createCaller(contextFor("admin"));
    await expect(nextSessionCaller.productPrivate.getCost({ productId: "product-reload" })).resolves.toEqual({ productId: "product-reload", costBase: 48.5 });
  });
});

