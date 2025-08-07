# Replit.md - Radio Station Web Application

## Overview
This is a full-stack web application for a radio station platform that allows users to browse stations, discover shows, and listen to live audio streams. The application aims to provide a modern, engaging experience for music discovery and community interaction, featuring live programming, curated content, and user submissions.

## Recent Changes
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
- **Streaming**: Supports live Icecast streaming with intelligent live/recorded switching and HTML5 audio for queued tracks.
- **Data Persistence**: In-memory storage with clean modular architecture (`server/storage.ts`) ensures data consistency and type safety.

### Database Architecture
- **Database**: PostgreSQL with connection pooling (ready for production)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit
- **Connection**: Neon serverless PostgreSQL
- **Current Setup**: Clean schema architecture with streamlined types and consistent naming conventions

### Key Features
- **Audio System**: Custom AudioManager and AudioPlayer components with real-time updates via WebSockets.
- **Station Management**: Browse stations by genre, featured shows, live status indicators, and organized content.
- **Editorial Workflow System**: Supports newsroom-style stages (Submitted → Copy Ready → Web Ready → Published) for zine content (though currently de-emphasized).
- **Physical Media Generation**: Functionality for creating NFC tags, QR stickers, and mini CDs linked to digital publications (Issuu.com integration).
- **Content Discovery**: NTS-inspired episode system, Spotify integration for music discovery, curated guides, and monthly album picks.
- **Mix Upload & Playback**: Custom MP3 upload system, LiveMixPlayer component with real-time track sync, professional audio player with seeking and volume controls.
- **Enamorado Radio System**: Distinguishes live programming vs. auto-rotation modes, ProgramIndicator, track rotation system combining community uploads, SoundCloud, and DJ submissions.
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
- **Metadata/APIs**: SoundCloud oEmbed API, Last.fm, Spotify API, Issuu.com (mock API)