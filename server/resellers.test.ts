import { describe, expect, it } from "vitest";
import { buildInviteLink, createInviteToken, validateResellerDraft } from "../client/src/features/resellers/resellerDomain";

describe("resellerDomain", () => {
  it("exige nome e cidade", () => {
    expect(validateResellerDraft({ name: "", city: "" }).valid).toBe(false);
    expect(validateResellerDraft({ name: " Marina ", city: " São Paulo " }).normalized).toEqual({ name: "Marina", city: "São Paulo" });
  });

  it("gera o mesmo token para os mesmos dados normalizados", () => {
    expect(createInviteToken({ name: "Marina Alves", city: "São Paulo" })).toBe(createInviteToken({ name: " Marina   Alves ", city: "São Paulo" }));
  });

  it("gera link próprio a partir do token determinístico", () => {
    const link = buildInviteLink({ name: "Marina Alves", city: "São Paulo" }, "https://fernandafortes.com");
    expect(link).toMatch(/^https:\/\/fernandafortes\.com\/convite\/res-[a-z0-9]+$/);
  });
});
