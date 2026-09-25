import type { Express, Request, Response, NextFunction } from "express";
import { requireAdmin } from "./adminAuth";
import { db } from "./db";
import {
  editorialProjects,
  editorialRevisions,
  editorialMedia,
  contentMapping,
  magazineSubmissions,
  magazineContent,
  contributors,
} from "../shared/schema";
import { eq, desc, sql, gte, lte, or } from "drizzle-orm";
// @ts-ignore
import fetch from "node-fetch";
import multer from "multer";
import path from "path";
import fs from "fs";

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "editorial");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — full-res editorial photos
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export function registerEditorialRoutes(app: Express) {
  // =============================
  // EDITORIAL PROJECTS ENDPOINTS
  // =============================

  // GET /api/editorial/projects - List all projects (optional ?assignedTo=username filter)
  app.get("/api/editorial/projects", async (req: Request, res: Response) => {
    try {
      const { assignedTo, status } = req.query as { assignedTo?: string; status?: string };

      let query = db.select().from(editorialProjects).$dynamic();

      if (assignedTo) {
        query = query.where(eq(editorialProjects.assignedTo, assignedTo));
      }
      if (status) {
        query = query.where(eq(editorialProjects.status, status));
      }

      const projects = await query.orderBy(desc(editorialProjects.updatedAt));
      res.json(projects);
    } catch (error) {
      console.error("Error fetching editorial projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // GET /api/editorial/projects/:id - Get single project
  app.get("/api/editorial/projects/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [project] = await db
        .select()
        .from(editorialProjects)
        .where(eq(editorialProjects.id, parseInt(id)));

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // POST /api/editorial/projects - Create new project
  app.post("/api/editorial/projects", async (req: Request, res: Response) => {
    try {
      const projectData = req.body;

      // Set default status if not provided
      if (!projectData.status) {
        projectData.status = "planning";
      }

      // Convert date strings to Date objects for Drizzle ORM
      if (projectData.dueDate && typeof projectData.dueDate === 'string') {
        projectData.dueDate = new Date(projectData.dueDate);
      }
      if (projectData.publishedAt && typeof projectData.publishedAt === 'string') {
        projectData.publishedAt = new Date(projectData.publishedAt);
      }

      const [newProject] = await db
        .insert(editorialProjects)
        .values(projectData)
        .returning();

      res.status(201).json(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // PATCH /api/editorial/projects/:id - Update project
  app.patch("/api/editorial/projects/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const projectId = parseInt(id);
      const updates = req.body;

      updates.updatedAt = new Date();

      // Date coercions
      for (const field of ["dueDate", "publishedAt", "scheduledAt", "copyEditedAt"]) {
        if (updates[field] && typeof updates[field] === "string") {
          updates[field] = new Date(updates[field]);
        }
      }

      // Auto-generate slug from title if the incoming payload has no slug yet
      if (updates.title && !updates.slug) {
        updates.slug = updates.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 80);
      }

      // If no title in this PATCH, check if the project already lacks a slug and derive one from DB title
      if (!updates.slug) {
        const [existing] = await db.select({ title: editorialProjects.title, slug: editorialProjects.slug })
          .from(editorialProjects).where(eq(editorialProjects.id, projectId));
        if (existing && existing.title && !existing.slug) {
          updates.slug = existing.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 80);
        }
      }

      // Auto-calculate word count + reading time from HTML content
      if (updates.content) {
        const plainText = updates.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const words = plainText.split(" ").filter(Boolean).length;
        updates.wordCount = words;
        updates.readingTime = Math.max(1, Math.ceil(words / 200));
      }

      const [updatedProject] = await db
        .update(editorialProjects)
        .set(updates)
        .where(eq(editorialProjects.id, projectId))
        .returning();

      if (!updatedProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Save a revision snapshot (fire-and-forget, don't block response)
      const savedBy = (req as any).adminUser?.username || updates.assignedTo || "system";
      db.insert(editorialRevisions).values({
        projectId,
        label: "Auto-save",
        content: updates.content ?? updatedProject.content ?? null,
        formSnapshot: updates,
        savedBy,
      }).catch(() => {});

      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // PATCH /api/editorial/projects/:id/status - Update project status
  // Editors can move to in-progress/copy-edit/ready only; published/featured require admin.
  app.patch("/api/editorial/projects/:id/status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const adminSession = (req as any).admin;
      const ADMIN_ONLY_STATUSES = ["published", "featured"];
      if (ADMIN_ONLY_STATUSES.includes(status) && adminSession?.role !== "admin") {
        return res.status(403).json({ error: "Only admins can set status to published or featured" });
      }

      const setFields: Record<string, unknown> = { status, updatedAt: new Date() };
      // Auto-set publishedAt when first publishing
      if (status === "published") {
        const [existing] = await db
          .select({ publishedAt: editorialProjects.publishedAt })
          .from(editorialProjects)
          .where(eq(editorialProjects.id, parseInt(id)));
        if (existing && !existing.publishedAt) {
          setFields.publishedAt = new Date();
        }
      }

      const [updatedProject] = await db
        .update(editorialProjects)
        .set(setFields as any)
        .where(eq(editorialProjects.id, parseInt(id)))
        .returning();

      if (!updatedProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // POST /api/editorial/projects/:id/publish - Publish project (admin-only)
  // Side-effects for community-spotlight type:
  //   1. Creates a magazineContent record (feeds homepage feature slots)
  //   2. Updates project with magazineContentId back-reference
  //   3. Auto-creates contributor from interviewee data if not already present
  app.post("/api/editorial/projects/:id/publish", requireAdmin, async (req: Request, res: Response) => {
    if ((req as any).admin?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can publish projects" });
    }
    try {
      const { id } = req.params;
      const projectId = parseInt(id);

      const [project] = await db
        .select()
        .from(editorialProjects)
        .where(eq(editorialProjects.id, projectId));

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const now = new Date();
      let magazineContentId: number | null = project.magazineContentId ?? null;

      // ── Auto-create magazineContent for spotlight/interview projects ────────
      if (
        (project.type === "community-spotlight" || project.type === "interview") &&
        !magazineContentId
      ) {
        // Generate a slug from title + project id for uniqueness
        const slug = project.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60) + `-${projectId}`;

        const authors: string[] = [];
        if (project.interviewee) authors.push(project.interviewee);
        else if (project.author) authors.push(project.author);

        const [newContent] = await db
          .insert(magazineContent)
          .values({
            title: project.title,
            slug,
            status: "published",
            excerpt: project.description ?? undefined,
            body: project.content ?? undefined,
            coverImageUrl: project.coverImage ?? undefined,
            authors: authors.length ? authors : undefined,
            templateType: "interview",
            publishedAt: now,
          } as any)
          .returning();

        magazineContentId = newContent.id;
      }

      // ── Auto-create/update contributor from interviewee fields ──────────────
      if (project.interviewee) {
        // Derive a handle from the interviewee name
        const handle = project.interviewee
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40);

        const [existing] = await db
          .select()
          .from(contributors)
          .where(eq(contributors.handle, handle));

        if (!existing) {
          await db.insert(contributors).values({
            handle,
            displayName: project.interviewee,
            bio: project.description ?? undefined,
            avatarUrl: project.intervieweeImage ?? undefined,
          });
        }
      }

      // ── Mark project published ───────────────────────────────────────────────
      const updatePayload: Record<string, unknown> = {
        status: "published",
        publishedAt: now,
        updatedAt: now,
      };
      if (magazineContentId) updatePayload.magazineContentId = magazineContentId;

      const [updatedProject] = await db
        .update(editorialProjects)
        .set(updatePayload)
        .where(eq(editorialProjects.id, projectId))
        .returning();

      res.json({ ...updatedProject, magazineContentId });
    } catch (error) {
      console.error("Error publishing project:", error);
      res.status(500).json({ error: "Failed to publish project" });
    }
  });

  // DELETE /api/editorial/projects/:id - Delete project (admin-only)
  app.delete("/api/editorial/projects/:id", requireAdmin, async (req: Request, res: Response) => {
    if ((req as any).admin?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete projects" });
    }
    try {
      const { id } = req.params;

      await db
        .delete(editorialProjects)
        .where(eq(editorialProjects.id, parseInt(id)));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // GET /api/editorial/published - Get published projects for content mapper
  app.get("/api/editorial/published", async (req: Request, res: Response) => {
    try {
      const published = await db
        .select({
          id: editorialProjects.id,
          title: editorialProjects.title,
          type: editorialProjects.type,
          coverImage: editorialProjects.coverImage,
          status: editorialProjects.status,
          publishedAt: editorialProjects.publishedAt,
          externalUrl: editorialProjects.externalUrl,
          externalType: editorialProjects.externalType,
        })
        .from(editorialProjects)
        .where(sql`${editorialProjects.status} IN ('published', 'featured')`)
        .orderBy(desc(editorialProjects.publishedAt));

      res.json(published);
    } catch (error) {
      console.error("Error fetching published content:", error);
      res.status(500).json({ error: "Failed to fetch published content" });
    }
  });

  // ============================================================
  // SPOTLIGHT LOOP ENDPOINTS
  // ============================================================

  // POST /api/editorial/projects/from-submission/:submissionId
  // Creates a community-spotlight editorial project pre-populated from
  // a magazine open-call submission. Bridges the submission → editorial gap.
  app.post("/api/editorial/projects/from-submission/:submissionId", async (req: Request, res: Response) => {
    try {
      const submissionId = parseInt(req.params.submissionId);

      const [submission] = await db
        .select()
        .from(magazineSubmissions)
        .where(eq(magazineSubmissions.id, submissionId));

      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      // Derive interviewee name from handle (capitalize each word)
      const displayName = submission.submitterHandle
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const [project] = await db
        .insert(editorialProjects)
        .values({
          title: `Spotlight: ${displayName}`,
          type: "community-spotlight",
          status: "planning",
          description: submission.description,
          interviewee: displayName,
          intervieweeRole: submission.category ?? undefined,
          externalUrl: submission.externalUrl ?? undefined,
          assignedTo: req.body.assignedTo ?? undefined,
          sourceSubmissionId: submissionId,
        })
        .returning();

      // Mark submission as approved so it doesn't show as pending
      await db
        .update(magazineSubmissions)
        .set({ status: "approved", reviewedAt: new Date() })
        .where(eq(magazineSubmissions.id, submissionId));

      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project from submission:", error);
      res.status(500).json({ error: "Failed to create project from submission" });
    }
  });

  // GET /api/editorial/spotlights — all published editorial content for the Spotlight archive.
  // Accepts optional ?type= query param to filter by content type
  // (community-spotlight | interview | essay | photoshoot | mix-feature).
  // Without a filter it returns ALL published/featured editorial types — mobility by design.
  app.get("/api/editorial/spotlights", async (req: Request, res: Response) => {
    try {
      const typeFilter = req.query.type as string | undefined;

      const ALL_TYPES = [
        "community-spotlight",
        "interview",
        "essay",
        "photoshoot",
        "mix-feature",
      ];

      const allowedTypes = typeFilter
        ? ALL_TYPES.filter((t) => t === typeFilter)
        : ALL_TYPES;

      // Build a safe IN (...) list from the filtered types
      const typeList = allowedTypes.map((t) => `'${t}'`).join(", ");

      const spotlights = await db
        .select()
        .from(editorialProjects)
        .where(
          sql`${editorialProjects.type} IN (${sql.raw(typeList)})
              AND ${editorialProjects.status} IN ('published', 'featured')`
        )
        .orderBy(desc(editorialProjects.publishedAt));

      res.json(spotlights);
    } catch (error) {
      console.error("Error fetching spotlights:", error);
      res.status(500).json({ error: "Failed to fetch spotlights" });
    }
  });

  // =============================
  // MEDIA LIBRARY ENDPOINTS
  // =============================

  // GET /api/editorial/media - List all media
  app.get("/api/editorial/media", async (req: Request, res: Response) => {
    try {
      const media = await db
        .select()
        .from(editorialMedia)
        .orderBy(desc(editorialMedia.uploadedAt));

      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // POST /api/editorial/media/upload - Upload media files
  app.post("/api/editorial/media/upload", (req: Request, res: Response, next: NextFunction) => {
    upload.array("files")(req, res, (err: any) => {
      if (err) {
        const msg = err.code === "LIMIT_FILE_SIZE"
          ? "File too large — max 50MB per image"
          : err.message || "Upload error";
        return res.status(400).json({ error: msg });
      }
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const uploadedBy = req.body.uploadedBy || "admin"; // TODO: Get from session

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedMedia = [];

      for (const file of files) {
        const url = `/uploads/editorial/${file.filename}`;
        const thumbnailUrl = url; // TODO: Generate actual thumbnails

        const [media] = await db
          .insert(editorialMedia)
          .values({
            filename: file.originalname,
            url,
            thumbnailUrl,
            type: "image",
            size: file.size,
            uploadedBy,
          })
          .returning();

        uploadedMedia.push(media);
      }

      res.status(201).json({ uploaded: uploadedMedia });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ error: "Failed to upload media" });
    }
  });

  // DELETE /api/editorial/media/:id - Delete media
  app.delete("/api/editorial/media/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get the media record to delete the file
      const [media] = await db
        .select()
        .from(editorialMedia)
        .where(eq(editorialMedia.id, parseInt(id)));

      if (media) {
        // Delete the physical file
        const filePath = path.join(process.cwd(), media.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete from database
      await db
        .delete(editorialMedia)
        .where(eq(editorialMedia.id, parseInt(id)));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  // =============================
  // CONTENT MAPPING ENDPOINTS
  // =============================

  // GET /api/editorial/content-mapping - Get current mapping
  app.get("/api/editorial/content-mapping", async (req: Request, res: Response) => {
    try {
      const mappings = await db
        .select()
        .from(contentMapping);

      res.json({ slots: mappings });
    } catch (error) {
      console.error("Error fetching content mapping:", error);
      res.status(500).json({ error: "Failed to fetch content mapping" });
    }
  });

  // POST /api/editorial/content-mapping - Save mapping
  app.post("/api/editorial/content-mapping", async (req: Request, res: Response) => {
    try {
      const { slots } = req.body;
      const updatedBy = "admin"; // TODO: Get from session

      if (!slots || !Array.isArray(slots)) {
        return res.status(400).json({ error: "Invalid slots data" });
      }

      // Update or insert each slot
      for (const slot of slots) {
        // Check if slot exists
        const [existing] = await db
          .select()
          .from(contentMapping)
          .where(eq(contentMapping.slotId, slot.id));

        if (existing) {
          // Update existing
          await db
            .update(contentMapping)
            .set({
              contentType: slot.contentType,
              contentId: slot.contentId,
              updatedAt: new Date(),
              updatedBy,
            })
            .where(eq(contentMapping.slotId, slot.id));
        } else {
          // Insert new
          await db
            .insert(contentMapping)
            .values({
              slotId: slot.id,
              contentType: slot.contentType,
              contentId: slot.contentId,
              updatedBy,
            });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving content mapping:", error);
      res.status(500).json({ error: "Failed to save content mapping" });
    }
  });

  // =============================
  // PUBLIC CONTENT ENDPOINT
  // =============================

  // GET /api/editorial/content/:id - Get published content for display
  app.get("/api/editorial/content/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [content] = await db
        .select()
        .from(editorialProjects)
        .where(
          sql`${editorialProjects.id} = ${parseInt(id)} AND ${editorialProjects.status} IN ('published', 'featured')`
        );

      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // ==========================================
  // REVISION HISTORY
  // ==========================================

  // GET /api/editorial/projects/:id/revisions
  app.get("/api/editorial/projects/:id/revisions", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const revisions = await db
        .select()
        .from(editorialRevisions)
        .where(eq(editorialRevisions.projectId, projectId))
        .orderBy(desc(editorialRevisions.savedAt))
        .limit(50);
      res.json(revisions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revisions" });
    }
  });

  // POST /api/editorial/projects/:id/revisions - Save named revision
  app.post("/api/editorial/projects/:id/revisions", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const { label, savedBy } = req.body;

      const [project] = await db.select().from(editorialProjects).where(eq(editorialProjects.id, projectId));
      if (!project) return res.status(404).json({ error: "Project not found" });

      const [revision] = await db.insert(editorialRevisions).values({
        projectId,
        label: label || "Manual save",
        content: project.content,
        formSnapshot: project as any,
        savedBy: savedBy || "admin",
      }).returning();

      res.status(201).json(revision);
    } catch (error) {
      res.status(500).json({ error: "Failed to save revision" });
    }
  });

  // POST /api/editorial/projects/:id/restore/:revisionId - Restore a revision
  app.post("/api/editorial/projects/:id/restore/:revisionId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const revisionId = parseInt(req.params.revisionId);

      const [revision] = await db.select().from(editorialRevisions).where(eq(editorialRevisions.id, revisionId));
      if (!revision || revision.projectId !== projectId) {
        return res.status(404).json({ error: "Revision not found" });
      }

      // Save current state as a revision before restoring
      const [current] = await db.select().from(editorialProjects).where(eq(editorialProjects.id, projectId));
      if (current) {
        await db.insert(editorialRevisions).values({
          projectId,
          label: "Before restore",
          content: current.content,
          formSnapshot: current as any,
          savedBy: "system",
        });
      }

      const [restored] = await db
        .update(editorialProjects)
        .set({ content: revision.content, updatedAt: new Date() })
        .where(eq(editorialProjects.id, projectId))
        .returning();

      res.json(restored);
    } catch (error) {
      res.status(500).json({ error: "Failed to restore revision" });
    }
  });

  // ==========================================
  // VIEW COUNT
  // ==========================================

  // POST /api/editorial/projects/:id/view - Increment view count
  app.post("/api/editorial/projects/:id/view", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      await db
        .update(editorialProjects)
        .set({ viewCount: sql`COALESCE(${editorialProjects.viewCount}, 0) + 1` })
        .where(eq(editorialProjects.id, projectId));
      res.json({ ok: true });
    } catch {
      res.json({ ok: false }); // non-critical, don't surface error
    }
  });

  // ==========================================
  // CONTENT CALENDAR
  // ==========================================

  // GET /api/editorial/calendar?month=2026-09 - Projects for calendar view
  app.get("/api/editorial/calendar", async (req: Request, res: Response) => {
    try {
      const { month } = req.query as { month?: string };
      let rangeStart: Date;
      let rangeEnd: Date;

      if (month && /^\d{4}-\d{2}$/.test(month)) {
        rangeStart = new Date(`${month}-01T00:00:00Z`);
        rangeEnd = new Date(rangeStart);
        rangeEnd.setMonth(rangeEnd.getMonth() + 1);
      } else {
        // Default: current month ± 1
        const now = new Date();
        rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1);
      }

      const projects = await db
        .select({
          id: editorialProjects.id,
          title: editorialProjects.title,
          type: editorialProjects.type,
          status: editorialProjects.status,
          assignedTo: editorialProjects.assignedTo,
          dueDate: editorialProjects.dueDate,
          scheduledAt: editorialProjects.scheduledAt,
          publishedAt: editorialProjects.publishedAt,
          coverImage: editorialProjects.coverImage,
          tags: editorialProjects.tags,
        })
        .from(editorialProjects)
        .orderBy(desc(editorialProjects.updatedAt));

      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  });

  // ==========================================
  // SCHEDULE
  // ==========================================

  // PATCH /api/editorial/projects/:id/schedule - Set scheduledAt
  app.patch("/api/editorial/projects/:id/schedule", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const { scheduledAt } = req.body;

      const [updated] = await db
        .update(editorialProjects)
        .set({
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(editorialProjects.id, projectId))
        .returning();

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to set schedule" });
    }
  });

  // ==========================================
  // WEBSCRAPER PROXY
  // Proxies to the user's local webscraper at localhost:8080
  // Used to enrich external URLs, embed links, and auto-fill OG metadata
  // ==========================================

  app.post("/api/editorial/scrape-url", async (req: Request, res: Response) => {
    const { url, mode = "metadata" } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });

    const SCRAPER_URL = process.env.SCRAPER_URL || "http://localhost:8080";

    try {
      // Quick metadata-only scan — faster than full deep-scan
      const scraperRes = await fetch(`${SCRAPER_URL}/api/deep-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          analysis_mode: "single",
          options: { extract_metadata: true, extract_styles: false, extract_layout: false },
        }),
        // @ts-ignore node-fetch signal
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      } as any);

      if (!scraperRes.ok) throw new Error(`Scraper returned ${scraperRes.status}`);
      const raw: any = await scraperRes.json();

      // Normalise the scraper output into a clean editorial metadata shape
      const meta = raw?.evidence?.metadata || raw?.metadata || {};
      const og = raw?.evidence?.open_graph || raw?.open_graph || {};

      const result = {
        title: og.title || meta.title || "",
        description: og.description || meta.description || "",
        ogImage: og.image || meta.image || "",
        author: meta.author || og.author || "",
        siteName: og.site_name || meta.site_name || "",
        canonical: meta.canonical || url,
        scraped: true,
      };

      res.json(result);
    } catch (err: any) {
      const isMissing = err?.code === "ECONNREFUSED";
      res.status(isMissing ? 503 : 500).json({
        error: isMissing
          ? "Webscraper is not running — start it at localhost:8080 to use this feature"
          : "Scrape failed",
        scraped: false,
      });
    }
  });
}
