import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';
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
  status: text("status").notNull().default("pending"), // pending, approved (no rejection - community-friendly)
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

export const residentApplications = pgTable("resident_applications", {
  id: serial("id").primaryKey(),
  djName: text("dj_name").notNull(),
  realName: text("real_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  location: text("location").notNull(),
  bio: text("bio").notNull(),
  experience: text("experience").notNull(),
  preferredGenres: text("preferred_genres").notNull(),
  showConcept: text("show_concept").notNull(),
  availableDays: text("available_days").notNull(),
  preferredTimeSlot: text("preferred_time_slot").notNull(),
  showLength: text("show_length").notNull(),
  techSetup: text("tech_setup").notNull(),
  pastWork: text("past_work"),
  socialMedia: text("social_media"),
  additionalInfo: text("additional_info"),
  mixSampleUrl: text("mix_sample_url"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  notes: text("notes"),
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

// Custom Mix Upload System
export const mixUploads = pgTable("mix_uploads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(), // DJ name
  description: text("description"),
  genre: text("genre").notNull(),
  duration: integer("duration").notNull(), // in seconds
  fileUrl: text("file_url").notNull(), // path to uploaded MP3
  artworkUrl: text("artwork_url"), // mix artwork
  isLive: boolean("is_live").default(false),
  isFeatured: boolean("is_featured").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: text("uploaded_by").notNull(), // admin username
});

// Tracklist for custom mixes
export const mixTracklist = pgTable("mix_tracklist", {
  id: serial("id").primaryKey(),
  mixId: integer("mix_id").references(() => mixUploads.id),
  trackNumber: integer("track_number").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  startTime: integer("start_time").notNull(), // timestamp in seconds when track starts
  endTime: integer("end_time"), // timestamp in seconds when track ends
  label: text("label"), // record label
  year: integer("year"), // release year
  genre: text("genre"),
  bpm: integer("bpm"),
  key: text("key"), // musical key
  notes: text("notes"), // DJ notes about the track
  spotifyId: text("spotify_id"), // Spotify track ID for "Search on Spotify"
  soundcloudUrl: text("soundcloud_url"), // Original SoundCloud URL
  youtubeUrl: text("youtube_url"), // YouTube URL
  discogsUrl: text("discogs_url"), // Discogs URL for vinyl info
  isSpotifyAvailable: boolean("is_spotify_available").default(false),
});

// Episodes table for organizing mixes into series like NTS Radio
export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  episodeNumber: integer("episode_number"),
  seriesTitle: text("series_title"), // e.g., "Late Night Sessions", "Footwork Fridays"
  hostName: text("host_name").notNull(),
  airDate: timestamp("air_date").notNull(),
  duration: integer("duration").notNull(), // in seconds
  audioUrl: text("audio_url").notNull(), // path to episode audio
  artworkUrl: text("artwork_url"),
  tags: text("tags").array(), // genre tags like ["RAP", "HIP HOP", "RNB"]
  isLive: boolean("is_live").default(false),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Episode tracklist for NTS-style track listings
export const episodeTracklist = pgTable("episode_tracklist", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id").references(() => episodes.id),
  trackNumber: integer("track_number").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  startTime: integer("start_time").notNull(), // timestamp in seconds when track starts
  endTime: integer("end_time"), // timestamp in seconds when track ends
  label: text("label"), // record label
  year: integer("year"), // release year
  genre: text("genre"),
  bpm: integer("bpm"),
  key: text("key"), // musical key
  notes: text("notes"), // DJ notes about the track
  spotifyId: text("spotify_id"), // For "Search on Spotify" functionality
  soundcloudUrl: text("soundcloud_url"),
  youtubeUrl: text("youtube_url"),
  discogsUrl: text("discogs_url"),
  isSpotifyAvailable: boolean("is_spotify_available").default(false),
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

export const insertMixUploadSchema = createInsertSchema(mixUploads).omit({
  id: true,
  uploadedAt: true,
});

export const insertMixTracklistSchema = createInsertSchema(mixTracklist).omit({
  id: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
  viewCount: true,
});

// Radio Playlist table for HTML5 player
export const radioPlaylist = pgTable("radio_playlist", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(), // DJ name
  description: text("description"),
  genre: text("genre").notNull(),
  duration: integer("duration").notNull(), // in seconds
  fileUrl: text("file_url").notNull(), // path to uploaded audio file
  artworkUrl: text("artwork_url"), // mix artwork
  isActive: boolean("is_active").default(true), // if file should be in rotation
  playCount: integer("play_count").default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: text("uploaded_by").notNull(), // admin username
});

export const insertEpisodeTracklistSchema = createInsertSchema(episodeTracklist).omit({
  id: true,
});

export const insertRadioPlaylistSchema = createInsertSchema(radioPlaylist).omit({
  id: true,
  uploadedAt: true,
  playCount: true,
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
export type MixUpload = typeof mixUploads.$inferSelect;
export type MixTracklist = typeof mixTracklist.$inferSelect;
export type InsertMixUpload = z.infer<typeof insertMixUploadSchema>;
export type InsertMixTracklist = z.infer<typeof insertMixTracklistSchema>;
export type Episode = typeof episodes.$inferSelect;
export type EpisodeTracklist = typeof episodeTracklist.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type InsertEpisodeTracklist = z.infer<typeof insertEpisodeTracklistSchema>;
export type RadioPlaylist = typeof radioPlaylist.$inferSelect;
export type InsertRadioPlaylist = z.infer<typeof insertRadioPlaylistSchema>;

// Track metadata cache for Last.fm data
export const trackMetadata = pgTable("track_metadata", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  artist: text("artist"),
  trackName: text("track_name"),
  album: text("album"),
  imageUrl: text("image_url"),
  lastfmUrl: text("lastfm_url"),
  duration: integer("duration"), // in seconds
  playcount: integer("playcount"),
  listeners: integer("listeners"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackMetadataSchema = createInsertSchema(trackMetadata).omit({
  id: true,
  createdAt: true,
});

export type TrackMetadata = typeof trackMetadata.$inferSelect;
export type InsertTrackMetadata = z.infer<typeof insertTrackMetadataSchema>;

// College Radio Rotation System
export const radioRotation = pgTable("radio_rotation", {
  id: serial("id").primaryKey(),
  trackId: text("track_id").notNull(), // references submission or upload
  sourceType: text("source_type").notNull(), // 'upload' | 'soundcloud' | 'dj_submission'
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  originalMetadata: text("original_metadata"), // JSON string
  lastfmMetadata: text("lastfm_metadata"), // JSON string  
  approvalStatus: text("approval_status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  inRotation: boolean("in_rotation").default(false),
  playCount: integer("play_count").default(0),
  lastPlayed: timestamp("last_played"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRadioRotationSchema = createInsertSchema(radioRotation).omit({
  id: true,
  createdAt: true,
});

export type RadioRotation = typeof radioRotation.$inferSelect;
export type InsertRadioRotation = z.infer<typeof insertRadioRotationSchema>;

// Live Programming Schedule
export const liveShows = pgTable("live_shows", {
  id: serial("id").primaryKey(),
  showName: text("show_name").notNull(),
  hostName: text("host_name").notNull(),
  description: text("description"),
  genre: text("genre"),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isActive: boolean("is_active").default(true),
  isLive: boolean("is_live").default(false), // currently broadcasting
  startedAt: timestamp("started_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLiveShowSchema = createInsertSchema(liveShows).omit({
  id: true,
  createdAt: true,
});

export type LiveShow = typeof liveShows.$inferSelect;
export type InsertLiveShow = z.infer<typeof insertLiveShowSchema>;

// Programming State (current radio mode)
export const programState = pgTable("program_state", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'auto' | 'live'
  currentShowId: integer("current_show_id"),
  currentTrackId: text("current_track_id"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertProgramStateSchema = createInsertSchema(programState).omit({
  id: true,
});

export type ProgramState = typeof programState.$inferSelect;
export type InsertProgramState = z.infer<typeof insertProgramStateSchema>;

export const insertResidentApplicationSchema = createInsertSchema(residentApplications).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  status: true,
});

export type ResidentApplication = typeof residentApplications.$inferSelect;
export type InsertResidentApplication = z.infer<typeof insertResidentApplicationSchema>;

// Song Submissions for Community Features
export const songSubmissions = pgTable("song_submissions", {
  id: serial("id").primaryKey(),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  songTitle: text("song_title").notNull(),
  artistName: text("artist_name").notNull(),
  albumName: text("album_name"),
  genre: text("genre").notNull(),
  submissionType: text("submission_type").notNull(), // 'discovery', 'promotion', 'testing'
  platform: text("platform").notNull(), // 'spotify', 'apple_music', 'soundcloud', 'bandcamp', 'youtube'
  platformUrl: text("platform_url").notNull(),
  trackId: text("track_id"), // Platform-specific track ID
  description: text("description"), // Why they're submitting this track
  requestedDate: text("requested_date"), // Specific day request (e.g., "Fan Music Friday")
  isScheduled: boolean("is_scheduled").default(false),
  scheduledFor: timestamp("scheduled_for"), // When it's scheduled to play
  themeTag: text("theme_tag"), // e.g., "fan_music_friday", "throwback_thursday"
  metadata: text("metadata"), // JSON string with track info from APIs
  approvalStatus: text("approval_status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  playedAt: timestamp("played_at"),
  playCount: integer("play_count").default(0),
  submittedAt: timestamp("submitted_at").defaultNow(),
  notes: text("notes"), // Admin notes
  
  // Queue management fields
  queuePosition: integer("queue_position"), // Order in queue (null = not in queue)
  playbackStatus: text("playback_status").default('queued'), // 'queued', 'playing', 'played'
  currentlyPlaying: boolean("currently_playing").default(false)
});

export const insertSongSubmissionSchema = createInsertSchema(songSubmissions).omit({
  id: true,
  submittedAt: true,
  approvalStatus: true,
  playCount: true,
});

export type SongSubmission = typeof songSubmissions.$inferSelect;
export type InsertSongSubmission = z.infer<typeof insertSongSubmissionSchema>;

// Themed Programming Schedule
export const themedPrograms = pgTable("themed_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Fan Music Friday", "Throwback Thursday"
  slug: text("slug").notNull().unique(), // "fan_music_friday"
  description: text("description"),
  dayOfWeek: integer("day_of_week"), // 0-6, null for special events
  startTime: text("start_time"), // HH:MM format
  duration: integer("duration"), // minutes
  isActive: boolean("is_active").default(true),
  color: text("color").default("#FF0000"), // Theme color
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertThemedProgramSchema = createInsertSchema(themedPrograms).omit({
  id: true,
  createdAt: true,
});

export type ThemedProgram = typeof themedPrograms.$inferSelect;
export type InsertThemedProgram = z.infer<typeof insertThemedProgramSchema>;
