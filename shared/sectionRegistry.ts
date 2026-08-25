export type PlatformRole = "gestora" | "revendedora";
export type SectionId = "painel" | "catalogo" | "pedidos" | "revendedoras";
export type SectionIconKey = "dashboard" | "catalog" | "orders" | "resellers";

export type SectionDefinition = {
  id: SectionId;
  label: string;
  managerLabel?: string;
  resellerLabel?: string;
  icon: SectionIconKey;
  roles: PlatformRole[];
};

export const SECTION_REGISTRY: readonly SectionDefinition[] = [
  { id: "painel", label: "Painel", managerLabel: "Painel", resellerLabel: "Meu painel", icon: "dashboard", roles: ["gestora", "revendedora"] },
  { id: "catalogo", label: "Catálogo", icon: "catalog", roles: ["gestora", "revendedora"] },
  { id: "pedidos", label: "Pedidos", managerLabel: "Pedidos", resellerLabel: "Meus pedidos", icon: "orders", roles: ["gestora", "revendedora"] },
  { id: "revendedoras", label: "Revendedoras", icon: "resellers", roles: ["gestora"] },
];

export function getSectionsForRole(role: PlatformRole) {
  return SECTION_REGISTRY.filter(section => section.roles.includes(role));
}

export function getSectionLabel(section: SectionId, role: PlatformRole) {
  const definition = SECTION_REGISTRY.find(item => item.id === section);
  return role === "gestora" ? definition?.managerLabel ?? definition?.label ?? "Painel" : definition?.resellerLabel ?? definition?.label ?? "Painel";
}
