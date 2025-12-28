# Enamorado Platform

> A unified full-stack platform combining live radio streaming with magazine-style editorial content, featuring comprehensive content management, community submissions, and role-based workflows.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 🎵 Overview

A production-ready platform that merges two powerful content systems: **live radio broadcasting** and **magazine editorial publishing**. Features real-time streaming, block-based content editing, community submissions, and unified contributor management.

**Key Philosophy**: Authentic content from real contributors, professional editorial workflows, and seamless integration between audio and written content.

## ✨ Features

### 🎙️ Radio Broadcasting
- **Live Streaming** - AzuraCast integration for 24/7 radio
- **Episode Management** - Archive past shows with full metadata
- **Mix Submissions** - Community DJ mix submissions with approval workflow
- **Playlist Submissions** - Curated playlists from Spotify, Apple Music, YouTube
- **Resident System** - DJ/host management with streaming credentials
- **Schedule** - Upcoming and past show scheduling
- **Guides** - Thematic entry points for music discovery
- **Album of the Month** - Community voting and editorial picks
- **Unified Audio Player** - Persistent player across entire site

### 📝 Magazine & Editorial
- **Block-Based Editor** - Tiptap WYSIWYG for rich content creation
- **Editorial Sections**: Text, images, image rows, pull quotes, callouts, embeds, Q&A
- **Magazine Issues** - Curated seasonal collections with table of contents
- **Long-Form Content** - Articles, interviews, photo essays, reviews
- **Community Submissions** - User-generated content with editorial review
- **Open Calls** - Themed submission drives
- **Pitches** - Internal editorial planning and workflow
- **Features** - Time-based homepage curation
- **Rich Embeds** - Iframely integration for 1900+ platforms

### 👥 Unified Community
- **Contributors** - Single identity system for all submissions
- **Role-Based Access** - Admin, Editor, Contributor, Viewer roles
- **Multi-Format Support** - Audio, video, playlists, articles, photo essays
- **Tags & Categories** - Flexible content organization
- **Moderation Tools** - Editorial feedback and constructive review

### 🎨 Design & UX
- **Magazine-Style Aesthetic** - Editorial layout inspired by NTS Radio & Polyester
- **Responsive Design** - Mobile-first with elegant typography
- **Dark Theme** - Professional color palette
- **Micro-Interactions** - Smooth transitions and hover effects

## 🏗️ Architecture

### Frontend
```
React 18 + TypeScript
├── Vite 5.4 (build tool)
├── Wouter 3.3 (routing)
├── TanStack Query 5.60 (server state)
├── Zustand 5.0 (client state)
├── Tiptap (WYSIWYG editor)
├── Tailwind CSS + shadcn/ui (styling)
├── Radix UI (accessible primitives)
└── Framer Motion (animations)
```

### Backend
```
Node.js + Express 4.21
├── TypeScript with ES modules
├── WebSocket server (real-time updates)
├── RESTful API design
├── Passport.js (authentication)
├── Multer 2.0 (file uploads)
└── Google Cloud Storage
```

### Database
```
PostgreSQL (Neon serverless)
├── Drizzle ORM 0.39
├── Type-safe queries with Zod validation
├── Migrations with drizzle-kit
└── File-based fallback storage
```

### External Integrations
- **AzuraCast** - Professional radio streaming + SFTP uploads
- **Iframely** - Rich embeds (1900+ platforms)
- **Spotify API** - Track metadata enrichment
- **Last.fm API** - Music information
- **MusicBrainz** - Album metadata and artwork
- **Google Sheets** - Resident application forms
- **SoundCloud/Mixcloud** - oEmbed metadata

