import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const managerDashboard = readFileSync(new URL("../client/src/pages/ManagerDashboard.tsx", import.meta.url), "utf8");

describe("orders UI contract", () => {
  it("usa um ícone vetorial próprio no toggle sem emojis de tipo de pedido", () => {
    expect(managerDashboard).toContain("ArrowLeftRight");
    expect(managerDashboard).toContain('aria-label={entryType === "detailed" ? "Trocar para venda geral" : "Trocar para pedido detalhado"}');
    expect(managerDashboard).not.toContain("🧾");
    expect(managerDashboard).not.toContain("🛍️");
  });

  it("não renderiza as mensagens auxiliares removidas do modal", () => {
    expect(managerDashboard).not.toContain("Selecione a revendedora na linha do catálogo.");
    expect(managerDashboard).not.toContain("Venda direta sem revendedora vinculada.");
  });

  it("posiciona a revendedora junto do catálogo somente quando a origem é intermediada", () => {
    const piecesIndex = managerDashboard.indexOf("Peças do catálogo");
    const resellerIndex = managerDashboard.indexOf("Revendedora<select");
    expect(piecesIndex).toBeGreaterThan(-1);
    expect(resellerIndex).toBeGreaterThan(piecesIndex);
    expect(managerDashboard).toContain('origin === "reseller" ? "grid gap-3 md:grid-cols-2" : "grid gap-3"');
    expect(managerDashboard).not.toContain("Venda direta sem revendedora vinculada.");
  });

  it("mantém inspeção somente como ícone com nome acessível", () => {
    expect(managerDashboard).toContain('title="Inspecionar pedido"');
    expect(managerDashboard).toContain('aria-label={`Inspecionar pedido ${order.id}`}');
    expect(managerDashboard).not.toContain('>Inspecionar</Button>');
  });
});
