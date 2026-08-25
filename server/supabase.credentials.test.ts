import { describe, expect, it } from "vitest";

describe("Supabase credentials", () => {
  it("valida a chave anônima no endpoint REST", async () => {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    expect(url, "SUPABASE_URL ausente").toBeTruthy();
    expect(anonKey, "SUPABASE_ANON_KEY ausente").toBeTruthy();

    const response = await fetch(
      `${url!.replace(/\/$/, "")}/rest/v1/organizations?select=id&limit=1`,
      {
        headers: {
          apikey: anonKey!,
          Authorization: `Bearer ${anonKey!}`,
        },
      },
    );

    // Organizations deliberately has no grants for the anon role. This exact
    // PostgreSQL permission error proves the REST gateway accepted the anon
    // key while RLS/grants still protect platform data.
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "42501",
      message: "permission denied for table organizations",
    });
  }, 15_000);
});
