import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core Content Types
// =================

// Episodes - Main audio content (replaces shows, mixUploads, etc.)
export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  hostName: text("host_name").notNull(),
  seriesTitle: text("series_title"), // e.g., "Late Night Sessions", "Footwork Fridays"
  episodeNumber: integer("episode_number"),
  airDate: timestamp("air_date").notNull(),
  duration: integer("duration").notNull(), // in seconds
  audioUrl: text("audio_url").notNull(), // SoundCloud, Mixcloud, or direct file
  artworkUrl: text("artwork_url"),
  genre: text("genre").notNull(),
  tags: text("tags").array(), // ["RAP", "HIP HOP", "RNB"]
  status: text("status").notNull().default("published"), // draft, published, featured
  isLive: boolean("is_live").default(false),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Guides - Thematic entry points with embedded episodes
export const guides = pgTable("guides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  authorName: text("author_name").notNull(),
  guideType: text("guide_type").notNull(), // artist, genre, tutorial, editorial
  tags: text("tags").array(), // ["jazz", "vinyl", "beginner-friendly"]
  intro: text("intro").notNull(), // rich text/markdown intro
  sections: jsonb("sections"), // array of {heading, description, episodeId}
  coverImageUrl: text("cover_image_url"),
  status: text("status").notNull().default("published"), // draft, published, featured
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  publishedAt: timestamp("published_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mix Submissions - Community submissions with routing control
export const mixSubmissions = pgTable("mix_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Submitter name
  title: text("title").notNull(), // Mix title  
  genre: text("genre").notNull(),
  about: text("about").notNull(), // Description
  url: text("url").notNull(), // SoundCloud, Mixcloud, Audio.com URL
  metadata: jsonb("metadata"), // Enhanced metadata from APIs
  status: text("status").notNull().default("pending"), // pending, approved, featured, rejected
  
  // ADMIN WORKFLOW FIELDS
  featured: boolean("featured").default(false), // Featured status for homepage
  approved: boolean("approved").default(false), // Approval status
  coverUrl: text("cover_url"), // SoundCloud/oEmbed artwork URL
  source: text("source").default("url"), // "upload"|"soundcloud"|"mixcloud"|"url"
  sourceUrl: text("source_url"), // Original source URL
  filePath: text("file_path"), // Local file path for uploads
  fileName: text("file_name"), // Original filename
  
  // ROUTING FLAGS - Control where approved mixes go
  featureOnSite: boolean("feature_on_site").default(true), // Show on website pages/cards
  pushToAzura: boolean("push_to_azura").default(false), // Send to AzuraCast library
  targetPlaylist: text("target_playlist").default("General Rotation"), // AzuraCast playlist
  airDate: timestamp("air_date"), // Optional: first play scheduling
  
  // AZURACAST TRACKING - Monitor upload progress
  azuraFilePath: text("azura_file_path"), // Path after SFTP upload
  azuraPlaylistId: text("azura_playlist_id"), // AzuraCast playlist ID
  
  // AUDIT TRAIL - Complete lifecycle tracking
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  notes: text("notes"),
  approvedAt: timestamp("approved_at"), // When routing started
  uploadedAt: timestamp("uploaded_at"), // SFTP completion
  rescannedAt: timestamp("rescanned_at"), // AzuraCast library rescan
  playlistLinkedAt: timestamp("playlist_linked_at"), // Added to playlist
  createdAt: timestamp("created_at").defaultNow(), // Creation timestamp
});

// Schedule - Upcoming and past shows
export const schedule = pgTable("schedule", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  hostName: text("host_name").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // in minutes
  episodeId: integer("episode_id").references(() => episodes.id),
  isLive: boolean("is_live").default(false),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"), // "weekly", "monthly", etc.
  artworkUrl: text("artwork_url"),
  status: text("status").notNull().default("scheduled"), // scheduled, live, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Song Submissions - Community song suggestions
export const songSubmissions = pgTable("song_submissions", {
  id: serial("id").primaryKey(),
  submitterName: text("submitter_name").notNull(),
  songTitle: text("song_title").notNull(),
  artistName: text("artist_name").notNull(),
  spotifyUrl: text("spotify_url"),
  youtubeUrl: text("youtube_url"),
  notes: text("notes"), // Why they love this song
  approvalStatus: text("approval_status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Admin & System Tables
// ====================

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const currentPlayback = pgTable("current_playback", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist"),
  artwork: text("artwork"),
  episodeId: integer("episode_id").references(() => episodes.id),
  mixId: integer("mix_id").references(() => mixSubmissions.id),
  trackUrl: text("track_url"),
  startTime: timestamp("start_time").defaultNow(),
  isLive: boolean("is_live").default(true),
});

// Stream Status
export const streamStatus = pgTable("stream_status", {
  id: serial("id").primaryKey(),
  isLive: boolean("is_live").default(false),
  listenerCount: integer("listener_count").default(0),
  currentShow: text("current_show"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

// Insert Schemas
// =============

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
  viewCount: true,
});

export const insertGuideSchema = createInsertSchema(guides).omit({
  id: true,
  publishedAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertMixSubmissionSchema = createInsertSchema(mixSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
});

export const insertScheduleSchema = createInsertSchema(schedule).omit({
  id: true,
  createdAt: true,
});

export const insertSongSubmissionSchema = createInsertSchema(songSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  approvalStatus: true,
});

export const insertCurrentPlaybackSchema = createInsertSchema(currentPlayback).omit({
  id: true,
  startTime: true,
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

// Type exports  
export type Episode = typeof episodes.$inferSelect;
export type Guide = typeof guides.$inferSelect;
export type MixSubmission = typeof mixSubmissions.$inferSelect;
export type Schedule = typeof schedule.$inferSelect;
export type SongSubmission = typeof songSubmissions.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type CurrentPlayback = typeof currentPlayback.$inferSelect;
export type StreamStatus = typeof streamStatus.$inferSelect;

export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type InsertMixSubmission = z.infer<typeof insertMixSubmissionSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type InsertSongSubmission = z.infer<typeof insertSongSubmissionSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type InsertCurrentPlayback = z.infer<typeof insertCurrentPlaybackSchema>;

