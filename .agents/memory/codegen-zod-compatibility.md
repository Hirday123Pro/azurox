---
name: OpenAPI Zod compatibility
description: Compatibility constraint for generated validation schemas in this workspace
---

Generated API validation currently targets the workspace's Zod 3 runtime. Avoid OpenAPI formats or integer constraints that Orval emits as Zod 4-only helpers unless the workspace Zod version and generator output are upgraded together.

**Why:** Code generation can succeed while the chained library typecheck fails when generated helpers (`int`, `url`) do not exist in the installed Zod runtime.

**How to apply:** Prefer runtime validation in route handlers for URL/integer semantics when the OpenAPI contract must remain compatible with the current generated Zod package.