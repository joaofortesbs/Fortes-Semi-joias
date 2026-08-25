export type InviteStatus = "not_invited" | "pending" | "accepted" | "expired";

export type ResellerDraft = {
  name: string;
  city: string;
};

export type ResellerView = {
  id: string;
  name: string;
  city: string;
  inviteStatus: InviteStatus;
  inviteLink?: string;
  createdAt: string;
};

export function normalizeResellerDraft(input: ResellerDraft): ResellerDraft {
  return { name: input.name.trim().replace(/\s+/g, " "), city: input.city.trim().replace(/\s+/g, " ") };
}

export function validateResellerDraft(input: ResellerDraft) {
  const normalized = normalizeResellerDraft(input);
  return { normalized, valid: normalized.name.length > 0 && normalized.city.length > 0 };
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createInviteToken(input: ResellerDraft) {
  const { normalized } = validateResellerDraft(input);
  return `res-${stableHash(`${normalized.name.toLocaleLowerCase("pt-BR")}::${normalized.city.toLocaleLowerCase("pt-BR")}`)}`;
}

export function buildInviteLink(input: ResellerDraft, origin = typeof window === "undefined" ? "" : window.location.origin) {
  const token = createInviteToken(input);
  return `${origin}/convite/${token}`;
}

export function inviteStatusLabel(status: InviteStatus) {
  return { not_invited: "Sem convite", pending: "Convite pendente", accepted: "Aceito", expired: "Expirado" }[status];
}

export function filterResellers<T extends { name: string; city?: string; inviteStatus?: InviteStatus; active?: boolean }>(users: T[], query: string, status: "all" | InviteStatus, city: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  return users.filter(user => {
    const userStatus = user.inviteStatus ?? (user.active ? "accepted" : "pending");
    const matchesQuery = !normalizedQuery || user.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery) || (user.city ?? "").toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    return matchesQuery && (status === "all" || userStatus === status) && (city === "all" || user.city === city);
  });
}
