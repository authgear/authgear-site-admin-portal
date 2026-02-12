# Getting Started with Authgear Admin Portal

This project has been generated based on the Figma design for the Teams page, following the UI guidelines and component structure from the reference portal implementation.

## What Was Generated

### Core Page
- **TeamsScreen.tsx** - Main Teams page with search, filters, and data table
- **TeamsScreen.module.css** - Styled following Fluent UI design patterns

### Layout Components
- **ScreenLayout.tsx** - Main layout wrapper with header and navigation
- **ScreenHeader.tsx** - Top navigation bar with logo and user menu
- **ScreenNav.tsx** - Side navigation with expandable sections
- **ScreenTitle.tsx** - Page title component
- **Logo.tsx** - Authgear logo component

### Application Setup
- **App.tsx** - Root application component
- **index.tsx** - Entry point
- **App.css** - Global styles with Tailwind integration

### Configuration Files
- **package.json** - Dependencies and scripts
- **vite.config.ts** - Vite bundler configuration
- **tsconfig.json** - TypeScript configuration
- **tailwind.config.js** - Tailwind CSS configuration with custom theme
- **postcss.config.js** - PostCSS configuration

## Design Implementation

The implementation follows the Figma design specifications:
- **Header**: Blue background (#176df3) with logo, app name, and user menu
- **Navigation**: Left sidebar with "Teams" (selected) and "Advanced" section expanded
- **Main Content**: 
  - Search toolbar with dropdown, search box, and clear filters button
  - Data table with columns: Project name, Owner email, Plan, Create at
  - Sortable columns with icons
  - Mock data showing 9 projects

## Technology Stack

- **React 18** with TypeScript
- **Fluent UI v8** for UI components (Dropdown, SearchBox, DetailsList, etc.)
- **Tailwind CSS v3** for utility styling
- **CSS Modules** for component-scoped styles
- **Vite** for fast development and building

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

The application will open at http://localhost:3000

### 3. Build for Production

```bash
npm run build
```

## File Structure

```
admin-panel/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── TeamsScreen.tsx         # Teams page (main feature)
│   ├── TeamsScreen.module.css  # Teams page styles
│   ├── ScreenLayout.tsx        # Layout wrapper
│   ├── ScreenHeader.tsx        # Top header
│   ├── ScreenNav.tsx           # Side navigation
│   ├── ScreenTitle.tsx         # Page title
│   ├── Logo.tsx                # Logo component
│   ├── App.tsx                 # Root component
│   ├── App.css                 # Global styles
│   └── index.tsx               # Entry point
├── reference/                  # Reference implementation
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md

## Key Features Implemented

### Teams Screen
- ✅ Header with page title "Teams"
- ✅ Search toolbar with:
  - "Search By" dropdown (Project ID, Project Name, Owner Email)
  - Search input field
  - "Clean all filters" button
- ✅ Data table with:
  - Project name (with project ID subtitle)
  - Owner email
  - Plan
  - Created at timestamp
- ✅ Sortable columns (visual indicators)
- ✅ Row hover effects

### Layout
- ✅ Fixed header with Authgear logo and user menu
- ✅ Left sidebar navigation (260px width)
- ✅ Selected state for "Teams" nav item
- ✅ Expandable "Advanced" section with sub-items

### Styling
- ✅ Fluent UI design system colors
- ✅ Segoe UI font family
- ✅ Proper spacing and typography
- ✅ Border colors matching design (#edebe9, #d0d0d0)
- ✅ Theme primary color (#176df3)

## Next Steps

### To Add Real Data
Replace the `MOCK_TEAMS` array in `TeamsScreen.tsx` with actual API calls:

```typescript
// Example:
const { data, loading } = useTeamsQuery();
const items = useMemo(() => data?.teams || [], [data]);
```

### To Add Routing
Install React Router:
```bash
npm install react-router-dom
```

Then wrap the app with BrowserRouter and add routes.

### To Add State Management
Consider adding:
- React Context for global state
- React Query for server state
- Redux Toolkit for complex state

## Customization

### Colors
Edit `tailwind.config.js` to customize the color palette.

### Components
All components use CSS Modules for scoped styling. Edit `.module.css` files to customize appearance.

### Layout
Modify `ScreenLayout.module.css` to adjust the navigation width, header height, etc.

## Troubleshooting

### Port Already in Use
Change the port in `vite.config.ts`:
```typescript
server: {
  port: 3001, // Change to different port
}
```

### Styling Issues
Make sure Tailwind is properly imported in `App.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Reference

- Design: [Figma - Portal 2025](https://www.figma.com/design/K38RiF42gekApCdtwRLF4W/Portal---2025?node-id=10128-109433)
- Reference Implementation: `./reference/portal/`
- Fluent UI Documentation: https://developer.microsoft.com/en-us/fluentui
- Tailwind CSS: https://tailwindcss.com/docs

## Support

For questions or issues, refer to:
- `reference/portal/UI_COMPONENTS_AND_STYLE_REFERENCE.md` - Component and styling guide
- `reference/portal/src/` - Reference implementations
