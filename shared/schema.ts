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

// Mix Submissions - Community submissions with timestamp-based approval system
export const mixSubmissions = pgTable("mix_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Submitter name (artist)
  title: text("title").notNull(), // Mix title  
  genre: text("genre").notNull(),
  about: text("about"), // Description - now optional
  url: text("url").notNull(), // SoundCloud, Mixcloud, Audio.com URL (source_url)
  metadata: jsonb("metadata"), // Enhanced metadata from APIs
  status: text("status").notNull().default("pending"), // pending, approved, featured, rejected
  
  // TIMESTAMP-BASED APPROVAL SYSTEM (source of truth)
  approved_at: timestamp("approved_at"), // null = not approved, timestamp = approved
  featured_at: timestamp("featured_at"), // null = not featured, timestamp = featured
  artwork_url: text("artwork_url"), // Final, absolute URL for card display
  platform: text("platform"), // "soundcloud" | "mixcloud" | "audiocom" | "file" | "spotify" | "apple" | "youtube"
  
  // REFERENCE-ONLY PLATFORM SUPPORT (Spotify, Apple Music, YouTube)
  playback_mode: text("playback_mode").default("stream"), // "embed" | "file" | "stream"
  is_radio_ingestable: boolean("is_radio_ingestable").default(true), // false for Spotify/Apple/YouTube
  requires_alternative: boolean("requires_alternative").default(false), // true for reference-only platforms
  radio_alt_url: text("radio_alt_url"), // Admin-provided alternative source URL (e.g., SoundCloud)
  radio_file_path: text("radio_file_path"), // Uploaded MP3/ZIP for radio
  rights_status: text("rights_status").default("unverified"), // "unverified" | "ok_to_stream"
  
  // LEGACY BOOLEAN FLAGS (kept for backward compatibility during migration)
  featured: boolean("featured").default(false), // Featured status for homepage
  approved: boolean("approved").default(false), // Approval status
  coverUrl: text("cover_url"), // SoundCloud/oEmbed artwork URL
  artUrl: text("art_url"), // Alternative artwork URL field
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
  approvedAt: timestamp("approved_at_legacy"), // Legacy field (use approved_at instead)
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
  residentId: integer("resident_id").references(() => residents.id), // Link to resident DJ
  isLive: boolean("is_live").default(false),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"), // "weekly", "monthly", etc.
  artworkUrl: text("artwork_url"),
  status: text("status").notNull().default("scheduled"), // scheduled, live, completed, cancelled
  liveStatus: text("live_status").default("scheduled"), // scheduled, live, completed, offline
  streamingCredentials: jsonb("streaming_credentials"), // Resident-specific stream info
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

// Resident Applications - DJ/Host applications from Google Forms
export const residentApplications = pgTable("resident_applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  alias: text("alias").notNull(), // DJ/Artist alias
  email: text("email").notNull(),
  phone: text("phone"),
  location: text("location"),
  experience: text("experience"), // Years or description
  genre: text("genre"), // Primary genre/style
  bio: text("bio"), // Tell us about yourself
  mixUrl: text("mix_url"), // Portfolio/mix submission URL
  socialLinks: jsonb("social_links"), // Instagram, SoundCloud, etc.
  availability: text("availability"), // When can you host shows
  showConcept: text("show_concept"), // What kind of show would you want to do
  equipment: text("equipment"), // What equipment do you have
  additionalInfo: text("additional_info"), // Anything else to share
  
  // Google Forms integration
  googleFormResponseId: text("google_form_response_id"), // Original form submission ID
  googleSheetRowNumber: integer("google_sheet_row_number"), // Row in the sheet
  
  // Application status management
  status: text("status").notNull().default("submitted"), // submitted, under_review, approved, rejected, on_hold
  reviewStage: text("review_stage").default("initial"), // initial, interview, trial, final
  priority: text("priority").default("normal"), // low, normal, high, urgent
  
  // Review process
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes"), // Internal admin notes
  interviewScheduled: timestamp("interview_scheduled"),
  trialShowDate: timestamp("trial_show_date"),
  approvalDate: timestamp("approval_date"),
  
  // Resident status (once approved)
  isActiveResident: boolean("is_active_resident").default(false),
  showSlot: text("show_slot"), // "Thursdays 8-10pm" etc.
  onboardingCompleted: boolean("onboarding_completed").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin & System Tables
// ====================

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // viewer, contributor, editor, admin
  createdAt: timestamp("created_at").defaultNow(),
});

