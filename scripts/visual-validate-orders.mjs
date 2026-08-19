import { chromium } from "playwright";

async function assertVisible(locator, label) { if (await locator.count() === 0) throw new Error(`Elemento não encontrado: ${label}`); }
async function assertAbsent(locator, label) { if (await locator.count() !== 0) throw new Error(`Elemento deveria estar ausente: ${label}`); }
async function assertSelected(locator, label) { const value = await locator.inputValue(); if (!value) throw new Error(`Nenhuma seleção encontrada: ${label}`); }

const previewUrl = "https://3000-iidx99rxqb3of3lvcxn3i-39bdd11e.us4.manus.computer/";
const manager = { id: "visual-order-manager", name: "Gestora de validação", email: "visual-orders@example.test", phone: "", role: "gestora", password: "", active: true, commissionRate: 0, createdAt: new Date().toISOString() };
const reseller = { id: "visual-order-reseller", name: "Ana Lima", email: "", phone: "", city: "Recife", role: "revendedora", password: "", active: true, commissionRate: 20, inviteStatus: "accepted", createdAt: new Date().toISOString() };
const now = new Date().toISOString();
const store = { users: [manager, reseller], customers: [], products: [{ id: "visual-order-product", name: "Colar Aura", category: "Colares", price: 120, stock: 3, status: "available", accent: "#c8a86b", showInStore: true, createdAt: now, updatedAt: now }], orders: [{ id: "visual-order-record", entryType: "detailed", origin: "direct", resellerId: undefined, customerId: undefined, customerName: undefined, customerContact: undefined, items: [{ productId: "visual-order-product", productName: "Colar Aura", quantity: 1, unitPrice: 120, subtotal: 120 }], total: 120, commission: 0, status: "delivered", paymentMethod: "pix", paymentStatus: "paid", saleDate: now, createdAt: now, updatedAt: now, history: [{ status: "delivered", changedAt: now, changedBy: manager.id }] }], notifications: [], sessionUserId: manager.id };
const storageKey = "fernanda-fortes-saas-store-v2-real-data";
const browser = await chromium.launch({ headless: true });
const screenshots = "/home/ubuntu/screenshots";

const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const desktopPage = await desktopContext.newPage();
await desktopPage.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: storageKey, value: store });
await desktopPage.goto(previewUrl, { waitUntil: "networkidle" });
await desktopPage.getByRole("button", { name: "Pedidos" }).click();
await desktopPage.screenshot({ path: `${screenshots}/orders-desktop-list.png`, fullPage: true });
await desktopPage.getByRole("button", { name: "Pedidos" }).click();
await assertVisible(desktopPage.getByRole("button", { name: /Inspecionar pedido/ }), "botão de inspeção somente com ícone desktop");
await desktopPage.getByRole("button", { name: "Registrar venda" }).click();
await assertVisible(desktopPage.getByLabel("Trocar para venda geral"), "toggle vetorial desktop");
await assertVisible(desktopPage.getByLabel("Selecionar cliente"), "seletor de cliente desktop");
await assertAbsent(desktopPage.getByText("Selecione a revendedora na linha do catálogo."), "mensagem auxiliar de revendedora desktop");
await assertAbsent(desktopPage.getByText("Venda direta sem revendedora vinculada."), "mensagem de venda direta desktop");
await assertAbsent(desktopPage.getByText("Referência do comprovante (opcional)"), "referência de comprovante desktop");
await assertAbsent(desktopPage.getByText("Observações internas"), "observações desktop");
await assertAbsent(desktopPage.getByText("Contato (opcional)"), "contato desktop");
await assertAbsent(desktopPage.getByText("Cliente (opcional)"), "cliente textual desktop");
await desktopPage.getByRole("button", { name: "Novo cliente" }).click();
await desktopPage.getByLabel("Nome do cliente").fill("Cliente Visual Desktop");
await desktopPage.getByLabel("Telefone ou WhatsApp").fill("11999990000");
await desktopPage.getByRole("button", { name: "Registrar cliente" }).click();
await assertSelected(desktopPage.getByLabel("Selecionar cliente"), "cliente desktop");
await desktopPage.getByRole("button", { name: "Venda geral" }).click();
await desktopPage.getByLabel("Descrição da venda").fill("Venda agregada de validação");
await desktopPage.getByLabel("Valor total").fill("250,00");
await desktopPage.screenshot({ path: `${screenshots}/orders-desktop-general-modal.png`, fullPage: true });
await desktopContext.close();

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobileContext.newPage();
await mobilePage.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: storageKey, value: store });
await mobilePage.goto(previewUrl, { waitUntil: "networkidle" });
await mobilePage.getByRole("button", { name: "Abrir menu" }).click();
await mobilePage.getByRole("button", { name: "Revendedoras" }).click();
await mobilePage.getByRole("button", { name: "Novo pedido" }).click();
await assertVisible(mobilePage.getByLabel("Trocar para venda geral"), "toggle vetorial mobile");
await assertVisible(mobilePage.getByLabel("Selecionar cliente"), "seletor de cliente mobile");
await assertAbsent(mobilePage.getByText("Selecione a revendedora na linha do catálogo."), "mensagem auxiliar de revendedora mobile");
await assertAbsent(mobilePage.getByText("Venda direta sem revendedora vinculada."), "mensagem de venda direta mobile");
await assertAbsent(mobilePage.getByText("Referência do comprovante (opcional)"), "referência de comprovante mobile");
await assertAbsent(mobilePage.getByText("Observações internas"), "observações mobile");
await assertAbsent(mobilePage.getByText("Contato (opcional)"), "contato mobile");
await assertAbsent(mobilePage.getByText("Cliente (opcional)"), "cliente textual mobile");
await mobilePage.getByRole("button", { name: "Novo cliente" }).click();
await mobilePage.getByLabel("Nome do cliente").fill("Cliente Visual Mobile");
await mobilePage.getByLabel("Telefone ou WhatsApp").fill("21999990000");
await mobilePage.getByRole("button", { name: "Registrar cliente" }).click();
await assertSelected(mobilePage.getByLabel("Selecionar cliente"), "cliente mobile");
await mobilePage.screenshot({ path: `${screenshots}/orders-mobile-modal.png`, fullPage: true });
await mobileContext.close();
await browser.close();
console.log("Order visual validation completed.");
