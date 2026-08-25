import { type LocalUser, type Order, type OrderOrigin, type OrderStatus, type PaymentMethod, type PaymentStatus, type Product, type OrderEntryType, createOrder } from "@/lib/localStore";

export type OrderCreationDraft = { requestId?: string; entryType: OrderEntryType; origin: OrderOrigin; resellerId?: string; customerId?: string; items: Array<{ productId: string; quantity: number }>; status: OrderStatus; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; saleDate: string; manualDescription?: string; manualTotal?: number };
export function buildOrderInput(input: OrderCreationDraft): Parameters<typeof createOrder>[0] { return { ...input, customerId: input.customerId || undefined }; }

export const orderStatuses: OrderStatus[] = ["pending", "approved", "paid", "separating", "shipped", "delivered", "cancelled"];
export const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: "pix", label: "Pix" },
  { value: "card", label: "Cartão" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
  { value: "pending", label: "A definir" },
];
export const paymentStatuses: Array<{ value: PaymentStatus; label: string }> = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "partially_paid", label: "Parcialmente pago" },
];

export function parseBRLInput(value: string) { const digits = value.replace(/\D/g, ""); return digits ? Number(digits) / 100 : 0; }
export function formatBRLInput(value: string) { const digits = value.replace(/\D/g, ""); return digits ? (Number(digits) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""; }

export function getSelectableProducts(products: Product[]) { return products.filter(product => product.status === "available"); }

export function calculateDraftTotal(products: Product[], items: Record<string, number>) {
  return Number(Object.entries(items).reduce((sum, [productId, quantity]) => sum + (products.find(product => product.id === productId)?.price ?? 0) * quantity, 0).toFixed(2));
}

export function getOrderOriginLabel(origin: OrderOrigin) { return origin === "direct" ? "Venda direta" : "Por revendedora"; }
export function getPaymentMethodLabel(method: PaymentMethod) { return paymentMethods.find(item => item.value === method)?.label ?? "A definir"; }
export function getPaymentStatusLabel(status: PaymentStatus) { return paymentStatuses.find(item => item.value === status)?.label ?? "Pendente"; }
export function getOrderReseller(order: Order, users: LocalUser[]) { return order.resellerId ? users.find(user => user.id === order.resellerId) : undefined; }
export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  if (from === "cancelled" || from === "delivered") return false;
  if (to === "cancelled") return true;
  const sequence: OrderStatus[] = ["pending", "approved", "paid", "separating", "shipped", "delivered"];
  return sequence.indexOf(to) >= sequence.indexOf(from);
}
export type SalesHistoryRange = "1m" | "6m" | "12m" | "custom" | "all";
export type SalesHistoryWindow = { range: SalesHistoryRange; from?: string; to?: string };
export type SalesHistoryPoint = { label: string; value: number; count: number; period: string };
export function getSalesHistoryBounds(window: SalesHistoryWindow, now = new Date()) {
  if (window.range === "custom") return { from: window.from ? new Date(`${window.from}T00:00:00`) : undefined, to: window.to ? new Date(`${window.to}T23:59:59.999`) : undefined };
  if (window.range === "all") return { from: undefined, to: now };
  const from = new Date(now);
  from.setMonth(from.getMonth() - (window.range === "1m" ? 1 : window.range === "12m" ? 12 : 6));
  return { from, to: now };
}
export function filterOrdersBySalesWindow(orders: Order[], window: SalesHistoryWindow, now = new Date()) {
  const bounds = getSalesHistoryBounds(window, now);
  return orders.filter(order => {
    if (order.status === "cancelled") return false;
    const date = new Date(order.saleDate);
    return (!bounds.from || date >= bounds.from) && (!bounds.to || date <= bounds.to);
  });
}
export function buildSalesHistory(orders: Order[], window: SalesHistoryWindow = { range: "6m" }, now = new Date()): SalesHistoryPoint[] {
  const filtered = filterOrdersBySalesWindow(orders, window, now);
  const periods = window.range === "custom" || window.range === "all" ? 6 : window.range === "1m" ? 6 : window.range === "12m" ? 12 : 6;
  const unit = window.range === "1m" ? "day" : "month";
  const points = Array.from({ length: periods }, (_, index) => {
    const date = new Date(now);
    if (unit === "day") date.setDate(now.getDate() - (periods - 1 - index) * 5);
    else date.setMonth(now.getMonth() - (periods - 1 - index));
    const label = unit === "day" ? `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}` : date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const period = unit === "day" ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return { label, value: 0, count: 0, period };
  });
  filtered.forEach(order => {
    const date = new Date(order.saleDate);
    const age = unit === "day" ? Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)) : (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
    const rawIndex = unit === "day" ? periods - 1 - Math.floor(Math.max(0, age) / 5) : periods - 1 - Math.max(0, age);
    const index = window.range === "all" ? Math.min(periods - 1, Math.max(0, rawIndex)) : rawIndex;
    if (index >= 0 && index < points.length) { points[index].value += order.total; points[index].count += 1; }
  });
  return points;
}

export function filterOrders(orders: Order[], query: string, status: OrderStatus | "all", origin: OrderOrigin | "all", customerId: string = "all") {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  return orders.filter(order => {
    const matchesQuery = !normalized || [order.id, order.customerName, ...order.items.map(item => item.productName)].filter(Boolean).some(value => value!.toLocaleLowerCase("pt-BR").includes(normalized));
    const matchesCustomer = customerId === "all" || order.customerId === customerId;
    return matchesQuery && matchesCustomer && (status === "all" || order.status === status) && (origin === "all" || order.origin === origin);
  });
}
