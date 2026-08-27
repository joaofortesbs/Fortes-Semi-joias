import { describe, expect, it } from "vitest";
import { buildFinanceMetrics, buildReceivables, type Payable } from "../client/src/features/finance/financeDomain";
import type { Order } from "../client/src/lib/localStore";

const order = (overrides: Partial<Order> = {}): Order => ({
  id: "order-1", origin: "direct", entryType: "detailed", items: [], total: 150, commission: 0, commissionRate: 0,
  status: "delivered", paymentMethod: "pix", paymentStatus: "pending", saleDate: "2026-08-20T12:00:00.000Z", createdAt: "2026-08-20T12:00:00.000Z", updatedAt: "2026-08-20T12:00:00.000Z", history: [], ...overrides,
});

const payable = (overrides: Partial<Payable> = {}): Payable => ({ id: "payable-1", description: "Fornecedor", category: "Fornecedor", amount: 100, dueDate: "2026-08-22", status: "open", paidAmount: 0, createdAt: "2026-08-20T12:00:00.000Z", settlements: [], ...overrides });

describe("finance domain", () => {
  it("derives an overdue receivable without treating delivery as payment", () => {
    const [item] = buildReceivables([order()], "2026-08-26");
    expect(item.status).toBe("overdue");
    expect(item.paidAmount).toBe(0);
    expect(item.daysLate).toBe(6);
  });

  it("calculates confirmed cash separately from open commitments", () => {
    const receivables = buildReceivables([order({ id: "paid", paymentStatus: "paid", saleDate: "2026-08-25T12:00:00.000Z" })], "2026-08-26");
    const metrics = buildFinanceMetrics(receivables, [payable({ paidAmount: 30, status: "partial", dueDate: "2026-08-30" })], "2026-08-26");
    expect(metrics.confirmedCash).toBe(120);
    expect(metrics.payableNext7).toBe(70);
  });
});
