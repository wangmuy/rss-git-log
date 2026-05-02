## Context

RSS Reader is a static React SPA that uses GitHub as a backend replacement. The application:
- Runs purely in the browser (no Node.js server)
- Uses GitHub REST API v3 for reading/writing config and log files
- Stores read status in browser LocalStorage for session persistence
- Commits daily read logs to GitHub as JSON files

**Current State (as of 2025-12-24):**
- MVP completed with all core features
- Architecture flattened from `src/features/rss-reader/*` to `src/*`
- Site-based log organization implemented (`logs/{siteId}/YYYY-MM-DD.json`)
- Subscription management UI added
- Sidebar layout with two-panel design

**Constraints:**
- Browser-native only (no Node.js modules like `stream`, `Buffer`, `fs`)
- Must use native `fetch`, `DOMParser`, `atob`/`btoa`
- GitHub tokens visible in client bundle (use public repos recommended)
- GitHub API rate limits: 60/hour (unauthenticated), 5000/hour (authenticated)

## Goals / Non-Goals

**Goals:**
- Provide a zero-backend RSS reading experience
- Persist read status via GitHub commits
- Support multiple RSS feeds with subscription management
- Modern, responsive UI using MUI v7
- Site-based log organization with 200-item chunking

**Non-Goals:**
- Server-side rendering or backend API
- User authentication system (uses GitHub personal access tokens)
- Real-time updates or WebSocket connections
- Advanced RSS features (full-text search, categories/tags, keyboard shortcuts)
- PWA/offline mode (future enhancement)

## Decisions

### 1. State Management: Zustand over Redux/Context API
**Decision:** Use Zustand for state management
**Rationale:**
- Lightweight (~1kb) - critical for static SPA
- Simple API with minimal boilerplate
- Good TypeScript integration
- No provider wrapping needed
**Alternatives Considered:**
- Context API: More boilerplate, less performant
- Redux: Overkill for this use case, larger bundle

### 2. RSS Parsing: Native DOMParser over rss-parser library
**Decision:** Use browser-native DOMParser
**Rationale:**
- rss-parser depends on Node.js `stream` module (incompatible with browsers)
- DOMParser built into all modern browsers
- Handles both RSS 2.0 and Atom formats
- Zero external dependencies for parsing
**Alternatives Considered:**
- rss-parser: Rejected due to Node.js dependency
- Custom regex parsing: Too error-prone

### 3. URL Normalization: Remove Tracking Parameters
**Decision:** Strip common tracking params (`utm_*`, `fbclid`, `gclid`) for item ID generation
**Rationale:**
- Same article with different UTM params should have same ID
- Prevents duplicate read tracking
- More stable item identifiers
**Implementation:** URL object with searchParams.delete() for known tracking params

### 4. Item ID Generation: Composite Base64 Hash
**Decision:** `base64(guid|normalizedLink|title|description|pubDate)` truncated to 32 chars
**Rationale:**
- GUID alone may not be unique across feeds
- Composite approach ensures uniqueness
- Base64 is browser-native (btoa)
**Alternative Considered:**
- SHA-256: Overkill, requires crypto API or library

### 5. Log File Structure: Site-Based with Chunking
**Decision:** `logs/{siteId}/YYYY-MM-DD.json` with max 200 items per file
**Rationale:**
- Prevents large file issues
- Site-isolated for better organization
- Filename based on oldest item date
- Automatic chunking when limit reached
**Migration:** Automatic conversion from old `logs/YYYY-MM-DD.json` daily structure

### 6. GitHub API: Native Fetch with Base64 Encoding
**Decision:** Use native `fetch()` API with manual base64 encoding/decoding
**Rationale:**
- Works in all modern browsers
- No external HTTP library needed
- Full control over requests
- GitHub API requires base64 for file content
**Implementation:**
- Read: `GET /repos/{owner}/{repo}/contents/{path}` → atob(response.content)
- Write: `PUT /repos/{owner}/{repo}/contents/{path}` → btoa(JSON.stringify(data))
- SHA required for updates (get from read response)

### 7. CORS Handling: Multi-Tier Fallback
**Decision:** Direct fetch → corsproxy.io → allorigins.win
**Rationale:**
- Many RSS feeds don't enable CORS
- Multiple fallbacks increase success rate
- No server-side proxy needed
**Trade-off:** Depends on third-party CORS proxies (free services)

### 8. Configuration Storage: localStorage over .env Files
**Decision:** Store GitHub config (owner, repo, branch, token) in localStorage
**Rationale:**
- Pure browser approach (no .env files)
- User can configure via UI
- Tokens visible in bundle anyway (security implications documented)
**Impact:** SetupPage.tsx handles configuration instead of .env

### 9. UI Framework: MUI v7
**Decision:** Use Material-UI v7 components
**Rationale:**
- Already specified in project guidelines
- Rich component library
- Responsive by default
- Good TypeScript support
**Components Used:** Container, Paper, Accordion, Switch, Button, Chip, LinearProgress, ThemeProvider

### 10. Auto-Commit: Configurable Timer with Manual Option
**Decision:** Optional auto-commit with 60s/300s/900s intervals
**Rationale:**
- Prevents data loss
- Reduces manual work
- User controls frequency
- Respects GitHub API rate limits
**Default:** 300 seconds (5 minutes)

## Risks / Trade-offs

**[CORS Blocking RSS Feeds]** → Use multiple CORS proxy fallbacks (corsproxy.io, allorigins.win). Document limitation to users.

**[GitHub API Rate Limits]** → Unauthenticated: 60/hour. Authenticated: 5000/hour. Mitigation: batch commits, cache responses, configurable commit intervals.

**[GitHub Token Exposure]** → Tokens visible in client bundle. Mitigation: Use public repos (no token needed for reads), document security implications clearly.

**[RSS Feed Parsing Errors]** → Malformed XML or unsupported formats. Mitigation: Robust error handling, validate before parsing, user-friendly error messages.

**[Hash Collisions for Item IDs]** → Extremely unlikely with composite key. Mitigation: 32-char base64 provides sufficient entropy. Add collision detection if needed.

**[Browser Storage Limits]** → localStorage ~5-10MB. Mitigation: Limit stored items, cleanup old data, compress if needed.

**[Data Loss During Merge]** → GitHub log merge errors. Mitigation: Test merge logic thoroughly, local backup before commit, retry logic.

**[Network Timeouts]** → Slow or unresponsive feeds. Mitigation: Timeout configuration, retry with exponential backoff.

## Migration Plan

### From Daily Logs to Site-Based Logs
1. On app startup, check for old `logs/YYYY-MM-DD.json` files
2. Read existing daily logs
3. Re-organize by site: `logs/{siteId}/YYYY-MM-DD.json`
4. Apply 200-item chunking rule
5. Write new structure to GitHub
6. Optionally keep or remove old structure (recommend keep as backup)

### From .env to localStorage
1. Remove .env file references
2. Update SetupPage to save config to localStorage
3. On load, check localStorage for config
4. Provide UI for configuring GitHub repo settings

### Deployment
- Build: `npm run build` (Vite)
- Deploy to: Vercel, Netlify, GitHub Pages, or Cloudflare Pages
- No environment variables needed on server (all in localStorage)
- User configures their own GitHub repo on first use

## Open Questions

- Should we implement search/filter functionality? (Currently out of scope for MVP)
- Should we add dark mode theme? (Nice to have, post-MVP)
- Should we support feed categories/tags? (Future enhancement)
- Should we implement PWA features for offline support? (Future consideration)
- Should we add keyboard shortcuts for power users? (Post-MVP enhancement)
