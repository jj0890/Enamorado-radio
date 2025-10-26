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