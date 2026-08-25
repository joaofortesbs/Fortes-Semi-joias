import type { LocalUser, Store } from "./localStore";

type AuthResponse = { user: LocalUser };

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? "Não foi possível concluir a operação.");
  }
  return body as T;
}

export function fetchRemoteStore() {
  return request<Store>("/api/store");
}

export function persistRemoteStore(store: Store) {
  return request<Store>("/api/store", {
    method: "PUT",
    body: JSON.stringify(store),
  });
}

export function saveRemoteProductCost(productId: string, costBase: number) {
  return request<void>(`/api/products/${encodeURIComponent(productId)}/private-cost`, {
    method: "PUT",
    body: JSON.stringify({ costBase }),
  });
}

export function fetchRemoteProductCost(productId: string) {
  return request<{ costBase: number | null }>(`/api/products/${encodeURIComponent(productId)}/private-cost`);
}

export function registerRemoteAccount(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: LocalUser["role"];
  inviteToken?: string;
}) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginRemoteAccount(input: {
  email: string;
  password: string;
  role: LocalUser["role"];
}) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchRemoteSession() {
  return request<AuthResponse | { user: null }>("/api/auth/session");
}

export function logoutRemoteAccount() {
  return request<{ success: true }>("/api/auth/logout", { method: "POST" });
}