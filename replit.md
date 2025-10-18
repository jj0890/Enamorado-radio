# Radio Station Web Application

## Overview
This full-stack web application provides a modern, engaging platform for a radio station. It enables users to discover and listen to live audio streams, browse stations and shows, and interact with curated content. The project aims to offer a comprehensive experience for music discovery, community interaction, featuring live programming, user submissions, and a robust admin system for content management and resident DJ operations. The business vision is to create a hub for music enthusiasts, fostering community and promoting new artists through a streamlined and user-friendly interface.

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
- **Styling**: Tailwind CSS with shadcn/ui component library, Radix UI primitives
- **State Management**: TanStack Query
- **Routing**: Wouter
- **UI/UX Decisions**: Responsive design (mobile-first), Dark Theme (default), IBM Plex Mono typography, white/cream backgrounds with #FF0000 red accent. Features include an iPod Cover Flow-inspired album showcase, macOS folder-style guide navigation, and a single persistent radio player with customizable themes.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for live updates
- **API Design**: RESTful API with real-time WebSocket enhancements
- **Core Functionality**: Manages radio programs, schedules, content rotation, user submissions, and an admin approval queue.
- **Streaming**: Integrated with AzuraCast for professional radio streaming (stream management, scheduling, auto-playlists).
- **Data Persistence**: File-based persistent storage (`server/persistentStorage.ts`) using JSON files in `./data/`.

