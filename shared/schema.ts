import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  streamUrl: text("stream_url").notNull(),
  genre: text("genre").notNull(),
  description: text("description"),
  artworkUrl: text("artwork_url"),
  isLive: boolean("is_live").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  host: text("host").notNull(),
  description: text("description"),
  artworkUrl: text("artwork_url"),
  genre: text("genre").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  duration: integer("duration"), // in minutes
  isLive: boolean("is_live").default(false),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const currentPlayback = pgTable("current_playback", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").references(() => stations.id),
  showId: integer("show_id").references(() => shows.id),
  title: text("title").notNull(),
  artist: text("artist"),
  artwork: text("artwork"),
  startTime: timestamp("start_time").defaultNow(),
  isLive: boolean("is_live").default(true),
});

export const djSubmissions = pgTable("dj_submissions", {
  id: serial("id").primaryKey(),
  djName: text("dj_name").notNull(),
  realName: text("real_name").notNull(),
  email: text("email").notNull(),
  location: text("location"),
  showTitle: text("show_title").notNull(),
  showDescription: text("show_description").notNull(),
  primaryGenre: text("primary_genre").notNull(),
  showLength: integer("show_length").notNull(),
  additionalGenres: text("additional_genres"),
  djExperience: text("dj_experience"),
  musicDiscovery: text("music_discovery"),
  socialMedia: text("social_media"),
  demoMixTitle: text("demo_mix_title"),
  demoMixDescription: text("demo_mix_description"),
  soundcloudUrl: text("soundcloud_url"),
  mixcloudUrl: text("mixcloud_url"),
  audiocomUrl: text("audiocom_url"),
  otherUrl: text("other_url"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  notes: text("notes"),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // admin, superadmin
  createdAt: timestamp("created_at").defaultNow(),
});

export const zineSubmissions = pgTable("zine_submissions", {
  id: serial("id").primaryKey(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  authorBio: text("author_bio"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  contentType: text("content_type").notNull(), // article, interview, review, photo-essay, mixtape-notes
  category: text("category").notNull(), // music, culture, art, technology, politics
  content: text("content").notNull(), // main content body
  excerpt: text("excerpt"), // short description/preview
  tags: text("tags"), // comma-separated tags
  imageUrls: text("image_urls"), // comma-separated image URLs
  audioUrls: text("audio_urls"), // comma-separated audio URLs for mixtapes
  externalLinks: text("external_links"), // comma-separated related links
  collaborators: text("collaborators"), // other contributors
  submissionNotes: text("submission_notes"), // notes to editors
  status: text("status").notNull().default("submitted"), // submitted, copy_ready, web_ready, published, rejected
  publishedAt: timestamp("published_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  editorNotes: text("editor_notes"),
  featuredOrder: integer("featured_order"), // for featured content ordering
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
});

export const zineContent = pgTable("zine_content", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").references(() => zineSubmissions.id),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  authorName: text("author_name").notNull(),
  authorBio: text("author_bio"),
  contentType: text("content_type").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  tags: text("tags"),
  imageUrls: text("image_urls"),
  audioUrls: text("audio_urls"),
  externalLinks: text("external_links"),
  slug: text("slug").notNull().unique(),
  publishedAt: timestamp("published_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isFeatured: boolean("is_featured").default(false),
  featuredOrder: integer("featured_order"),
  viewCount: integer("view_count").default(0),
});

// Editorial workflow and physical media generation
export const editorialWorkflow = pgTable("editorial_workflow", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").references(() => zineSubmissions.id),
  workflowStage: text("workflow_stage").notNull().default("submitted"), // submitted, copy_ready, web_ready, published
  assignedEditor: text("assigned_editor"),
  copyEditorNotes: text("copy_editor_notes"),
  webEditorNotes: text("web_editor_notes"),
  publisherNotes: text("publisher_notes"),
  estimatedPublishDate: timestamp("estimated_publish_date"),
  actualPublishDate: timestamp("actual_publish_date"),
  priority: text("priority").notNull().default("normal"), // urgent, high, normal, low
  issuuDraftId: text("issuu_draft_id"), // Issuu draft ID for API integration
  issuuPublicationId: text("issuu_publication_id"), // Issuu publication ID after publishing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const physicalMedia = pgTable("physical_media", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").references(() => zineSubmissions.id),
  mediaType: text("media_type").notNull(), // mini_cd, nfc_card, qr_sticker
  nfcData: text("nfc_data"), // JSON data for NFC tags
  qrCode: text("qr_code"), // QR code content
  physicalId: text("physical_id").notNull().unique(), // unique identifier for physical object
  printSpecs: text("print_specs"), // JSON with printing specifications
  productionStatus: text("production_status").notNull().default("pending"), // pending, in_production, completed, shipped
  createdAt: timestamp("created_at").defaultNow(),
  shippedAt: timestamp("shipped_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStationSchema = createInsertSchema(stations).omit({
  id: true,
  createdAt: true,
});

export const insertShowSchema = createInsertSchema(shows).omit({
  id: true,
  createdAt: true,
});

export const insertCurrentPlaybackSchema = createInsertSchema(currentPlayback).omit({
  id: true,
  startTime: true,
});

export const insertDjSubmissionSchema = createInsertSchema(djSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertZineSubmissionSchema = createInsertSchema(zineSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
  publishedAt: true,
  editorNotes: true,
  featuredOrder: true,
  isFeatured: true,
  viewCount: true,
});

export const insertZineContentSchema = createInsertSchema(zineContent).omit({
  id: true,
  publishedAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertEditorialWorkflowSchema = createInsertSchema(editorialWorkflow).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhysicalMediaSchema = createInsertSchema(physicalMedia).omit({
  id: true,
  createdAt: true,
  shippedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Station = typeof stations.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type CurrentPlayback = typeof currentPlayback.$inferSelect;
export type DjSubmission = typeof djSubmissions.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type ZineSubmission = typeof zineSubmissions.$inferSelect;
export type ZineContent = typeof zineContent.$inferSelect;
export type EditorialWorkflow = typeof editorialWorkflow.$inferSelect;
export type PhysicalMedia = typeof physicalMedia.$inferSelect;
export type InsertStation = z.infer<typeof insertStationSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertCurrentPlayback = z.infer<typeof insertCurrentPlaybackSchema>;
export type InsertDjSubmission = z.infer<typeof insertDjSubmissionSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type InsertZineSubmission = z.infer<typeof insertZineSubmissionSchema>;
export type InsertZineContent = z.infer<typeof insertZineContentSchema>;
export type InsertEditorialWorkflow = z.infer<typeof insertEditorialWorkflowSchema>;
export type InsertPhysicalMedia = z.infer<typeof insertPhysicalMediaSchema>;
