# Constitution

## Core Principles

1. **Zero Backend** — The app MUST operate as a purely client-side SPA. No server, no database, no authentication backend. GitHub API is the only persistence layer.
2. **Runtime Configuration** — All configuration MUST be settable through the in-app Config UI. No `.env` files, no build-time configuration, no hardcoded tokens.
3. **Spec-Driven Changes** — Every feature change MUST have an OpenSpec proposal, design, and task breakdown before implementation. Changes without spec artifacts MUST be rejected.
4. **Web Worker Isolation** — Any operation that may block the main thread for >50ms (PGlite queries, large serialization, batch fetch) MUST be offloaded to a Web Worker.
5. **Backward Compatibility** — Interface changes MUST be backward compatible (optional params with defaults, additive patterns). The existing `localStorage`-based item store MUST continue to work alongside any new storage provider.

## Banned Patterns

- **NEVER** commit GitHub tokens, API keys, or secrets to the repository
- **NEVER** use `LOWER()` or `ILIKE` in PGlite queries — use `~*` (case-insensitive regex) instead (PGlite v0.4.5 limitation)
- **NEVER** import browser-only APIs (`localStorage`, `DOMParser`, `window`) in shared modules consumed by Node.js scripts — use dependency injection or optional config parameters
- **NEVER** use `any` type — prefer `unknown` with type narrowing, or defined union types
- **NEVER** add runtime dependencies without evaluating bundle size impact

## Required Patterns

- **MUST** define TypeScript interfaces for all data types in `src/types/` with PascalCase names (no `I` prefix)
- **MUST** prefix React hooks with `use` (camelCase)
- **MUST** place unit tests next to source files (`*.test.ts` / `*.test.tsx`)
- **MUST** use 2-space indentation and single quotes for string literals
- **MUST** use `GitProvider` interface for all git repository operations — never call `GitHubProvider` directly from business logic
- **MUST** include Blast Radius in every task group within change-manifests
- **MUST** mark every profile.md with `Last auto-derived: <date>` to track freshness

## Tech Stack Constraints

| Constraint | Rule |
|-----------|------|
| React | v18.x (no v19 until tested) |
| MUI | v7 (`@mui/material` v7) |
| PGlite | v0.4.5 (avoid PostgreSQL functions known broken in this version) |
| TypeScript | strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`) |
| Vite | v5.x |
| Build target | `es2020` (required for PGlite BigInt literals) |
| State | Zustand v4 |
| Testing | Vitest + `@testing-library/react` + jsdom |