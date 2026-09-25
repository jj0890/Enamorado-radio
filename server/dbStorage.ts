import { db } from "./db";
import {
  shows,
  episodes,
  guides,
  heroBanners,
  mixSubmissions,
  playlistSubmissions,
  schedule,
  residentApplications,
  residents,
  admins,
  settings,
  contributors,
  Show,
  Episode,
  Guide,
  HeroBanner,
  MixSubmission,
  PlaylistSubmission,
  Schedule,
  ResidentApplication,
  Resident,
  Admin,
  Settings,
  Contributor,
  InsertShow,
  InsertEpisode,
  InsertGuide,
  InsertHeroBanner,
  InsertMixSubmission,
  InsertPlaylistSubmission,
  InsertSchedule,
  InsertResidentApplication,
  InsertResident,
  InsertAdmin,
  InsertContributor,
} from "../shared/schema";
import { eq, and, desc, asc, or, sql, ilike } from "drizzle-orm";
import { FileStorage } from "./persistentStorage";

export class DrizzleStorage extends FileStorage {
  // ─── Shows ────────────────────────────────────────────────────────────────

  async getShows(filters?: { status?: string; limit?: number }): Promise<Show[]> {
    let query = db.select().from(shows).orderBy(desc(shows.createdAt));
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.status) {
      conditions.push(eq(shows.status, filters.status));
    }

    const results = conditions.length
      ? await db.select().from(shows).where(and(...conditions)).orderBy(desc(shows.createdAt))
      : await db.select().from(shows).orderBy(desc(shows.createdAt));

