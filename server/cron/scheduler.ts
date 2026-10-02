import cron from "node-cron";
import { db } from "../db";
import { editorialProjects } from "@shared/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { notifyScheduledPublish } from "../notifications/discord";

// Runs every minute — checks for articles whose scheduledAt has passed
// and whose status is still 'ready' (not yet published)
export function startScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const due = await db
        .select({ id: editorialProjects.id, title: editorialProjects.title })
        .from(editorialProjects)
        .where(
          and(
            eq(editorialProjects.status, "ready"),
            isNotNull(editorialProjects.scheduledAt),
            lte(editorialProjects.scheduledAt, new Date())
          )
        );

      for (const project of due) {
        await db
          .update(editorialProjects)
          .set({ status: "published", publishedAt: new Date() })
          .where(eq(editorialProjects.id, project.id));

        await notifyScheduledPublish(project.title, project.id);
        console.log(`[scheduler] Published editorial #${project.id}: ${project.title}`);
      }
    } catch (err) {
      console.error("[scheduler] Error in publish job:", err);
    }
  });

  console.log("[scheduler] Editorial publish scheduler started");
}
