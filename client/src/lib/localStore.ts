export type Role = "gestora" | "revendedora";
export type ProductStatus = "available" | "unavailable";
export type OrderStatus = "draft" | "pending" | "approved" | "paid" | "separating" | "shipped" | "delivered" | "cancelled";
export type OrderOrigin = "direct" | "reseller";
export type PaymentMethod = "pix" | "card" | "cash" | "transfer" | "pending";
export type PaymentStatus = "pending" | "paid" | "partially_paid";
export type OrderEntryType = "detailed" | "general";

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

export type Customer = { id: string; name: string; phone: string; email?: string; createdAt: string; updatedAt: string };

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
  variations?: ProductVariation[];
  showInStore?: boolean;
  tags?: string[];
  collection?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderItem = { productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number };
export type OrderHistoryEntry = { status: OrderStatus; at: string; by?: string };
export type Order = {
  id: string;
  origin: OrderOrigin;
  entryType: OrderEntryType;
  resellerId?: string;
  customerId?: string;
  customerName?: string;
  customerContact?: string;
  items: OrderItem[];
  total: number;
  commission: number;
  commissionRate: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  saleDate: string;
  notes?: string;
  proofReference?: string;
  requestId?: string;
  createdAt: string;
  updatedAt: string;
  history: OrderHistoryEntry[];
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
  customers: Customer[];
  products: Product[];
  orders: Order[];
  notifications: Notification[];
  sessionUserId: string | null;
};

const STORAGE_KEY = "fernanda-fortes-saas-store-v2-real-data";
const emptyStore: Store = { users: [], customers: [], products: [], orders: [], notifications: [], sessionUserId: null };
let privateProductMeta: Record<string, { costBase?: number }> = {};

function readStore(): Store {
  if (typeof window === "undefined") return structuredClone(emptyStore);
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const freshStore = structuredClone(emptyStore);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshStore));
    return freshStore;
  }
  try {
    type LegacyProduct = Product & { costBase?: number; sku?: string };
    const parsed = JSON.parse(raw) as Partial<Store> & { products?: LegacyProduct[] };
    const legacyProducts = (parsed.products ?? []) as LegacyProduct[];
    const products = legacyProducts.map(product => {
      const legacyCost = product.costBase;
      if (legacyCost !== undefined) privateProductMeta[product.id] = { costBase: legacyCost };
      const { costBase: _legacyCost, sku: _legacySku, ...publicProduct } = product;
      return publicProduct as Product;
    });
    const normalized = { ...emptyStore, ...parsed, customers: parsed.customers ?? [], products } as Store;
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
export function getProductCost(productId: string) { readStore(); return privateProductMeta[productId]?.costBase; }
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

export function createCustomer(input: { name: string; phone: string; email?: string }) {
  const store = readStore();
  const name = input.name.trim().replace(/\s+/g, " ");
  const phone = input.phone.trim();
  const email = input.email?.trim().toLowerCase() || undefined;
  if (!name || !phone) throw new Error("Nome e telefone do cliente são obrigatórios.");
  const duplicate = store.customers.find(customer => customer.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && customer.phone === phone);
  if (duplicate) return duplicate;
  const now = new Date().toISOString();
  const customer: Customer = { id: crypto.randomUUID(), name, phone, email, createdAt: now, updatedAt: now };
  store.customers.unshift(customer);
  writeStore(store);
  return customer;
}

export function createOrder(input: Omit<Order, "id" | "createdAt" | "updatedAt" | "history" | "commission" | "commissionRate" | "total" | "items" | "customerId" | "customerName" | "customerContact" | "notes" | "proofReference"> & { items: Array<{ productId: string; quantity: number }>; customerId?: string; resellerId?: string; manualDescription?: string; manualTotal?: number }) {
  const store = readStore();
  if (input.requestId) { const existing = store.orders.find(order => order.requestId === input.requestId); if (existing) return existing; }
  if (input.origin === "reseller" && !input.resellerId) throw new Error("Selecione a revendedora responsável.");
  if (input.origin === "direct") input.resellerId = undefined;
  if (input.entryType === "general") {
    if (!input.manualDescription?.trim() || !input.manualTotal || input.manualTotal <= 0) throw new Error("Informe a descrição e o valor da venda geral.");
    input.items = [{ productId: "general-sale", quantity: 1 }];
  }
  if (!input.items.length) throw new Error("Adicione ao menos uma peça ao pedido.");
  const resolvedItems: OrderItem[] = [];
  for (const item of input.items) {
    const product = store.products.find(candidate => candidate.id === item.productId);
    if (input.entryType === "general" && item.productId === "general-sale") {
      resolvedItems.push({ productId: "general-sale", productName: input.manualDescription!.trim(), unitPrice: input.manualTotal!, quantity: 1, subtotal: Number(input.manualTotal!.toFixed(2)) });
      continue;
    }
    if (!product || product.status !== "available") throw new Error("Uma das peças selecionadas não está disponível.");
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || product.stock < item.quantity) throw new Error(`Estoque insuficiente para ${product.name}.`);
    resolvedItems.push({ productId: product.id, productName: product.name, unitPrice: product.price, quantity: item.quantity, subtotal: Number((product.price * item.quantity).toFixed(2)) });
  }
  const total = Number(resolvedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const reseller = input.resellerId ? store.users.find(user => user.id === input.resellerId && user.role === "revendedora") : undefined;
  const commissionRate = reseller ? reseller.commissionRate : 0;
  const commission = calculateCommission(total, commissionRate);
  const now = new Date().toISOString();
  resolvedItems.forEach(item => { const product = store.products.find(candidate => candidate.id === item.productId); if (product) product.stock -= item.quantity; });
  const selectedCustomer = input.customerId ? store.customers.find(customer => customer.id === input.customerId) : undefined;
  if (input.customerId && !selectedCustomer) throw new Error("Cliente selecionado não foi encontrado.");
  const order: Order = { ...input, customerId: selectedCustomer?.id, customerName: selectedCustomer?.name, customerContact: selectedCustomer?.phone, items: resolvedItems, total, commission, commissionRate, id: crypto.randomUUID(), createdAt: now, updatedAt: now, history: [{ status: input.status, at: now }] };
  store.orders.unshift(order);
  store.notifications.unshift({ id: crypto.randomUUID(), title: "Novo pedido registrado", message: input.origin === "direct" ? "Uma venda direta foi registrada." : "Um pedido de revendedora foi enviado para acompanhamento.", read: false, createdAt: now });
  writeStore(store);
  return order;
}

function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus) {
  if (from === "cancelled" || from === "delivered") return false;
  if (to === "cancelled") return true;
  const sequence: OrderStatus[] = ["pending", "approved", "paid", "separating", "shipped", "delivered"];
  return sequence.indexOf(to) >= sequence.indexOf(from);
}

