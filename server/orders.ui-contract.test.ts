import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const managerDashboard = readFileSync(new URL("../client/src/pages/ManagerDashboard.tsx", import.meta.url), "utf8");
const appShell = readFileSync(new URL("../client/src/components/AppShell.tsx", import.meta.url), "utf8");
const sectionRegistry = readFileSync(new URL("../shared/sectionRegistry.ts", import.meta.url), "utf8");

describe("orders UI contract", () => {
  it("usa um ícone vetorial próprio no toggle sem emojis de tipo de pedido", () => {
    expect(managerDashboard).toContain("ArrowLeftRight");
    expect(managerDashboard).toContain("Trocar para venda geral");
    expect(managerDashboard).toContain("Trocar para pedido detalhado");
    expect(managerDashboard).not.toContain("🧾");
    expect(managerDashboard).not.toContain("🛍️");
  });

  it("não renderiza as mensagens auxiliares removidas do modal", () => {
    expect(managerDashboard).not.toContain("Selecione a revendedora na linha do catálogo.");
    expect(managerDashboard).not.toContain("Venda direta sem revendedora vinculada.");
  });

  it("posiciona a revendedora junto do catálogo somente quando a origem é intermediada", () => {
    const piecesIndex = managerDashboard.indexOf("Peças do catálogo");
    const resellerIndex = managerDashboard.indexOf("Selecione uma revendedora", piecesIndex);
    expect(piecesIndex).toBeGreaterThan(-1);
    expect(resellerIndex).toBeGreaterThan(piecesIndex);
    expect(managerDashboard).toContain('origin === "reseller"');
    expect(managerDashboard).toContain("md:grid-cols-2");
    expect(managerDashboard).not.toContain("Venda direta sem revendedora vinculada.");
  });

  it("mantém inspeção somente como ícone com nome acessível", () => {
    expect(managerDashboard).toContain('title="Inspecionar pedido"');
    expect(managerDashboard).toContain('aria-label={`Inspecionar pedido ${order.id}`}');
    expect(managerDashboard).not.toContain('>Inspecionar</Button>');
  });
});

  it("remove a seção de Comissões da navegação oficial e do módulo gerencial", () => { expect(sectionRegistry).not.toContain('id: "comissoes"'); expect(appShell).not.toContain("Comissões"); expect(managerDashboard).not.toContain('title="Comissões"'); });
  it("alimenta o Painel com fotografia real do store, pedidos recentes e série de vendas", () => { expect(managerDashboard).toContain("const store = getStore();"); expect(managerDashboard).toContain("chartPoints"); expect(managerDashboard).toContain("recentOrders"); expect(managerDashboard).toContain("totalSales"); });

  it("torna a superfície do card de pedido clicável e acessível", () => { expect(managerDashboard).toContain('role="button"'); expect(managerDashboard).toContain("hover:-translate-y-px"); expect(managerDashboard).toContain("Abrir detalhes do pedido"); expect(managerDashboard).toContain("onKeyDown"); });
  it("mantém data da venda no cadastro e no payload", () => { expect(managerDashboard).toContain("Data da venda"); expect(managerDashboard).toContain('type="date"'); expect(managerDashboard).toContain("saleDate: new Date(`${saleDate}T12:00:00`).toISOString()"); });
  it("preserva a pré-seleção da revendedora no atalho contextual", () => { expect(managerDashboard).toContain('initialResellerId ? "reseller" : "direct"'); expect(managerDashboard).toContain('useState(initialResellerId ?? "")'); expect(managerDashboard).toContain('resellerId: origin === "reseller" ? resellerId : undefined'); });
  it("expõe período e totais reais no histórico de vendas", () => { expect(managerDashboard).toContain('aria-label="Período do histórico de vendas"'); expect(managerDashboard).toContain("Últimos 30 dias"); expect(managerDashboard).toContain("em vendas"); expect(managerDashboard).toContain("availableUnits"); });
