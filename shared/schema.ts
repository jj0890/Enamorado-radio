import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, uniqueIndex, index, smallint, unique } from "drizzle-orm/pg-core";
import { sql, relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// EDITORIAL BLOCK TYPES (From Magazine)
// Block-based content sections for magazine layouts
// ============================================

// Base block interface - all blocks extend this
export const baseBlockSchema = z.object({
  id: z.string(), // Unique ID for the block (for reordering/editing)
});

// Text block - Rich text content (Tiptap HTML)
export const textBlockSchema = baseBlockSchema.extend({
  _type: z.literal("text"),
  content: z.string(), // HTML content from Tiptap
});

// Full-width image block
export const imageBlockSchema = baseBlockSchema.extend({
  _type: z.literal("image"),
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

// Image row - 2-3 images side by side
export const imageRowBlockSchema = baseBlockSchema.extend({
  _type: z.literal("imageRow"),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string().optional(),
    caption: z.string().optional(),
  })),
  layout: z.enum(["2-up", "3-up"]).default("2-up"),
});

// Pull quote - Large highlighted quote
export const pullQuoteBlockSchema = baseBlockSchema.extend({
  _type: z.literal("pullQuote"),
  quote: z.string(),
  attribution: z.string().optional(),
});

// Callout box - Colored background text section
export const calloutBlockSchema = baseBlockSchema.extend({
  _type: z.literal("callout"),
  content: z.string(), // HTML content
  backgroundColor: z.string().default("#ffc0e6"),
  textColor: z.string().default("#2A2A2A"),
});

// Embed block - External content (YouTube, Spotify, etc.)
export const embedBlockSchema = baseBlockSchema.extend({
  _type: z.literal("embed"),
  url: z.string(),
  embedHtml: z.string().optional(), // Cached embed HTML from oEmbed
  platform: z.string().optional(), // Detected platform
});

// Q&A block - Structured interview format
export const qaBlockSchema = baseBlockSchema.extend({
  _type: z.literal("qa"),
  questionLabel: z.string().default("Q:"),
  answerLabel: z.string().default("A:"),
  question: z.string(),
  answer: z.string(),
});

// Union of all block types
export const editorialSectionSchema = z.discriminatedUnion("_type", [
  textBlockSchema,
  imageBlockSchema,
  imageRowBlockSchema,
  pullQuoteBlockSchema,
  calloutBlockSchema,
  embedBlockSchema,
  qaBlockSchema,
]);

// Array of sections for content
export const sectionsArraySchema = z.array(editorialSectionSchema);

// TypeScript types derived from schemas
export type TextBlock = z.infer<typeof textBlockSchema>;
export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type ImageRowBlock = z.infer<typeof imageRowBlockSchema>;
export type PullQuoteBlock = z.infer<typeof pullQuoteBlockSchema>;
export type CalloutBlock = z.infer<typeof calloutBlockSchema>;
export type EmbedBlock = z.infer<typeof embedBlockSchema>;
export type QABlock = z.infer<typeof qaBlockSchema>;
export type EditorialSection = z.infer<typeof editorialSectionSchema>;

// Template type schema
export const templateTypeSchema = z.enum([
  "article",
  "interview",
  "photo_essay",
  "playlist",
  "video",
  "pdf",
  "notes",      // Raw thoughts, notes app style
  "picks_list", // Numbered recommendations with commentary
]);
export type TemplateType = z.infer<typeof templateTypeSchema>;

// Content tier schema
// editorial = commissioned/curated, featured = elevated community, archive = approved submissions
export const tierSchema = z.enum([
  "editorial",      // Commissioned, planned, or editorially curated (was "issue")
  "featured",       // Community work that gets elevated (was "web_exclusive")
  "archive",        // All approved community submissions (was "community")
  // Legacy values kept for backwards compatibility during migration
  "issue",          // @deprecated - use "editorial"
  "web_exclusive",  // @deprecated - use "featured"
  "community",      // @deprecated - use "archive"
]);
export type Tier = z.infer<typeof tierSchema>;

// Contributor role schema
export const contributorRoleSchema = z.enum([
  "dj",
  "writer",
  "photographer",
  "curator",
  "artist",
  "producer",
  "other",
]);
export type ContributorRole = z.infer<typeof contributorRoleSchema>;

// Social links schema for contributors
export const socialLinksSchema = z.object({
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  soundcloud: z.string().optional(),
  bandcamp: z.string().optional(),
  spotify: z.string().optional(),
}).optional();
export type SocialLinks = z.infer<typeof socialLinksSchema>;

// Photoshoot gallery item schema
export const photoshootGalleryItemSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
});
export type PhotoshootGalleryItem = z.infer<typeof photoshootGalleryItemSchema>;

// Content contributor role (for junction table)
export const contentContributorRoleSchema = z.enum([
  "author",
  "photographer",
  "interviewer",
  "subject",
  "curator",
  "editor",
]);
export type ContentContributorRole = z.infer<typeof contentContributorRoleSchema>;

// Editorial category schema
export const editorialCategorySchema = z.enum([
  "essay",
  "review",
  "profile",
  "feature",
  "column",
  "news",
  "art",
  "interview",
  "radio", // New: for radio-specific content
]);
export type EditorialCategory = z.infer<typeof editorialCategorySchema>;

// ============================================
// CORE DATABASE TABLES
// ============================================

// Users - Combined admin/editor authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"), // 'admin', 'editor', 'contributor', 'viewer'
  createdAt: timestamp("created_at").defaultNow(),
});

