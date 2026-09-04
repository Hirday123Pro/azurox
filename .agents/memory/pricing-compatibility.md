---
name: Asset pricing compatibility
description: Pricing model rule for keeping old marketplace assets usable
---

Keep the original primary `price` and `currency` values alongside optional Robux and dollar amounts and an explicit display mode. Existing single-currency records should derive missing values from the legacy pair.

**Why:** The marketplace already had persisted assets and generated clients built around one price. Replacing those fields would make old records and fallback content harder to migrate safely.

**How to apply:** New admin forms should write the selected primary price plus nullable secondary pricing, while public cards and detail pages should render from the display mode with legacy fallback logic.