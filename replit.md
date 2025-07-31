# Replit.md - Radio Station Web Application

## Overview
This is a full-stack web application for a radio station platform that allows users to browse stations, discover shows, and listen to live audio streams. The application aims to provide a modern, engaging experience for music discovery and community interaction, featuring live programming, curated content, and user submissions.

## User Preferences
Preferred communication style: Simple, everyday language.
Technical approach: No mock data, placeholder content, or "vibey coding" - only authentic data sources and real functionality
Design philosophy: Substance over style - every UI element must have tangible backend implementation
Streaming approach: Self-hosted solution preferred over third-party services like Radio.co

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

### Database Architecture
- **Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit
- **Connection**: Neon serverless PostgreSQL

### Key Features
- **Audio System**: Custom AudioManager and AudioPlayer components with real-time updates via WebSockets.
- **Station Management**: Browse stations by genre, featured shows, live status indicators, and organized content.
- **Editorial Workflow System**: Supports newsroom-style stages (Submitted → Copy Ready → Web Ready → Published) for zine content (though currently de-emphasized).
- **Physical Media Generation**: Functionality for creating NFC tags, QR stickers, and mini CDs linked to digital publications (Issuu.com integration).
- **Content Discovery**: NTS-inspired episode system, Spotify integration for music discovery, curated guides, and monthly album picks.
- **Mix Upload & Playback**: Custom MP3 upload system, LiveMixPlayer component with real-time track sync, professional audio player with seeking and volume controls.
- **College Radio System**: Distinguishes live programming vs. auto-rotation modes, ProgramIndicator, track rotation system combining community uploads, SoundCloud, and DJ submissions.
- **User Submissions**: Unified submission system for tracks/mixes with admin approval queue, automatic metadata enhancement (e.g., Last.fm, Spotify).
- **Admin Controls**: Stream control panel (play/pause/skip), manual now playing updates, comprehensive CRUD operations for content.

## External Dependencies

- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **Development**: Vite, TypeScript, ESLint
- **Audio**: Web Audio API, WebSocket for live updates
- **Streaming**: Icecast streaming server, HTML5 audio
- **Metadata/APIs**: SoundCloud oEmbed API, Last.fm, Spotify API, Issuu.com (mock API)