// Contributors - Community members who submit content (unified from both)
// Anyone who publishes content gets a contributor profile
export const contributors = pgTable("contributors", {
  id: serial("id").primaryKey(),
  handle: text("handle").notNull().unique(), // @username format (lowercase, no spaces)
  displayName: text("display_name").notNull(), // Full name or DJ name
  email: text("email"),

  // Profile info
  bio: text("bio"), // Longer bio (up to 500 chars)
  tagline: text("tagline"), // Short 1-liner for cards (up to 150 chars)
  location: text("location"), // "Brooklyn, NY" style
  role: text("role"), // "dj", "writer", "photographer", etc.
  avatarUrl: text("avatar_url"),
  websiteUrl: text("website_url"),

  // Social links (expanded from single socialHandle)
  socialHandle: text("social_handle"), // @deprecated - use socialLinks
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    twitter?: string;
    soundcloud?: string;
    bandcamp?: string;
    spotify?: string;
  }>(),

  // Profile showcase content
  photoshootGallery: jsonb("photoshoot_gallery").$type<Array<{
    src: string;
    alt?: string;
    caption?: string;
    credit?: string;
  }>>(),
  recommendedPlaylistUrl: text("recommended_playlist_url"), // Spotify/Apple/etc playlist
  recommendedPlaylistPlatform: text("recommended_playlist_platform"), // "spotify" | "apple" | "soundcloud"

  // Resident linking
  isResident: boolean("is_resident").default(false),
  residentId: integer("resident_id"),

  // Multi-role labels (replaces single role string for profile display)
  roleLabels: text("role_labels").array().default([]),

  // Generic links array: [{label, url}] — replaces scattered websiteUrl + socialLinks
  links: jsonb("links").$type<Array<{ label: string; url: string }>>(),

  // Visibility & featuring
  isPublic: boolean("is_public").default(true),
  isFeatured: boolean("is_featured").default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Top-5 albums per contributor (MusicBrainz-backed)
export const profileAlbums = pgTable("profile_albums", {
  id: serial("id").primaryKey(),
  contributorId: integer("contributor_id").references(() => contributors.id, { onDelete: "cascade" }).notNull(),
  rank: smallint("rank").notNull(), // 1–5
  mbId: text("mb_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  year: text("year"),
  coverUrl: text("cover_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniqRank: unique().on(t.contributorId, t.rank),
}));

// ============================================
// RADIO-SPECIFIC TABLES
// ============================================

// Shows - Radio show series/programs
export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  hostName: text("host_name"),
  genre: text("genre"),
  tags: text("tags").array(),
  artworkUrl: text("artwork_url"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Episodes - Radio episodes/shows
export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  hostName: text("host_name").notNull(),
  seriesTitle: text("series_title"),
  episodeNumber: integer("episode_number"),
  airDate: timestamp("air_date").notNull(),
  duration: integer("duration").notNull(),
  audioUrl: text("audio_url").notNull(),
  artworkUrl: text("artwork_url"),
  genre: text("genre").notNull(),
  tags: text("tags").array(),
  tracklist: text("tracklist"),
  status: text("status").notNull().default("published"),
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
  guideType: text("guide_type").notNull(),
  tags: text("tags").array(),
  intro: text("intro").notNull(),
  sections: jsonb("sections"),
  coverImageUrl: text("cover_image_url"),
  status: text("status").notNull().default("published"),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  publishedAt: timestamp("published_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hero Banners - Seasonal homepage banners
export const heroBanners = pgTable("hero_banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  overlayText: text("overlay_text"),
  isActive: boolean("is_active").default(false),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mix Submissions - Community mix submissions
export const mixSubmissions = pgTable("mix_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle"),
  contributorId: integer("contributor_id").references(() => contributors.id),
  title: text("title").notNull(),
  genre: text("genre").notNull(),
  about: text("about"),
  url: text("url").notNull(),
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("pending"),
  approved_at: timestamp("approved_at"),
  featured_at: timestamp("featured_at"),
  artwork_url: text("artwork_url"),
  platform: text("platform"),
  playback_mode: text("playback_mode").default("stream"),
  is_radio_ingestable: boolean("is_radio_ingestable").default(true),
  requires_alternative: boolean("requires_alternative").default(false),
  radio_alt_url: text("radio_alt_url"),
  radio_file_path: text("radio_file_path"),
  rights_status: text("rights_status").default("unverified"),
  featured: boolean("featured").default(false),
  approved: boolean("approved").default(false),
  coverUrl: text("cover_url"),
  artUrl: text("art_url"),
  source: text("source").default("url"),
  sourceUrl: text("source_url"),
  filePath: text("file_path"),
  fileName: text("file_name"),
  featureOnSite: boolean("feature_on_site").default(true),
  pushToAzura: boolean("push_to_azura").default(false),
  targetPlaylist: text("target_playlist").default("General Rotation"),
  airDate: timestamp("air_date"),
  azuraFilePath: text("azura_file_path"),
  azuraPlaylistId: text("azura_playlist_id"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  notes: text("notes"),
  approvedAt: timestamp("approved_at_legacy"),
  uploadedAt: timestamp("uploaded_at"),
  rescannedAt: timestamp("rescanned_at"),
  playlistLinkedAt: timestamp("playlist_linked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Episode Submissions - Resident pre-recorded episodes
export const episodeSubmissions = pgTable("episode_submissions", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").references(() => residents.id).notNull(),
  residentName: text("resident_name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  showNotes: text("show_notes"),
  seriesTitle: text("series_title"),
  episodeNumber: integer("episode_number"),
  genre: text("genre").notNull(),
  tags: text("tags").array(),
  audioFilePath: text("audio_file_path").notNull(),
  audioFileName: text("audio_file_name").notNull(),
  audioFileSize: integer("audio_file_size").notNull(),
  duration: integer("duration"),
  coverArtPath: text("cover_art_path"),
  coverArtUrl: text("cover_art_url"),
  status: text("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  scheduledAirDate: timestamp("scheduled_air_date"),
  airedAt: timestamp("aired_at"),
  azuracastFileId: text("azuracast_file_id"),
  azuracastPlaylistId: text("azuracast_playlist_id"),
  uploadedToAzuracastAt: timestamp("uploaded_to_azuracast_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Playlist Submissions - Community curated playlists
export const playlistSubmissions = pgTable("playlist_submissions", {
  id: serial("id").primaryKey(),
  curatorName: text("curator_name").notNull(),
  curatorEmail: text("curator_email"),
  handle: text("handle"),
  contributorId: integer("contributor_id").references(() => contributors.id),
  title: text("title").notNull(),
  description: text("description"),
  playlistUrl: text("playlist_url").notNull(),
  artworkUrl: text("artwork_url"),
  tags: text("tags").array(),
  metadata: jsonb("metadata"),
  platform: text("platform"),
  trackCount: integer("track_count"),
  status: text("status").notNull().default("pending"),
  approvedAt: timestamp("approved_at"),
  featuredAt: timestamp("featured_at"),
  likes: integer("likes").default(0),
  editorNotes: text("editor_notes"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule - Upcoming and past shows
export const schedule = pgTable("schedule", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  hostName: text("host_name").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(),
  episodeId: integer("episode_id").references(() => episodes.id),
  residentId: integer("resident_id").references(() => residents.id),
  isLive: boolean("is_live").default(false),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"),
  artworkUrl: text("artwork_url"),
  status: text("status").notNull().default("scheduled"),
  liveStatus: text("live_status").default("scheduled"),
  streamingCredentials: jsonb("streaming_credentials"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resident Applications
export const residentApplications = pgTable("resident_applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  alias: text("alias").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  location: text("location"),
  experience: text("experience"),
  genre: text("genre"),
  bio: text("bio"),
  mixUrl: text("mix_url"),
  socialLinks: jsonb("social_links"),
  availability: text("availability"),
  showConcept: text("show_concept"),
  equipment: text("equipment"),
  additionalInfo: text("additional_info"),
  googleFormResponseId: text("google_form_response_id"),
  googleSheetRowNumber: integer("google_sheet_row_number"),
  status: text("status").notNull().default("submitted"),
  reviewStage: text("review_stage").default("initial"),
  priority: text("priority").default("normal"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes"),
  interviewScheduled: timestamp("interview_scheduled"),
  trialShowDate: timestamp("trial_show_date"),
  approvalDate: timestamp("approval_date"),
  isActiveResident: boolean("is_active_resident").default(false),
  showSlot: text("show_slot"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Residents - DJs/Hosts with streaming access
export const residents = pgTable("residents", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  azuracastUsername: text("azuracast_username").notNull().unique(),
  azuracastPassword: text("azuracast_password").notNull(),
  mountPoint: text("mount_point").notNull(),
  azuracastStreamerId: integer("azuracast_streamer_id"),
  azuracastAutoCreated: boolean("azuracast_auto_created").default(false),
  isActive: boolean("is_active").default(true),
  canGoLive: boolean("can_go_live").default(true),
  showTitle: text("show_title"),
  showDescription: text("show_description"),
  genres: text("genres").array(),
  socialLinks: jsonb("social_links"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Albums of the Month
export const albumSuggestions = pgTable("album_suggestions", {
  id: serial("id").primaryKey(),
  suggestedBy: text("suggested_by").notNull(),
  musicbrainzId: text("musicbrainz_id"),
  releaseGroupId: text("release_group_id"),
  artist: text("artist").notNull(),
  title: text("title").notNull(),
  releaseYear: integer("release_year"),
  reason: text("reason"),
  coverArtUrl: text("cover_art_url"),
  spotifyUrl: text("spotify_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
});

export const albumVotes = pgTable("album_votes", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").references(() => albumSuggestions.id).notNull(),
  voterUsername: text("voter_username").notNull(),
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const albumPicks = pgTable("album_picks", {
  id: serial("id").primaryKey(),
  month: text("month").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  listType: text("list_type").notNull().default("monthly"),
  introText: text("intro_text"),
  outroText: text("outro_text"),
  createdBy: text("created_by").notNull(),
  publishedAt: timestamp("published_at"),
  isPublished: boolean("is_published").default(false),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const albumPickItems = pgTable("album_pick_items", {
  id: serial("id").primaryKey(),
  pickId: integer("pick_id").references(() => albumPicks.id).notNull(),
  suggestionId: integer("suggestion_id").references(() => albumSuggestions.id).notNull(),
  rank: integer("rank").notNull(),
  blurb: text("blurb"),
  writeUp: text("write_up"),
  standoutTracks: text("standout_tracks").array(),
  label: text("label"),
  releaseDate: text("release_date"),
  accentColor: text("accent_color"),
  tags: text("tags").array(),
  spotifyUrl: text("spotify_url"),
  appleMusicUrl: text("apple_music_url"),
  bandcampUrl: text("bandcamp_url"),
  addedBy: text("added_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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

export const streamStatus = pgTable("stream_status", {
  id: serial("id").primaryKey(),
  isLive: boolean("is_live").default(false),
  listenerCount: integer("listener_count").default(0),
  currentShow: text("current_show"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

// System Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  isSecret: boolean("is_secret").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// MAGAZINE-SPECIFIC TABLES
// ============================================

// Open Calls - Themed submission drives
export const openCalls = pgTable("editorial_open_calls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  guidelines: text("guidelines"),
  targetDate: timestamp("target_date"),
  status: text("status").notNull().default("draft"),
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// Community Submissions - Magazine-style submissions
export const submissions = pgTable("editorial_submissions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  submitterHandle: text("submitter_handle").notNull(),
  submitterEmail: text("submitter_email"),
  socialHandle: text("social_handle"),
  contributorId: integer("contributor_id").references(() => contributors.id),
  category: text("category").notNull(),
  contentType: text("content_type").notNull().default("text"),
  status: text("status").notNull().default("pending"),
  files: text("files").array().default([]),
  collaborationLinks: text("collaboration_links").array().default([]),
  substackUrl: text("substack_url"),
  externalPlatform: text("external_platform"),
  originalExcerpt: text("original_excerpt"),
  originalAuthor: text("original_author"),
  originalDate: timestamp("original_date"),
  qualityScore: integer("quality_score").default(0),
  adminNotes: text("admin_notes"),
  moderationFlags: text("moderation_flags"),
  rejectionReason: text("rejection_reason"),
  likes: integer("likes").default(0),
  externalUrl: text("external_url"),
  embedPlatform: text("embed_platform"),
  embedUrl: text("embed_url"),
  coverImageUrl: text("cover_image_url"),
  editorialStatus: text("editorial_status").default("pending"),
  feedbackNotes: text("feedback_notes"),
  isCommunityVoice: boolean("is_community_voice").default(false),
  section: text("section").default("community"),
  contentUID: text("content_uid").unique(),
  embeddable: boolean("embeddable").default(false),
  thumbnailWidth: integer("thumbnail_width"),
  thumbnailHeight: integer("thumbnail_height"),
  aspectHint: text("aspect_hint").default("auto"),
  focalPointX: integer("focal_point_x").default(50),
  focalPointY: integer("focal_point_y").default(50),
  type: text("type"),
  originChannel: text("origin_channel").default("community"),
  provider: text("provider"),
  coverWidth: integer("cover_width"),
  coverHeight: integer("cover_height"),
  openCallId: integer("open_call_id").references(() => openCalls.id),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Magazine Issues
export const issues = pgTable("editorial_issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  season: text("season"),
  editorialIntro: text("editorial_intro"),
  coverImageUrl: text("cover_image_url"),
  pdfUrl: text("pdf_url"),
  status: text("status").notNull().default("draft"),
  featured: boolean("featured").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Issue Contents - Many-to-many linking
export const issueContents = pgTable("editorial_issue_contents", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").references(() => issues.id).notNull(),
  contentId: integer("content_id").references(() => content.id).notNull(),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Magazine Content - Editorial pieces
export const content = pgTable("editorial_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  body: text("body"),
  authors: text("authors").array().default([]), // @deprecated - use contentContributors junction
  coverImageUrl: text("cover_image_url"),
  videoUrl: text("video_url"),
  status: text("status").notNull().default("draft"),
  // contentType now includes "notes" and "picks_list"
  contentType: text("content_type").notNull().default("essay"),
  publishedAt: timestamp("published_at"),
  featuredRank: integer("featured_rank"),
  isHero: boolean("is_hero").default(false),
  issueId: integer("issue_id").references(() => issues.id),
  // templateType now includes "notes" and "picks_list"
  templateType: text("template_type"),
  // tier: "editorial" | "featured" | "archive" (new naming)
  tier: text("tier").default("featured"),
  editorialCategory: text("editorial_category"),
  sections: jsonb("sections").$type<EditorialSection[]>(),
  type: text("type"),
  originChannel: text("origin_channel").default("editorial"),
  provider: text("provider"),
  embedUrl: text("embed_url"),
  coverWidth: integer("cover_width"),
  coverHeight: integer("cover_height"),
  externalUrl: text("external_url"),
  pdfUrl: text("pdf_url"),
  artistCredit: text("artist_credit"),
  credits: text("credits"),
  galleryUrls: text("gallery_urls"),
  files: text("files").array().default([]),
  gallery: text("gallery"),

  // Import tracking (for Substack, Medium, etc.)
  importSource: text("import_source"), // "substack" | "medium" | "gdocs" | null
  importSourceUrl: text("import_source_url"), // Original URL
  importSourceAuthor: text("import_source_author"), // Original author name if different
  importedAt: timestamp("imported_at"),

  // Read time (auto-calculated based on word count)
  readTimeMinutes: integer("read_time_minutes"),

  // Scheduled publishing — when set + status='scheduled', cron auto-publishes at this time
  scheduledAt: timestamp("scheduled_at"),

  // Preview token — random UUID; allows draft/scheduled content to be previewed via
  // GET /api/content/:slug?preview=<token> without auth
  previewToken: text("preview_token"),

  // Review workflow — editors submit for review; admin approves/rejects
  // Values: 'none' | 'pending' | 'approved' | 'rejected'
  reviewStatus: text("review_status").default("none"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content-Contributor Junction Table
// Links content to contributors with roles (replaces string-based authors array)
export const contentContributors = pgTable("content_contributors", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").references(() => content.id, { onDelete: "cascade" }).notNull(),
  contributorId: integer("contributor_id").references(() => contributors.id, { onDelete: "cascade" }).notNull(),
  // Role in this content: author, photographer, interviewer, subject, curator, editor
  role: text("role").default("author"),
  // Position for ordering multiple contributors
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tags system
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  isPublic: boolean("is_public").default(true),
});

export const submissionTags = pgTable("submission_tags", {
  submissionId: integer("submission_id").references(() => submissions.id),
  tagId: integer("tag_id").references(() => tags.id),
});

export const contentTags = pgTable("content_tags", {
  contentId: integer("content_id").references(() => content.id),
  tagId: integer("tag_id").references(() => tags.id),
});

// Listener Likes — anonymous session-based likes that drive community promotion
// One like per (entityType, entityId, sessionKey) — enforced by unique index
export const contentLikes = pgTable("content_likes", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'submission' | 'episode' | 'mix'
  entityId: integer("entity_id").notNull(),
  sessionKey: text("session_key").notNull(), // UUID from enamorado_lsid cookie
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueLike: uniqueIndex("content_likes_unique").on(table.entityType, table.entityId, table.sessionKey),
  entityIdx: index("content_likes_entity_idx").on(table.entityType, table.entityId),
  createdAtIdx: index("content_likes_created_at_idx").on(table.createdAt),
}));

// Featured Stories
export const featuredStories = pgTable("featured_stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  author: text("author").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  externalUrl: text("external_url"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Features - Homepage feature management
export const features = pgTable("editorial_features", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  featureType: text("feature_type").notNull().default("main"),
  position: integer("position").default(0),
  isActive: boolean("is_active").default(true),
  activeFrom: timestamp("active_from"),
  activeUntil: timestamp("active_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pitches - Internal editorial planning
export const pitches = pgTable("editorial_pitches", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  concept: text("concept").notNull(),
  targetLength: text("target_length"),
  targetDate: timestamp("target_date"),
  status: text("status").notNull().default("idea"),
  assignedTo: integer("assigned_to").references(() => contributors.id),
  createdBy: text("created_by").notNull(),
  notes: text("notes"),
  contentId: integer("content_id").references(() => content.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  reviewedSubmissions: many(submissions),
}));

export const contributorsRelations = relations(contributors, ({ many }) => ({
  submissions: many(submissions),
  mixSubmissions: many(mixSubmissions),
  playlistSubmissions: many(playlistSubmissions),
  pitches: many(pitches),
  // Content they've contributed to (via junction table)
  contentCredits: many(contentContributors),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  reviewer: one(users, {
    fields: [submissions.reviewedBy],
    references: [users.username],
  }),
  contributor: one(contributors, {
    fields: [submissions.contributorId],
    references: [contributors.id],
  }),
  openCall: one(openCalls, {
    fields: [submissions.openCallId],
    references: [openCalls.id],
  }),
}));

export const issuesRelations = relations(issues, ({ many }) => ({
  contents: many(content),
  issueContents: many(issueContents),
}));

export const issueContentsRelations = relations(issueContents, ({ one }) => ({
  issue: one(issues, {
    fields: [issueContents.issueId],
    references: [issues.id],
  }),
  content: one(content, {
    fields: [issueContents.contentId],
    references: [content.id],
  }),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  issue: one(issues, {
    fields: [content.issueId],
    references: [issues.id],
  }),
  contentTags: many(contentTags),
  issueContents: many(issueContents),
  // Contributors linked via junction table
  contributors: many(contentContributors),
}));

// Content-Contributor junction relations
export const contentContributorsRelations = relations(contentContributors, ({ one }) => ({
  content: one(content, {
    fields: [contentContributors.contentId],
    references: [content.id],
  }),
  contributor: one(contributors, {
    fields: [contentContributors.contributorId],
    references: [contributors.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  submissionTags: many(submissionTags),
  contentTags: many(contentTags),
}));

export const submissionTagsRelations = relations(submissionTags, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionTags.submissionId],
    references: [submissions.id],
  }),
  tag: one(tags, {
    fields: [submissionTags.tagId],
    references: [tags.id],
  }),
}));

export const contentTagsRelations = relations(contentTags, ({ one }) => ({
  content: one(content, {
    fields: [contentTags.contentId],
    references: [content.id],
  }),
  tag: one(tags, {
    fields: [contentTags.tagId],
    references: [tags.id],
  }),
}));

export const featuresRelations = relations(features, ({ one }) => ({
  content: one(content, {
    fields: [features.entityId],
    references: [content.id],
  }),
  issue: one(issues, {
    fields: [features.entityId],
    references: [issues.id],
  }),
}));

export const pitchesRelations = relations(pitches, ({ one }) => ({
  assignee: one(contributors, {
    fields: [pitches.assignedTo],
    references: [contributors.id],
  }),
  linkedContent: one(content, {
    fields: [pitches.contentId],
    references: [content.id],
  }),
}));

export const openCallsRelations = relations(openCalls, ({ many }) => ({
  submissions: many(submissions),
}));

// ============================================
// INSERT SCHEMAS
// ============================================

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertContributorSchema = createInsertSchema(contributors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  handle: z.string()
    .min(1, "Handle is required")
    .max(50, "Handle is too long")
    .regex(/^[a-z0-9_-]+$/, "Handle can only contain lowercase letters, numbers, underscores, and hyphens"),
  displayName: z.string().min(1, "Display name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio is too long").optional(),
  tagline: z.string().max(150, "Tagline is too long").optional(),
  location: z.string().max(100, "Location is too long").optional(),
  role: contributorRoleSchema.optional(),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  socialHandle: z.string().optional(), // @deprecated
  socialLinks: socialLinksSchema,
  photoshootGallery: z.array(photoshootGalleryItemSchema).max(10, "Maximum 10 images").optional(),
  recommendedPlaylistUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  recommendedPlaylistPlatform: z.enum(["spotify", "apple", "soundcloud", "youtube"]).optional(),
  isResident: z.boolean().optional(),
  residentId: z.number().optional(),
  isPublic: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const insertShowSchema = createInsertSchema(shows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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

export const insertHeroBannerSchema = createInsertSchema(heroBanners).omit({
  id: true,
  createdAt: true,
});

export const insertMixSubmissionSchema = createInsertSchema(mixSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
});

export const insertEpisodeSubmissionSchema = createInsertSchema(episodeSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlaylistSubmissionSchema = createInsertSchema(playlistSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  featuredAt: true,
  likes: true,
});

export const insertScheduleSchema = createInsertSchema(schedule).omit({
  id: true,
  createdAt: true,
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

export const insertResidentSchema = createInsertSchema(residents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  azuracastStreamerId: true,
  azuracastAutoCreated: true,
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

export const insertCurrentPlaybackSchema = createInsertSchema(currentPlayback).omit({
  id: true,
  startTime: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertSubmissionSchema = z.object({
  title: z.string().min(3, "Please add a title").max(100, "Title is a bit too long"),
  description: z.string().min(10, "Tell us a bit more about your work").max(1000, "Description is too long"),
  submitterHandle: z.string().min(1, "Please add your name or handle"),
  submitterEmail: z.string().optional(),
  socialHandle: z.string().optional(),
  category: z.enum(["art", "fashion", "photography", "mixed"]),
  contentType: z.string().default("text"),
  files: z.array(z.string()).default([]),
  collaborationLinks: z.array(z.string()).default([]),
  substackUrl: z.string().optional(),
  externalPlatform: z.string().optional(),
  originalExcerpt: z.string().optional(),
  originalAuthor: z.string().optional(),
  section: z.string().default("community"),
  coverImageUrl: z.string().optional(),
  type: z.enum(["playlist", "writing", "art", "video", "pdf", "link"]).optional(),
  originChannel: z.enum(["community", "editorial"]).default("community"),
  provider: z.enum(["spotify", "apple", "soundcloud", "youtube", "gdocs", "pdf", "file", "external"]).optional(),
  coverWidth: z.number().positive().optional(),
  coverHeight: z.number().positive().optional(),
});

export const insertFeaturedStorySchema = createInsertSchema(featuredStories).omit({
  id: true,
  createdAt: true,
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
}).extend({
  title: z.string().min(1, "Issue title is required").max(100, "Title is too long"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  season: z.string().optional(),
  editorialIntro: z.string().optional(),
  coverImageUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  featured: z.boolean().default(false),
});

export const insertIssueContentSchema = createInsertSchema(issueContents).omit({
  id: true,
  createdAt: true,
}).extend({
  issueId: z.number().positive("Issue ID is required"),
  contentId: z.number().positive("Content ID is required"),
  position: z.number().min(0).default(0),
});

const isValidYouTubeUrl = (url: string | undefined): boolean => {
  if (!url) return true;
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  return patterns.some(pattern => pattern.test(url));
};

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1, "Content title is required").max(200, "Title is too long"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  authors: z.array(z.string()).default([]), // @deprecated - use contentContributors
  coverImageUrl: z.string().optional(),
  videoUrl: z.string().optional().refine(isValidYouTubeUrl, {
    message: "Please enter a valid YouTube URL"
  }),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  // Added "notes" and "picks_list" content types
  contentType: z.enum(["essay", "interview", "video_essay", "photoshoot", "playlist", "artPdf", "link", "notes", "picks_list"]).default("essay"),
  featuredRank: z.number().min(1).max(10).optional(),
  isHero: z.boolean().default(false),
  issueId: z.number().optional(),
  // Added "notes" and "picks_list" template types
  templateType: z.enum(["article", "interview", "photo_essay", "playlist", "video", "pdf", "notes", "picks_list"]).optional(),
  // New tier naming: editorial (curated), featured (elevated), archive (approved)
  tier: z.enum(["editorial", "featured", "archive", "issue", "web_exclusive", "community"]).default("featured"),
  editorialCategory: z.enum(["essay", "review", "profile", "feature", "column", "news", "art", "interview", "radio"]).optional(),
  type: z.enum(["playlist", "writing", "art", "video", "pdf", "link"]).optional(),
  originChannel: z.enum(["community", "editorial"]).default("editorial"),
  provider: z.enum(["spotify", "apple", "soundcloud", "youtube", "gdocs", "pdf", "file", "external"]).optional(),
  embedUrl: z.string().optional(),
  coverWidth: z.number().positive().optional(),
  coverHeight: z.number().positive().optional(),
  gallery: z.array(z.object({
    src: z.string(),
    caption: z.string().optional(),
    credit: z.string().optional(),
    alt: z.string().optional(),
  })).optional(),
  galleryLayout: z.enum(["slideshow","masonry","rows"]).optional(),
  externalUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  artistCredit: z.string().optional(),
  credits: z.string().optional(),
  galleryUrls: z.string().optional(),
  sections: sectionsArraySchema.optional(),
  // Import tracking fields
  importSource: z.enum(["substack", "medium", "gdocs"]).optional(),
  importSourceUrl: z.string().url().optional(),
  importSourceAuthor: z.string().optional(),
  readTimeMinutes: z.number().positive().optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(), // ISO-8601 string from datetime-local input
  reviewStatus: z.enum(["none", "pending", "approved", "rejected"]).optional(),
});

export const updateContentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long").optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format").optional(),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  authors: z.array(z.string()).optional(),
  coverImageUrl: z.string().optional(),
  videoUrl: z.string().optional().refine(isValidYouTubeUrl, { message: "Please enter a valid YouTube URL" }),
  status: z.enum(["draft", "scheduled", "published"]).optional(),
  contentType: z.enum(["essay", "interview", "video_essay", "photoshoot", "playlist", "artPdf", "link", "notes", "picks_list"]).optional(),
  featuredRank: z.number().min(1).max(10).optional(),
  isHero: z.boolean().optional(),
  issueId: z.number().optional(),
  publishedAt: z.date().optional(),
  tier: z.enum(["editorial", "featured", "archive"]).optional(),
  gallery: z.array(z.object({
    src: z.string(),
    caption: z.string().optional(),
    credit: z.string().optional(),
    alt: z.string().optional(),
  })).optional(),
  galleryLayout: z.enum(["slideshow","masonry","rows"]).optional(),
  externalUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  artistCredit: z.string().optional(),
  credits: z.string().optional(),
  galleryUrls: z.string().optional(),
  sections: sectionsArraySchema.optional(),
  // Import tracking
  importSource: z.enum(["substack", "medium", "gdocs"]).optional(),
  importSourceUrl: z.string().url().optional(),
  importSourceAuthor: z.string().optional(),
  readTimeMinutes: z.number().positive().optional(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
  reviewStatus: z.enum(["none", "pending", "approved", "rejected"]).optional(),
});

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  reviewedBy: z.string().optional(),
  editorialStatus: z.enum(["pending", "ready", "needs_edits", "not_suitable"]).optional(),
  feedbackNotes: z.string().optional(),
  section: z.enum(["editorial", "community", "voices"]).optional(),
  isCommunityVoice: z.boolean().optional(),
  likes: z.number().optional(),
  qualityScore: z.number().optional(),
  adminNotes: z.string().optional(),
  moderationFlags: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long").optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format").optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  publishedAt: z.date().optional(),
});

export const insertFeatureSchema = createInsertSchema(features).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  entityType: z.enum(["content", "issue"]),
  entityId: z.string().min(1),
  featureType: z.enum(["hero", "main", "secondary"]).default("main"),
  position: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  activeFrom: z.coerce.date().optional(),
  activeUntil: z.coerce.date().optional(),
});

export const updateFeatureSchema = z.object({
  entityType: z.enum(["content", "issue"]).optional(),
  entityId: z.string().min(1).optional(),
  featureType: z.enum(["hero", "main", "secondary"]).optional(),
  position: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  activeFrom: z.coerce.date().optional(),
  activeUntil: z.coerce.date().optional(),
});

export const updateContributorSchema = z.object({
  handle: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, "Invalid handle format").optional(),
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  tagline: z.string().max(150).optional(),
  location: z.string().max(100).optional(),
  role: contributorRoleSchema.optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  socialHandle: z.string().optional(), // @deprecated
  socialLinks: socialLinksSchema,
  photoshootGallery: z.array(photoshootGalleryItemSchema).max(10).optional(),
  recommendedPlaylistUrl: z.string().url().optional().or(z.literal("")),
  recommendedPlaylistPlatform: z.enum(["spotify", "apple", "soundcloud", "youtube"]).optional(),
  isResident: z.boolean().optional(),
  residentId: z.number().optional(),
  isPublic: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

// Content-Contributor linking schema
export const insertContentContributorSchema = z.object({
  contentId: z.number().positive("Content ID is required"),
  contributorId: z.number().positive("Contributor ID is required"),
  role: contentContributorRoleSchema.default("author"),
  position: z.number().min(0).default(0),
});

// Substack import schema
export const substackImportSchema = z.object({
  url: z.string().url("Invalid URL").refine(
    (url) => url.includes("substack.com") || url.includes(".substack."),
    "Must be a valid Substack URL"
  ),
  // Optional overrides
  title: z.string().optional(),
  excerpt: z.string().optional(),
  contributorId: z.number().positive().optional(),
  tier: z.enum(["editorial", "featured", "archive"]).default("featured"),
});

// Auto-create contributor schema (for when content is approved)
export const autoCreateContributorSchema = z.object({
  handle: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  displayName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  role: contributorRoleSchema.optional(),
  avatarUrl: z.string().url().optional(),
  socialLinks: socialLinksSchema.optional(),
});

export const insertPitchSchema = createInsertSchema(pitches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  concept: z.string().min(10, "Add more detail to the concept").max(1000, "Concept is too long"),
  targetLength: z.string().optional(),
  targetDate: z.coerce.date().optional(),
  status: z.enum(["idea", "in_progress", "published", "dropped"]).default("idea"),
  assignedTo: z.number().optional(),
  createdBy: z.string().min(1, "Creator is required"),
  notes: z.string().optional(),
  contentId: z.number().optional(),
});

export const updatePitchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  concept: z.string().min(10).max(1000).optional(),
  targetLength: z.string().optional(),
  targetDate: z.coerce.date().optional(),
  status: z.enum(["idea", "in_progress", "published", "dropped"]).optional(),
  assignedTo: z.number().optional(),
  notes: z.string().optional(),
  contentId: z.number().optional(),
});

export const insertOpenCallSchema = createInsertSchema(openCalls).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
}).extend({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  description: z.string().min(10, "Add more detail").max(2000, "Description is too long"),
  guidelines: z.string().optional(),
  targetDate: z.coerce.date().optional(),
  status: z.enum(["draft", "active", "closed"]).default("draft"),
  coverImageUrl: z.string().optional(),
});

export const updateOpenCallSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10).max(2000).optional(),
  guidelines: z.string().optional(),
  targetDate: z.coerce.date().optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
  coverImageUrl: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Contributor = typeof contributors.$inferSelect;
export type InsertContributor = z.infer<typeof insertContributorSchema>;
export type UpdateContributor = z.infer<typeof updateContributorSchema>;

export type Show = typeof shows.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type Guide = typeof guides.$inferSelect;
export type HeroBanner = typeof heroBanners.$inferSelect;
export type MixSubmission = typeof mixSubmissions.$inferSelect;
export type EpisodeSubmission = typeof episodeSubmissions.$inferSelect;
export type PlaylistSubmission = typeof playlistSubmissions.$inferSelect;
export type Schedule = typeof schedule.$inferSelect;
export type ResidentApplication = typeof residentApplications.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Resident = typeof residents.$inferSelect;
export type CurrentPlayback = typeof currentPlayback.$inferSelect;
export type StreamStatus = typeof streamStatus.$inferSelect;
export type AlbumSuggestion = typeof albumSuggestions.$inferSelect;
export type AlbumVote = typeof albumVotes.$inferSelect;
export type AlbumPick = typeof albumPicks.$inferSelect;
export type AlbumPickItem = typeof albumPickItems.$inferSelect;
export type AlbumSuggestionNote = typeof albumSuggestionNotes.$inferSelect;

export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type InsertHeroBanner = z.infer<typeof insertHeroBannerSchema>;
export type InsertMixSubmission = z.infer<typeof insertMixSubmissionSchema>;
export type InsertEpisodeSubmission = z.infer<typeof insertEpisodeSubmissionSchema>;
export type InsertPlaylistSubmission = z.infer<typeof insertPlaylistSubmissionSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type InsertResidentApplication = z.infer<typeof insertResidentApplicationSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertResident = z.infer<typeof insertResidentSchema>;
export type InsertCurrentPlayback = z.infer<typeof insertCurrentPlaybackSchema>;
export type InsertAlbumSuggestion = z.infer<typeof insertAlbumSuggestionSchema>;
export type InsertAlbumVote = z.infer<typeof insertAlbumVoteSchema>;
export type InsertAlbumPick = z.infer<typeof insertAlbumPickSchema>;
export type InsertAlbumPickItem = z.infer<typeof insertAlbumPickItemSchema>;
export type InsertAlbumSuggestionNote = z.infer<typeof insertAlbumSuggestionNoteSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type FeaturedStory = typeof featuredStories.$inferSelect;
export type InsertFeaturedStory = z.infer<typeof insertFeaturedStorySchema>;
export type UpdateSubmissionStatus = z.infer<typeof updateSubmissionStatusSchema>;

export type Issue = typeof issues.$inferSelect;
/** @alias Issue — kept for legacy imports */
export type RawIssueRow = Issue;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type UpdateIssue = z.infer<typeof updateIssueSchema>;
export type IssueContent = typeof issueContents.$inferSelect;
export type InsertIssueContent = z.infer<typeof insertIssueContentSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type UpdateContent = z.infer<typeof updateContentSchema>;
export type Tag = typeof tags.$inferSelect;
export type ContentTag = typeof contentTags.$inferSelect;
export type SubmissionTag = typeof submissionTags.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type UpdateFeature = z.infer<typeof updateFeatureSchema>;
export type FeatureWithContent = { feature: Feature; content: Content | null };
export type Pitch = typeof pitches.$inferSelect;
export type InsertPitch = z.infer<typeof insertPitchSchema>;
export type UpdatePitch = z.infer<typeof updatePitchSchema>;
export type OpenCall = typeof openCalls.$inferSelect;
export type InsertOpenCall = z.infer<typeof insertOpenCallSchema>;
export type UpdateOpenCall = z.infer<typeof updateOpenCallSchema>;

// Content-Contributor junction types
export type ContentContributor = typeof contentContributors.$inferSelect;
export type InsertContentContributor = z.infer<typeof insertContentContributorSchema>;

// Admin type aliases (users table serves as admin store)
export type Admin = User;
export type InsertAdmin = InsertUser;

// Substack import type
export type SubstackImport = z.infer<typeof substackImportSchema>;

// Auto-create contributor type
export type AutoCreateContributor = z.infer<typeof autoCreateContributorSchema>;

// Contributor with content (for profile pages)
export interface ContributorWithContent extends Contributor {
  contentCredits?: Array<{
    content: Content;
    role: string;
    position: number;
  }>;
  mixSubmissions?: MixSubmission[];
  playlistSubmissions?: PlaylistSubmission[];
}

// Content with contributors (for article pages)
export interface ContentWithContributors extends Content {
  contributors?: Array<{
    contributor: Contributor;
    role: string;
    position: number;
  }>;
}

// Unified content types (for community page)
export interface ContentItemBase {
  id: number;
  title: string;
  artworkUrl?: string | null;
  genre?: string | null;
  submittedAt?: Date | null;
  createdAt?: Date | null;
  isFeatured?: boolean;
  url?: string | null;
}

export interface MixContentItem extends ContentItemBase {
  type: 'mix';
  name: string;
  handle?: string | null;
  about?: string | null;
  platform?: string | null;
  status?: string;
  approved_at?: Date | null;
  featured_at?: Date | null;
}

export interface EpisodeContentItem extends ContentItemBase {
  type: 'episode';
  hostName: string;
  description?: string | null;
  seriesTitle?: string | null;
  episodeNumber?: number | null;
  airDate: Date;
  duration: number;
  audioUrl: string;
  tracklist?: string | null;
  tags?: string[] | null;
  status: string;
  isLive?: boolean;
  viewCount?: number;
}

export interface ArtContentItem extends ContentItemBase {
  type: 'art';
  artistName: string;
  description?: string | null;
  medium?: string | null;
  tags?: string[] | null;
  imageUrl: string;
  status?: string;
}

export interface PlaylistContentItem extends ContentItemBase {
  type: 'playlist';
  curatorName: string;
  handle?: string | null;
  description?: string | null;
  trackCount?: number;
  tags?: string[] | null;
  status?: string;
  playlistUrl: string;
}

export type ContentItem =
  | MixContentItem
  | EpisodeContentItem
  | ArtContentItem
  | PlaylistContentItem;

export function isMixContent(item: ContentItem): item is MixContentItem {
  return item.type === 'mix';
}

export function isEpisodeContent(item: ContentItem): item is EpisodeContentItem {
  return item.type === 'episode';
}

export function isArtContent(item: ContentItem): item is ArtContentItem {
  return item.type === 'art';
}

export function isPlaylistContent(item: ContentItem): item is PlaylistContentItem {
  return item.type === 'playlist';
}

// ============================================
// GENRE TAG SYSTEM
// ============================================

// Genres - Tag system for content discovery
export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }), // parent category for grouping
  description: text("description"),
  colorHex: varchar("color_hex", { length: 7 }), // optional brand color
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content-Genre Relationships (polymorphic - handles mixes, episodes, playlists)
export const contentGenres = pgTable("content_genres", {
  id: serial("id").primaryKey(),
  genreId: integer("genre_id").references(() => genres.id).notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // 'mix', 'episode', 'playlist'
  contentId: integer("content_id").notNull(), // ID of the mix/episode/playlist
  isPrimary: boolean("is_primary").default(false), // primary genre for the content
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// EDITORIAL SUBMISSIONS
// ============================================

// Editorial Submissions - Writer pitch submissions
// NOTE: Uses "editorial_writer_submissions" to avoid collision with the community submissions table
export const editorialSubmissions = pgTable("editorial_writer_submissions", {
  id: serial("id").primaryKey(),

  // Writer Info
  writerName: varchar("writer_name", { length: 255 }).notNull(),
  writerEmail: varchar("writer_email", { length: 255 }).notNull(),
  writerBio: text("writer_bio"),
  portfolioLinks: jsonb("portfolio_links").$type<string[]>(), // Array of URLs
  socialLinks: jsonb("social_links").$type<{ twitter?: string; instagram?: string }>(),

  // Pitch Info
  pitchTitle: varchar("pitch_title", { length: 500 }).notNull(),
  pitchCategory: varchar("pitch_category", { length: 100 }),
  pitchSummary: text("pitch_summary").notNull(),
  whyThisPublication: text("why_this_publication"),
  uniqueAngle: text("unique_angle"),

  // Writing Sample
  writingSampleText: text("writing_sample_text"),
  writingSampleFile: varchar("writing_sample_file", { length: 500 }), // S3 URL or file path
  wordCount: integer("word_count"),

  // Metadata
  targetPublishDate: timestamp("target_publish_date"),
  exclusiveSubmission: boolean("exclusive_submission").default(false),
  previouslyPublished: boolean("previously_published").default(false),

  // Status & Review
  status: varchar("status", { length: 50 }).default("pending"), // pending, under_review, accepted, rejected
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),

  // Timestamps
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schema for editorial submissions
export const insertEditorialSubmissionSchema = z.object({
  writerName: z.string().min(2, "Name is required"),
  writerEmail: z.string().email("Valid email is required"),
  writerBio: z.string().optional(),
  portfolioLinks: z.array(z.string().url()).optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
  pitchTitle: z.string().min(3, "Pitch title is required"),
  pitchCategory: z.string().optional(),
  pitchSummary: z.string().min(50, "Pitch summary must be at least 50 characters"),
  whyThisPublication: z.string().optional(),
  uniqueAngle: z.string().optional(),
  writingSampleText: z.string().optional(),
  wordCount: z.number().int().positive().optional(),
  targetPublishDate: z.coerce.date().optional(),
  exclusiveSubmission: z.boolean().default(false),
  previouslyPublished: z.boolean().default(false),
});

export type EditorialSubmission = typeof editorialSubmissions.$inferSelect;
export type InsertEditorialSubmission = z.infer<typeof insertEditorialSubmissionSchema>;

// API Response Types
export type ApiOk<T = void> = { ok: true; data: T };
export type ApiError = { ok: false; error: string; code?: string };
export type ApiResult<T = void> = ApiOk<T> | ApiError;

export class ErrorWithCode extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ErrorWithCode';
  }
}

// Uploaded file interface
export interface UploadedFile {
  url: string;
  mime: string;
  name: string;
  size?: number;
  type?: string;
}
