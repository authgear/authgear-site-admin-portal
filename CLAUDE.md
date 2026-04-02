# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:3000
npm run build      # TypeScript check + production build (tsc && vite build)
npm run lint       # ESLint with zero warnings tolerance
npm run preview    # Preview production build locally
```

No test runner is configured in this project.

## Environment Variables

Copy `.env.example` to `.env` and fill in values before running locally.

| Variable | Purpose |
|----------|---------|
| `VITE_BASE_DOMAIN` | **Required.** Deployment base domain (e.g. `your-deployment.example.com`). All other vars are derived from this. |
| `VITE_AUTHGEAR_CLIENT_ID` | *(optional)* Authgear app client ID (default: `siteadmin`) |
| `VITE_AUTHGEAR_REDIRECT_URL` | *(optional)* OAuth redirect URI (default: `<current origin>/auth-redirect`) |
| `VITE_AUTHGEAR_ENDPOINT` | *(optional)* Override Authgear endpoint (default: `https://accounts.portal.<base>`) |
| `VITE_PORTAL_URL` | *(optional)* Override portal domain (default: `portal.<base>`) |
| `VITE_SITEADMIN_API_URL` | *(optional)* Override Site Admin API base URL (default: `https://siteadmin.<base>`) |

## Architecture

React 18 + TypeScript SPA for managing tenants/projects in an Authgear deployment. Built with Vite, React Router v6, Fluent UI v8, Tailwind CSS, and CSS Modules. Authentication is handled by the `@authgear/web` SDK.

### Folder Structure

```
src/
├── App.tsx, index.tsx, App.css   # Entry point and root router
├── auth/                          # Auth flow
│   ├── AuthgearContext.tsx        # Context: sessionState, userInfo, startLogin, logout
│   ├── AuthRedirectPage.tsx       # Handles OAuth callback at /auth-redirect
│   └── LoginPage.tsx              # Shown to unauthenticated users
├── components/                    # Persistent shell components
│   ├── ScreenLayout.tsx           # Header + sidebar + content wrapper
│   ├── ScreenHeader.tsx           # Fixed top bar (48px)
│   ├── ScreenNav.tsx              # Fixed left sidebar (260px)
│   ├── ScreenTitle.tsx            # Page heading component
│   └── Logo.tsx
├── pages/                         # Route-level pages and their tab content
│   ├── TeamsScreen.tsx
│   ├── ProjectDetailsPage.tsx
│   ├── AuditLogDetailPage.tsx
│   ├── AuditLogContent.tsx
│   ├── UsageContent.tsx
│   ├── PlanContent.tsx
│   └── PortalAdminContent.tsx
├── api/                           # Site Admin API client
│   ├── types.ts                   # TypeScript interfaces from OpenAPI spec
│   ├── client.ts                  # Base fetch wrapper (uses authgear.fetch for auth)
│   └── siteadmin.ts               # Typed function per API operation
├── data/                          # Mock data (teams.ts, auditLog.ts) — being replaced by API
└── types/                         # Shared TypeScript interfaces
```

### Routing

```
/                              → TeamsScreen
/:projectId                    → ProjectDetailsPage (tabs: Overview, Audit Log, Usage, Plan, Portal Admin)
/:projectId/audit-log/:logNum  → AuditLogDetailPage
/auth-redirect                 → AuthRedirectPage (OAuth callback, no auth guard)
```

Unauthenticated users are shown `LoginPage` for all routes except `/auth-redirect`. Auth state comes from `AuthgearContext` — configured in `index.tsx` before React mounts.

### Styling

Three-layer strategy used throughout:
1. **Fluent UI** components for interactive elements (dropdowns, tables, inputs)
2. **CSS Modules** (`Component.module.css`) for component-scoped styles
3. **Tailwind** utilities via `@apply` inside CSS modules (not inline classNames)

CSS module classes use camelCase (configured in `vite.config.ts`).

### Data

Mock data lives in `src/data/`. Components are being migrated to call the real Site Admin API.

### API Client

`src/api/` provides typed access to the Site Admin API:

- `authgear.fetch()` is used as the underlying fetcher — it injects the Bearer access token automatically from the current Authgear session.
- `apiRequest<T>(path, init?)` in `client.ts` is the base function; it throws `SiteAdminAPIError` on non-2xx responses.
- `src/api/siteadmin.ts` exports one typed function per operation: `listApps`, `getApp`, `listAppCollaborators`, `addAppCollaborator`, `removeAppCollaborator`, `getAppMessagingUsage`, `getAppMonthlyActiveUsers`.

API spec: `https://raw.githubusercontent.com/authgear/authgear-server/refs/heads/main/docs/api/siteadmin-api.yaml`

Use `/connect-api` to get step-by-step guidance on wiring a page to the API.

### TypeScript

Strict mode enabled. Components use `React.VFC<Props>` pattern. Type definitions for domain objects are in `src/types/`.

## Troubleshooting

**Port already in use** — change the port in `vite.config.ts`:
```ts
server: { port: 3001 }
```

**Tailwind not applying** — confirm `App.css` contains:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Git Rules

- Run `git pull` at the start of each session before making changes.
- If `git pull` causes a merge conflict, explain it in plain language and walk through resolving it — never silently discard either side.
- Commit messages should be plain English describing what changed and why, kept short.
- Only commit and push when the user explicitly asks.
- For small changes (typo fixes, minor tweaks), committing directly to `main` is fine. For larger changes (new features, restructuring), suggest a branch and pull request.
- Never force-push (`git push --force`).
- Never run `git reset --hard` or `git checkout .` without explicit user confirmation.
- Never rewrite history on `main`.
- Do not commit generated or temporary files (`node_modules/`, `.DS_Store`, build artifacts) — suggest `.gitignore` instead.

## Design Reference

Figma: [Portal - 2025](https://www.figma.com/design/K38RiF42gekApCdtwRLF4W/Portal---2025?node-id=10128-109433)

UI component and style reference: `reference/portal/UI_COMPONENTS_AND_STYLE_REFERENCE.md`
