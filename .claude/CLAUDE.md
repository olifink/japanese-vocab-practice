# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Japanese Vocab Practice is a Progressive Web App (PWA) for practicing Japanese vocabulary. Built with Angular 21 and Angular Material 3, it features bi-directional practice modes (JP-EN / EN-JP), lesson filtering, and offline support.

## Development Commands

```bash
npm start          # Run dev server at http://localhost:4200
npm test           # Run unit tests with Vitest
npm run build      # Production build to dist/
npm run watch      # Development build with watch mode
```

Run a single test file:
```bash
npx vitest run src/app/services/vocab.spec.ts
```

## Architecture

**State Management**: All application state uses Angular signals in the root `App` component (`src/app/app.ts`). Settings persist to localStorage.

**Data Flow**:
- `VocabService` (`src/app/services/vocab.ts`) loads vocabulary from `public/lessons.csv` using PapaParse
- Vocabulary is exposed as a signal and filtered via `computed()` based on lesson selection
- No routing - single-page application with all UI in the App component

**VocabItem Interface**:
- `group`: Part of speech
- `japaneseForm`, `dictionaryForm`, `teForm`, `naiForm`, `taForm`: Japanese word forms
- `meaning`: English translation
- `lesson`: Lesson number for filtering

**PWA**: Service worker config in `ngsw-config.json` prefetches app shell and caches Google Fonts.

**Deployment**: GitHub Actions (`.github/workflows/deploy.yml`) auto-deploys to GitHub Pages on push to main.

## Coding Standards

### TypeScript
- Strict type checking enabled
- Prefer type inference when obvious
- Avoid `any`; use `unknown` when type is uncertain

### Angular
- Standalone components only (do NOT set `standalone: true` - it's the default in Angular v20+)
- Signals for state management, `computed()` for derived state
- `ChangeDetectionStrategy.OnPush` required
- Use `input()` and `output()` functions, not decorators
- Use `inject()` function, not constructor injection
- Use `host` object in decorators instead of `@HostBinding`/`@HostListener`
- Native control flow (`@if`, `@for`, `@switch`) instead of structural directives
- Property bindings instead of `ngClass`/`ngStyle`
- Reactive forms over template-driven
- `NgOptimizedImage` for static images

### Accessibility
- Must pass AXE checks
- WCAG AA compliance required (focus management, color contrast, ARIA attributes)
