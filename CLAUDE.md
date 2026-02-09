# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenClaw Miami is a single-page landing site for the Miami community around OpenClaw. Built with Vite, React 18, TypeScript, and shadcn/ui components.

## Commands

```bash
npm install         # Install dependencies
npm run dev         # Start dev server on port 8080
npm run build       # Production build to dist/
npm run lint        # ESLint check
npm run test        # Run tests once (Vitest)
npm run test:watch  # Run tests in watch mode
npm run preview     # Preview production build
```

## Architecture

The site is a single-page app with section-based navigation:

```
src/
├── App.tsx              # Routes + providers (QueryClient, Tooltip, Toasters)
├── pages/Index.tsx      # Main page composing all sections
├── components/          # Page sections (HeroSection, WhatIsSection, etc.)
│   └── ui/              # shadcn/ui primitives (do not edit manually)
├── hooks/               # Custom React hooks
└── lib/utils.ts         # cn() helper for Tailwind class merging
```

### Key Patterns

- **Path alias**: `@/` maps to `src/` (configured in vite.config.ts and components.json)
- **shadcn/ui**: Components in `src/components/ui/` are auto-generated via `npx shadcn@latest add <component>`
- **Styling**: Tailwind CSS with CSS variables for theming (see `src/index.css` for Miami color palette)
- **Animations**: Framer Motion for entrance animations, Tailwind for keyframe animations (`animate-float`, `animate-pulse-glow`)

### Custom CSS Utilities

Defined in `src/index.css`:
- `.text-gradient-sunset` - coral-to-orange text gradient
- `.bg-gradient-sunset`, `.bg-gradient-miami` - background gradients
- `.bg-glow` - radial glow effect
- `.shadow-coral`, `.shadow-teal` - colored box shadows

### Typography

- **Display**: Space Grotesk (headings)
- **Body**: Inter (text)
- **Mono**: JetBrains Mono (code)

## Adding shadcn Components

```bash
npx shadcn@latest add button   # Example: add button component
```

Components are configured in `components.json` to use the `@/` alias structure.
