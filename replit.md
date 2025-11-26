# Radio Station Web Application

## Overview
This full-stack web application provides a modern platform for a radio station, enabling users to discover and listen to live audio streams, browse content, and interact with curated music. The project aims to create a comprehensive hub for music enthusiasts, fostering community, promoting new artists, and offering a streamlined user experience with live programming, user submissions, and a robust admin content management system. The business vision is to create a comprehensive hub for music enthusiasts, fostering community, promoting new artists, and offering a streamlined user experience with live programming, user submissions, and a robust admin content management system.

## User Preferences
Preferred communication style: Simple, everyday language.
Technical approach: **ZERO TOLERANCE for artificial seed data** - only authentic data sources and real functionality. No mock data, placeholder content, or "vibey coding" ever.
Design philosophy: Substance over style - every UI element must have tangible backend implementation
Streaming approach: Self-hosted solution preferred over third-party services like Radio.co
Data integrity: Clean slate storage with only essential admin account - all content must come from authentic user submissions
Metadata handling: Prioritize original submission names over enhanced metadata from external APIs (e.g., use submitted artist names over SoundCloud metadata)
External forms: Prefer Google Forms for complex applications over custom form implementations
UI terminology: Use "community programming" instead of "residents" in all user-facing copy

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui and Radix UI primitives
- **State Management**: TanStack Query
- **Routing**: Wouter
- **UI/UX Decisions**: Responsive, mobile-first design, Dark Theme (default), IBM Plex Mono typography, red accent (#FF0000). Features include an iPod Cover Flow-inspired album showcase, macOS folder-style guide navigation, and a single persistent radio player with customizable themes. A unified audio controller architecture ensures only one audio element exists in the DOM, consumed by all components requiring audio state via a shared context. Admin UI features a unified design system with an AdminShell component, reusable DataTable, and ActivityFeed, all using a light theme. The system includes a comprehensive Hero Banner system for managing seasonal content.

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

### System Design Choices
- **Audio System**: Simplified AudioPlayer compatible with AzuraCast backend with artwork caching, metadata persistence, and non-seekable progress bars for live streams.
- **Content Management**: Features for radio programs, schedules, content rotation, user submissions (mixes, episodes), and admin approval. This includes community mix submission, admin episode upload with SFTP, and tracklist support. A unified community feed displays mixes and episodes with filtering.
- **Station Management**: Allows browsing stations by genre, featured shows, and live status. Includes a "Resident DJ System" for managing residents with semi-automated AzuraCast streamer account setup.
- **User Engagement**: Community-driven album curation ("Albums of the Month") with submission, editor voting, and MusicBrainz integration.
- **Admin Controls**: A Radio Ops Panel for real-time broadcast monitoring and comprehensive CRUD operations for content and AzuraCast configuration. Features include an admin portal with a unified design system for managing mixes, episodes, albums, residents, and system settings.
- **Navigation**: Enhanced routing structure including Latest, Explore, Episodes, Schedule, and Mixes, with a simplified homepage featuring a Live Player Hero and a sticky mini-player.
- **Design Tokens**: Unified design token system in `client/src/tokens.css` for consistent styling.

## External Dependencies

- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **Development**: Vite, TypeScript, ESLint
- **Audio**: Web Audio API, HTML5 audio
- **Streaming**: AzuraCast (with Icecast server)
- **Broadcasting Software (recommended for resident streaming)**: BUTT, Mixxx, Audio Hijack, OBS Studio
- **Metadata/APIs**: SoundCloud oEmbed API, Last.fm, Spotify API, MusicBrainz API (album metadata and Cover Art Archive)
- **External Forms**: Google Sheets (for Resident Applications)