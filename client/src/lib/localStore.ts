export type Role = "gestora" | "revendedora";
export type ProductStatus = "available" | "unavailable";
export type OrderStatus = "pending" | "approved" | "separating" | "shipped" | "delivered";

export type LocalUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
  active: boolean;
  commissionRate: number;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  accent: string;
};

export type Order = {
  id: string;
  resellerId: string;
  items: { productId: string; quantity: number }[];
  total: number;
  commission: number;
  status: OrderStatus;
  createdAt: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type Store = {
  users: LocalUser[];
  products: Product[];
  orders: Order[];
  notifications: Notification[];
  sessionUserId: string | null;
};

const STORAGE_KEY = "fernanda-fortes-saas-store-v2-real-data";
const emptyStore: Store = { users: [], products: [], orders: [], notifications: [], sessionUserId: null };

function readStore(): Store {
  if (typeof window === "undefined") return structuredClone(emptyStore);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const freshStore = structuredClone(emptyStore);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshStore));
    return freshStore;
  }
  try {
    return JSON.parse(raw) as Store;
  } catch {
    const freshStore = structuredClone(emptyStore);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshStore));
    return freshStore;
  }
}

function writeStore(store: Store) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("fernanda-store-updated"));
}

export function getStore() { return readStore(); }
export function getSessionUser() {
  const store = readStore();
  return store.users.find(user => user.id === store.sessionUserId) ?? null;
}
export function subscribeStore(callback: () => void) {
  window.addEventListener("fernanda-store-updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("fernanda-store-updated", callback);
    window.removeEventListener("storage", callback);
  };
}
export function createAccount(input: Omit<LocalUser, "id" | "active" | "createdAt">) {
  const store = readStore();
  if (store.users.some(user => user.email.toLowerCase() === input.email.toLowerCase())) throw new Error("Este e-mail já está cadastrado.");
  const user: LocalUser = { ...input, id: crypto.randomUUID(), active: input.role === "gestora", createdAt: new Date().toISOString() };
  store.users.push(user);
  store.sessionUserId = user.id;
  if (user.role === "revendedora" && !user.active) store.notifications.unshift({ id: crypto.randomUUID(), title: "Novo cadastro recebido", message: `${user.name} solicitou acesso à rede.`, read: false, createdAt: new Date().toISOString() });
  writeStore(store);
  return user;
}
export function login(identifier: string, password: string, role: Role) {
  const store = readStore();
  const user = store.users.find(item => (item.email.toLowerCase() === identifier.toLowerCase() || item.name.toLowerCase() === identifier.toLowerCase()) && item.password === password && item.role === role);
  if (!user) throw new Error("Confira seus dados e o perfil selecionado.");
  if (!user.active) throw new Error("Seu cadastro aguarda aprovação da gestora.");
  store.sessionUserId = user.id;
  writeStore(store);
  return user;
}
export function logout() { const store = readStore(); store.sessionUserId = null; writeStore(store); }
export function updateStore(mutator: (store: Store) => void) { const store = readStore(); mutator(store); writeStore(store); return store; }
export const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
export const calculateCommission = (total: number, rate: number) => Number((total * (rate / 100)).toFixed(2));
export const statusLabel: Record<OrderStatus, string> = { pending: "Pendente", approved: "Aprovado", separating: "Em separação", shipped: "Enviado", delivered: "Entregue" };
