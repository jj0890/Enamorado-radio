# Infrastructure Issues — Enamorado Radio
> Audit conducted 2026-09-27. Archive for future sessions — do not fix inline.

---

## Broken Routes

### Server-side
- `PATCH /api/mixes/:id/status` — no auth middleware; any anonymous user can change mix approval status (`server/routes.ts:1931`)
- `POST /api/editorial/projects` — no auth middleware; unauthenticated users can create editorial projects (`server/editorialRouter.ts:98`)
- `PATCH /api/editorial/projects/:id` — no auth middleware; unauthenticated users can overwrite any project (`server/editorialRouter.ts:128`)
- `POST /api/editorial/content-mapping` — no auth middleware on write operation (`server/editorialRouter.ts:607`)
- `PATCH /api/editorial/projects/:id/schedule` — no auth middleware (`server/editorialRouter.ts:827`)
- `POST /api/editorial/projects/from-submission/:submissionId` — no auth middleware (`server/editorialRouter.ts:405`)
- `POST /api/admin/danger/clear-sessions` — stub; always returns success without clearing anything (`server/routes.ts:549–560`)
- `POST /api/admin/episode/:id/retry` — always returns 400 "Cannot retry: Original audio file not available"; feature not implemented (`server/routes.ts:1062–1092`)
- `PATCH /api/admin/episode-submissions/:id` — broadcast references bare `status` not in scope; should be `validatedData.status`; throws ReferenceError at runtime (`server/routes.ts:1341`)
- `/stream.mp3` registered twice: `server/index.ts:292` shadows the more complete version in `server/routes.ts:739`; routes.ts version is unreachable

### Client-side
- `/magazine/editorials` — no route registered in App.tsx; correct path is `/editorials`; any link to the longer path 404s (`client/src/App.tsx:102`)
- `/api/profiles/:handle` — comment says public handle view but actual sub-path is `/public/:handle`, making live URL `/api/profiles/public/:handle`; direct handle lookups return 404 (`server/routes.ts:99`, `server/userRoutes.ts:124`)

---

## Schema Issues

- `shared/schema-clean.ts` is a one-line re-export of `schema.ts` with no value; two client files import from it unnecessarily — consolidate to `@shared/schema` directly (`shared/schema-clean.ts:2`)
- `migrations/` directory does not exist despite `drizzle.config.ts:8` pointing there; no migration history; schema changes require the destructive `db:push`; no `db:migrate` script in `package.json`
- Two admin storage systems coexist: `admins` table in `shared/schema.ts:294` (Drizzle/Postgres) AND `data/admins.json` flat file; no migration path between them (`server/persistentStorage.ts:138`, `server/adminAuth.ts`)
- `shows` table defined in `shared/schema.ts:10` but no CRUD API routes exist anywhere; orphaned
- `data/songSubmissions.json` tracked in git with no corresponding `song_submissions` table in schema and no API routes; orphaned
- `streamStatus` and `currentPlayback` tables defined in schema with no API routes (`shared/schema.ts:438`, `shared/schema.ts:451`)

---

## Technical Debt

- `data/admins.json` tracked in git with plaintext credentials; `.gitignore` lists `data/` but file was committed before that rule — needs removal from git history
- Admin passwords stored as plaintext in flat file; no hashing (`server/adminAuth.ts:21`, `server/adminAuth.ts:94`)
- Resident passwords stored as plaintext (`server/residentAuth.ts:83`)
- AzuraCast IP `http://24.199.109.18` hardcoded in two places instead of reading from env (`server/routes.ts:734`, `server/index.ts:294`)
- `uploadedBy` and `updatedBy` hardcoded as `"admin"` string instead of reading from session (`server/editorialRouter.ts:523`, `server/editorialRouter.ts:610`)
- Thumbnail generation not implemented — thumbnail URL is just a copy of the source URL (`server/editorialRouter.ts:533`)
- `data/*.json` backup files committed to git including five `mixSubmissions.json.backup*` variants; `server/mixStorage.json` is live data in version control
- `cors()` called without origin allowlist; accepts requests from any origin in all environments (`server/index.ts:40`)
- `helmet` CSP disabled via `contentSecurityPolicy: false` with no production toggle implemented (`server/index.ts:37`)
- `requireEditor = requireAdmin` alias in `server/magazineRoutes.ts:48` — editor role not actually distinct from admin for magazine/editorial writes; `server/roleAuth.ts` exists but is not used here
- `package.json` `dev:all` script runs both `tsx server/index.ts` and `vite` concurrently but server already calls `setupVite()` in dev — creates duplicate Vite server
- Error handler registered at `server/index.ts:78` before `registerRoutes()` runs at line 322; second handler re-throws caught errors causing double-handling
- Five AzuraCast service files with overlapping responsibility and unclear deprecation: `azuracastService.ts`, `azuracastManager.ts`, `azuracastIntegration.ts`, `azuracastOps.ts`, `azuracastHelpers.ts`

---

## Missing Features

- No admin UI page for avatar approval queue despite backend having pending/approved/rejected states (`server/userRoutes.ts:183–198`)
- `mixSubmissions` schema has `radio_alt_url` and `radio_file_path` for reference-only platform support (Spotify, Apple Music, YouTube) but no upload workflow is implemented (`shared/schema.ts:100–101`)
- `shows` table intended as a show series parent for episodes but never wired up — no API, no UI
- `PATCH /api/admin/episode-submissions/:id` accepts `status: 'aired'` but no downstream side-effect marks the AzuraCast broadcast as complete; aired status is write-only
- No public route for users to check status of their own magazine submissions; `GET /api/magazine/submissions` requires editor auth (`server/magazineRoutes.ts:600`)
- `POST /api/editorial/scrape-url` depends on a separate local webscraper process at `localhost:8080` not part of this project; returns 503 when scraper is not running (`server/editorialRouter.ts:857`)
- No `db:migrate` script; no safe rollback path for schema changes
