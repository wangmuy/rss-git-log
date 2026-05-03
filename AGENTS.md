# Repository Guidelines

## Project Structure & Module Organization

This is a **Vite + React 18 + TypeScript** single-page application for reading RSS feeds with GitHub-backed persistence.

```
src/
  components/   # React UI components (ConfigPage, FeedList, SidebarFeedLayout, etc.)
  hooks/        # Custom hooks (useCommit, useConfig, useKeyboardNavigation, useRSSFeeds)
  store/        # Zustand state management (readerStore.ts)
  types/        # TypeScript interfaces (rss.ts, config.ts, log.ts)
  utils/        # Pure utilities (github-api.ts, rss-parser.ts, log-cache.ts, etc.)
  App.tsx       # Root component with MUI ThemeProvider
  main.tsx      # React entry point
  integration.test.tsx  # Integration-level tests
openspec/       # OpenSpec change artifacts (proposal, design, tasks, specs)
public/         # Static assets (rss-config.example.json)
dist/           # Production build output
```

Path alias `@/` maps to `src/` (configured in `tsconfig.json` and `vite.config.ts`).

## Build, Test, and Development Commands

| Command | Description |
|---|---|
| `npm install` | Install all dependencies |
| `npm run dev` | Start Vite dev server at `http://localhost:3000` |
| `npm run build` | Type-check with `tsc` then produce production bundle in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest test suite (jsdom environment) |

## Coding Style & Naming Conventions

- **Language**: TypeScript strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`).
- **Module system**: ES modules (`"type": "module"` in `package.json`).
- **Components**: PascalCase files and function declarations (e.g., `FeedList.tsx` → `function FeedList()`).
- **Hooks**: `use` prefix, camelCase (e.g., `useCommit.ts`).
- **Utilities**: camelCase, co-located with their tests (e.g., `url.ts` + `url.test.ts`).
- **Types**: Defined in `src/types/`; interfaces use PascalCase, no `I` prefix.
- **Styling**: MUI v7 (`@mui/material`, `@emotion/react`, `@emotion/styled`) — no separate CSS files.
- **Formatting**: No explicit formatter configured; follow existing code style (2-space indent, single quotes).

## Testing Guidelines

- **Framework**: Vitest with `@testing-library/react` and `jsdom`.
- **Test placement**: Unit tests sit next to their source files (`*.test.ts` / `*.test.tsx`). Integration tests live at `src/integration.test.tsx`.
- **Naming**: Test files mirror the source name with `.test` suffix (e.g., `rss-parser.ts` → `rss-parser.test.ts`).
- **Coverage**: Focus on pure utilities (`utils/`), custom hooks, and component rendering. Key areas: `generateItemId`, `removeTrackingParams`, `parseXMLFeed`, `AppConfig` validation, CORS policy logic, and GitHub token gating.
- **Run tests**: `npm test` (add `-- --run` for single-execution in CI contexts).

## Commit & Pull Request Guidelines

- **Commit style**: The project uses short, imperative subject lines (e.g., `Add sidebar layout`, `Fix CORS fallback order`). Keep messages concise and action-oriented.
- **PRs**: Link to the relevant OpenSpec change under `openspec/changes/`. Include a brief description of what changed and any UI impact (screenshots helpful for visual changes).
- **Spec-driven workflow**: Significant features should have an OpenSpec proposal (`proposal.md`), design (`design.md`), tasks (`tasks.md`), and capability specs (`specs/`) before implementation.

## Architecture Overview

- **State**: Zustand store (`readerStore.ts`) manages read/unread status with `LocalStorage` persistence.
- **Data flow**: RSS feeds are fetched via native `fetch` with CORS proxy fallback, parsed with `DOMParser`, and displayed in a two-panel sidebar layout.
- **Persistence**: GitHub REST API v3 reads/writes config and log files. Tokens are stored in `localStorage` — use least-privilege `repo` scope tokens.
- **Config**: All runtime configuration (GitHub repo, CORS policy, auto-commit, cache retention) is managed through the in-app Config page — no `.env` files.
