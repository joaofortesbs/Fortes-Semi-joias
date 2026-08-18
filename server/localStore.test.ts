import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateCommission, createAccount, createReseller, formatCurrency, getSessionUser, getStore, login, logout, statusLabel, updateResellerInvite } from "../client/src/lib/localStore";

const storage = new Map<string, string>();
const fakeWindow = {
  localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
};
Object.defineProperty(globalThis, "window", { value: fakeWindow, writable: true });
afterEach(() => storage.clear());

describe("localStore", () => {
  it("inicia sem dados demonstrativos", () => { const store = getStore(); expect(store.users).toHaveLength(0); expect(store.products).toHaveLength(0); expect(store.orders).toHaveLength(0); expect(store.notifications).toHaveLength(0); });
  it("não reintroduz dados demonstrativos nas interfaces principais", () => { const files = ["LandingPage.tsx", "ManagerDashboard.tsx", "ResellerDashboard.tsx"].map(file => readFileSync(resolve(process.cwd(), "client/src/pages", file), "utf8")).join("\n"); expect(files).toContain("Sem dados"); expect(files).not.toMatch(/18\\.420|18420|12,8|8,4|4,2|10,1|86%|\\+28%|PED-10|Marina Alves|R\\$ 579|R\\$ 173/); });
  it("formata valores e expõe status legível", () => { expect(formatCurrency(189.9)).toContain("189,90"); expect(statusLabel.delivered).toBe("Entregue"); });
  it("cria uma conta e permite login por e-mail", () => { const user = createAccount({ name: "Ana Souza", email: "ana@example.com", phone: "11999990000", password: "123456", role: "gestora", commissionRate: 0 }); expect(user.role).toBe("gestora"); expect(getSessionUser()?.email).toBe("ana@example.com"); logout(); expect(getSessionUser()).toBeNull(); expect(login("ana@example.com", "123456", "gestora").name).toBe("Ana Souza"); });
  it("cria convite novo com link e status pendente", () => { const created = createReseller({ name: "Camila Rocha", city: "Curitiba", inviteLink: "https://example.com/convite/res-new" }); expect(created.inviteLink).toBe("https://example.com/convite/res-new"); expect(created.inviteStatus).toBe("pending"); expect(getStore().users).toHaveLength(1); });
  it("registra uma revendedora e reaproveita o mesmo registro ao convidar novamente", () => { const first = createReseller({ name: "Marina Alves", city: "São Paulo" }); const second = createReseller({ name: " Marina   Alves ", city: "São Paulo" }); expect(second.id).toBe(first.id); expect(getStore().users).toHaveLength(1); const updated = updateResellerInvite(first.id, "https://example.com/convite/res-test"); expect(updated.inviteStatus).toBe("pending"); expect(updated.inviteLink).toContain("res-test"); });
  it("calcula a comissão com arredondamento monetário", () => { expect(calculateCommission(189.9, 30)).toBe(56.97); expect(calculateCommission(239.8, 12.5)).toBe(29.98); });
  it("impede cadastro duplicado", () => { createAccount({ name: "Ana Souza", email: "ana@example.com", phone: "11999990000", password: "123456", role: "gestora", commissionRate: 0 }); expect(() => createAccount({ name: "Outra Ana", email: "ANA@example.com", phone: "11888880000", password: "123456", role: "gestora", commissionRate: 0 })).toThrow("já está cadastrado"); });
});
