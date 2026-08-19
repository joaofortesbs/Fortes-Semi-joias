import type { Product, ProductVariation, ProductStatus } from "@/lib/localStore";

export const PRODUCT_CATEGORIES = ["Brincos", "Colares", "Anéis", "Pulseiras", "Conjuntos", "Acessórios"] as const;
export const PRODUCT_COLLECTIONS = ["Lançamentos", "Essenciais", "Presentes", "Datas especiais"] as const;
export const PRODUCT_TAGS = ["Destaque", "Lançamento", "Presente", "Mais vendido"] as const;

export type ProductDraft = {
  name: string; imageUrl: string; price: string; category: string; stock: string; status: ProductStatus; costBase: string; sku: string; description: string; variations: ProductVariation[]; tags: string[]; collection: string;
};

export function emptyProductDraft(): ProductDraft { return { name: "", imageUrl: "", price: "", category: "", stock: "", status: "available", costBase: "", sku: "", description: "", variations: [], tags: [], collection: "" }; }

export function productToDraft(product: Product): ProductDraft { return { name: product.name, imageUrl: product.imageUrl ?? "", price: product.price ? String(product.price).replace(".", ",") : "", category: product.category, stock: String(product.stock), status: product.status, costBase: product.costBase !== undefined ? String(product.costBase).replace(".", ",") : "", sku: product.sku ?? "", description: product.description ?? "", variations: product.variations ?? [], tags: product.tags ?? [], collection: product.collection ?? "" }; }

function parseMoney(value: string) { const cleaned = value.replace(/\s/g, "").replace(/R\$/g, "").replace(/\./g, "").replace(",", "."); return Number(cleaned); }
function parseInteger(value: string) { return Number(value.replace(/\D/g, "")); }

export function validateProductDraft(draft: ProductDraft) {
  const errors: Partial<Record<keyof ProductDraft, string>> = {};
  const name = draft.name.trim().replace(/\s+/g, " ");
  const price = parseMoney(draft.price);
  const stock = parseInteger(draft.stock);
  const costBase = draft.costBase.trim() ? parseMoney(draft.costBase) : undefined;
  if (!name) errors.name = "Informe o nome da peça.";
  if (!draft.imageUrl.trim()) errors.imageUrl = "Adicione uma imagem principal da peça.";
  if (!Number.isFinite(price) || price <= 0) errors.price = "Informe um preço de venda maior que zero.";
  if (!draft.category) errors.category = "Selecione uma categoria.";
  if (!draft.stock.trim() || !Number.isInteger(stock) || stock < 0) errors.stock = "Informe um estoque inteiro igual ou maior que zero.";
  if (costBase !== undefined && (!Number.isFinite(costBase) || costBase < 0)) errors.costBase = "O custo-base não pode ser negativo.";
  if (draft.variations.some(variation => !variation.name.trim() || variation.options.some(option => !option.trim()))) errors.variations = "Preencha o nome e as opções das variações.";
  if (draft.status === "available" && stock === 0) errors.status = "Uma peça sem estoque deve ficar indisponível ou pausada.";
  return { valid: Object.keys(errors).length === 0, errors, normalized: { name, imageUrl: draft.imageUrl.trim() || undefined, price, category: draft.category, stock, status: draft.status, costBase, sku: draft.sku.trim().toUpperCase() || undefined, description: draft.description.trim() || undefined, variations: draft.variations.filter(variation => variation.name.trim()), tags: draft.tags, collection: draft.collection || undefined, accent: "#c8a86b" } };
}
