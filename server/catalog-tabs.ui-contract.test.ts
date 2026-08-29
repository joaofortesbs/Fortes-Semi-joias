import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const catalogSection = readFileSync(new URL("../client/src/features/catalog/CatalogSection.tsx", import.meta.url), "utf8");

describe("catalog tabs UI contract", () => {
  it("renderiza abas acessíveis e painéis associados para Peças e Coleções", () => {
    expect(catalogSection).toContain('role="tablist"');
    expect(catalogSection).toContain('id="catalog-tab-products"');
    expect(catalogSection).toContain('id="catalog-tab-collections"');
    expect(catalogSection).toContain('role="tabpanel"');
    expect(catalogSection).toContain('aria-labelledby="catalog-tab-products"');
    expect(catalogSection).toContain('aria-labelledby="catalog-tab-collections"');
    expect(catalogSection).toContain('tabIndex={tab === "products" ? 0 : -1}');
  });

  it("alterna a ação principal conforme a aba ativa", () => {
    const productsAction = catalogSection.indexOf("Adicionar peça</Button>");
    const collectionsAction = catalogSection.indexOf("Nova coleção</Button>");
    expect(productsAction).toBeGreaterThan(-1);
    expect(collectionsAction).toBeGreaterThan(-1);
    expect(catalogSection).toContain('tab === "products" ? <Button');
    expect(catalogSection).toContain('placeholder={tab === "products" ? "Buscar por nome, categoria ou etiqueta" : "Buscar coleção"}');
  });
});
