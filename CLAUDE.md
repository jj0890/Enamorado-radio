# Enamorado Radio

A community-driven internet radio platform with editorial magazine features. Built with React, Express, Drizzle ORM, and PostgreSQL.

## Project Vision

Enamorado Radio is an Austin/Texas-adjacent music platform inspired by the editorial voice and cultural positioning of Polyester, Hyperreal Film Club, 032c, The Fader, and Resident Advisor.

The goal is to showcase writing and music from the community while maintaining a warm, non-corporate tone—editorial rigor without institutional stiffness.

**Guiding principles:**

- **Community-first:** prioritize contributor submissions, profiles, and local scenes
- **Editorial quality without pretension:** sharp, thoughtful, never corny
- **Music discovery as culture:** mixes, playlists, radio programming, and writing are treated as equally important
- **Low-friction publishing:** Substack-style accessibility for writers without flattening voice or intent

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Wouter (routing), TanStack Query
- **Backend:** Express.js, Drizzle ORM, PostgreSQL (with file-based fallback storage)
- **Editor:** Tiptap (rich text) with a custom block system for editorial layouts
- **Streaming:** AzuraCast integration for live radio and archived shows
- **UI Components:** shadcn/ui (Radix primitives)

## Editorial + Engineering Philosophy

Enamorado Radio treats software, writing, and curation as part of the same system. The platform is built to support clarity, sustainability, and intentionality—both in code and content.

This project follows a strict internal workflow doctrine to prevent entropy, overengineering, and editorial dilution.

### Workflow Orchestration

#### 1. Plan Mode (Default)

- Enter plan mode for any non-trivial task (3+ steps, schema changes, editorial systems)
- If something goes sideways: STOP and re-plan immediately
- Planning is required for verification and correctness, not just implementation
- Write detailed specs upfront to reduce ambiguity in both code and editorial logic

#### 2. Subagent Strategy (Parallel Thinking)

- Use subagents to keep the main context clean
- Offload:
  - Research
  - Editorial exploration
  - Architecture comparisons
  - UI/UX audits
- One task per subagent for focused execution
- Complex problems justify more compute, not rushed decisions

#### 3. Self-Improvement Loop

After any correction or oversight:
- Update `tasks/lessons.md` with the underlying pattern
- Convert mistakes into rules, not reminders
- Iterate ruthlessly until error rate drops
- Review relevant lessons at the start of each session

This applies equally to:
- Database design
- Editorial workflows
- UI decisions
- Community moderation tools

#### 4. Verification Before "Done"

- Never mark a task complete without proof
- Compare behavior before vs after changes
- Ask: "Would this be approved by a staff-level engineer or editor?"

Required checks:
- Tests
- Logs
- Real usage scenarios
- Editorial edge cases

#### 5. Demand Elegance (Balanced)

For non-trivial changes, pause and ask:
- "Is there a more elegant solution?"

If a fix feels hacky:
- "Knowing everything I know now, implement the elegant version"
- Do not over-engineer obvious or small fixes
- Challenge your own work before presenting it

Elegance here means:
- Fewer moving parts
- Clear editorial affordances
- Minimal cognitive load for contributors

#### 6. Autonomous Bug Fixing

When given a bug report: fix it
- Do not ask for hand-holding
- Identify: Logs, Errors, Failing tests
- Resolve without requiring additional context from the user
- Fix failing CI or editorial regressions proactively

### Task Management

1. **Plan First** - Write plans to `tasks/todo.md` using checkable items
2. **Verify Plan** - Confirm approach before implementation
3. **Track Progress** - Mark items complete incrementally
4. **Explain Changes** - Provide high-level summaries at each step
5. **Document Results** - Add a review section to `tasks/todo.md`
6. **Capture Lessons** - Update `tasks/lessons.md` after corrections or failures

### Core Principles

- **Simplicity First** - Every change should do the least work possible with the most clarity.
- **No Laziness** - Find root causes. No temporary fixes. No "we'll clean it up later."
- **Minimal Impact** - Touch only what's necessary. Avoid cascading complexity.

