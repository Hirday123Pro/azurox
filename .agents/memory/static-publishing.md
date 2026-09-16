---
name: Static publishing boundary
description: What Azurox can and cannot persist or protect when exported as a static GitHub Pages site.
---

Azurox supports a browser-local catalog fallback for static hosting, but only the API-backed deployment provides real admin authentication and shared persistence.

**Why:** GitHub Pages serves frontend files only; it has no server endpoint, database, HTTP-only session, or private admin surface.

**How to apply:** Treat local preview changes as device/browser-local convenience data. For a shared catalog and protected admin operations, keep the API server and PostgreSQL deployment.