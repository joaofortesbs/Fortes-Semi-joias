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

const STORAGE_KEY = "fernanda-fortes-saas-store-v1";

const seed: Store = {
  users: [
    {
      id: "gestora-demo",
      name: "Fernanda Fortes",
      email: "gestora@fernandafortes.com",
      phone: "(11) 99999-0000",
      role: "gestora",
      password: "123456",
      active: true,
      commissionRate: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "revendedora-demo",
      name: "Marina Alves",
      email: "marina@exemplo.com",
      phone: "(11) 98888-0000",
      role: "revendedora",
      password: "123456",
      active: true,
      commissionRate: 30,
      createdAt: new Date().toISOString(),
    },
  ],
  products: [
    { id: "p1", name: "Colar Aurora", category: "Colares", price: 189.9, stock: 12, status: "available", accent: "#c8a86b" },
    { id: "p2", name: "Brinco Lumière", category: "Brincos", price: 119.9, stock: 18, status: "available", accent: "#e4cfa4" },
    { id: "p3", name: "Anel Siena", category: "Anéis", price: 149.9, stock: 7, status: "available", accent: "#b8955b" },
    { id: "p4", name: "Pulseira Essenza", category: "Pulseiras", price: 169.9, stock: 0, status: "unavailable", accent: "#d7c2a0" },
  ],
  orders: [
    { id: "PED-1048", resellerId: "revendedora-demo", items: [{ productId: "p1", quantity: 1 }], total: 189.9, commission: 56.97, status: "approved", createdAt: "2026-08-15T10:00:00.000Z" },
    { id: "PED-1047", resellerId: "revendedora-demo", items: [{ productId: "p2", quantity: 2 }], total: 239.8, commission: 71.94, status: "delivered", createdAt: "2026-08-11T10:00:00.000Z" },
    { id: "PED-1046", resellerId: "revendedora-demo", items: [{ productId: "p3", quantity: 1 }], total: 149.9, commission: 44.97, status: "shipped", createdAt: "2026-08-06T10:00:00.000Z" },
  ],
  notifications: [
    { id: "n1", title: "Novo pedido recebido", message: "Marina Alves enviou o pedido PED-1048.", read: false, createdAt: "2026-08-15T10:15:00.000Z" },
    { id: "n2", title: "Cadastro aprovado", message: "Seu acesso à rede Fernanda Fortes está ativo.", read: true, createdAt: "2026-08-12T08:00:00.000Z" },
  ],
  sessionUserId: null,
};

function readStore(): Store {
  if (typeof window === "undefined") return seed;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const freshSeed = structuredClone(seed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshSeed));
    return freshSeed;
  }
  try {
    return JSON.parse(raw) as Store;
  } catch {
    const freshSeed = structuredClone(seed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshSeed));
    return freshSeed;
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
