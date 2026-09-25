/**
 * Magazine Routes
 * Handles editorial content, issues, open calls, pitches, features,
 * magazine community submissions, and contributor profiles.
 *
 * Mounted by registerRoutes() in routes.ts via:
 *   registerMagazineRoutes(app);
 *
 * All routes namespaced under /api/magazine/* to avoid collision with
 * the existing webplayer routes.
 *
 * Public routes:   GET /api/magazine/content, /api/magazine/issues,
 *                  /api/magazine/open-calls, /api/magazine/contributors
 * Protected routes: require admin session (same adminAuth middleware)
 */

import type { Express } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import { requireAdmin } from "./adminAuth";
import { db } from "./db";
import {
  magazineContent,
  magazineIssues,
  magazineIssueContents,
  magazineFeatures,
  magazinePitches,
  magazineSubmissions,
  editorialProjects,
  openCalls,
  contributors,
  insertMagazineContentSchema,
  insertMagazineIssueSchema,
  insertOpenCallSchema,
  insertMagazineSubmissionSchema,
  insertContributorSchema,
} from "@shared/schema";
import { eq, desc, asc, and, isNull, like, or, sql } from "drizzle-orm";

// ── Upload config (mirrors existing webplayer multer setup) ──────────────────
const upload = multer({
  dest: path.join(process.cwd(), "uploads", "magazine"),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ── Auth middleware shorthand ────────────────────────────────────────────────
const requireEditor = requireAdmin; // treat admin as editor for now; expand with role later

// ── Helper ───────────────────────────────────────────────────────────────────
function notFound(res: any, entity = "Resource") {
  return res.status(404).json({ error: `${entity} not found` });
}

/** Normalize a DB row into the EditorialItem shape used by EditorialLanding / HomePage */
type EditorialItem = {
  id: string;
  kind: string;
  contentType?: string;
  title: string;
  description?: string;
  authorName?: string;
  authorHandle?: string;
  submittedAt?: string;
  thumbnail?: string | null;
  editorial?: { promoted: boolean; slug?: string };
};

export function registerMagazineRoutes(app: Express): void {

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC EDITORIAL FEED ENDPOINTS
  //  Called by HomePage and EditorialLanding
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/published-content
   * All published editorial content merged from magazine_content,
   * editorial_projects, and promoted magazine_submissions,
   * sorted newest-first. Returns EditorialItem[].
   */
  app.get("/api/published-content", async (_req, res) => {
    try {
      const [contentRows, projectRows, submissionRows] = await Promise.all([
        // Magazine articles / photoshoots / essays
        db
          .select()
          .from(magazineContent)
          .where(eq(magazineContent.status, "published"))
          .orderBy(desc(magazineContent.publishedAt))
          .limit(50),

        // In-house editorial projects
        db
          .select()
          .from(editorialProjects)
          .where(or(
            eq(editorialProjects.status, "published"),
            eq(editorialProjects.status, "featured")
          ))
          .orderBy(desc(editorialProjects.publishedAt))
          .limit(30),

        // Community submissions promoted to editorial track
        db
          .select()
          .from(magazineSubmissions)
          .where(eq(magazineSubmissions.editorialStatus, "published"))
          .orderBy(desc(magazineSubmissions.createdAt))
          .limit(30),
      ]);

      const items: EditorialItem[] = [
        ...contentRows.map((r) => ({
          id: `mc-${r.id}`,
          kind: r.editorialCategory || r.templateType || "editorial",
          contentType: r.templateType ?? undefined,
          title: r.title,
          description: r.excerpt ?? undefined,
          authorName: Array.isArray(r.authors) ? r.authors[0] : undefined,
          submittedAt: r.publishedAt?.toISOString(),
          thumbnail: r.coverImageUrl ?? null,
          editorial: { promoted: r.isHero ?? false, slug: r.slug },
        })),
        ...projectRows.map((r) => ({
          id: `ep-${r.id}`,
          kind: r.type,
          contentType: r.type,
          title: r.title,
          description: r.description ?? undefined,
          authorName: r.author ?? r.interviewee ?? undefined,
          submittedAt: r.publishedAt?.toISOString(),
          thumbnail: r.coverImage ?? null,
          editorial: { promoted: r.status === "featured" },
        })),
        ...submissionRows.map((r) => ({
          id: `ms-${r.id}`,
          kind: r.category,
          contentType: r.contentType ?? undefined,
          title: r.title,
          description: r.description ?? undefined,
          authorHandle: r.submitterHandle,
          submittedAt: r.createdAt?.toISOString(),
          thumbnail:
            (Array.isArray(r.files) && r.files.length > 0 ? r.files[0] : null) ??
            r.coverImageUrl ??
            null,
          editorial: { promoted: r.editorialStatus === "published" },
        })),
      ];

      // Sort by date descending
      items.sort((a, b) => {
        const ta = a.submittedAt ? Date.parse(a.submittedAt) : 0;
        const tb = b.submittedAt ? Date.parse(b.submittedAt) : 0;
        return tb - ta;
      });

      res.json(items);
    } catch (err) {
      console.error("[magazine] GET /api/published-content", err);
      res.status(500).json({ error: "Failed to fetch published content" });
    }
  });

  /**
   * GET /api/editorial-promoted
   * Subset of published content that is actively promoted/featured —
   * used for the homepage editorial strip and hero slots.
   * Returns EditorialItem[].
   */
  app.get("/api/editorial-promoted", async (_req, res) => {
    try {
      const [contentRows, projectRows] = await Promise.all([
        // Hero-flagged magazine content, ordered by featuredRank then date
        db
          .select()
          .from(magazineContent)
          .where(and(
            eq(magazineContent.status, "published"),
            eq(magazineContent.isHero, true)
          ))
          .orderBy(asc(magazineContent.featuredRank), desc(magazineContent.publishedAt))
          .limit(10),

        // Featured editorial projects
        db
          .select()
          .from(editorialProjects)
          .where(eq(editorialProjects.status, "featured"))
          .orderBy(desc(editorialProjects.publishedAt))
          .limit(10),
      ]);

      const items: EditorialItem[] = [
        ...contentRows.map((r) => ({
          id: `mc-${r.id}`,
          kind: r.editorialCategory || r.templateType || "editorial",
          contentType: r.templateType ?? undefined,
          title: r.title,
          description: r.excerpt ?? undefined,
          authorName: Array.isArray(r.authors) ? r.authors[0] : undefined,
          submittedAt: r.publishedAt?.toISOString(),
          thumbnail: r.coverImageUrl ?? null,
          editorial: { promoted: true, slug: r.slug },
        })),
        ...projectRows.map((r) => ({
          id: `ep-${r.id}`,
          kind: r.type,
          contentType: r.type,
          title: r.title,
          description: r.description ?? undefined,
          authorName: r.author ?? r.interviewee ?? undefined,
          submittedAt: r.publishedAt?.toISOString(),
          thumbnail: r.coverImage ?? null,
          editorial: { promoted: true },
        })),
      ];

      items.sort((a, b) => {
        const ta = a.submittedAt ? Date.parse(a.submittedAt) : 0;
        const tb = b.submittedAt ? Date.parse(b.submittedAt) : 0;
        return tb - ta;
      });

      res.json(items);
    } catch (err) {
      console.error("[magazine] GET /api/editorial-promoted", err);
      res.status(500).json({ error: "Failed to fetch promoted content" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  CONTENT (editorial articles, photoshoots, essays, etc.)
  // ═══════════════════════════════════════════════════════════

  // Public: list published content
  app.get("/api/magazine/content", async (req, res) => {
    try {
      const { category, template, limit = "20", offset = "0" } = req.query as Record<string, string>;
      const conditions = [eq(magazineContent.status, "published")];
      if (category) conditions.push(eq(magazineContent.editorialCategory, category));
      if (template) conditions.push(eq(magazineContent.templateType, template));

      const rows = await db
        .select()
        .from(magazineContent)
        .where(and(...conditions))
        .orderBy(desc(magazineContent.publishedAt))
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      res.json(rows);
    } catch (err) {
      console.error("[magazine] GET /content", err);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Public: single article by slug (canonical + legacy alias)
  const contentBySlug = async (req: any, res: any) => {
    try {
      const [row] = await db
        .select()
        .from(magazineContent)
        .where(eq(magazineContent.slug, req.params.slug));
      if (!row) return notFound(res, "Article");
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  };
  app.get("/api/magazine/content/slug/:slug", contentBySlug);
  app.get("/api/content/slug/:slug", contentBySlug);

  // Unified content resolver: /api/content/:slugOrId
  // Handles ep-{n} (editorial project by ID) and plain slugs (magazine content).
  // Client can use this single endpoint instead of chaining two separate fetches.
  app.get("/api/content/:slugOrId", async (req, res) => {
    try {
      const { slugOrId } = req.params;

      // ep-{n} → editorial project by ID
      const epMatch = slugOrId.match(/^ep-(\d+)$/);
      if (epMatch) {
        const [project] = await db
          .select()
          .from(editorialProjects)
          .where(eq(editorialProjects.id, parseInt(epMatch[1])));
        if (!project) return res.status(404).json({ error: "Not found" });
        return res.json({ _source: "editorial", ...project });
      }

      // Plain slug → magazine content
      const [article] = await db
        .select()
        .from(magazineContent)
        .where(eq(magazineContent.slug, slugOrId));
      if (article) return res.json({ _source: "magazine", ...article });

      return res.status(404).json({ error: "Not found" });
    } catch (err) {
      res.status(500).json({ error: "Failed to resolve content" });
    }
  });

  // Public: single article by ID
  app.get("/api/magazine/content/:id", async (req, res) => {
    try {
      const [row] = await db
        .select()
        .from(magazineContent)
        .where(eq(magazineContent.id, parseInt(req.params.id)));
      if (!row) return notFound(res, "Article");
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Admin: create
  app.post("/api/magazine/content", requireEditor, express.json(), async (req, res) => {
    try {
      const data = insertMagazineContentSchema.parse(req.body);
      const [row] = await db.insert(magazineContent).values(data).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: update
  app.patch("/api/magazine/content/:id", requireEditor, express.json(), async (req, res) => {
    try {
      const [row] = await db
        .update(magazineContent)
        .set({ ...req.body })
        .where(eq(magazineContent.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Article");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: delete
  app.delete("/api/magazine/content/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(magazineContent).where(eq(magazineContent.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  ISSUES
  // ═══════════════════════════════════════════════════════════

  app.get("/api/magazine/issues", async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(magazineIssues)
        .where(eq(magazineIssues.status, "published"))
        .orderBy(desc(magazineIssues.publishedAt));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  app.get("/api/magazine/issues/slug/:slug", async (req, res) => {
    try {
      const [issue] = await db
        .select()
        .from(magazineIssues)
        .where(eq(magazineIssues.slug, req.params.slug));
      if (!issue) return notFound(res, "Issue");

      // Fetch linked articles in order
      const links = await db
        .select()
        .from(magazineIssueContents)
        .where(eq(magazineIssueContents.issueId, issue.id))
        .orderBy(magazineIssueContents.position);

      const contentIds = links.map((l) => l.contentId);
      const articles =
        contentIds.length > 0
          ? await db
              .select()
              .from(magazineContent)
              .where(sql`${magazineContent.id} = ANY(${contentIds})`)
          : [];

      res.json({ ...issue, articles });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch issue" });
    }
  });

  app.post("/api/magazine/issues", requireEditor, express.json(), async (req, res) => {
    try {
      const data = insertMagazineIssueSchema.parse(req.body);
      const [row] = await db.insert(magazineIssues).values(data).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/magazine/issues/:id", requireEditor, express.json(), async (req, res) => {
    try {
      const [row] = await db
        .update(magazineIssues)
        .set({ ...req.body })
        .where(eq(magazineIssues.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Issue");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/magazine/issues/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(magazineIssues).where(eq(magazineIssues.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // Add article to issue
  app.post("/api/magazine/issues/:id/contents", requireEditor, express.json(), async (req, res) => {
    try {
      const { contentId, position = 0 } = req.body;
      const [row] = await db
        .insert(magazineIssueContents)
        .values({ issueId: parseInt(req.params.id), contentId, position })
        .returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Remove article from issue
  app.delete("/api/magazine/issue-contents/:id", requireEditor, async (req, res) => {
    try {
      await db
        .delete(magazineIssueContents)
        .where(eq(magazineIssueContents.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to remove" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  OPEN CALLS
  // ═══════════════════════════════════════════════════════════

  app.get("/api/magazine/open-calls", async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(openCalls)
        .where(eq(openCalls.status, "active"))
        .orderBy(desc(openCalls.publishedAt));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch open calls" });
    }
  });

  app.get("/api/magazine/open-calls/:slug", async (req, res) => {
    try {
      const [row] = await db
        .select()
        .from(openCalls)
        .where(eq(openCalls.slug, req.params.slug));
      if (!row) return notFound(res, "Open Call");
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch open call" });
    }
  });

  app.post("/api/magazine/open-calls", requireAdmin, express.json(), async (req, res) => {
    try {
      const data = insertOpenCallSchema.parse(req.body);
      const [row] = await db.insert(openCalls).values(data as any).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/magazine/open-calls/:id", requireAdmin, express.json(), async (req, res) => {
    try {
      const [row] = await db
        .update(openCalls)
        .set({ ...req.body })
        .where(eq(openCalls.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Open Call");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/magazine/open-calls/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(openCalls).where(eq(openCalls.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  COMMUNITY SUBMISSIONS (magazine track)
  // ═══════════════════════════════════════════════════════════

  app.post("/api/magazine/submit", express.json(), async (req, res) => {
    try {
      const data = insertMagazineSubmissionSchema.parse(req.body);
      const [row] = await db.insert(magazineSubmissions).values(data as any).returning();
      res.status(201).json({ ok: true, id: row.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Unified community submission endpoint.
  // Accepts all content types: mix (non-air), playlist, track, writing, artwork, article.
  // kind values: "playlist" | "track" | "writing" | "artwork" | "article" | "other"
  app.post("/api/community-submissions", express.json(), async (req, res) => {
    try {
      const {
        kind,
        title,
        description,
        externalUrl,
        authorName,
        genre,
        coverImageUrl,
      } = req.body;

      if (!title || !authorName) {
        return res.status(400).json({ error: "title and authorName are required" });
      }

      // Derive contentType from kind
      const contentType =
        kind === "writing" || kind === "article" ? "text"
        : kind === "artwork" ? "image"
        : "link";

      // Derive embedPlatform if URL is present
      let embedPlatform: string | undefined;
      if (externalUrl) {
        const u = externalUrl.toLowerCase();
        if (u.includes("soundcloud.com")) embedPlatform = "soundcloud";
        else if (u.includes("mixcloud.com")) embedPlatform = "mixcloud";
        else if (u.includes("open.spotify.com")) embedPlatform = "spotify";
        else if (u.includes("music.apple.com")) embedPlatform = "apple-music";
        else if (u.includes("youtube.com") || u.includes("youtu.be")) embedPlatform = "youtube";
      }

      const [row] = await db
        .insert(magazineSubmissions)
        .values({
          title,
          description: description ?? "",
          submitterHandle: authorName,
          category: kind ?? "other",
          contentType,
          externalUrl: externalUrl ?? undefined,
          embedPlatform: embedPlatform ?? undefined,
          embedUrl: externalUrl ?? undefined,
          coverImageUrl: coverImageUrl ?? undefined,
          status: "pending",
          editorialStatus: "pending",
          section: "community",
          isCommunityVoice: true,
        } as any)
        .returning();
      res.status(201).json({ ok: true, id: row.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/magazine/submissions", requireEditor, async (req, res) => {
    try {
      const { status } = req.query as Record<string, string>;
      const conditions = status ? [eq(magazineSubmissions.status, status)] : [];
      const rows = await db
        .select()
        .from(magazineSubmissions)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(magazineSubmissions.createdAt));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.patch("/api/magazine/submissions/:id/status", requireEditor, express.json(), async (req, res) => {
    try {
      const { status, feedbackNotes, editorialStatus } = req.body;
      const [row] = await db
        .update(magazineSubmissions)
        .set({ status, feedbackNotes, editorialStatus, reviewedAt: new Date() })
        .where(eq(magazineSubmissions.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Submission");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  FEATURES (homepage curation)
  // ═══════════════════════════════════════════════════════════

  app.get("/api/magazine/features", async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(magazineFeatures)
        .where(eq(magazineFeatures.isActive, true))
        .orderBy(magazineFeatures.position);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  app.post("/api/magazine/features", requireAdmin, express.json(), async (req, res) => {
    try {
      const [row] = await db.insert(magazineFeatures).values(req.body).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/magazine/features/:id", requireAdmin, express.json(), async (req, res) => {
    try {
      const [row] = await db
        .update(magazineFeatures)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(magazineFeatures.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Feature");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/magazine/features/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(magazineFeatures).where(eq(magazineFeatures.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  PITCHES (internal editorial planning)
  // ═══════════════════════════════════════════════════════════

  app.get("/api/magazine/pitches", requireAdmin, async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(magazinePitches)
        .orderBy(desc(magazinePitches.createdAt));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch pitches" });
    }
  });

  app.post("/api/magazine/pitches", requireAdmin, express.json(), async (req, res) => {
    try {
      const [row] = await db.insert(magazinePitches).values(req.body).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/magazine/pitches/:id", requireAdmin, express.json(), async (req, res) => {
    try {
      const [row] = await db
        .update(magazinePitches)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(magazinePitches.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Pitch");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/magazine/pitches/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(magazinePitches).where(eq(magazinePitches.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  IMAGE UPLOAD (magazine articles)
  // ═══════════════════════════════════════════════════════════

  app.post(
    "/api/magazine/upload-image",
    requireEditor,
    upload.single("image"),
    (req, res) => {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const url = `/uploads/magazine/${req.file.filename}`;
      res.json({ url });
    }
  );

  // ═══════════════════════════════════════════════════════════
  //  SHORTHAND ALIASES
  //  Magazine admin pages call /api/issues, /api/pitches, etc.
  //  rather than the /api/magazine/* prefix.  These aliases
  //  expose the same DB operations at the shorter paths so the
  //  admin UI works without requiring client-side path changes.
  // ═══════════════════════════════════════════════════════════

  // ── Issues ──────────────────────────────────────────────────
  // Admin view shows ALL issues (no status filter), unlike the
  // public /api/magazine/issues route which only returns published.
  app.get("/api/issues", requireEditor, async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(magazineIssues)
        .orderBy(desc(magazineIssues.publishedAt));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  app.post("/api/issues", requireEditor, express.json(), async (req, res) => {
    try {
      const data = insertMagazineIssueSchema.parse(req.body);
      const [row] = await db.insert(magazineIssues).values(data).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/issues/:id", requireEditor, express.json(), async (req, res) => {
    try {
      const [row] = await db
        .update(magazineIssues)
        .set({ ...req.body })
        .where(eq(magazineIssues.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Issue");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/issues/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(magazineIssues).where(eq(magazineIssues.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ── Pitches ─────────────────────────────────────────────────
  app.get("/api/pitches", requireAdmin, async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(magazinePitches)
        .orderBy(desc(magazinePitches.createdAt));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch pitches" });
    }
  });

  app.post("/api/pitches", requireAdmin, express.json(), async (req, res) => {
    try {
      const [row] = await db.insert(magazinePitches).values(req.body).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/pitches/:id", requireAdmin, express.json(), async (req, res) => {
    try {
      const [row] = await db
        .update(magazinePitches)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(magazinePitches.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Pitch");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/pitches/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(magazinePitches).where(eq(magazinePitches.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ── Open Calls ───────────────────────────────────────────────
  // Admin alias returns ALL open calls (no status filter).
  app.get("/api/open-calls", requireEditor, async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(openCalls)
        .orderBy(desc(openCalls.publishedAt));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch open calls" });
    }
  });

  app.post("/api/open-calls", requireAdmin, express.json(), async (req, res) => {
    try {
      const data = insertOpenCallSchema.parse(req.body);
      const [row] = await db.insert(openCalls).values(data as any).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/open-calls/:id", requireAdmin, express.json(), async (req, res) => {
    try {
      const [row] = await db
        .update(openCalls)
        .set({ ...req.body })
        .where(eq(openCalls.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Open Call");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/open-calls/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(openCalls).where(eq(openCalls.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ── Contributors CRUD (admin write paths) ───────────────────
  // GET /api/contributors and GET /api/contributors/:handle are
  // already registered in routes.ts (public endpoints).
  // These add the write operations at the same /api/contributors
  // prefix that the magazine-admin-contributors page expects.
  app.post("/api/contributors", requireAdmin, express.json(), async (req, res) => {
    try {
      const data = insertContributorSchema.parse(req.body);
      const [row] = await db.insert(contributors).values(data).returning();
      res.status(201).json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/contributors/:id", requireAdmin, express.json(), async (req, res) => {
    try {
      const data = insertContributorSchema.partial().parse(req.body);
      const [row] = await db
        .update(contributors)
        .set(data)
        .where(eq(contributors.id, parseInt(req.params.id)))
        .returning();
      if (!row) return notFound(res, "Contributor");
      res.json(row);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/contributors/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(contributors).where(eq(contributors.id, parseInt(req.params.id)));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  FEATURES WITH CONTENT
  //  Used by: magazine-editorials.tsx, featured-stories.tsx,
  //           hero-section.tsx
  //  Returns: FeatureWithContent[] — each active feature with
  //           its associated magazineContent row joined in.
  // ═══════════════════════════════════════════════════════════

  app.get("/api/features-with-content", async (_req, res) => {
    try {
      const features = await db
        .select()
        .from(magazineFeatures)
        .where(eq(magazineFeatures.isActive, true))
        .orderBy(magazineFeatures.position);

      const results = await Promise.all(
        features.map(async (feature) => {
          let content = null;
          if (feature.entityType === "content") {
            const contentId = parseInt(feature.entityId);
            if (!isNaN(contentId)) {
              const [row] = await db
                .select()
                .from(magazineContent)
                .where(eq(magazineContent.id, contentId));
              content = row ?? null;
            }
          }
          return {
            feature: {
              id: feature.id,
              entityType: feature.entityType,
              entityId: feature.entityId,
              featureType: feature.featureType as "hero" | "main" | "secondary",
              position: feature.position ?? 0,
              isActive: feature.isActive ?? true,
              activeFrom: feature.activeFrom,
              activeUntil: feature.activeUntil,
            },
            content,
          };
        })
      );

      res.json(results);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch features with content" });
    }
  });
}
