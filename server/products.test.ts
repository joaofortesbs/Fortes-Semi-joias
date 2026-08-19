import { beforeEach, describe, expect, it } from "vitest";
import { createProduct, deleteProduct, getProductCost, getProductsForRole, getStore, updateProduct } from "../client/src/lib/localStore";
import { emptyProductDraft, formatMoneyInput, validateProductDraft } from "../client/src/features/catalog/productDomain";

const storage = new Map<string, string>();
const localStorageMock = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) };

globalThis.window = { localStorage: localStorageMock, dispatchEvent: () => true, addEventListener: () => undefined, removeEventListener: () => undefined } as unknown as Window & typeof globalThis;

describe("productDomain", () => {
  beforeEach(() => { storage.clear(); });
  it("exige imagem, nome, categoria, preço e estoque", () => {
    const result = validateProductDraft(emptyProductDraft());
    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({ imageUrl: expect.any(String), name: expect.any(String), category: expect.any(String), price: expect.any(String) });
  });
  it("normaliza valores comerciais e preserva custo privado no modelo", () => {
    const result = validateProductDraft({ ...emptyProductDraft(), imageUrl: "data:image/png;base64,abc", name: "  Brinco   Aurora ", category: "Brincos", price: "R$ 129,90", stock: "4", costBase: "48,50", status: "available" });
    expect(result.valid).toBe(true);
    expect(result.normalized).toMatchObject({ name: "Brinco Aurora", price: 129.9, stock: 4, costBase: 48.5 });
  });
  it("impede peça disponível sem estoque", () => {
    const result = validateProductDraft({ ...emptyProductDraft(), imageUrl: "data:image/png;base64,abc", name: "Colar Aurora", category: "Colares", price: "100", stock: "0", status: "available" });
    expect(result.errors.status).toContain("sem estoque");
  });
  it("valida variações simples sem opções vazias", () => {
    const result = validateProductDraft({ ...emptyProductDraft(), imageUrl: "data:image/png;base64,abc", name: "Anel Luz", category: "Anéis", price: "100", stock: "1", status: "available", variations: [{ name: "Banho", options: [""] }] });
    expect(result.errors.variations).toContain("variações");
  });
  it("cria, atualiza e remove uma peça com persistência", () => {
    const created = createProduct({ name: "Brinco Aurora", imageUrl: "data:image/png;base64,abc", category: "Brincos", price: 129.9, stock: 4, status: "available", accent: "#c8a86b", costBase: 48.5, sku: "AUR-01", tags: ["Destaque"], collection: "Lançamentos", variations: [] });
    expect(getStore().products[0]).toMatchObject({ id: created.id, name: "Brinco Aurora" });
    expect(getProductCost(created.id)).toBe(48.5);
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateInput } = created;
    const updated = updateProduct(created.id, { ...updateInput, name: "Brinco Aurora Editado", price: 149.9 });
    expect(updated.name).toBe("Brinco Aurora Editado");
    deleteProduct(created.id);
    expect(getStore().products).toHaveLength(0);
  });
  it("impede duplicidade de nome sem depender de SKU", () => {
    createProduct({ name: "Colar Luz", imageUrl: "data:image/png;base64,abc", category: "Colares", price: 100, stock: 1, status: "available", accent: "#c8a86b", showInStore: false });
    expect(() => createProduct({ name: "colar luz", imageUrl: "data:image/png;base64,abc", category: "Colares", price: 100, stock: 1, status: "available", accent: "#c8a86b", showInStore: false })).toThrow("nome");
  });
  it("formata valores monetários em reais e assume estoque 1 quando vazio", () => {
    expect(formatMoneyInput("12990")).toBe("129,90");
    expect(formatMoneyInput("R$ 1.299,90")).toBe("1.299,90");
    const result = validateProductDraft({ ...emptyProductDraft(), imageUrl: "data:image/png;base64,abc", name: "Peça sem estoque informado", category: "Brincos", price: "129,90" });
    expect(result.valid).toBe(true);
    expect(result.normalized.stock).toBe(1);
    expect(result.normalized.showInStore).toBe(false);
  });
  it("persiste o toggle showInStore em create e update", () => {
    const created = createProduct({ name: "Brinco Loja", imageUrl: "data:image/png;base64,abc", category: "Brincos", price: 100, stock: 1, status: "available", accent: "#c8a86b", showInStore: true });
    expect(getStore().products[0]?.showInStore).toBe(true);
    updateProduct(created.id, { ...created, showInStore: false });
    expect(getStore().products[0]?.showInStore).toBe(false);
  });
  it("remove custo-base do catálogo consumido pela revendedora", () => {
    createProduct({ name: "Pulseira Essencial", imageUrl: "data:image/png;base64,abc", category: "Pulseiras", price: 100, stock: 1, status: "available", accent: "#c8a86b", costBase: 30 });
    expect(getProductsForRole("gestora")[0]?.costBase).toBeUndefined();
    expect(getProductsForRole("revendedora")[0]?.costBase).toBeUndefined();
    expect(getProductCost(getStore().products[0]!.id)).toBe(30);
  });
});
