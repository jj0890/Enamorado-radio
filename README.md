# Radio Station Web Platform

> A full-stack web platform for managing and broadcasting a professional online radio station with NTS-inspired editorial design, real-time streaming integration, and comprehensive content management.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 🎵 Overview

A production-ready radio station platform featuring live streaming, editorial content management, community submissions, and role-based access control. Built with a magazine-style aesthetic inspired by NTS Radio, emphasizing editorial curation and authentic data over mock content.

**Key Philosophy**: Zero tolerance for artificial seed data - all content comes from real user submissions and authentic external APIs.

## ✨ Features

### 🎙️ Broadcasting & Streaming
- **Live Radio Integration** - AzuraCast backend with real-time metadata
- **Episode Management** - Upload, schedule, and manage radio episodes
- **Unified Audio Player** - Single persistent player across entire site
- **Tracklist Display** - Formatted track lists with hover micro-interactions

### 📝 Content Management
- **Community Submissions** - Mixes, playlists, and episodes from users
- **Editorial Dashboard** - Role-based content approval (Admin/Editor)
- **Featured Content** - Highlight best submissions in feeds
- **Hero Banners** - Seasonal homepage banner system
- **Albums of the Month** - Team voting system for monthly album curation

### 👥 User & Access Control
- **Role-Based Authentication** - Admin, Editor, Contributor, Viewer roles
- **Admin Dashboard** - Comprehensive system management
- **Editor Portal** - Streamlined content review workflow
- **Resident DJ System** - Semi-automated AzuraCast account setup

### 🎨 Design & UX
- **Magazine-Style Aesthetic** - Editorial layout inspired by NTS Radio
- **Dark Theme** - Navy blue (#003F87) and cream color palette
- **Responsive Design** - Mobile-first with IBM Plex Mono typography
- **Micro-Interactions** - Subtle hover effects and smooth transitions

## 🏗️ Architecture

### Frontend
```
React + TypeScript
├── Vite (build tool)
├── Wouter (routing)
├── TanStack Query (state management)
├── Tailwind CSS + shadcn/ui (styling)
└── Radix UI (primitives)
```

### Backend
```
Node.js + Express
├── TypeScript with ES modules
├── WebSocket server (real-time updates)
├── RESTful API design
├── Cookie-based authentication (HMAC-signed tokens)
└── Integration with AzuraCast API
```

### Database
```
PostgreSQL (Neon serverless)
├── Drizzle ORM
├── Connection pooling
└── File-based persistent storage fallback
```

### External Integrations
- **AzuraCast** - Professional radio streaming backend
- **SoundCloud oEmbed** - Mix metadata and embeds
- **Spotify API** - Track metadata enrichment
- **Last.fm API** - Music information
- **MusicBrainz** - Album metadata and artwork
- **Google Sheets** - Resident application forms

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
