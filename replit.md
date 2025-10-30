# Radio Station Web Application

## Overview
This full-stack web application provides a modern platform for a radio station, enabling users to discover and listen to live audio streams, browse content, and interact with curated music. The project aims to create a comprehensive hub for music enthusiasts, fostering community, promoting new artists, and offering a streamlined user experience with live programming, user submissions, and a robust admin content management system.

## User Preferences
Preferred communication style: Simple, everyday language.
Technical approach: **ZERO TOLERANCE for artificial seed data** - only authentic data sources and real functionality. No mock data, placeholder content, or "vibey coding" ever.
Design philosophy: Substance over style - every UI element must have tangible backend implementation
Streaming approach: Self-hosted solution preferred over third-party services like Radio.co
Data integrity: Clean slate storage with only essential admin account - all content must come from authentic user submissions
Metadata handling: Prioritize original submission names over enhanced metadata from external APIs (e.g., use submitted artist names over SoundCloud metadata)
External forms: Prefer Google Forms for complex applications over custom form implementations
UI terminology: Use "community programming" instead of "residents" in all user-facing copy

## Recent Changes (Station Mode Implementation)
- **Hero Banner System** (Oct 30, 2025): Completed full-stack seasonal banner management:
  - HeroBanner schema with title, subtitle, imageUrl, overlayText fields in shared/schema.ts
  - Complete CRUD operations in IStorage and FileStorage (server/storage.ts, server/persistentStorage.ts)
  - Editor-only API routes: GET/POST/PATCH/DELETE /api/editor/hero-banners, POST /api/editor/hero-banners/:id/activate
  - Public endpoint GET /api/hero-banners/active for homepage consumption
  - HeroBannersAdmin page at /admin/hero-banners with upload form, preview, and banner list
  - EditorDashboard card for quick access to banner management
  - StaticHero component now consumes active banner from API (polls every 60s)
  - WebSocket broadcast on banner activation for real-time updates
- **P1 Audio Enhancement** (Oct 28, 2025): Enhanced global audio controller with professional features:
  - Artwork caching system prevents flicker during track changes with smooth 500ms crossfade transitions
  - Metadata persistence across route changes via enhanced audioController singleton
  - Non-seekable progress bar for live streams (always visible, shows elapsed time + LIVE indicator)
  - AudioProgressBar component supports both VOD (seekable) and live (non-seekable) modes
  - StickyRadioPlayer integrates artwork cache for instant retrieval and graceful fallbacks
