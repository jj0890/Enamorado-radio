# Task Backlog

## Current Sprint

_Tasks currently in progress_

---

## Backlog

### CRITICAL - Storage Layer

- [ ] **Fix storage interface mismatch** - 47+ methods called in routes.ts but not defined in IStorage interface
  - Editorial/Content methods: `createContent`, `getContentById`, `getContentBySlug`, `getAllContent`, `updateContent`, `deleteContent`
  - Issues methods: `createIssue`, `getIssueById`, `getAllIssues`, `updateIssue`, `deleteIssue`
  - Album/Picks methods: All album suggestion and pick methods
  - Open Calls: `createOpenCall`, `getOpenCallById`, `getActiveOpenCalls`, etc.
  - Pitches: `createPitch`, `getAllPitches`, `updatePitch`, `deletePitch`
  - Episode submissions: `getEpisodeSubmissions`, `createEpisodeSubmission`, etc.
  - **Files:** `server/storage.ts` (interface), `server/persistentStorage.ts` (implementation)

- [ ] **Fix Admin type references** - `Admin` and `InsertAdmin` imported in storage.ts but not defined in schema
  - Used by `getAdminByUsername`, `createAdmin` methods
  - **Files:** `server/storage.ts` lines 1-28, `shared/schema.ts`

### CRITICAL - Editorial System

- [ ] **Wire contentContributors junction to editor UI** - Schema has proper junction table but AdminEditorialEditor still uses deprecated `authors: string[]`
  - Replace string array with contributor picker
  - Support multiple contributors with roles (author, photographer, interviewer, subject)
  - **Files:** `client/src/pages/AdminEditorialEditor.tsx` lines 18, 40, 56

- [ ] **Complete editorial submissions pipeline** - Schema defines `editorialSubmissions` table (lines 1621-1658) but NO routes or UI
  - Create `/api/editorial-submissions` endpoints (create, list, review)
  - Create admin UI to review writer pitches
  - Create public submit form for writers
  - **Files:** `shared/schema.ts` lines 1620-1658

### HIGH - Contributor System

- [ ] **Create admin UI for contributor management** - No page to list/edit contributors despite being core entity
  - Create `/admin/contributors` page
  - List all contributors with search/filter
  - Edit contributor profile fields (role, location, socialLinks, photoshootGallery, etc.)
  - **Existing:** API endpoints exist, public profile exists

- [ ] **Add content-contributor linking API routes**
  - `POST /api/admin/content/:id/contributors` - Add contributor to content
  - `DELETE /api/admin/content/:id/contributors/:contributorId` - Remove
  - `PATCH /api/admin/content/:id/contributors/:contributorId` - Update role/position
  - `GET /api/content/:id/contributors` - List contributors for content
  - **Files:** `server/routes.ts`

- [ ] **Create public contributor directory page**
  - List/discover contributors
  - Featured contributors showcase
  - Filter by role (DJ, writer, photographer, etc.)
  - **Files:** New page in `client/src/pages/`

### HIGH - Data Integrity

- [ ] **Run tier migration** - Migration file has tier updates COMMENTED OUT
  - `issue` → `editorial`
  - `web_exclusive` → `featured`
  - `community` → `archive`
  - Create migration script and run
  - **Files:** `migrations/0001_editorial_v2.sql` lines 72-74

- [ ] **Clean up deprecated fields usage**
  - `socialHandle` → `socialLinks` (both currently stored)
  - `authors` array → `contentContributors` junction
  - Document migration path for each

### MEDIUM - Features

- [ ] **Complete Substack import feature**
  - Schema exists: `substackImportSchema`, import tracking fields
  - Need: UI form for entering Substack URLs
  - Need: API endpoint to fetch and parse Substack content
  - **Files:** `shared/schema.ts` lines 1328-1339

- [ ] **Audit block type implementations** - 7 block types defined in schema, unclear which have UI
  - text, image, imageRow, pullQuote, callout, embed, qa
  - Document which are implemented in editor
  - Wire missing block types to editor UI
  - **Files:** `shared/schema.ts` lines 16-83, `client/src/pages/AdminEditorialEditor.tsx`

- [ ] **Genre system integration** - Schema and routes exist, UI unclear
  - Verify admin UI for genre management
  - Add genre filtering to content discovery
  - **Files:** `shared/schema.ts` lines 1593-1614, `server/genreRoutes.ts`

### LOW - Code Quality

- [ ] **Refactor schema.ts** - 1680+ lines, monolithic
  - Consider splitting into logical modules
  - Group related tables

- [ ] **Standardize album method naming**
  - Generic `getAlbum` vs specific `getAlbumPick`, `getAlbumSuggestion`
  - Clarify hierarchy and remove duplicates

---

## Completed

### Contributor Profile Enhancement
- [x] Add new schema fields (location, role, tagline, socialLinks, photoshootGallery, recommendedPlaylistUrl)
- [x] Create `content_contributors` junction table
- [x] Update ContributorProfile.tsx with full field support
- [x] Add photoshoot gallery component
- [x] Add playlist embed component (Spotify/Apple/SoundCloud)
- [x] Update API endpoint to fetch editorial content via junction
- [x] Fix SiTwitter → SiX icon migration

### Documentation
- [x] Create CLAUDE.md with project vision and engineering philosophy
- [x] Create tasks/todo.md
- [x] Create tasks/lessons.md

---

## Review Notes

### Codebase Audit Summary (Feb 2026)

| System | Completeness | Blocker? |
|--------|-------------|----------|
| Storage Layer | 40% | YES |
| Editorial Content | 60% | YES |
| Contributors | 70% | NO |
| Content-Contributor Linking | 30% | YES |
| Writer Submissions | 0% | YES |
| Block Types | 50% | NO |
| Album System | 80% | NO |
| Genre System | 60% | NO |
| Substack Import | 20% | NO |

**Key Insight:** Storage interface is the foundational issue. Fix that first, then editorial/contributor linking becomes straightforward.

---
