# Replit.md - Radio Station Web Application

## Overview
This is a full-stack web application for a radio station platform that allows users to browse stations, discover shows, and listen to live audio streams. The application aims to provide a modern, engaging experience for music discovery and community interaction, featuring live programming, curated content, and user submissions.

## Recent Changes
**✅ COMPLETE: Albums of the Month Feature (October 2025)**
- ✅ Full role-based authentication system (viewer/contributor/editor/admin) with requireRole middleware
- ✅ MusicBrainz API integration for album metadata and Cover Art Archive with highest-rated fallback
- ✅ Complete album suggestion workflow: submission → voting → acceptance → draft → publishing
- ✅ AlbumSuggestion, AlbumVote, AlbumPick, and AlbumPickItem schema with persistent FileStorage
- ✅ Public submission page (/submit-album) for community album recommendations
- ✅ Admin interface (/admin/albums) with tabbed views: Suggestions, Draft, Published
- ✅ Editor voting system requiring consensus (2+ votes) for acceptance
- ✅ Monthly album picks with ranked items and publication workflow
- ✅ Public Albums of the Month page (/albums) displaying published monthly selections
- ✅ Protected admin API endpoints with proper authentication and authorization
- ✅ End-to-end testing confirms complete workflow functionality
- ✅ Production-ready implementation with proper error handling and data persistence

**✅ COMPLETE: Resident Applications Management System (September 2025)**
- ✅ Full-stack resident DJ application system with Google Sheets integration
- ✅ ResidentApplication schema with comprehensive fields (status, review stages, priority)
- ✅ FileStorage implementation with persistent JSON-based data storage
- ✅ Complete CRUD API with admin authentication and proper error handling
- ✅ AdminResidentApplications React interface with sync functionality and filtering
- ✅ Google Sheets service with automatic form response import and duplicate detection
- ✅ Toast notification system configured and working for user feedback
- ✅ Admin dashboard integration with application statistics display
- ✅ Manual and automatic sync capabilities with configurable intervals
- ✅ Status workflow management (Submitted → Under Review → Approved/Rejected)
- ✅ End-to-end testing confirms complete functionality (requires Google API credentials for production)

**Critical Data Corruption Fixes (September 2025)**
- ✅ Fixed persistent data corruption bug where approved mixes incorrectly appeared in featured tab
- ✅ Resolved root cause: migrateMixData function was deleting canonical status field on every server restart
- ✅ Implemented comprehensive multi-layer fix: serialization logic, storage filtering, admin endpoint authentication
- ✅ Created dedicated admin-authenticated endpoint (/api/admin/mixes) with proper status filtering
- ✅ Restored data integrity by preserving status field as primary source of truth with backward compatibility
- ✅ Updated real SoundCloud thumbnails for community mixes replacing placeholder artwork
- ✅ End-to-end testing confirms correct data distribution: Pending(1), Approved(1), Featured(3)

**Working Sticky Radio Player Implementation (January 2025)**
- ✅ HTTPS proxy endpoints (/stream.mp3 and /nowplaying) fix mixed-content blocking
- ✅ Top banner player matching sharedfrequenciesradio.com design exactly
- ✅ Real-time AzuraCast integration with live metadata polling
- ✅ Functional play/pause controls with proper error handling and debugging
- ✅ Volume controls and responsive design
- Stream URL proxied through: /stream.mp3 (HTTPS-safe)

**Standardized Mix Routing System (January 2025)**
- ✅ Complete routing control system with featureOnSite/pushToAzura flags
- ✅ Single backend router handling all post-approval workflows
- ✅ Admin interface at `/admin/routing` for granular control over mix destinations
- ✅ Audit trail tracking: approval → upload → rescan → playlist addition
- ✅ Idempotent operations supporting retries and routing updates
- ✅ AzuraCast integration with SFTP upload and playlist management

**Clean Schema Migration Completed (January 2025)**
- Successfully migrated from complex legacy schema to streamlined clean architecture
- Consolidated all routing and type definitions into single source of truth files
- Moved deprecated files (routes.ts, schema.ts, storage.ts) to dedicated deprecated/ folder
- Updated all imports across client and server to use clean schema system
- Resolved all TypeScript/LSP errors and ensured type consistency
- Maintained full functionality while simplifying codebase structure

