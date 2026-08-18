import { describe, expect, it } from "vitest";
import { buildInviteLink, createInviteToken, filterResellers, validateResellerDraft } from "../client/src/features/resellers/resellerDomain";

describe("resellerDomain", () => {
  it("exige nome e cidade", () => {
    expect(validateResellerDraft({ name: "", city: "" }).valid).toBe(false);
    expect(validateResellerDraft({ name: " Marina ", city: " São Paulo " }).normalized).toEqual({ name: "Marina", city: "São Paulo" });
  });

  it("gera o mesmo token para os mesmos dados normalizados", () => {
    expect(createInviteToken({ name: "Marina Alves", city: "São Paulo" })).toBe(createInviteToken({ name: " Marina   Alves ", city: "São Paulo" }));
  });

  it("filtra por nome, cidade e status sem alterar a lista original", () => { const users = [{ name: "Ana Lima", city: "Recife", inviteStatus: "pending" as const }, { name: "Bia Costa", city: "Natal", inviteStatus: "accepted" as const }]; expect(filterResellers(users, "ana", "all", "all")).toHaveLength(1); expect(filterResellers(users, "", "accepted", "all")[0]?.name).toBe("Bia Costa"); expect(filterResellers(users, "", "all", "Recife")[0]?.name).toBe("Ana Lima"); expect(users).toHaveLength(2); });
  it("gera link próprio a partir do token determinístico", () => {
    const link = buildInviteLink({ name: "Marina Alves", city: "São Paulo" }, "https://fernandafortes.com");
    expect(link).toMatch(/^https:\/\/fernandafortes\.com\/convite\/res-[a-z0-9]+$/);
  });
});
