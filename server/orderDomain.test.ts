import { describe, expect, it } from "vitest";
import { canTransitionOrder, filterOrders, getOrderOriginLabel, getPaymentMethodLabel } from "../client/src/features/orders/orderDomain";
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
});
