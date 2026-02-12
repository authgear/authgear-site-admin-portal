# Authgear Admin Portal

Admin portal for Authgear, built with React, TypeScript, and Fluent UI.

## Features

- Teams management page with search and filtering
- Fluent UI components following Microsoft design patterns
- Responsive layout with navigation sidebar
- TypeScript for type safety
- Tailwind CSS for utility styling

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Fluent UI v8** - Microsoft's design system
- **Tailwind CSS** - Utility-first CSS
- **Vite** - Build tool
- **CSS Modules** - Component-scoped styling

## Project Structure

```
src/
├── TeamsScreen.tsx         # Main Teams page component
├── TeamsScreen.module.css  # Teams page styles
├── ScreenLayout.tsx        # Layout wrapper
├── ScreenHeader.tsx        # Top navigation bar
├── ScreenNav.tsx           # Side navigation
├── ScreenTitle.tsx         # Page title component
├── Logo.tsx                # Logo component
├── App.tsx                 # Root app component
└── index.tsx               # Entry point
```

## Design Reference

The UI follows the Authgear portal design system:
- Figma: [Portal - 2025](https://www.figma.com/design/K38RiF42gekApCdtwRLF4W/Portal---2025?node-id=10128-109433)
- Reference implementation in `reference/portal/`

## License

Private - All rights reserved
