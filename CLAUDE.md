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
| `VITE_AUTHGEAR_CLIENT_ID` | Authgear app client ID |
| `VITE_AUTHGEAR_ENDPOINT` | Authgear endpoint URL |
| `VITE_AUTHGEAR_REDIRECT_URL` | OAuth redirect URI (e.g. `http://localhost:3000/auth-redirect`) |
| `VITE_PORTAL_URL` | Domain of the Authgear portal instance being managed (e.g. `portal.authgear-staging.com`) |

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
├── data/                          # Mock data (teams.ts, auditLog.ts)
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

Mock data lives in `src/data/`. No API integration exists yet. Components consume data via `useMemo` and local `useState`.

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