    return filters?.limit ? results.slice(0, filters.limit) : results;
  }

  async getShowById(id: number): Promise<Show | undefined> {
    const [row] = await db.select().from(shows).where(eq(shows.id, id));
    return row;
  }

  async getShowBySlug(slug: string): Promise<Show | undefined> {
    const [row] = await db.select().from(shows).where(eq(shows.slug, slug));
    return row;
  }

  async createShow(show: InsertShow): Promise<Show> {
    const [row] = await db.insert(shows).values(show).returning();
    return row;
  }

  async updateShow(id: number, updates: Partial<Show>): Promise<Show> {
    const [row] = await db.update(shows).set(updates).where(eq(shows.id, id)).returning();
    if (!row) throw new Error(`Show ${id} not found`);
    return row;
  }

  async deleteShow(id: number): Promise<void> {
    await db.delete(shows).where(eq(shows.id, id));
  }

  // ─── Episodes ─────────────────────────────────────────────────────────────

  async getEpisodes(filters?: { featured?: boolean; genre?: string; limit?: number }): Promise<Episode[]> {
    const conditions: ReturnType<typeof eq | typeof ilike>[] = [];

    if (filters?.featured !== undefined) {
      conditions.push(eq(episodes.isFeatured, filters.featured));
    }
    if (filters?.genre) {
      conditions.push(ilike(episodes.genre, `%${filters.genre}%`));
    }

    const results = conditions.length
      ? await db.select().from(episodes).where(and(...conditions)).orderBy(desc(episodes.airDate))
      : await db.select().from(episodes).orderBy(desc(episodes.airDate));

    return filters?.limit ? results.slice(0, filters.limit) : results;
  }

  async getEpisodeById(id: number): Promise<Episode | undefined> {
    const [row] = await db.select().from(episodes).where(eq(episodes.id, id));
    return row;
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const [row] = await db.insert(episodes).values(episode).returning();
    return row;
  }

  async updateEpisode(id: number, updates: Partial<Episode>): Promise<Episode> {
    const [row] = await db.update(episodes).set(updates).where(eq(episodes.id, id)).returning();
    if (!row) throw new Error(`Episode ${id} not found`);
    return row;
  }

  async deleteEpisode(id: number): Promise<void> {
    await db.delete(episodes).where(eq(episodes.id, id));
  }

  // ─── Guides ───────────────────────────────────────────────────────────────

  async getGuides(filters?: { featured?: boolean; type?: string; limit?: number }): Promise<Guide[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.featured !== undefined) {
      conditions.push(eq(guides.isFeatured, filters.featured));
    }
    if (filters?.type) {
      conditions.push(eq(guides.guideType, filters.type));
    }

    const results = conditions.length
      ? await db.select().from(guides).where(and(...conditions)).orderBy(desc(guides.publishedAt))
      : await db.select().from(guides).orderBy(desc(guides.publishedAt));

    return filters?.limit ? results.slice(0, filters.limit) : results;
  }

  async getGuideById(id: number): Promise<Guide | undefined> {
    const [row] = await db.select().from(guides).where(eq(guides.id, id));
    return row;
  }

  async getGuideBySlug(slug: string): Promise<Guide | undefined> {
    const [row] = await db.select().from(guides).where(eq(guides.slug, slug));
    return row;
  }

  async createGuide(guide: InsertGuide): Promise<Guide> {
    const [row] = await db.insert(guides).values(guide).returning();
    return row;
  }

  async updateGuide(id: number, updates: Partial<Guide>): Promise<Guide> {
    const [row] = await db
      .update(guides)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guides.id, id))
      .returning();
    if (!row) throw new Error(`Guide ${id} not found`);
    return row;
  }

  async deleteGuide(id: number): Promise<void> {
    await db.delete(guides).where(eq(guides.id, id));
  }

  // ─── Hero Banners ─────────────────────────────────────────────────────────

  async getHeroBanners(): Promise<HeroBanner[]> {
    return db.select().from(heroBanners).orderBy(asc(heroBanners.displayOrder));
  }

  async getActiveBanner(): Promise<HeroBanner | undefined> {
    const [row] = await db.select().from(heroBanners).where(eq(heroBanners.isActive, true));
    return row;
  }

  async getHeroBannerById(id: number): Promise<HeroBanner | undefined> {
    const [row] = await db.select().from(heroBanners).where(eq(heroBanners.id, id));
    return row;
  }

  async createHeroBanner(banner: InsertHeroBanner): Promise<HeroBanner> {
    const [row] = await db.insert(heroBanners).values(banner).returning();
    return row;
  }

  async updateHeroBanner(id: number, updates: Partial<HeroBanner>): Promise<HeroBanner> {
    const [row] = await db.update(heroBanners).set(updates).where(eq(heroBanners.id, id)).returning();
    if (!row) throw new Error(`HeroBanner ${id} not found`);
    return row;
  }

  async deleteHeroBanner(id: number): Promise<void> {
    await db.delete(heroBanners).where(eq(heroBanners.id, id));
  }

  async setActiveBanner(id: number): Promise<HeroBanner> {
    // Deactivate all banners, then activate the target one
    await db.update(heroBanners).set({ isActive: false });
    const [row] = await db.update(heroBanners).set({ isActive: true }).where(eq(heroBanners.id, id)).returning();
    if (!row) throw new Error(`HeroBanner ${id} not found`);
    return row;
  }

  // ─── Mix Submissions ──────────────────────────────────────────────────────

  async getMixSubmissions(filters?: {
    status?: string;
    genre?: string;
    limit?: number;
    featured?: boolean;
    approved?: boolean;
  }): Promise<MixSubmission[]> {
    const conditions: any[] = [];

    if (filters?.status) {
      conditions.push(eq(mixSubmissions.status, filters.status));
    }
    // For featured filter: check status === 'featured'
    if (filters?.featured !== undefined) {
      if (filters.featured) {
        conditions.push(eq(mixSubmissions.status, "featured"));
      } else {
        conditions.push(
          sql`${mixSubmissions.status} != 'featured'`
        );
      }
    }
    // For approved filter: check status === 'approved' OR status === 'featured'
    if (filters?.approved !== undefined) {
      if (filters.approved) {
        conditions.push(
          or(eq(mixSubmissions.status, "approved"), eq(mixSubmissions.status, "featured"))
        );
      } else {
        conditions.push(
          sql`${mixSubmissions.status} NOT IN ('approved', 'featured')`
        );
      }
    }
    if (filters?.genre) {
      conditions.push(ilike(mixSubmissions.genre, `%${filters.genre}%`));
    }

    const results = conditions.length
      ? await db.select().from(mixSubmissions).where(and(...conditions)).orderBy(desc(mixSubmissions.submittedAt))
      : await db.select().from(mixSubmissions).orderBy(desc(mixSubmissions.submittedAt));

    return filters?.limit ? results.slice(0, filters.limit) : results;
  }

  async getMixSubmissionById(id: number): Promise<MixSubmission | undefined> {
    const [row] = await db.select().from(mixSubmissions).where(eq(mixSubmissions.id, id));
    return row;
  }

  async getMixSubmission(id: number): Promise<MixSubmission | undefined> {
    return this.getMixSubmissionById(id);
  }

  async createMixSubmission(submission: InsertMixSubmission): Promise<MixSubmission> {
    const [row] = await db.insert(mixSubmissions).values(submission).returning();
    return row;
  }

  async updateMixSubmission(id: number, updates: Partial<MixSubmission>): Promise<MixSubmission> {
    const [row] = await db.update(mixSubmissions).set(updates).where(eq(mixSubmissions.id, id)).returning();
    if (!row) throw new Error(`MixSubmission ${id} not found`);
    return row;
  }

  async updateMixSubmissionStatus(id: number, status: string, notes?: string): Promise<MixSubmission> {
    const updateData: Partial<MixSubmission> = {
      status,
      reviewedAt: new Date(),
      reviewedBy: "Admin",
    };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    const [row] = await db.update(mixSubmissions).set(updateData).where(eq(mixSubmissions.id, id)).returning();
    if (!row) throw new Error(`MixSubmission ${id} not found`);
    return row;
  }

  async toggleMixFeature(id: number): Promise<MixSubmission> {
    const current = await this.getMixSubmissionById(id);
    if (!current) throw new Error(`MixSubmission ${id} not found`);

    // Toggle: if currently featured, drop back to approved; otherwise promote to featured
    const isFeatured = current.status === "featured";
    const newStatus = isFeatured ? "approved" : "featured";
    const newFeaturedAt = isFeatured ? null : new Date();
    const newFeaturedBool = !isFeatured;

    const [row] = await db
      .update(mixSubmissions)
      .set({
        status: newStatus,
        featured_at: newFeaturedAt,
        featured: newFeaturedBool,
      })
      .where(eq(mixSubmissions.id, id))
      .returning();
    return row;
  }

  async toggleMixApproval(id: number): Promise<MixSubmission> {
    const current = await this.getMixSubmissionById(id);
    if (!current) throw new Error(`MixSubmission ${id} not found`);

    const isApproved = current.status === "approved" || current.status === "featured";
    const newStatus = isApproved ? "pending" : "approved";
    const newApprovedAt = isApproved ? null : new Date();
    const newApprovedBool = !isApproved;

    const [row] = await db
      .update(mixSubmissions)
      .set({
        status: newStatus,
        approved_at: newApprovedAt,
        approved: newApprovedBool,
      })
      .where(eq(mixSubmissions.id, id))
      .returning();
    return row;
  }

  async deleteMixSubmission(id: number): Promise<void> {
    await db.delete(mixSubmissions).where(eq(mixSubmissions.id, id));
  }

  // ─── Playlist Submissions ─────────────────────────────────────────────────

  async getPlaylistSubmissions(filters?: {
    status?: string;
    limit?: number;
    featured?: boolean;
    approved?: boolean;
  }): Promise<PlaylistSubmission[]> {
    const conditions: any[] = [];

    if (filters?.status) {
      conditions.push(eq(playlistSubmissions.status, filters.status));
    }
    if (filters?.featured !== undefined) {
      if (filters.featured) {
        conditions.push(eq(playlistSubmissions.status, "featured"));
      } else {
        conditions.push(sql`${playlistSubmissions.status} != 'featured'`);
      }
    }
    if (filters?.approved !== undefined) {
      if (filters.approved) {
        conditions.push(
          or(eq(playlistSubmissions.status, "approved"), eq(playlistSubmissions.status, "featured"))
        );
      } else {
        conditions.push(
          sql`${playlistSubmissions.status} NOT IN ('approved', 'featured')`
        );
      }
    }

    const results = conditions.length
      ? await db
          .select()
          .from(playlistSubmissions)
          .where(and(...conditions))
          .orderBy(desc(playlistSubmissions.submittedAt))
      : await db.select().from(playlistSubmissions).orderBy(desc(playlistSubmissions.submittedAt));

    return filters?.limit ? results.slice(0, filters.limit) : results;
  }

  async getPlaylistSubmissionById(id: number): Promise<PlaylistSubmission | undefined> {
    const [row] = await db.select().from(playlistSubmissions).where(eq(playlistSubmissions.id, id));
    return row;
  }

  // Alias used in routes.ts
  async getPlaylistSubmission(id: number): Promise<PlaylistSubmission | undefined> {
    return this.getPlaylistSubmissionById(id);
  }

  async createPlaylistSubmission(submission: InsertPlaylistSubmission): Promise<PlaylistSubmission> {
    const [row] = await db.insert(playlistSubmissions).values(submission).returning();
    return row;
  }

  async updatePlaylistSubmission(id: number, updates: Partial<PlaylistSubmission>): Promise<PlaylistSubmission> {
    const [row] = await db
      .update(playlistSubmissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playlistSubmissions.id, id))
      .returning();
    if (!row) throw new Error(`PlaylistSubmission ${id} not found`);
    return row;
  }

  async updatePlaylistSubmissionStatus(id: number, status: string, notes?: string): Promise<PlaylistSubmission> {
    const updateData: Partial<PlaylistSubmission> = {
      status,
      reviewedAt: new Date(),
      reviewedBy: "Admin",
      updatedAt: new Date(),
    };
    if (notes !== undefined) {
      updateData.editorNotes = notes;
    }
    const [row] = await db
      .update(playlistSubmissions)
      .set(updateData)
      .where(eq(playlistSubmissions.id, id))
      .returning();
    if (!row) throw new Error(`PlaylistSubmission ${id} not found`);
    return row;
  }

  async togglePlaylistFeature(id: number): Promise<PlaylistSubmission> {
    const current = await this.getPlaylistSubmissionById(id);
    if (!current) throw new Error(`PlaylistSubmission ${id} not found`);

    const isFeatured = current.status === "featured";
    const newStatus = isFeatured ? "approved" : "featured";
    const newFeaturedAt = isFeatured ? null : new Date();

    const [row] = await db
      .update(playlistSubmissions)
      .set({ status: newStatus, featuredAt: newFeaturedAt, updatedAt: new Date() })
      .where(eq(playlistSubmissions.id, id))
      .returning();
    return row;
  }

  async togglePlaylistApproval(id: number): Promise<PlaylistSubmission> {
    const current = await this.getPlaylistSubmissionById(id);
    if (!current) throw new Error(`PlaylistSubmission ${id} not found`);

    const isApproved = current.status === "approved" || current.status === "featured";
    const newStatus = isApproved ? "pending" : "approved";
    const newApprovedAt = isApproved ? null : new Date();

    const [row] = await db
      .update(playlistSubmissions)
      .set({ status: newStatus, approvedAt: newApprovedAt, updatedAt: new Date() })
      .where(eq(playlistSubmissions.id, id))
      .returning();
    return row;
  }

  async deletePlaylistSubmission(id: number): Promise<void> {
    await db.delete(playlistSubmissions).where(eq(playlistSubmissions.id, id));
  }

  // ─── Contributors ─────────────────────────────────────────────────────────

  async getContributors(): Promise<Contributor[]> {
    return db.select().from(contributors).orderBy(asc(contributors.displayName));
  }

  async getContributorById(id: number): Promise<Contributor | undefined> {
    const [row] = await db.select().from(contributors).where(eq(contributors.id, id));
    return row;
  }

  async getContributorByHandle(handle: string): Promise<Contributor | undefined> {
    // Handle may be stored with or without @; normalise to without
    const normalised = handle.startsWith("@") ? handle.slice(1) : handle;
    const [row] = await db.select().from(contributors).where(eq(contributors.handle, normalised));
    return row;
  }

  async createContributor(contributor: InsertContributor): Promise<Contributor> {
    const [row] = await db.insert(contributors).values(contributor).returning();
    return row;
  }

  async updateContributor(id: number, updates: Partial<Contributor>): Promise<Contributor | undefined> {
    const [row] = await db.update(contributors).set(updates).where(eq(contributors.id, id)).returning();
    return row;
  }

  // ─── Residents ────────────────────────────────────────────────────────────

  async getResidents(filters?: { isActive?: boolean; limit?: number }): Promise<Resident[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.isActive !== undefined) {
      conditions.push(eq(residents.isActive, filters.isActive));
    }

    const results = conditions.length
      ? await db.select().from(residents).where(and(...conditions)).orderBy(asc(residents.displayName))
      : await db.select().from(residents).orderBy(asc(residents.displayName));

    return filters?.limit ? results.slice(0, filters.limit) : results;
  }

  async getResidentById(id: number): Promise<Resident | undefined> {
    const [row] = await db.select().from(residents).where(eq(residents.id, id));
    return row;
  }

  async getResidentByUsername(username: string): Promise<Resident | undefined> {
    const [row] = await db.select().from(residents).where(eq(residents.username, username));
    return row;
  }

  async createResident(resident: InsertResident): Promise<Resident> {
    const [row] = await db.insert(residents).values(resident).returning();
    return row;
  }

  async updateResident(id: number, updates: Partial<Resident>): Promise<Resident> {
    const [row] = await db
      .update(residents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(residents.id, id))
      .returning();
    if (!row) throw new Error(`Resident ${id} not found`);
    return row;
  }

  async deleteResident(id: number): Promise<void> {
    await db.delete(residents).where(eq(residents.id, id));
  }

  // ─── Episodes (schedule table) ────────────────────────────────────────────
  // Note: "schedule" is the DB table; IStorage uses getSchedule / getScheduleById etc.

  async getSchedule(filters?: { upcoming?: boolean; date?: Date; limit?: number }): Promise<Schedule[]> {
    const conditions: any[] = [];

    if (filters?.upcoming) {
      conditions.push(sql`${schedule.scheduledAt} > NOW()`);
    }
    if (filters?.date) {
      const d = filters.date;
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      conditions.push(
        and(
          sql`${schedule.scheduledAt} >= ${start.toISOString()}`,
          sql`${schedule.scheduledAt} <= ${end.toISOString()}`
        )
      );
    }

    const results = conditions.length
      ? await db.select().from(schedule).where(and(...conditions)).orderBy(asc(schedule.scheduledAt))
      : await db.select().from(schedule).orderBy(asc(schedule.scheduledAt));

    return filters?.limit ? results.slice(0, filters.limit) : results;
  }

  async getScheduleById(id: number): Promise<Schedule | undefined> {
    const [row] = await db.select().from(schedule).where(eq(schedule.id, id));
    return row;
  }

  async createScheduleItem(item: InsertSchedule): Promise<Schedule> {
    const [row] = await db.insert(schedule).values(item).returning();
    return row;
  }

  async updateScheduleItem(id: number, updates: Partial<Schedule>): Promise<Schedule> {
    const [row] = await db.update(schedule).set(updates).where(eq(schedule.id, id)).returning();
    if (!row) throw new Error(`Schedule item ${id} not found`);
    return row;
  }

  async deleteScheduleItem(id: number): Promise<void> {
    await db.delete(schedule).where(eq(schedule.id, id));
  }

  // ─── Resident Applications ────────────────────────────────────────────────

  async getResidentApplications(filters?: {
    status?: string;
    priority?: string;
    limit?: number;
  }): Promise<ResidentApplication[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.status) {
      conditions.push(eq(residentApplications.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(residentApplications.priority, filters.priority));
    }

    const results = conditions.length
      ? await db
          .select()
          .from(residentApplications)
          .where(and(...conditions))
          .orderBy(desc(residentApplications.submittedAt))
      : await db.select().from(residentApplications).orderBy(desc(residentApplications.submittedAt));

    return filters?.limit ? results.slice(0, filters.limit) : results;
  }

  async getResidentApplicationById(id: number): Promise<ResidentApplication | undefined> {
    const [row] = await db.select().from(residentApplications).where(eq(residentApplications.id, id));
    return row;
  }

  async createResidentApplication(application: InsertResidentApplication): Promise<ResidentApplication> {
    const [row] = await db.insert(residentApplications).values(application).returning();
    return row;
  }

  async updateResidentApplication(id: number, updates: Partial<ResidentApplication>): Promise<ResidentApplication> {
    const [row] = await db
      .update(residentApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(residentApplications.id, id))
      .returning();
    if (!row) throw new Error(`ResidentApplication ${id} not found`);
    return row;
  }

  async updateResidentApplicationStatus(
    id: number,
    status: string,
    notes?: string
  ): Promise<ResidentApplication> {
    const updateData: Partial<ResidentApplication> = {
      status,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };
    if (notes !== undefined) {
      updateData.reviewNotes = notes;
    }
    const [row] = await db
      .update(residentApplications)
      .set(updateData)
      .where(eq(residentApplications.id, id))
      .returning();
    if (!row) throw new Error(`ResidentApplication ${id} not found`);
    return row;
  }

  async deleteResidentApplication(id: number): Promise<void> {
    await db.delete(residentApplications).where(eq(residentApplications.id, id));
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  async getSettings(): Promise<Settings[]> {
    return db.select().from(settings).orderBy(asc(settings.key));
  }

  async getSettingByKey(key: string): Promise<Settings | undefined> {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));
    return row;
  }

  async upsertSetting(
    key: string,
    value: string,
    description?: string,
    isSecret?: boolean
  ): Promise<Settings> {
    const [row] = await db
      .insert(settings)
      .values({
        key,
        value,
        description: description ?? null,
        isSecret: isSecret ?? false,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value,
          description: description ?? sql`excluded.description`,
          isSecret: isSecret !== undefined ? isSecret : sql`excluded.is_secret`,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }

  // ─── Admins ───────────────────────────────────────────────────────────────

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [row] = await db.select().from(admins).where(eq(admins.username, username));
    return row;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [row] = await db.insert(admins).values(admin).returning();
    return row;
  }

  // ─── Alias: updateMixRoutingStatus ────────────────────────────────────────

  async updateMixRoutingStatus(id: number, updates: Partial<MixSubmission>): Promise<MixSubmission> {
    return this.updateMixSubmission(id, updates);
  }
}

export const storage = new DrizzleStorage();