export function updateOrderStatus(orderId: string, status: OrderStatus, by?: string) {
  const store = readStore();
  const order = store.orders.find(item => item.id === orderId);
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.status === "cancelled") throw new Error("Um pedido cancelado não pode ser alterado.");
  if (order.status === status) return order;
  if (!canTransitionOrderStatus(order.status, status)) throw new Error("Transição de status inválida para este pedido.");
  if (status === "cancelled") order.items.forEach(item => { const product = store.products.find(candidate => candidate.id === item.productId); if (product) product.stock += item.quantity; });
  const now = new Date().toISOString();
  order.status = status; order.updatedAt = now; order.history.push({ status, at: now, by });
  if (status === "paid") order.paymentStatus = "paid";
  writeStore(store);
  return order;
}

export function updateOrderDetails(orderId: string, input: { customerId?: string; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; saleDate: string; status: OrderStatus }, by?: string) {
  const store = readStore();
  const order = store.orders.find(item => item.id === orderId);
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.status === "cancelled" && input.status !== "cancelled") throw new Error("Um pedido cancelado não pode ser reaberto.");
  if (input.status !== order.status && !canTransitionOrderStatus(order.status, input.status)) throw new Error("Transição de status inválida para este pedido.");
  const selectedCustomer = input.customerId ? store.customers.find(customer => customer.id === input.customerId) : undefined;
  if (input.customerId && !selectedCustomer) throw new Error("Cliente selecionado não foi encontrado.");
  if (input.status === "cancelled" && order.status !== "cancelled") order.items.forEach(item => { const product = store.products.find(candidate => candidate.id === item.productId); if (product) product.stock += item.quantity; });
  const now = new Date().toISOString();
  order.customerId = selectedCustomer?.id;
  order.customerName = selectedCustomer?.name;
  order.customerContact = selectedCustomer?.phone;
  order.paymentMethod = input.paymentMethod;
  order.paymentStatus = input.status === "paid" ? "paid" : input.paymentStatus;
  order.saleDate = input.saleDate;
  if (input.status !== order.status) { order.status = input.status; order.history.push({ status: input.status, at: now, by }); }
  order.updatedAt = now;
  writeStore(store);
  return order;
}

export function createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt"> & { costBase?: number }) {
  const store = readStore();
  const now = new Date().toISOString();
  if (store.products.some(product => product.name.trim().toLocaleLowerCase("pt-BR") === input.name.trim().toLocaleLowerCase("pt-BR"))) throw new Error("Já existe uma peça com este nome.");
  const { costBase, ...publicInput } = input;
  const product: Product = { ...publicInput, name: input.name.trim().replace(/\s+/g, " "), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  store.products.unshift(product);
  if (costBase !== undefined) privateProductMeta[product.id] = { costBase };
  writeStore(store);
  return product;
}

export function updateProduct(productId: string, input: Omit<Product, "id" | "createdAt" | "updatedAt"> & { costBase?: number }) {
  const store = readStore();
  const product = store.products.find(item => item.id === productId);
  if (!product) throw new Error("Peça não encontrada.");
  if (store.products.some(item => item.id !== productId && item.name.trim().toLocaleLowerCase("pt-BR") === input.name.trim().toLocaleLowerCase("pt-BR"))) throw new Error("Já existe uma peça com este nome.");
  const { costBase, ...publicInput } = input;
  Object.assign(product, { ...publicInput, name: input.name.trim().replace(/\s+/g, " "), updatedAt: new Date().toISOString() });
  if (costBase === undefined) delete privateProductMeta[productId]; else privateProductMeta[productId] = { costBase };
  writeStore(store);
  return product;
}

export function deleteProduct(productId: string) {
  const store = readStore();
  const index = store.products.findIndex(item => item.id === productId);
  if (index === -1) throw new Error("Peça não encontrada.");
  const [removed] = store.products.splice(index, 1);
  delete privateProductMeta[productId];
  writeStore(store);
  return removed;
}

export const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
export const calculateCommission = (total: number, rate: number) => Number((total * (rate / 100)).toFixed(2));
export const statusLabel: Record<OrderStatus, string> = { draft: "Rascunho", pending: "Pendente", approved: "Aprovado", paid: "Pago", separating: "Em separação", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado" };