### Database Architecture
- **Database**: PostgreSQL with connection pooling (Neon serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit
- **Current Setup**: Clean schema architecture with streamlined types and consistent naming conventions.

### Key Features
- **Audio System**: Simplified AudioPlayer compatible with AzuraCast backend; AzuraCast handles complex audio features.
- **Station Management**: Browse stations by genre, featured shows, live status, and organized content.
- **Albums of the Month**: Community-driven album curation with a public submission page, editor voting, MusicBrainz integration for artwork, and a ranked publication system.
- **Mix Upload & Playback**: Community mix submission system with persistent JSON-based storage, admin approval workflow, and SoundCloud/Mixcloud/Audio.com URL support. Includes automatic metadata fetching via oEmbed API.
- **Resident DJ System**: Full-stack resident management with semi-automated AzuraCast streamer account setup. This involves auto-generating secure credentials and a one-click "Copy to AzuraCast" button for admin-assisted configuration due to AzuraCast API limitations.
- **User Submissions**: Community-friendly submission system with dynamic "Fresh from the Community" section and automatic metadata enhancement.
- **Admin Controls**: Radio Ops Panel for real-time monitoring of broadcast status and now playing information from AzuraCast, along with comprehensive CRUD operations for content and AzuraCast configuration via an admin settings page.
- **Enhanced Routing Structure**: Comprehensive navigation including Latest, Explore (guides), Episodes (archive), Schedule (live programming), and Mixes (community).

## External Dependencies

- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **Development**: Vite, TypeScript, ESLint
- **Audio**: Web Audio API, HTML5 audio
- **Streaming**: AzuraCast (with Icecast server)
- **Broadcasting Software**: BUTT, Mixxx, Audio Hijack, OBS Studio (for resident streaming)
- **Metadata/APIs**: SoundCloud oEmbed API, Last.fm, Spotify API, MusicBrainz API (album metadata and Cover Art Archive)
- **External Forms**: Google Sheets (for Resident Applications)

## Streaming Workflows

### Resident DJ Streaming Setup
**Complete End-to-End Workflow: From Account Creation to Going Live**

#### Phase 1: Admin Creates Resident Account
1. Admin logs into admin portal (/admin)
2. Navigate to Residents Management (/admin/residents)
3. Click "Create New Resident" and fill in resident details (name, bio, etc.)
4. System automatically generates secure streaming credentials:
   - Username: `resident_[firstname_lastname]`
   - Password: Randomly generated secure password
   - Server: Hostname extracted from AZURACAST_BASE_URL (e.g., 24.199.109.18)
   - Port: 8000 (default Icecast port)
   - Mount Point: /radio.mp3

#### Phase 2: Admin Configures Streamer in AzuraCast (Semi-Automated)
1. After resident creation, admin sees "Copy to AzuraCast" button
2. Click button to copy pre-formatted credentials to clipboard
3. Click "Open AzuraCast Admin Panel" to access AzuraCast in new tab
4. In AzuraCast: Navigate to Streamers → Add Streamer
5. Paste copied credentials directly into AzuraCast form
6. Save streamer configuration in AzuraCast (total time: ~10 seconds)
7. **Note**: This semi-automated workflow exists because AzuraCast's streamer management endpoint requires web session authentication (cookies), not API keys

#### Phase 3: Resident Receives Credentials
1. Resident logs into their dashboard (/resident)
2. Credentials are displayed in a clear, copy-friendly format
3. Resident can copy individual fields or entire credential set
4. **Important Warning Displayed**: "When you go live, the automated playlist will stop playing. Your live broadcast takes priority."

#### Phase 4: Resident Configures Broadcasting Software
Residents can use any of these recommended software options:

**Option A: BUTT (Broadcast Using This Tool) - Free, Cross-Platform**
- Download from https://danielnoethen.de/butt/
- Configure streaming settings:
  - Server: [from credentials]
  - Port: 8000
  - Password: [from credentials]
  - Mount Point: /radio.mp3
  - Encoder: MP3 (128kbps or higher recommended)
- Select audio input source (microphone, line-in, or virtual audio device)
- Click "Play" to start streaming

**Option B: Mixxx - Free DJ Software**
- Download from https://mixxx.org
- Enable Live Broadcasting in Preferences → Live Broadcasting
- Configure Icecast 2 settings using provided credentials
- Use Mixxx's DJ features while streaming live

**Option C: Audio Hijack (macOS) - Advanced Audio Routing**
- Download from https://rogueamoeba.com/audiohijack/
- Create new session with desired audio sources:
  - Application audio (Spotify, Apple Music, web browsers)
  - Microphone input for announcements
  - Music library for playback
- Add "Broadcast" block and configure with AzuraCast credentials:
  - Type: Icecast
  - Server: [from credentials]
  - Port: 8000
  - Mount Point: /radio.mp3
  - Password: [from credentials]
- Use Audio Hijack's powerful routing to mix multiple audio sources
- Click "Record & Broadcast" to go live

**Option D: OBS Studio + Icecast Plugin**
- Download OBS Studio from https://obsproject.com/
- Install the obs-icecast plugin:
  - For Windows/Mac: Download from https://github.com/iamscottxu/obs-icecast/releases
  - Extract and copy files to OBS plugins folder
  - Restart OBS Studio
- Configure audio-only streaming:
  - Create a new Scene with audio sources (Desktop Audio, Mic/Aux)
  - Go to Settings → Output
  - Set Output Mode to "Advanced"
  - Enable "Audio Track 1" for your audio sources
- Configure Icecast streaming:
  - In Settings → Stream, select "Icecast" as Service
  - Enter server details from credentials:
    - Server: [hostname without http://]
    - Port: 8000
    - Mount Point: /radio.mp3
    - Password: [from credentials]
  - Set Audio Bitrate to 128 kbps or higher
- Click "Start Streaming" to go live
- Monitor stream status in OBS status bar

#### Phase 5: Going Live - What Happens
1. Resident starts streaming from their software
2. AzuraCast receives the live stream connection
3. **Automated playlist immediately stops** - Live broadcast takes priority
4. Stream switches from AUTO mode to LIVE mode
5. Radio Ops Panel (/admin/radio-ops) shows:
   - Status: "🔴 LIVE"
   - Now Playing: Updates with metadata from live stream
   - "Coming Up Next" section disappears (no queue during live broadcast)
6. Listeners hear the resident's live broadcast in real-time

#### Phase 6: Ending Live Broadcast
1. Resident stops streaming from their software
2. AzuraCast detects disconnection
3. **Automated playlist automatically resumes** - Ensures continuous audio
4. Stream switches from LIVE mode back to AUTO mode
5. Radio Ops Panel shows:
   - Status: "⚡ AUTO"
   - Now Playing: Current automated playlist track
   - "Coming Up Next" reappears with queue information

#### Technical Notes & Best Practices
- **Playlist Interruption**: This is expected AzuraCast behavior - live broadcasts take priority over automation
- **Bandwidth**: Recommend streaming at 128kbps MP3 for quality/bandwidth balance
- **Latency**: Typical stream delay is 5-15 seconds between broadcast and listener playback
- **Monitoring**: Admins can monitor live status via Radio Ops Panel with auto-refresh every 5 seconds
- **Security**: All credentials are stored securely in the database and transmitted over HTTPS
- **Fallback**: If a resident's stream drops unexpectedly, automated playlist resumes immediately
- **Multiple Residents**: AzuraCast supports multiple streamer accounts, but only one can be live at a time

#### Troubleshooting Common Issues
- **"Connection Refused"**: Verify server URL and port (should be http://[server]:8000)
- **"Authentication Failed"**: Double-check password - no extra spaces or characters
- **"Mount Point Error"**: Ensure using `/radio.mp3` exactly as provided
- **"Stream Not Appearing"**: Check that automated playlist has stopped - if it's still playing, live connection may not be established
- **"Audio Quality Issues"**: Increase bitrate to 192kbps or use AAC encoding for better quality