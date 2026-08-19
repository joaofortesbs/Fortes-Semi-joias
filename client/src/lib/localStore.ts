export type Role = "gestora" | "revendedora";
export type ProductStatus = "available" | "unavailable";
export type OrderStatus = "pending" | "approved" | "separating" | "shipped" | "delivered";

export type ResellerInviteStatus = "not_invited" | "pending" | "accepted" | "expired";

export type LocalUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  role: Role;
  password: string;
  active: boolean;
  commissionRate: number;
  inviteStatus?: ResellerInviteStatus;
  inviteLink?: string;
  createdAt: string;
};

export type ProductVariation = { name: string; options: string[] };
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  accent: string;
  imageUrl?: string;
  description?: string;
  costBase?: number;
  sku?: string;
  variations?: ProductVariation[];
  tags?: string[];
  collection?: string;
  createdAt?: string;
  updatedAt?: string;
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
  privateProductMeta: Record<string, { costBase?: number }>;
  orders: Order[];
  notifications: Notification[];
  sessionUserId: string | null;
};

const STORAGE_KEY = "fernanda-fortes-saas-store-v2-real-data";
const emptyStore: Store = { users: [], products: [], privateProductMeta: {}, orders: [], notifications: [], sessionUserId: null };

function readStore(): Store {
  if (typeof window === "undefined") return structuredClone(emptyStore);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const freshStore = structuredClone(emptyStore);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshStore));
    return freshStore;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Store> & { products?: Product[] };
    const privateProductMeta = parsed.privateProductMeta ?? {};
    const products = (parsed.products ?? []).map(product => {
      const legacyCost = product.costBase;
      if (legacyCost !== undefined) privateProductMeta[product.id] = { costBase: legacyCost };
      const { costBase: _legacyCost, ...publicProduct } = product;
      return publicProduct as Product;
    });
    const normalized = { ...emptyStore, ...parsed, products, privateProductMeta };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
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
export function getProductsForRole(_role: Role) { return readStore().products.map(product => ({ ...product })); }
export function getProductCost(productId: string) { return readStore().privateProductMeta[productId]?.costBase; }
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
export function createReseller(input: { name: string; city: string; inviteLink?: string }) {
  const store = readStore();
  const normalizedName = input.name.trim().replace(/\s+/g, " ");
  const normalizedCity = input.city.trim().replace(/\s+/g, " ");
  if (!normalizedName || !normalizedCity) throw new Error("Nome e cidade são obrigatórios.");
  const existing = store.users.find(user => user.role === "revendedora" && user.name.toLocaleLowerCase("pt-BR") === normalizedName.toLocaleLowerCase("pt-BR") && (user.city ?? "").toLocaleLowerCase("pt-BR") === normalizedCity.toLocaleLowerCase("pt-BR"));
  if (existing) {
    if (input.inviteLink) { existing.inviteLink = input.inviteLink; existing.inviteStatus = "pending"; writeStore(store); }
    return existing;
  }
  const user: LocalUser = { id: crypto.randomUUID(), name: normalizedName, email: "", phone: "", city: normalizedCity, role: "revendedora", password: "", active: false, commissionRate: 0, inviteStatus: input.inviteLink ? "pending" : "not_invited", inviteLink: input.inviteLink, createdAt: new Date().toISOString() };
  store.users.push(user);
  writeStore(store);
  return user;
}

export function updateResellerInvite(userId: string, inviteLink: string) {
  const store = readStore();
  const user = store.users.find(item => item.id === userId && item.role === "revendedora");
  if (!user) throw new Error("Revendedora não encontrada.");
  user.inviteLink = inviteLink;
  user.inviteStatus = "pending";
  writeStore(store);
  return user;
}

export function updateReseller(userId: string, input: { name: string; city: string }) {
  const store = readStore();
  const name = input.name.trim().replace(/\s+/g, " ");
  const city = input.city.trim().replace(/\s+/g, " ");
  if (!name || !city) throw new Error("Nome e cidade são obrigatórios.");
  const duplicate = store.users.find(item => item.role === "revendedora" && item.id !== userId && item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && (item.city ?? "").toLocaleLowerCase("pt-BR") === city.toLocaleLowerCase("pt-BR"));
  if (duplicate) throw new Error("Já existe uma revendedora com este nome nesta cidade.");
  const user = store.users.find(item => item.id === userId && item.role === "revendedora");
  if (!user) throw new Error("Revendedora não encontrada.");
  user.name = name;
  user.city = city;
  writeStore(store);
  return user;
}

export function deleteReseller(userId: string) {
  const store = readStore();
  const index = store.users.findIndex(item => item.id === userId && item.role === "revendedora");
  if (index === -1) throw new Error("Revendedora não encontrada.");
  const [removed] = store.users.splice(index, 1);
  writeStore(store);
  return removed;
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

export function createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt"> & { costBase?: number }) {
  const store = readStore();
  const now = new Date().toISOString();
  const normalizedSku = input.sku?.trim().toUpperCase();
  if (store.products.some(product => normalizedSku && product.sku?.toUpperCase() === normalizedSku)) throw new Error("Este código interno já está cadastrado.");
  if (store.products.some(product => product.name.trim().toLocaleLowerCase("pt-BR") === input.name.trim().toLocaleLowerCase("pt-BR"))) throw new Error("Já existe uma peça com este nome.");
  const { costBase, ...publicInput } = input;
  const product: Product = { ...publicInput, name: input.name.trim().replace(/\s+/g, " "), sku: normalizedSku || undefined, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  store.products.unshift(product);
  if (costBase !== undefined) store.privateProductMeta[product.id] = { costBase };
  writeStore(store);
  return product;
}

export function updateProduct(productId: string, input: Omit<Product, "id" | "createdAt" | "updatedAt"> & { costBase?: number }) {
  const store = readStore();
  const product = store.products.find(item => item.id === productId);
  if (!product) throw new Error("Peça não encontrada.");
  const normalizedSku = input.sku?.trim().toUpperCase();
  if (store.products.some(item => item.id !== productId && normalizedSku && item.sku?.toUpperCase() === normalizedSku)) throw new Error("Este código interno já está cadastrado.");
  if (store.products.some(item => item.id !== productId && item.name.trim().toLocaleLowerCase("pt-BR") === input.name.trim().toLocaleLowerCase("pt-BR"))) throw new Error("Já existe uma peça com este nome.");
  const { costBase, ...publicInput } = input;
  Object.assign(product, { ...publicInput, name: input.name.trim().replace(/\s+/g, " "), sku: normalizedSku || undefined, updatedAt: new Date().toISOString() });
  if (costBase === undefined) delete store.privateProductMeta[productId]; else store.privateProductMeta[productId] = { costBase };
  writeStore(store);
  return product;
}

export function deleteProduct(productId: string) {
  const store = readStore();
  const index = store.products.findIndex(item => item.id === productId);
  if (index === -1) throw new Error("Peça não encontrada.");
  const [removed] = store.products.splice(index, 1);
  delete store.privateProductMeta[productId];
  writeStore(store);
  return removed;
}

export const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
export const calculateCommission = (total: number, rate: number) => Number((total * (rate / 100)).toFixed(2));
export const statusLabel: Record<OrderStatus, string> = { pending: "Pendente", approved: "Aprovado", separating: "Em separação", shipped: "Enviado", delivered: "Entregue" };
