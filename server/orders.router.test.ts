import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const persistedIds = new Set<string>();
vi.mock("./db", () => ({
  createPersistedOrder: vi.fn(async (_owner: string, input: { id: string }) => { const duplicate = persistedIds.has(input.id); persistedIds.add(input.id); return { id: input.id, duplicate }; }),
  listPersistedOrders: vi.fn(async () => []),
  updatePersistedOrderStatus: vi.fn(async (_owner: string, id: string, status: string) => ({ id, status })),
  getPrivateProductCost: vi.fn(),
  upsertPrivateProductCost: vi.fn(),
}));

const { appRouter } = await import("./routers");

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 1, openId: `${role}-open-id`, email: `${role}@example.com`, name: role, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("orders router", () => {
  it("bloqueia todas as operações protegidas para usuário não-admin", async () => { const caller = appRouter.createCaller(context("user")); await expect(caller.orders.list()).rejects.toMatchObject({ code: "FORBIDDEN" }); await expect(caller.orders.create({ id: "order-user-1", origin: "direct", status: "pending", total: 100, commission: 0, saleDate: new Date("2026-08-19T12:00:00.000Z"), payload: {} })).rejects.toMatchObject({ code: "FORBIDDEN" }); await expect(caller.orders.updateStatus({ id: "order-user-1", status: "cancelled", payload: {} })).rejects.toMatchObject({ code: "FORBIDDEN" }); });
  it("permite gestora listar e criar pedido persistido", async () => { const caller = appRouter.createCaller(context("admin")); expect(await caller.orders.list()).toEqual([]); await expect(caller.orders.create({ id: "order-router-1", origin: "direct", status: "pending", total: 100, commission: 0, saleDate: new Date("2026-08-19T12:00:00.000Z"), payload: { entryType: "general" } })).resolves.toEqual({ id: "order-router-1", duplicate: false }); await expect(caller.orders.create({ id: "order-router-1", origin: "direct", status: "pending", total: 100, commission: 0, saleDate: new Date("2026-08-19T12:00:00.000Z"), payload: { entryType: "general" } })).resolves.toEqual({ id: "order-router-1", duplicate: true }); });
  it("permite gestora atualizar status persistido", async () => { await expect(appRouter.createCaller(context("admin")).orders.updateStatus({ id: "order-router-1", status: "cancelled", payload: { status: "cancelled" } })).resolves.toEqual({ id: "order-router-1", status: "cancelled" }); });
  it("rejeita status fora do contrato tRPC", async () => { await expect(appRouter.createCaller(context("admin")).orders.updateStatus({ id: "order-router-1", status: "invalid" as never, payload: {} })).rejects.toMatchObject({ code: "BAD_REQUEST" }); });
});