// System Settings - Configuration for integrations
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g., "azuracast_api_key", "azuracast_station_id"
  value: text("value").notNull(),
  description: text("description"), // What this setting is for
  isSecret: boolean("is_secret").default(false), // Mask in UI if true
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Residents - DJs/Hosts with streaming access
export const residents = pgTable("residents", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(), // Show name / DJ name
  email: text("email"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  
  // AzuraCast streaming credentials
  azuracastUsername: text("azuracast_username").notNull().unique(),
  azuracastPassword: text("azuracast_password").notNull(),
  mountPoint: text("mount_point").notNull(), // e.g., "/live/dj1"
  azuracastStreamerId: integer("azuracast_streamer_id"), // ID from AzuraCast API (if auto-created)
  azuracastAutoCreated: boolean("azuracast_auto_created").default(false), // Track if account was created via API
  
  // Status & permissions
  isActive: boolean("is_active").default(true),
  canGoLive: boolean("can_go_live").default(true),
  
  // Metadata
  showTitle: text("show_title"), // Their regular show name
  showDescription: text("show_description"),
  genres: text("genres").array(),
  socialLinks: jsonb("social_links"), // {instagram: "@...", soundcloud: "..."}
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Albums of the Month Feature
// ============================

// Community album suggestions
export const albumSuggestions = pgTable("album_suggestions", {
  id: serial("id").primaryKey(),
  suggestedBy: text("suggested_by").notNull(), // Username (before user system)
  musicbrainzId: text("musicbrainz_id"), // Cached MusicBrainz release ID
  releaseGroupId: text("release_group_id"), // MusicBrainz release-group ID
  artist: text("artist").notNull(),
  title: text("title").notNull(),
  releaseYear: integer("release_year"), // Optional release year
  reason: text("reason"), // Why this album should be featured
  coverArtUrl: text("cover_art_url"), // Cached from MusicBrainz (highest-rated)
  spotifyUrl: text("spotify_url"), // Spotify album URL for listening
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
});

// Editor votes on suggestions (consensus system)
export const albumVotes = pgTable("album_votes", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").references(() => albumSuggestions.id).notNull(),
  voterUsername: text("voter_username").notNull(),
  value: integer("value").notNull(), // +1 or -1
  createdAt: timestamp("created_at").defaultNow(),
});

// Published monthly album picks
export const albumPicks = pgTable("album_picks", {
  id: serial("id").primaryKey(),
  month: text("month").notNull().unique(), // "2025-10"
  title: text("title").notNull(), // "October 2025 Albums"
  description: text("description"),
  createdBy: text("created_by").notNull(),
  publishedAt: timestamp("published_at"),
  isPublished: boolean("is_published").default(false),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual albums in a published pick
export const albumPickItems = pgTable("album_pick_items", {
  id: serial("id").primaryKey(),
  pickId: integer("pick_id").references(() => albumPicks.id).notNull(),
  suggestionId: integer("suggestion_id").references(() => albumSuggestions.id).notNull(),
  rank: integer("rank").notNull(), // 1-10 for ordering
  blurb: text("blurb"), // Editor's note about this pick
  tags: text("tags").array(), // ["experimental", "shoegaze"]
  spotifyUrl: text("spotify_url"),
  appleMusicUrl: text("apple_music_url"),
  bandcampUrl: text("bandcamp_url"),
  addedBy: text("added_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Discussion notes on suggestions
export const albumSuggestionNotes = pgTable("album_suggestion_notes", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").references(() => albumSuggestions.id).notNull(),
  authorUsername: text("author_username").notNull(),
  content: text("content").notNull(),
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

export const insertResidentApplicationSchema = createInsertSchema(residentApplications).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCurrentPlaybackSchema = createInsertSchema(currentPlayback).omit({
  id: true,
  startTime: true,
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertResidentSchema = createInsertSchema(residents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  azuracastStreamerId: true, // Set by API after creation
  azuracastAutoCreated: true, // Set automatically
});

export const insertAlbumSuggestionSchema = createInsertSchema(albumSuggestions).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
  musicbrainzId: true,
  releaseGroupId: true,
  coverArtUrl: true,
});

export const insertAlbumVoteSchema = createInsertSchema(albumVotes).omit({
  id: true,
  createdAt: true,
});

export const insertAlbumPickSchema = createInsertSchema(albumPicks).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
  isPublished: true,
});

export const insertAlbumPickItemSchema = createInsertSchema(albumPickItems).omit({
  id: true,
  createdAt: true,
});

export const insertAlbumSuggestionNoteSchema = createInsertSchema(albumSuggestionNotes).omit({
  id: true,
  createdAt: true,
});

// Type exports  
export type Episode = typeof episodes.$inferSelect;
export type Guide = typeof guides.$inferSelect;
export type MixSubmission = typeof mixSubmissions.$inferSelect;
export type Schedule = typeof schedule.$inferSelect;
export type SongSubmission = typeof songSubmissions.$inferSelect;
export type ResidentApplication = typeof residentApplications.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Resident = typeof residents.$inferSelect;
export type CurrentPlayback = typeof currentPlayback.$inferSelect;
export type StreamStatus = typeof streamStatus.$inferSelect;
export type AlbumSuggestion = typeof albumSuggestions.$inferSelect;
export type AlbumVote = typeof albumVotes.$inferSelect;
export type AlbumPick = typeof albumPicks.$inferSelect;
export type AlbumPickItem = typeof albumPickItems.$inferSelect;
export type AlbumSuggestionNote = typeof albumSuggestionNotes.$inferSelect;

export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type InsertMixSubmission = z.infer<typeof insertMixSubmissionSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type InsertSongSubmission = z.infer<typeof insertSongSubmissionSchema>;
export type InsertResidentApplication = z.infer<typeof insertResidentApplicationSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertResident = z.infer<typeof insertResidentSchema>;
export type InsertCurrentPlayback = z.infer<typeof insertCurrentPlaybackSchema>;
export type InsertAlbumSuggestion = z.infer<typeof insertAlbumSuggestionSchema>;
export type InsertAlbumVote = z.infer<typeof insertAlbumVoteSchema>;
export type InsertAlbumPick = z.infer<typeof insertAlbumPickSchema>;
export type InsertAlbumPickItem = z.infer<typeof insertAlbumPickItemSchema>;
export type InsertAlbumSuggestionNote = z.infer<typeof insertAlbumSuggestionNoteSchema>;

// API Response Types
// ==================
export type ApiOk<T = void> = { ok: true; data: T };
export type ApiError = { ok: false; error: string; code?: string };
export type ApiResult<T = void> = ApiOk<T> | ApiError;

export class ErrorWithCode extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ErrorWithCode';
  }
}

