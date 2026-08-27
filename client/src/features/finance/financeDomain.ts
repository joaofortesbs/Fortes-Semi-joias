import { getProductCost, type LocalUser, type Order, type Product } from "@/lib/localStore";

export type FinanceTab = "today" | "receivables" | "payables" | "commissions" | "margin" | "cashflow";
export type FinanceStatus = "open" | "partial" | "paid" | "overdue" | "cancelled";
export type Settlement = { id: string; amount: number; date: string; method: string; note?: string };
export type Payable = { id: string; description: string; category: string; supplier?: string; amount: number; dueDate: string; status: FinanceStatus; paidAmount: number; createdAt: string; settlements: Settlement[] };
export type FinanceSnapshot = { payables: Payable[] };
export type Receivable = { id: string; order: Order; dueDate: string; amount: number; paidAmount: number; status: FinanceStatus; daysLate: number };

const DAY = 86_400_000;
export const money = (value: number) => Number(value.toFixed(2));
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, days: number) => new Date(new Date(`${iso}T12:00:00`).getTime() + days * DAY).toISOString().slice(0, 10);
export const formatDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");

export function buildReceivables(orders: Order[], today = todayISO()): Receivable[] {
  return orders.filter(order => order.status !== "cancelled").map(order => {
    const paid = order.paymentStatus === "paid" ? order.total : 0;
    const dueDate = order.saleDate.slice(0, 10);
    const open = money(order.total - paid);
    const daysLate = open > 0 && dueDate < today ? Math.floor((new Date(`${today}T12:00:00`).getTime() - new Date(`${dueDate}T12:00:00`).getTime()) / DAY) : 0;
    return { id: `order:${order.id}`, order, dueDate, amount: order.total, paidAmount: paid, status: open <= 0 ? "paid" : daysLate > 0 ? "overdue" : paid > 0 ? "partial" : "open", daysLate };
  });
}

export function buildFinanceMetrics(receivables: Receivable[], payables: Payable[], today = todayISO()) {
  const inSeven = addDays(today, 7);
  const receivableNext7 = money(receivables.filter(item => item.status !== "paid" && item.dueDate >= today && item.dueDate <= inSeven).reduce((sum, item) => sum + item.amount - item.paidAmount, 0));
  const overdue = money(receivables.filter(item => item.status === "overdue").reduce((sum, item) => sum + item.amount - item.paidAmount, 0));
  const payableNext7 = money(payables.filter(item => item.status !== "paid" && item.dueDate >= today && item.dueDate <= inSeven).reduce((sum, item) => sum + item.amount - item.paidAmount, 0));
  const confirmedIn = money(receivables.reduce((sum, item) => sum + item.paidAmount, 0));
  const confirmedOut = money(payables.reduce((sum, item) => sum + item.paidAmount, 0));
  return { receivableNext7, overdue, payableNext7, confirmedCash: money(confirmedIn - confirmedOut), confirmedIn, confirmedOut };
}

export function calculateMargin(order: Order, products: Product[], users: LocalUser[]) {
  const cost = order.items.reduce((sum, item) => sum + (getProductCost(item.productId) ?? 0) * item.quantity, 0);
  const reseller = order.resellerId ? users.find(user => user.id === order.resellerId) : undefined;
  const commission = reseller ? order.commission : 0;
  const known = order.items.every(item => getProductCost(item.productId) !== undefined);
  const value = money(order.total - cost - commission);
  return { value, percentage: order.total ? money((value / order.total) * 100) : 0, known, cost, commission };
}

export function formatBRL(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
export function statusLabel(status: FinanceStatus) { return ({ open: "Em aberto", partial: "Parcial", paid: "Pago", overdue: "Em atraso", cancelled: "Cancelado" } as const)[status]; }
