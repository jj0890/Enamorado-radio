# Replit.md - Radio Station Web Application

## Overview

This is a full-stack web application for a radio station platform that allows users to browse stations, discover shows, and listen to live audio streams. The application features a modern React frontend with a Node.js/Express backend, real-time WebSocket communication, and PostgreSQL database integration.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for live updates
- **API Design**: RESTful API with real-time WebSocket enhancements
- **Development**: Hot reloading with Vite middleware in development

### Database Architecture
- **Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless PostgreSQL for cloud deployment

## Key Components

### Audio System
- **AudioManager**: Custom audio context management for streaming
- **AudioPlayer**: Full-featured audio player with controls
- **CompactPlayer**: Minimized player for background listening
- **Real-time Updates**: WebSocket integration for live playback information

### Station Management
- **Station Grid**: Browse available radio stations by genre
- **Featured Shows**: Curated content discovery
- **Live Status**: Real-time indication of live broadcasts
- **Genre Categorization**: Organized content by music genres

### Editorial Workflow System
- **Newsroom-Style Stages**: Submitted → Copy Ready → Web Ready → Published
- **Issuu.com Integration**: Mock API for publishing zines to Issuu platform
- **Physical Media Generation**: Creates NFC tags, QR stickers, and mini CDs
- **NFC Technology**: NTAG213 chips that automatically load Issuu publications
- **Print Specifications**: Detailed specs for physical magazine production

### Physical Media Types
- **NFC Cards**: Credit card-sized with embedded NFC chips and magazine artwork
- **QR Stickers**: Small vinyl stickers with QR codes linking to digital zines
- **Mini CDs**: 8cm diameter CDs with magazine artwork printed on surface

### User Interface
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark Theme**: Default dark theme with CSS custom properties
- **Component Library**: Comprehensive UI components from shadcn/ui
- **Accessibility**: ARIA labels and keyboard navigation support

## Data Flow

### Client-Side Flow
1. User browses stations and shows through React components
2. TanStack Query manages API requests and caching
3. Audio player manages stream playback and controls
4. WebSocket connection provides real-time updates

### Server-Side Flow
1. Express server handles REST API endpoints
2. WebSocket server manages real-time connections
3. Storage layer abstracts database operations
4. Broadcasting system sends updates to connected clients

### Database Flow
1. Drizzle ORM handles type-safe database queries
2. Schema definitions ensure data consistency
3. Migrations manage database structure changes
4. Connection pooling optimizes database performance

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **Development**: Vite, TypeScript, ESLint

### Audio Dependencies
- **Web Audio API**: Native browser audio processing
- **Streaming**: Direct HTTP stream handling
- **Real-time**: WebSocket for live updates

### Build Dependencies
- **Bundling**: Vite with React plugin
- **Styling**: PostCSS with Tailwind CSS
- **Development**: Hot module replacement and error overlay

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot reloading
- **Database**: Local PostgreSQL or Neon cloud database
- **Environment Variables**: `.env` file for local configuration

### Production Build
- **Frontend**: Vite build with optimized bundles
- **Backend**: esbuild compilation for Node.js deployment
- **Static Assets**: Served from Express with proper caching headers

### Database Deployment
- **Migrations**: Drizzle Kit push for schema deployment
- **Connection**: Environment-based database URL configuration
- **Scaling**: Connection pooling for concurrent requests

## Changelog

Changelog:
- July 03, 2025. Initial setup
- July 11, 2025. Added comprehensive editorial workflow system with newsroom-style stages (submitted, copy_ready, web_ready, published)
- July 11, 2025. Implemented physical media generation system with NFC tags for loading Issuu.com publications
- July 11, 2025. Created mock Issuu API integration for publication workflow
- July 11, 2025. Added physical media types: NFC cards, QR stickers, and mini CDs with magazine artwork
- July 11, 2025. Completely redesigned DJ submission form with modern glass morphism design and enhanced UX features
- July 11, 2025. Integrated Google Docs and Adobe InDesign connections for zine submission workflow
- July 11, 2025. Connected admin panel to display real DJ and zine submissions with full CRUD operations
- July 11, 2025. Added external publishing app integrations for streamlined editorial workflow
- July 12, 2025. Enhanced homepage with SoundCloud oEmbed API integration for real track thumbnails
- July 12, 2025. Created sophisticated featured content system with centralized hero showcase
- July 12, 2025. Implemented SoundCloud embed modal for authentic audio playback experience
- July 12, 2025. Added dynamic thumbnail loading from actual SoundCloud tracks using their API
- July 12, 2025. Redesigned homepage layout with prominent featured mix display similar to modern music platforms
- July 13, 2025. Improved artist submission ethics with respectful language and consent-focused messaging
- July 13, 2025. Enhanced featured content card design with square aspect ratio and "Featured Mix of the Month" branding
- July 13, 2025. Updated submission process to emphasize artist ownership, consent, and fair compensation practices
- July 13, 2025. Changed "Become a DJ" button to "Submit a Mix" with more inclusive community messaging

## User Preferences

Preferred communication style: Simple, everyday language.