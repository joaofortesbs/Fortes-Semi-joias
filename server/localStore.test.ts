import { afterEach, describe, expect, it } from "vitest";
import { calculateCommission, createAccount, formatCurrency, getSessionUser, login, logout, statusLabel } from "../client/src/lib/localStore";

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
  it("formata valores e expõe status legível", () => { expect(formatCurrency(189.9)).toContain("189,90"); expect(statusLabel.delivered).toBe("Entregue"); });
  it("cria uma conta e permite login por e-mail", () => { const user = createAccount({ name: "Ana Souza", email: "ana@example.com", phone: "11999990000", password: "123456", role: "gestora", commissionRate: 0 }); expect(user.role).toBe("gestora"); expect(getSessionUser()?.email).toBe("ana@example.com"); logout(); expect(getSessionUser()).toBeNull(); expect(login("ana@example.com", "123456", "gestora").name).toBe("Ana Souza"); });
  it("calcula a comissão com arredondamento monetário", () => { expect(calculateCommission(189.9, 30)).toBe(56.97); expect(calculateCommission(239.8, 12.5)).toBe(29.98); });
  it("impede cadastro duplicado", () => { createAccount({ name: "Ana Souza", email: "ana@example.com", phone: "11999990000", password: "123456", role: "gestora", commissionRate: 0 }); expect(() => createAccount({ name: "Outra Ana", email: "ANA@example.com", phone: "11888880000", password: "123456", role: "gestora", commissionRate: 0 })).toThrow("já está cadastrado"); });
});
