import { chromium } from "playwright";

const previewUrl = "https://3000-iidx99rxqb3of3lvcxn3i-39bdd11e.us4.manus.computer/";
const manager = { id: "visual-manager", name: "Gestora de validação", email: "visual@example.test", phone: "", role: "gestora", password: "", active: true, commissionRate: 0, createdAt: new Date().toISOString() };
const resellers = [
  { id: "visual-ana", name: "Ana Lima", email: "", phone: "", city: "Recife", role: "revendedora", password: "", active: false, commissionRate: 0, inviteStatus: "pending", createdAt: new Date().toISOString() },
  { id: "visual-bia", name: "Bia Costa", email: "", phone: "", city: "Natal", role: "revendedora", password: "", active: true, commissionRate: 0, inviteStatus: "accepted", createdAt: new Date().toISOString() },
];
const store = { users: [manager, ...resellers], products: [], orders: [], notifications: [], sessionUserId: manager.id };
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: "fernanda-fortes-saas-store-v2-real-data", value: store });
await page.goto(previewUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Revendedoras" }).click();
await page.screenshot({ path: "/home/ubuntu/screenshots/resellers-desktop-list.png", fullPage: true });
await page.getByLabel("Buscar revendedoras").fill("Ana");
await page.screenshot({ path: "/home/ubuntu/screenshots/resellers-desktop-search.png", fullPage: true });
await page.getByRole("button", { name: "Adicionar" }).click();
await page.getByLabel("Nome obrigatório").fill("Carla Mendes");
await page.getByLabel("Cidade obrigatório").fill("Curitiba");
await page.getByRole("button", { name: "Convidar via link" }).click();
await page.screenshot({ path: "/home/ubuntu/screenshots/resellers-desktop-invite.png", fullPage: true });
await page.getByRole("button", { name: "Concluir" }).click();
await page.getByRole("button", { name: "Editar" }).first().click();
await page.getByLabel("Nome").last().fill("Ana Lima Atualizada");
await page.getByRole("button", { name: "Salvar alterações" }).click();
await page.getByRole("button", { name: "Excluir" }).first().click();
await page.screenshot({ path: "/home/ubuntu/screenshots/resellers-desktop-delete-confirmation.png", fullPage: true });
await context.close();
const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobileContext.newPage();
await mobilePage.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: "fernanda-fortes-saas-store-v2-real-data", value: store });
await mobilePage.goto(previewUrl, { waitUntil: "networkidle" });
await mobilePage.getByRole("button", { name: "Abrir menu" }).click();
await mobilePage.getByRole("button", { name: "Revendedoras" }).click();
await mobilePage.screenshot({ path: "/home/ubuntu/screenshots/resellers-mobile-list.png", fullPage: true });
await mobileContext.close();
await browser.close();