## User Preferences
Preferred communication style: Simple, everyday language.
Technical approach: **ZERO TOLERANCE for artificial seed data** - only authentic data sources and real functionality. No mock data, placeholder content, or "vibey coding" ever.
Design philosophy: Substance over style - every UI element must have tangible backend implementation
Streaming approach: Self-hosted solution preferred over third-party services like Radio.co
Data integrity: Clean slate storage with only essential admin account - all content must come from authentic user submissions
Metadata handling: Prioritize original submission names over enhanced metadata from external APIs (e.g., use submitted artist names over SoundCloud metadata)
External forms: Prefer Google Forms for complex applications over custom form implementations

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query
- **Routing**: Wouter
- **UI Components**: Radix UI primitives
- **UI/UX Decisions**: Responsive design (mobile-first), Dark Theme (default), IBM Plex Mono typography, white/cream backgrounds with #FF0000 red accent scheme. Features include iPod Cover Flow-inspired album showcase, macOS folder-style guide navigation, and a single persistent radio player in the top-right corner. Customizable player themes are available.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for live updates
- **API Design**: RESTful API with real-time WebSocket enhancements
- **Core Functionality**: Manages radio programs, schedules, content rotation, user submissions, and an admin approval queue.
- **Streaming**: Integrated with AzuraCast for professional radio streaming - AzuraCast handles stream management, scheduling, and auto-playlists.
- **Data Persistence**: File-based persistent storage (`server/persistentStorage.ts`) with JSON files in `./data/` directory ensures data survives server restarts and maintains consistency.

### Database Architecture
- **Database**: PostgreSQL with connection pooling (ready for production)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit
- **Connection**: Neon serverless PostgreSQL
- **Current Setup**: Clean schema architecture with streamlined types and consistent naming conventions

### Key Features
- **Audio System**: Simplified AudioPlayer compatible with AzuraCast backend - AzuraCast handles complex audio features like auto-playlists and rotation.
- **Station Management**: Browse stations by genre, featured shows, live status indicators, and organized content.
- **Editorial Workflow System**: Supports newsroom-style stages (Submitted → Copy Ready → Web Ready → Published) for zine content (though currently de-emphasized).
- **Physical Media Generation**: Functionality for creating NFC tags, QR stickers, and mini CDs linked to digital publications (Issuu.com integration).
- **Content Discovery**: NTS-inspired episode system, Spotify integration for music discovery, curated guides, and monthly album picks.
- **Albums of the Month**: Community-driven monthly album curation with submission workflow, editor voting (consensus-based), MusicBrainz integration for artwork, and ranked publication system. Public users submit suggestions via /submit-album, editors vote and curate monthly picks, and published selections appear on /albums with full metadata and artwork.
- **Mix Upload & Playback**: Community mix submission system with manual playback - AzuraCast handles scheduling and rotation.
- **AzuraCast Integration**: Backend handles live programming, auto-rotation, scheduling - frontend focuses on community content and manual selection.
- **User Submissions**: Community-friendly submission system with dynamic "Fresh from the Community" section, no harsh rejections, automatic metadata enhancement (e.g., Last.fm, Spotify).
- **Mix Submission Backend**: Complete persistent JSON-based storage system for mix submissions with approval workflow. Supports SoundCloud, Mixcloud, and Audio.com URLs. Features admin approval pipeline with status management (pending → approved/featured).
- **SoundCloud Metadata Integration**: Automatic fetching and storage of enhanced metadata (titles, artists, thumbnails) via oEmbed API with intelligent display priority logic.
- **Resident Application System**: Express redirect route from /resident-application to external Google Form for streamlined application processing.
- **Admin Controls**: Stream control panel (play/pause/skip), manual now playing updates, comprehensive CRUD operations for content.
- **Enhanced Routing Structure**: Complete navigation system with Latest, Explore (guides), Episodes (archive), Schedule (live programming), and Mixes (community) sections. Guides are treated as collections/editorials distinct from individual episodes, following a magazine-style content architecture.

## External Dependencies

- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **Development**: Vite, TypeScript, ESLint
- **Audio**: Web Audio API, WebSocket for live updates
- **Streaming**: Icecast streaming server, HTML5 audio
- **Metadata/APIs**: SoundCloud oEmbed API, Last.fm, Spotify API, MusicBrainz API (album metadata and Cover Art Archive), Issuu.com (mock API)