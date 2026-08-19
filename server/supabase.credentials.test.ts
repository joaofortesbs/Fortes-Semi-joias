import { describe, expect, it } from "vitest";

describe("Supabase credentials", () => {
  it("respondem ao endpoint REST com a chave anônima", async () => {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    expect(url, "SUPABASE_URL ausente").toBeTruthy();
    expect(anonKey, "SUPABASE_ANON_KEY ausente").toBeTruthy();

    const response = await fetch(`${url!.replace(/\/$/, "")}/rest/v1/`, {
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${anonKey!}`,
      },
    });

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.status).toBeLessThan(500);
  }, 15_000);
});
