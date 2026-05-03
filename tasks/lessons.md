# Lessons Learned

A running log of patterns, mistakes, and rules discovered during development. Review at the start of each session.

---

## Icon Libraries

**Rule:** Twitter rebranded to X. Use `SiX` from `react-icons/si`, not `SiTwitter`.

**Context:** Build failed because `SiTwitter` no longer exists in react-icons.

---

## Schema as Source of Truth

**Rule:** All data types, validation schemas, and relations live in `shared/schema.ts`. Never define duplicate types elsewhere.

**Context:** Drizzle ORM + Zod validation in one file prevents drift between database and application types.

---

## Storage Abstraction

**Rule:** Always use the `storage` singleton for data access. Don't query the database directly in routes unless joining tables not covered by storage methods.

**Context:** The app supports both PostgreSQL and file-based fallback. Direct DB queries break file storage mode.

**Exception:** Junction table queries (like `contentContributors`) may need direct Drizzle queries until storage methods are added.

---

## Migration Safety

**Rule:** Wrap migration table additions in try/catch or check existence. New junction tables may not exist in all environments.

**Context:** The `contentContributors` query in contributor routes is wrapped to handle missing table gracefully.

---

## Content Tiers vs Labels

**Rule:** Content tiers (editorial/featured/archive) exist in the database but should not be prominently displayed to users.

**Context:** Per project vision—avoid heavy labeling. Let quality speak for itself.

---

## No View Counts

**Rule:** Intentionally avoid vanity metrics. No view counts, no popularity rankings.

**Context:** Editorial philosophy prioritizes curation over algorithmic engagement.

---
