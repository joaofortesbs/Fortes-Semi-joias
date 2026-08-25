---
name: Supabase REST validation
description: Operational distinction between connector-proxy responses and direct Supabase REST responses.
---

When validating a Supabase integration, compare connector-proxy results with the direct project REST endpoint before concluding that a table, schema, or policy is broken.

**Why:** Intermediary integration layers can retain stale schema or policy state that differs from the project endpoint.

**How to apply:** Use secure server-side diagnostics, never print credentials, and clean up any temporary records in reverse dependency order.