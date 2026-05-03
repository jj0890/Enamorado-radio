import type { Express } from "express";
import { db } from "./db";
import { editorialSubmissions, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "./adminAuth";
import { z } from "zod";

// Validation schema for submissions
const submissionSchema = z.object({
  writerName: z.string().min(2),
  writerEmail: z.string().email(),
  writerBio: z.string().max(500).optional(),
  portfolioLinks: z.array(z.string().url()).max(5).optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
  pitchTitle: z.string().min(10),
  pitchCategory: z.string(),
  pitchSummary: z.string().min(50).max(1000),
  whyThisPublication: z.string().max(500).optional(),
  uniqueAngle: z.string().optional(),
  writingSampleText: z.string().min(100).optional(),
  writingSampleFile: z.string().optional(),
  wordCount: z.number().optional(),
  targetPublishDate: z.string().optional(),
  exclusiveSubmission: z.boolean().default(false),
});

export function registerSubmissionRoutes(app: Express) {

  // POST /api/submissions - Create new submission
  app.post("/api/submissions", async (req, res) => {
    try {
      // Validate submission data
      const validatedData = submissionSchema.parse(req.body);

      // Insert into database
      const result = await db.insert(editorialSubmissions).values({
        writerName: validatedData.writerName,
        writerEmail: validatedData.writerEmail,
        writerBio: validatedData.writerBio || null,
        portfolioLinks: validatedData.portfolioLinks || null,
        socialLinks: validatedData.socialLinks || null,
        pitchTitle: validatedData.pitchTitle,
        pitchCategory: validatedData.pitchCategory,
        pitchSummary: validatedData.pitchSummary,
        whyThisPublication: validatedData.whyThisPublication || null,
        uniqueAngle: validatedData.uniqueAngle || null,
        writingSampleText: validatedData.writingSampleText || null,
        writingSampleFile: validatedData.writingSampleFile || null,
        wordCount: validatedData.wordCount || null,
        targetPublishDate: validatedData.targetPublishDate ? new Date(validatedData.targetPublishDate) : null,
        exclusiveSubmission: validatedData.exclusiveSubmission,
        status: 'pending',
      }).returning();

      // TODO: Send confirmation email to writer
      // TODO: Send notification email to editorial team

      res.json({
        ok: true,
        data: {
          id: result[0].id,
          message: 'Submission received successfully',
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }

      console.error('Error creating submission:', error);
      res.status(500).json({ ok: false, error: 'Failed to create submission' });
    }
  });

  // GET /api/admin/submissions - List all submissions (admin only)
  app.get("/api/admin/submissions", requireAdmin, async (req, res) => {
    try {
      const { status, limit = '50', offset = '0' } = req.query;

      let query = db.select()
        .from(editorialSubmissions)
        .orderBy(desc(editorialSubmissions.submittedAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Filter by status if provided
      if (status && status !== 'all') {
        query = query.where(eq(editorialSubmissions.status, status as string)) as any;
      }

      const submissions = await query;

      // Get total count
      const totalCount = await db.select({ count: editorialSubmissions.id })
        .from(editorialSubmissions);

      res.json({
        ok: true,
        data: {
          submissions,
          total: totalCount.length,
        }
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch submissions' });
    }
  });

  // GET /api/admin/submissions/:id - Get single submission (admin only)
  app.get("/api/admin/submissions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const submission = await db.query.editorialSubmissions.findFirst({
        where: eq(editorialSubmissions.id, parseInt(id)),
      });

      if (!submission) {
        return res.status(404).json({ ok: false, error: 'Submission not found' });
      }

      // Get reviewer info if reviewed
      let reviewer = null;
      if (submission.reviewedBy) {
        reviewer = await db.query.users.findFirst({
          where: eq(users.id, submission.reviewedBy),
        });
      }

      res.json({
        ok: true,
        data: {
          ...submission,
          reviewer: reviewer ? {
            id: reviewer.id,
            username: reviewer.username,
          } : null,
        }
      });
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch submission' });
    }
  });

  // PATCH /api/admin/submissions/:id - Update submission status (admin only)
  app.patch("/api/admin/submissions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reviewNotes, reviewedBy } = req.body;

      // Validate status
      if (status && !['pending', 'under_review', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ ok: false, error: 'Invalid status' });
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (status) {
        updateData.status = status;
        updateData.reviewedAt = new Date();
      }

      if (reviewNotes !== undefined) {
        updateData.reviewNotes = reviewNotes;
      }

      if (reviewedBy) {
        updateData.reviewedBy = reviewedBy;
      }

      const result = await db.update(editorialSubmissions)
        .set(updateData)
        .where(eq(editorialSubmissions.id, parseInt(id)))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ ok: false, error: 'Submission not found' });
      }

      // TODO: Send status update email to writer

      res.json({
        ok: true,
        data: result[0],
      });
    } catch (error) {
      console.error('Error updating submission:', error);
      res.status(500).json({ ok: false, error: 'Failed to update submission' });
    }
  });

  // GET /api/admin/submissions/stats - Get submission statistics (admin only)
  app.get("/api/admin/submissions/stats", requireAdmin, async (req, res) => {
    try {
      const allSubmissions = await db.select()
        .from(editorialSubmissions);

      const stats = {
        total: allSubmissions.length,
        pending: allSubmissions.filter(s => s.status === 'pending').length,
        underReview: allSubmissions.filter(s => s.status === 'under_review').length,
        accepted: allSubmissions.filter(s => s.status === 'accepted').length,
        rejected: allSubmissions.filter(s => s.status === 'rejected').length,
        thisMonth: allSubmissions.filter(s => {
          const submittedDate = new Date(s.submittedAt!);
          const now = new Date();
          return submittedDate.getMonth() === now.getMonth() &&
            submittedDate.getFullYear() === now.getFullYear();
        }).length,
      };

      res.json({
        ok: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch submission stats' });
    }
  });
}