- **P0 MVP Production Polish** (Oct 28, 2025): Final production-ready improvements:
  - Sticky player hidden exclusively on homepage (/) for clean NTS-style hero experience, visible on all other routes
  - Route consolidation: /latest and /explore now redirect to /mixes, navigation updated accordingly
  - Unified ContentCard component enhanced with platform badges (SoundCloud, Spotify, MP3 ♫, Mixcloud) for visual clarity
  - Design tokens refined: off-white background (#FAFAFA), typography scale (h1: 40px/1.1, h2: 28px/1.2, h3: 20px/1.25), consistent red accent
  - Zero 404 errors from navigation, all routes working correctly
- **NTS-Inspired Homepage Redesign** (Oct 26, 2025): Complete visual overhaul for editorial aesthetic:
  - New LiveShowCard hero with show art background, gradient overlay, minimal typography
  - Removed big red gradient banner (HeroOption3_FullWidth)
  - Translucent sticky player with backdrop blur (NTS-style)
  - Playfair Display serif font for section headings
  - Off-white background (#FAFAFA) instead of pure white
  - Section headings changed from red to gray-900/white for magazine feel
  - Removed duplicate "ENAMORADO RADIO" branding from hero and sticky player
  - Single "Enamorado" branding in navigation only
- **Production Polish - Tasks 8-11** (Oct 26, 2025): Completed final production readiness tasks:
  - Feature flags system (`config/features.ts`) to conditionally hide incomplete features
  - Graceful empty states for Schedule and Residents pages with discovery CTAs
  - Typography shift from ALL CAPS to Mixed Case for magazine-style rhythm
  - Card style parity (12px radius, 1px borders, hover elevation) across all card types
  - Route aliases added (`/residency` and `/residents` both work)
- **Design Token System** (Oct 26, 2025): Created unified design token system in `client/src/tokens.css` with single accent color (red #FF0000). Removed legacy CSS variables from index.css. All shadcn components now use centralized tokens for both light/dark modes. Includes radiored/slate palette, button tokens (solid primary, text-only secondary), focus rings, and complete semantic token coverage.
- **Lightweight Featured Integration** (Oct 26, 2025): Removed dedicated Featured Episodes section. Featured items now integrated into Latest feed with max 2 featured cards in first row (red border + Featured badge). Extra featured items demoted to regular styling but remain in feed (no data loss).
- **Blended Community Feed** (Oct 26, 2025): "Latest from the Community" section displays unified feed of both mixes and episodes, sorted by recency. Features type chips (Mix in red, Episode in blue) and interactive filter tabs (All/Mixes/Episodes).
- **About Section Redesign** (Oct 26, 2025): Moved long description out of hero into concise 2-sentence About section positioned below Latest feed with prominent "Submit a Mix" CTA.
- **Live Player Hero** (Oct 26, 2025): Replaced complex hero with simplified Live Player Hero featuring large play button, now playing ticker, one-line tagline, and sticky mini-player on scroll. Unified audio controller ensures single audio element across entire site.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui and Radix UI primitives
- **State Management**: TanStack Query
- **Routing**: Wouter
- **UI/UX Decisions**: Responsive, mobile-first design, Dark Theme (default), IBM Plex Mono typography, red accent (#FF0000). Features include an iPod Cover Flow-inspired album showcase, macOS folder-style guide navigation, and a single persistent radio player with customizable themes. A unified audio controller architecture ensures only one audio element exists in the DOM, consumed by all components requiring audio state via a shared context.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server
- **API Design**: RESTful API with WebSocket enhancements
- **Core Functionality**: Manages radio programs, schedules, content rotation, user submissions, and admin approval.
- **Streaming**: Integrated with AzuraCast for professional radio streaming.
- **Data Persistence**: File-based persistent storage (`server/persistentStorage.ts`) using JSON files.

### Database Architecture
- **Database**: PostgreSQL with connection pooling (Neon serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit

### Key Features
- **Audio System**: Simplified AudioPlayer compatible with AzuraCast backend.
- **Station Management**: Browse stations by genre, featured shows, live status.
- **Albums of the Month**: Community-driven album curation with submission, editor voting, MusicBrainz integration, and ranked publication.
- **Mix Upload & Playback**: Community mix submission with persistent JSON storage, admin approval, and SoundCloud/Mixcloud/Audio.com URL support with automatic metadata fetching.
- **Episode Upload System**: Admin episode upload with SFTP, authentication, visual progress, and troubleshooting guidance. Episodes support tracklists displayed in a specific format.
- **Resident DJ System**: Full-stack resident management with semi-automated AzuraCast streamer account setup, credential generation, and a "Copy to AzuraCast" function.
- **User Submissions**: Community submission system with dynamic "Fresh from the Community" section and automatic metadata enhancement.
- **Admin Controls**: Radio Ops Panel for real-time broadcast monitoring and comprehensive CRUD operations for content and AzuraCast configuration.
- **Enhanced Routing Structure**: Navigation including Latest, Explore, Episodes, Schedule, and Mixes.
- **Featured Content Integration**: Featured items are blended into the Latest feed with visual distinctions for the top two, while others are demoted to regular styling. A unified "Latest from the Community" section displays mixes and episodes with type chips and filter tabs.

## External Dependencies

- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **Development**: Vite, TypeScript, ESLint
- **Audio**: Web Audio API, HTML5 audio
- **Streaming**: AzuraCast (with Icecast server)
- **Broadcasting Software**: BUTT, Mixxx, Audio Hijack, OBS Studio (recommended for resident streaming)
- **Metadata/APIs**: SoundCloud oEmbed API, Last.fm, Spotify API, MusicBrainz API (album metadata and Cover Art Archive)
- **External Forms**: Google Sheets (for Resident Applications)