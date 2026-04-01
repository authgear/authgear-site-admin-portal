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

## Architecture

React 18 + TypeScript SPA for an Authgear platform admin portal. Built with Vite, React Router v6, Fluent UI v8, Tailwind CSS, and CSS Modules.

### Routing

```
/ → TeamsScreen
/:projectId → ProjectDetailsPage
/:projectId/audit-log/:logNum → AuditLogDetailPage
```

All routes are wrapped in `ScreenLayout` (header + sidebar + outlet). The router is a `BrowserRouter` at the root of `App.tsx`.

### Layout

- `ScreenLayout` — persistent shell wrapping all pages (header + sidebar + content area)
- `ScreenHeader` — fixed top bar (48px), logo + user menu
- `ScreenNav` — fixed left sidebar (260px), expandable navigation sections
- Pages render into the outlet inside `ScreenLayout`

### Styling

Three-layer styling strategy used throughout:
1. **Fluent UI** components for interactive elements (dropdowns, tables, inputs)
2. **CSS Modules** (`Component.module.css`) for component-scoped styles
3. **Tailwind** utilities via `@apply` inside CSS modules (not inline classNames)

CSS module classes use camelCase (configured in `vite.config.ts`).

### Data

Mock data lives in `src/data/` (TypeScript files). No API integration exists yet. Components consume data via `useMemo` and local `useState` — no Redux or Context API.

### TypeScript

Strict mode enabled. Components use `React.VFC<Props>` pattern. Type definitions for domain objects are in `src/types/`.

## Design Reference

Figma: [Portal - 2025](https://www.figma.com/design/K38RiF42gekApCdtwRLF4W/Portal---2025?node-id=10128-109433)

UI component and style reference: `reference/portal/UI_COMPONENTS_AND_STYLE_REFERENCE.md`
