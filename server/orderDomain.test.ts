import { describe, expect, it } from "vitest";
import { buildOrderInput, canTransitionOrder, filterOrders, formatBRLInput, getOrderOriginLabel, getPaymentMethodLabel, parseBRLInput } from "../client/src/features/orders/orderDomain";
import type { Order } from "../client/src/lib/localStore";

const baseOrder = (partial: Partial<Order> = {}): Order => ({
  id: "order-1",
  origin: "reseller",
  entryType: "detailed",
  resellerId: "reseller-1",
  items: [{ productId: "product-1", productName: "Colar Aura", unitPrice: 100, quantity: 1, subtotal: 100 }],
  total: 100,
  commission: 20,
  commissionRate: 20,
  status: "pending",
  paymentMethod: "pix",
  paymentStatus: "pending",
  saleDate: "2026-08-19T12:00:00.000Z",
  createdAt: "2026-08-19T12:00:00.000Z",
  updatedAt: "2026-08-19T12:00:00.000Z",
  history: [{ status: "pending", at: "2026-08-19T12:00:00.000Z" }],
  ...partial,
});

describe("orderDomain", () => {
  it("filtra pedido por texto, status e origem", () => { const orders = [baseOrder(), baseOrder({ id: "order-2", origin: "direct", status: "approved", customerName: "Ana Lima", items: [{ productId: "product-2", productName: "Anel Essência", unitPrice: 80, quantity: 1, subtotal: 80 }], total: 80, commission: 0 })]; expect(filterOrders(orders, "aura", "all", "all")).toHaveLength(1); expect(filterOrders(orders, "ana", "approved", "direct")).toHaveLength(1); expect(filterOrders(orders, "", "pending", "direct")).toHaveLength(0); });
  it("permite progressão e cancelamento, mas bloqueia alteração após entrega/cancelamento", () => { expect(canTransitionOrder("pending", "approved")).toBe(true); expect(canTransitionOrder("pending", "cancelled")).toBe(true); expect(canTransitionOrder("delivered", "pending")).toBe(false); expect(canTransitionOrder("cancelled", "approved")).toBe(false); });
  it("expõe labels operacionais legíveis", () => { expect(getOrderOriginLabel("direct")).toBe("Venda direta"); expect(getPaymentMethodLabel("pix")).toBe("Pix"); });
  it("formata o valor geral em reais e aceita somente dígitos no valor numérico", () => { expect(formatBRLInput("12990")).toBe("R$ 129,90"); expect(formatBRLInput("R$ 1.234,56")).toBe("R$ 1.234,56"); expect(parseBRLInput("R$ 1.234,56")).toBe(1234.56); });
  it("constrói o payload da gestora com customerId e sem campos removidos", () => { const payload = buildOrderInput({ requestId: "manager-request", entryType: "detailed", origin: "direct", customerId: "customer-manager", items: [{ productId: "product-1", quantity: 1 }], status: "pending", paymentMethod: "pix", paymentStatus: "paid", saleDate: "2026-08-19T12:00:00.000Z" }); expect(payload.customerId).toBe("customer-manager"); expect(payload).not.toHaveProperty("customerName"); expect(payload).not.toHaveProperty("customerContact"); expect(payload).not.toHaveProperty("notes"); expect(payload).not.toHaveProperty("proofReference"); });
  it("constrói o payload da revendedora com customerId e origem vinculada", () => { const payload = buildOrderInput({ requestId: "reseller-request", entryType: "detailed", origin: "reseller", resellerId: "reseller-1", customerId: "customer-reseller", items: [{ productId: "product-1", quantity: 1 }], status: "pending", paymentMethod: "pending", paymentStatus: "pending", saleDate: "2026-08-19T12:00:00.000Z" }); expect(payload.customerId).toBe("customer-reseller"); expect(payload.origin).toBe("reseller"); expect(payload.resellerId).toBe("reseller-1"); expect(payload).not.toHaveProperty("customerName"); expect(payload).not.toHaveProperty("customerContact"); expect(payload).not.toHaveProperty("notes"); expect(payload).not.toHaveProperty("proofReference"); });
});