## 📂 Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── lib/             # Utilities and helpers
│   │   └── tokens.css       # Design system tokens
│
├── server/                    # Backend Express application
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Storage interface
│   ├── persistentStorage.ts # File-based storage implementation
│   ├── adminAuth.ts         # Authentication system
│   ├── azuracastService.ts  # AzuraCast integration
│   └── metadataService.ts   # External API integrations
│
├── shared/                    # Shared types and schemas
│   └── schema.ts            # Drizzle database schema
│
└── data/                      # Persistent JSON storage (gitignored)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- AzuraCast instance (optional, for streaming features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ScumbagJones/Portfolio.git
   cd Portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5000`

### Default Admin Account
On first startup, a default admin account is created:
- **Username**: Set via `ADMIN_USER` environment variable (default: `admin`)
- **Password**: Set via `ADMIN_PASS` environment variable (default: `change-me`)

⚠️ **Important**: Change default credentials in production!

## 🔐 Environment Variables

See `.env.example` for all required environment variables. Key categories:

- **Authentication**: Admin credentials and session secrets
- **Database**: PostgreSQL connection details
- **AzuraCast**: Streaming backend API and SFTP configuration
- **External APIs**: Spotify, Last.fm, MusicBrainz credentials
- **Google Sheets**: Service account for application forms

## 🎨 Design System

### Color Palette
- **Primary**: Navy Blue (#003F87)
- **Secondary**: Cream (#FEFCF9)
- **Accent**: Red (#FF0000)
- **Dark Theme**: Default

### Typography
- **Font Family**: IBM Plex Mono
- **Headings**: Playfair Display (serif)
- **Scale**: 40px/28px/20px with tight line-height

### Design Principles
- **Borders are ink, not color** - Use neutral gray borders
- **Shadow carries depth** - Subtle elevation system
- **8px radius** - Consistent rounded-lg corners
- **Color reserved for tags/CTAs** - No color on hover states
- **Featured items** - Distinguished by darker border + depth, not color

## 🛠️ Tech Stack Highlights

### Frontend Features
- **Unified Audio Controller** - Single audio element shared across all components
- **Real-time Updates** - WebSocket integration for live metadata
- **Optimistic Updates** - TanStack Query for snappy UX
- **Type Safety** - End-to-end TypeScript with Zod validation
- **Accessibility** - data-testid attributes for e2e testing

### Backend Features
- **RESTful API** - Clean separation of concerns
- **Middleware Stack** - Helmet, CORS, cookie-parser
- **Session Management** - HMAC-signed tokens with 24hr expiry
- **File Uploads** - Multer with SFTP integration
- **Error Handling** - express-async-errors for clean error boundaries

### Database Schema
- **Drizzle ORM** - Type-safe query builder
- **Migrations** - `npm run db:push` for schema sync
- **Relations** - Proper foreign keys and indexes
- **JSON Fields** - JSONB for flexible metadata storage

## 📝 Key Implementation Details

### Authentication System
- HMAC-signed session tokens (no JWT overhead)
- httpOnly cookies for XSS protection
- Timing-safe password comparison
- Auto-seeding of default accounts
- Role-based route protection

### Audio Playback
- Single audio element pattern (prevents overlapping playback)
- Artwork caching with crossfade transitions
- Non-seekable progress for live streams
- Metadata persistence across route changes

### Content Management
- Timestamp-based approval system (`approved_at` vs boolean flags)
- Multi-platform support (SoundCloud, Mixcloud, Spotify, local files)
- Automatic metadata enrichment from external APIs
- Reference-only vs streamable content differentiation

### AzuraCast Integration
- SFTP file uploads with progress tracking
- Real-time now-playing metadata
- Playlist management via REST API
- Semi-automated resident account setup

## 🧪 Testing

The project uses Playwright for end-to-end testing:

```bash
npm run test
```

## 📜 License

This is a portfolio project. All rights reserved.

## 👤 Author

**Jarrad Jones**
- GitHub: [@ScumbagJones](https://github.com/ScumbagJones)

## 🙏 Acknowledgments

- Design inspiration: NTS Radio, Boiler Room
- UI Components: shadcn/ui, Radix UI
- Streaming Backend: AzuraCast
- Deployment: Replit

---

**Note**: This repository showcases the codebase architecture and implementation. Some features require external integrations (AzuraCast, PostgreSQL) not included in this repository.
