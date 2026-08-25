---
name: Supabase authentication bridge
description: Security boundary for the application's Supabase Auth and persistence migration.
---

The browser must use the application’s same-origin authentication and persistence endpoints, with the Supabase access token held in an HttpOnly cookie. The Service Role credential must remain server-only; it is used only after the server resolves the authenticated actor and their organization membership.

**Why:** The application schema relies on Supabase identities, profiles, and organization memberships. Sending a service credential or trusting a client-supplied role would bypass tenant isolation and RLS.

**How to apply:** Any new remote write must resolve the actor from the server cookie, enforce organization membership and role before querying with elevated credentials, and return an explicit error rather than silently retaining a local-only change. Local storage is a UI cache hydrated from the remote store, not a persistence fallback.