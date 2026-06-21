# Auth Decision: HMAC-Signed Stateless Sessions

**Date:** 2026-06-21  
**Status:** Active

## Decision

Resident authentication uses HMAC-SHA256 signed cookies (`radio_resident`) with stateless verification. No Redis, no session database, no refresh tokens.

Cookie payload: `{ residentId, username, sessionId, exp }`

## Rationale

**Blast radius of a stale session for Enamorado Radio is low.**

A compromised or over-extended session allows: posting a song request, accessing the resident portal, editing the resident's own public contributor profile (bio, avatar, links, album picks, visibility toggle). It does not allow: modifying station programming, accessing financial or donor data, performing any action with legal implications, or escalating privileges beyond the authenticated resident's own account.

At this blast radius, the complexity and infrastructure cost of stateful session management is not justified.

## Properties

- **Stateless** — no DB or cache lookup on every request. HMAC re-computed locally in microseconds.
- **Isolated** — all auth logic lives in `server/residentAuth.ts`. Handlers read `req.resident` only; none import auth primitives directly.
- **Migratable** — `sessionId` in the payload enables a future blacklist with a one-line middleware change. No existing-session breakage required at the infrastructure layer.

## What this doesn't handle (accepted tradeoffs)

- **No "log out everywhere"** — can't invalidate a specific session before its 24-hour expiry
- **No mid-session revocation** — admin disabling an account takes effect at next login, not instantly
- **No stolen-device kill switch** — user cannot invalidate a specific device's session

These are acceptable given the blast radius above.

## Migration triggers

Re-evaluate this decision if residents gain the ability to:

- Modify live station programming or scheduling
- Access donor, financial, or subscriber information
- Perform any action with legal or financial implications
- Manage other residents' accounts

At that point, add a `sessions` table (or Redis blacklist keyed on `sessionId`) and a single check in `requireResident`. The API surface does not change.

## Migration path (when needed)

```typescript
// requireResident today — stateless
const session = verifySessionToken(token);
req.resident = session;

// requireResident tomorrow — one line added
const session = verifySessionToken(token);
if (await sessionBlacklist.has(session.sessionId)) return res.status(401).json({ error: 'unauthorized' });
req.resident = session;
```

The `sessionId` field added 2026-06-21 enables this without breaking existing sessions or changing the API surface.

## Audit — 2026-06-21

**Routes checked:** All profile and contributor routes in `server/routes.ts`.

**Findings:**

| Check | Result |
|---|---|
| Every `req.resident` read has `requireResident` in its middleware chain | ✅ 5/5 routes clean |
| Every mutation resolves target by `session.residentId`, never user input | ✅ No parameter/body ID accepted |
| HMAC verification wrapped in try/catch, returns null on any error | ✅ `timingSafeEqual` used, fails closed |
| No handler imports auth primitives directly (cookies, HMAC) | ✅ Only `residentAuth.ts` touches them |
| Public contributor routes (`GET /api/contributors`, `check-handle`) correctly open | ✅ Intentionally unauthenticated |
| `GET /api/profile` with no cookie → 401 | ✅ |
| `GET /api/profile` with tampered cookie (no valid HMAC) → 401 | ✅ |
| `GET /api/contributors` with no cookie → 200 | ✅ |

**Baseline confirmed.** No auth bypasses found. Single enforcement point verified.
