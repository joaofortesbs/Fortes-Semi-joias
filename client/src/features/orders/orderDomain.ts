import type { LocalUser, Order, OrderOrigin, OrderStatus, PaymentMethod, PaymentStatus, Product } from "@/lib/localStore";

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
export function filterOrders(orders: Order[], query: string, status: OrderStatus | "all", origin: OrderOrigin | "all") {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  return orders.filter(order => {
    const matchesQuery = !normalized || [order.id, order.customerName, ...order.items.map(item => item.productName)].filter(Boolean).some(value => value!.toLocaleLowerCase("pt-BR").includes(normalized));
    return matchesQuery && (status === "all" || order.status === status) && (origin === "all" || order.origin === origin);
  });
}