---

## Technical Reference

### Directory Structure

```
merged-enamorado/
├── client/src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities
├── server/
│   ├── routes.ts       # All API endpoints
│   ├── storage.ts      # Storage interface
│   ├── persistentStorage.ts  # File + DB storage implementation
│   └── db.ts           # Drizzle database connection
├── shared/
│   └── schema.ts       # Drizzle schema + Zod validation (single source of truth)
├── migrations/         # SQL migration files
├── tasks/              # Task tracking and lessons learned
└── data/               # File-based JSON storage (fallback)
```

### Design System

#### Colors (from tokens.css)
- `burnt-orange`: Primary accent (#cc4a00 range)
- `charcoal`: Text/dark backgrounds (#2a2a2a range)
- `cream`: Light backgrounds (#faf8f5 range)
- `navy`: Secondary accent

#### Typography
- `font-display`: Headlines (serif)
- `font-body`: Body text
- `font-ui`: Interface elements
- `font-mono`: Code/technical
- `font-accent`: Labels, uppercase tracking

#### Dark Mode
All components support dark mode via Tailwind's `dark:` prefix.

### UI/Design Standards

#### Decision Priority (for any UI change)
1. **User Needs** — Does this serve the task? Is it completable?
2. **Accessibility** — POUR: Perceivable, Operable, Understandable, Robust
3. **Consistency** — Follows established tokens and patterns
4. **Aesthetics** — Visually intentional, never decorative for its own sake
5. **Developer Experience** — Maintainable and composable

Never sacrifice a higher-priority concern for a lower one. Beautiful but inaccessible = broken. Consistent but confusing = wrong pattern.

#### Token Architecture (3-Tier)
- **Primitive** — Raw values: the `burnt-orange`, `charcoal`, `cream`, `navy` palette entries
- **Semantic** — Purpose aliases: `action.primary`, `surface.page`, `text.secondary`
- **Component** — Scoped to one element: `button-bg-primary`, `player-surface`

Never hardcode hex values or magic px sizes in component code. Reference Tailwind tokens or CSS custom properties. One theme change should cascade everywhere.

#### Contrast Requirements (WCAG 2.2 AA — measure, never approximate)
- Normal text (< 24px): **4.5:1 minimum**
- Large text (≥ 24px) / headings: **3:1 minimum**
- UI components, icons, borders conveying meaning: **3:1 minimum**
- Focus indicators: **3:1 minimum**

#### Component States (mandatory for every interactive element)
Every button, input, link, and player control must define:
**Default → Hover → Focus → Active → Disabled**

Loading and Error states are required for any async action. The StickyRadioPlayer play/pause is a primary action — it must pass all 5 states.

#### Touch Targets
- Primary actions (play/pause, submit, CTA): **44×44px minimum**
- Secondary actions: **24×24px minimum** (WCAG 2.5.8)
- The sticky player's 68px play button is the reference standard — hold all primary controls to this bar.

#### Motion Rules
- UI transitions: **100–300ms**. Never exceed 500ms.
- Entrances use `ease-out`. Exits use `ease-in`. State changes use `ease-in-out`.
- Every animation must respect `prefers-reduced-motion` — swap for a fade or instant transition.
- This includes the CarPlay expanded player backdrop blur and the artwork crossfade.

#### Progressive Disclosure (admin UI)
- Primary actions are always visible
- Secondary actions are one interaction away (menu, expand, popover)
- Advanced options sit behind an explicit disclosure control
- Empty states must explain value AND guide to first action — never bare "No data"

#### Voice & Tone for UI Copy
- **Labels**: Verb-first, concise. "Save changes" not "Click here to save your changes".
- **Errors**: What happened → why → how to fix. "Password must be 8+ characters — add numbers or symbols." not "Error: Invalid input".
- **Empty states**: Explain value, then guide. "No mixes yet. Be the first to submit one." not "Nothing here".
- Matches the editorial voice: warm, direct, non-corporate. Never condescending.

### Content Architecture

#### Content Tiers
- **Editorial:** Commissioned/curated content (highest visibility)
- **Featured:** Elevated community submissions
- **Archive:** Approved community content

#### Content Types
- `essay`, `interview`, `video_essay`, `photoshoot`, `playlist`, `artPdf`, `link`
- `notes` (raw thoughts, lighter format)
- `picks_list` (numbered recommendations)

#### Block System
Editorial content uses a block-based system (defined in `shared/schema.ts`):
- `text`: Rich HTML from Tiptap
- `image`: Full-width images with caption/credit
- `imageRow`: 2-3 images side by side
- `pullQuote`: Large highlighted quotes
- `callout`: Colored background sections
- `embed`: External content (YouTube, Spotify, etc.)
- `qa`: Interview Q&A format

### Key Entities

#### Contributors
Community members who submit content. Auto-created when content is approved.

```typescript
handle: string          // @username
displayName: string
role: 'dj' | 'writer' | 'photographer' | 'curator' | 'artist' | 'producer' | 'other'
location?: string
tagline?: string
bio?: string
socialLinks?: { instagram, twitter, soundcloud, bandcamp, spotify }
photoshootGallery?: Array<{ src, alt, caption, credit }>
recommendedPlaylistUrl?: string
```

#### Content-Contributor Junction
Links content to contributors with roles (author, photographer, interviewer, subject, etc.). Replaces the deprecated string-based `authors` array.

```typescript
// contentContributors table
contentId: number
contributorId: number
role: string        // 'author', 'photographer', 'subject', etc.
position: number    // Ordering
```

#### Mix Submissions
Community-submitted DJ mixes. Status flow: `pending` → `approved` → `featured`

#### Playlist Submissions
Community-curated playlists with Spotify/Apple Music/SoundCloud links.

### API Patterns

#### Public Endpoints
- `GET /api/contributors/:handle` - Profile with submissions + editorial content
- `GET /api/mixes` - Approved mixes
- `GET /api/playlists` - Approved playlists
- `GET /api/content/:identifier` - Editorial content by ID or slug

#### Admin Endpoints
All prefixed with `/api/admin/` and require `requireAdmin` middleware.

#### Storage Pattern
The `storage` singleton (from `./storage.ts`) abstracts data access. It's a `FileStorage` instance that uses both PostgreSQL (via Drizzle) and JSON files.

```typescript
const contributor = await storage.getContributorByHandle(handle);
const mixes = await storage.getMixSubmissions({ approved: true });
```

### Conventions

#### Icons
- Use `lucide-react` for UI icons
- Use `react-icons/si` for brand icons (SiInstagram, SiX, SiSpotify, etc.)
- Note: Twitter is now `SiX` (not SiTwitter)

#### Links
Use `wouter` for internal navigation:
```typescript
import { Link } from 'wouter';
<Link href="/contributors/username">Profile</Link>
```

#### Component Structure
```typescript
export default function PageName() {
  const { data, isLoading, error } = useQuery({...});

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState />;

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-gray-950">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {/* Content */}
      </main>
    </div>
  );
}
```

### Database Migrations

Migration files live in `/migrations/`. Key migration: `0001_editorial_v2.sql` adds:
- Enhanced contributor fields (location, role, socialLinks, photoshootGallery, etc.)
- `content_contributors` junction table
- Import tracking fields for Substack/Medium

### Environment Variables

```env
DATABASE_URL=postgresql://...
AZURACAST_API_KEY=...
AZURACAST_BASE_URL=...
SESSION_SECRET=...
```

### Notes

- **Substack Import:** Planned feature to import existing writing. Schema fields exist but UI not yet implemented.
- **File Storage:** The app can run without PostgreSQL using JSON file storage in `/data/`. Contributors specifically use the database.
- **No view counts:** Intentionally avoiding vanity metrics per project vision.
- **No heavy labeling:** Content tiers exist in the database but aren't prominently displayed to users.
