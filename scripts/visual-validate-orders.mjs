import { chromium } from "playwright";

const previewUrl = "https://3000-iidx99rxqb3of3lvcxn3i-39bdd11e.us4.manus.computer/";
const manager = { id: "visual-order-manager", name: "Gestora de validação", email: "visual-orders@example.test", phone: "", role: "gestora", password: "", active: true, commissionRate: 0, createdAt: new Date().toISOString() };
const reseller = { id: "visual-order-reseller", name: "Ana Lima", email: "", phone: "", city: "Recife", role: "revendedora", password: "", active: true, commissionRate: 20, inviteStatus: "accepted", createdAt: new Date().toISOString() };
const store = { users: [manager, reseller], products: [{ id: "visual-order-product", name: "Colar Aura", category: "Colares", price: 120, stock: 3, status: "available", accent: "#c8a86b", showInStore: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], orders: [], notifications: [], sessionUserId: manager.id };
const storageKey = "fernanda-fortes-saas-store-v2-real-data";
const browser = await chromium.launch({ headless: true });
const screenshots = "/home/ubuntu/screenshots";

const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const desktopPage = await desktopContext.newPage();
await desktopPage.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: storageKey, value: store });
await desktopPage.goto(previewUrl, { waitUntil: "networkidle" });
await desktopPage.getByRole("button", { name: "Pedidos" }).click();
await desktopPage.screenshot({ path: `${screenshots}/orders-desktop-list.png`, fullPage: true });
await desktopPage.getByRole("button", { name: "Registrar venda" }).click();
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
await mobilePage.screenshot({ path: `${screenshots}/orders-mobile-modal.png`, fullPage: true });
await mobileContext.close();
await browser.close();
console.log("Order visual validation completed.");
