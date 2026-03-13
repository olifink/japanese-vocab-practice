# Japanese Vocab Practice - Project Context

## Project Overview
A modern web application for practicing Japanese vocabulary, built with **Angular v21**. The app allows users to practice vocabulary from specific lessons, supporting multiple modes (Japanese to English, English to Japanese) and lesson-based filtering.

### Key Technologies
- **Framework:** Angular v21 (Standalone Components, Signals)
- **UI Library:** Angular Material
- **Data Handling:** `papaparse` for CSV parsing
- **PWA:** Angular Service Worker for offline support
- **Testing:** Vitest
- **Build Tool:** Angular CLI with ESBuild

### Architecture
- **State Management:** Uses Angular Signals (`signal`, `computed`, `effect`) for reactive state management.
- **Services:** `VocabService` handles fetching and parsing vocabulary data from `public/lessons.csv`.
- **Components:** Single-page application structure with `App` as the main component.
- **Data Source:** Vocabulary is stored in CSV format in the `public/` directory.

## Building and Running

### Development
```bash
npm start
```
Starts the development server at `http://localhost:4200`.

### Build
```bash
npm run build
```
Generates a production build in the `dist/` directory.

### Testing
```bash
npm test
```
Runs unit tests using **Vitest**.

### Linting & Formatting
```bash
# Formatting with Prettier
npx prettier --write .
```

## Development Conventions

### Angular Standards
- **Standalone Components:** All components must be standalone.
- **Signals:** Prefer Signals over Observables for local component state.
- **Change Detection:** Aim for `ChangeDetectionStrategy.OnPush` (though some legacy components might still use Default).
- **Dependency Injection:** Use the `inject()` function instead of constructor injection.
- **Control Flow:** Use modern `@if`, `@for`, and `@switch` syntax in templates.

### Styling
- **SCSS:** Use SCSS for styling, leveraging Angular Material's theming capabilities where appropriate.
- **Layout:** Flexbox and CSS Grid are preferred.

### Testing
- Unit tests are co-located with the source code (e.g., `app.spec.ts`).
- Uses **Vitest** for fast test execution and **jsdom** for DOM simulation.

### Data Model
Vocabulary items follow the `VocabItem` interface:
```typescript
interface VocabItem {
  group: string;
  japaneseForm: string;
  dictionaryForm: string;
  teForm: string;
  naiForm: string;
  taForm: string;
  meaning: string;
  lesson: number;
}
```
