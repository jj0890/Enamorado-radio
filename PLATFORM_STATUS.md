# Enamorado Platform - Current Status

**Last Updated**: December 28, 2025
**Server Status**: ✅ Running on http://localhost:5000
**Database**: ✅ Connected to Neon PostgreSQL
**All APIs**: ✅ Connected and functional

---

## 🎉 What's Working Right Now

### Core Platform
- ✅ **Server running** on localhost:5000
- ✅ **Database connected** - Neon PostgreSQL (webplayer production DB)
- ✅ **Authentication** - Admin login working (user: jarrad)
- ✅ **All external APIs connected**:
  - AzuraCast (http://24.199.109.18)
  - Spotify API (metadata enrichment)
  - Last.fm API
  - Google Sheets (resident applications)
  - Iframely (rich embeds)
  - Replit Object Storage

### Radio Features
- ✅ Live streaming via AzuraCast
- ✅ Episodes archive
- ✅ Guides system
- ✅ Mix submissions
- ✅ Playlist submissions
- ✅ Album of the Month
- ✅ Resident DJ system
- ✅ Schedule management
- ✅ Hero banners

### Editorial / Magazine Features
- ✅ Block-based editor (Tiptap)
- ✅ Editorial submissions
- ✅ Magazine issues
- ✅ Content management
- ✅ Features (homepage curation)
- ✅ Open calls
- ✅ Pitches (internal planning)
- ✅ Unified submission landing page

### Navigation
- ✅ Home
- ✅ Latest
- ✅ Community
- ✅ Explore (Episodes, Mixes, Albums, **Editorial**, Schedule)
- ✅ **Submit** (unified landing for all content types)
- ✅ About

---

## 📊 Database Schema

### Radio Tables (Existing + New)
- `users` - Admin/editor authentication
- `contributors` - Unified contributor system
- `shows` - Radio shows
- `episodes` - Past episodes
- `guides` - Music discovery guides
- `hero_banners` - Homepage banners
- `mix_submissions` - DJ mix submissions
- `episode_submissions` - Episode submissions
- `playlist_submissions` - Playlist submissions
- `schedule` - Show schedule
- `residents` - DJ residents
- `resident_applications` - Resident applications
- `album_suggestions` - Community album nominations
- `album_votes` - Album voting
- `album_picks` - Monthly picks
- `current_playback` - Now playing
- `settings` - Platform settings
- `tags` - Tagging system

### Editorial Tables (NEW - with editorial_ prefix)
- `editorial_submissions` - Community submissions (art, writing, links, etc.)
- `editorial_content` - Published editorial pieces
- `editorial_issues` - Magazine issues/zines
- `editorial_issue_contents` - Issue table of contents
- `editorial_features` - Homepage feature management
- `editorial_open_calls` - Themed submission drives
- `editorial_pitches` - Internal editorial planning

**Note**: All editorial tables use `editorial_` prefix to avoid conflicts with existing production tables.

---

## 🎯 Content Flow (The Vision)

### 1. Submission → Curation → Publication
```
User submits via /submit
    ↓
Editorial team reviews in admin panel
    ↓
Approved content → Featured on homepage
    ↓
Curated into community zines/issues
```

### 2. Content Types Supported
- **DJ Mixes** - Audio files uploaded to AzuraCast
- **Playlists** - Spotify, Apple Music, YouTube links
- **Artwork** - Photography, illustrations, visuals
- **Writing** - Poems, essays, reviews, creative writing
- **Links/Videos** - Interesting web content
- **Album Suggestions** - Monthly album nominations

### 3. Editorial Output
- **Community Zines** - Collective taste publications (playlists + art + writing)
- **Editorial Issues** - Curated editorial publications
- **Featured Content** - Homepage curation via features system

---

## 🔑 Admin Access

### Admin Panel
- **URL**: http://localhost:5000/admin
- **Username**: jarrad
- **Password**: 5I6[D9!jEehJ

### Admin Capabilities
- Approve/reject submissions
- Create editorial content
- Manage magazine issues
- Curate features
- Manage open calls
- Handle pitches
- Manage residents
- Configure platform settings

---

## 🚀 Next Steps for Development

### Priority 1: Polish Admin Experience
- [ ] Improve submission review workflow
- [ ] Better issue curation tools
- [ ] Community zine builder
- [ ] Bulk content management

### Priority 2: Submission Flow
- [ ] Create editorial submission forms for each type
  - [ ] Art submission form
  - [ ] Writing submission form
  - [ ] Link submission form
- [ ] Submission status tracking for users
- [ ] Email notifications for submission updates

### Priority 3: Frontend Polish
- [ ] Editorial landing page design
- [ ] Issue detail pages
- [ ] Content display templates
- [ ] Community zine display
- [ ] Submission gallery/archive

### Priority 4: Live Streaming
- [ ] Figure out HTML5 audio player UX
- [ ] Track metadata display
- [ ] Now playing UI
- [ ] Live show scheduling UI

### Priority 5: Production Deployment
- [ ] Deploy to Replit or hosting
- [ ] Set up production environment variables
- [ ] Configure production database
- [ ] Set up CI/CD
- [ ] Domain and SSL

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev
# Server runs on http://localhost:5000

# Type check
npm run check

# Build for production
npm run build

# Run production build
npm start

# Push database schema changes
npm run db:push
```

---

## 📁 Key Files

### Core Configuration
- `.env` - Environment variables (API keys, database URL)
- `shared/schema.ts` - Database schema
- `server/routes.ts` - API routes (5300+ lines)
- `server/index.ts` - Server entry point

### Editorial Components
- `client/src/components/block-editor/` - Tiptap block editors
- `client/src/components/block-renderer.tsx` - Block display
- `client/src/components/content-templates/` - Content templates
- `client/src/components/submission-form.tsx` - Submission forms
- `client/src/pages/Editorial.tsx` - Editorial landing
- `client/src/pages/UnifiedSubmit.tsx` - Submission landing

### Admin Pages
- `client/src/pages/AdminEditorial.tsx` - Editorial management
- `client/src/pages/AdminIssues.tsx` - Issue management

---

## 🎨 Design Philosophy

### Visual Identity
- Magazine-style aesthetic (NTS Radio + Polyester inspiration)
- Dark theme professional palette
- Typography-focused layouts
- Minimal, intentional use of color
- 8px border radius standard

### Content Strategy
- **Authentic voices** - Real contributors, not AI slop
- **Editorial discretion** - Curated, not endless scroll
- **Community taste** - Collective submissions in zines
- **Professional standards** - Quality over quantity

### User Roles
- **Visitors** - Browse content, submit work
- **Contributors** - Approved submitters
- **Editors** - Content review and curation
- **Admins** - Full platform management

---

## 🔒 Security Notes

### Credentials in .env (DO NOT COMMIT)
- Database credentials
- API keys (Spotify, Last.fm, Google, Iframely)
- AzuraCast API key and SFTP credentials
- Admin password

### GitHub Repository
If/when pushing to GitHub:
1. ✅ .env is already gitignored
2. ✅ Sensitive files in .gitignore
3. ⚠️ Consider environment variable encryption
4. ⚠️ Use GitHub secrets for CI/CD
5. ⚠️ Rotate API keys if repo becomes public

---

## 📊 Git History

### Recent Commits
1. **Integrate magazine editorial features** - Added all block editors, submission forms, editorial pages
2. **Rename magazine tables with editorial_ prefix** - Avoided database conflicts
3. **Add database schema merge analysis** - Investigation tools for safe migration
4. **Update .env with production credentials** - Connected all external APIs
5. **Initial merge commit** - Combined radio + magazine codebases

---

## 🎵 AzuraCast Integration

### Current Setup
- **URL**: http://24.199.109.18
- **Station**: enamorado_radio (ID: 1)
- **Features**:
  - Live streaming
  - SFTP file uploads (for DJ mixes)
  - Now playing metadata
  - Playlist management

### Future Considerations
- Evaluate if AzuraCast is optimal
- Consider alternatives if needed
- Keep integration simple for now

---

## 📝 Content Strategy Notes

### Track Metadata
- Currently unclear how to best display songs
- HTML5 audio player UX needs design
- Customer/fan display needs thought
- Tracking individual songs TBD

### Physical Media
- May or may not be needed
- Could be useful for magazine issue collections
- Keep optional for now

### Zine Collections
- Goal: Group community submissions (playlists + sketches + writing)
- Requires artist permission
- Can combine with editorial zines
- Feature in magazine issues system

---

## ✅ Platform Readiness

### Ready for Development
- [x] Full codebase merged
- [x] All APIs connected
- [x] Database schema designed
- [x] Server running locally
- [x] Authentication working
- [x] Admin panel accessible

### Ready for Testing
- [ ] Editorial submission workflows
- [ ] Issue curation
- [ ] Community zine creation
- [ ] Live streaming display
- [ ] Playlist embeds
- [ ] Image uploads

### Ready for Production
- [ ] Frontend polish
- [ ] User testing
- [ ] Performance optimization
- [ ] Error handling
- [ ] Production deployment
- [ ] Domain configuration

---

## 🚦 Current State: **DEVELOPMENT READY**

The platform is fully functional for local development. All core systems are integrated and working. The foundation is solid - now it's time to build the user experience and polish the editorial workflows.

**Server is running at: http://localhost:5000** 🎉
