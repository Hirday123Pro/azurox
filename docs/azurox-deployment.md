# Azurox deployment

## GitHub Pages

Azurox includes a GitHub Actions workflow at
`.github/workflows/deploy-azurox-pages.yml`. It builds the frontend from
`artifacts/azurox` and publishes `artifacts/azurox/dist/public` to GitHub
Pages whenever `main` is updated.

To enable it for a repository:

1. In the repository settings, open **Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`, or run **Deploy Azurox to GitHub Pages** from the Actions
   tab.

For a normal project site, the workflow derives the Vite base path from the
repository name. For example, a repository named `azurox` is built with
`BASE_PATH=/azurox/` and is served at
`https://OWNER.github.io/azurox/`. A repository named `OWNER.github.io` is
treated as a root site and uses `BASE_PATH=/`.

If the site is served from a custom subpath, use the workflow's optional
`base_path` input when running it manually. Include the leading slash, for
example `/marketplace/`. A custom domain at the domain root should use `/`.

The build copies `index.html` to `404.html`. GitHub Pages serves that fallback
for unknown files, so refreshing the marketplace route or an asset detail
route such as `/assets/101` loads the SPA while keeping the original URL.

## Static-site data and the API deployment

The GitHub Pages build is a frontend-only preview:

- The seeded catalog is available without an API server.
- Catalog edits made while the API is unavailable are stored in that
  browser's `localStorage`.
- Browser-local edits are not shared with other visitors, devices, or
  browsers, and can be lost when site data is cleared.
- GitHub Pages does not provide a server, database, HTTP-only session, or
  protected admin surface. Do not treat the static `/admin` preview as a
  secure place for production credentials or shared catalog management.

Use the API-backed deployment for production catalog operations. It provides
the Express API, PostgreSQL persistence, and the admin session/password
protection. The frontend can continue to show the local catalog fallback when
that API is unavailable, but only successful API operations are shared and
protected across users.
