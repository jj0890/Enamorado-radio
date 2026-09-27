# Enamorado Radio - Practical Workflow Guide

## Current State (What Actually Works)

### ✅ Working Features:
1. **Mix Submissions** (`/submit-mix`)
   - Users can submit SoundCloud/Mixcloud mixes
   - Admin approves → Uploads to AzuraCast → Plays on air
   - This is your most reliable workflow

2. **Playlist Submissions** (`/submit-playlist`)
   - Users submit Spotify/Apple Music/YouTube playlists
   - **BUT**: No automatic playback (just shows in community feed)

3. **Individual Song Requests** (no public form yet)
   - AdminQueue shows individual songs
   - Meant for manual DJ sessions (not automated)

## The Spotify Track Problem

**You asked**: What happens if someone submits `https://open.spotify.com/track/3C6s0G3TW6VBEvZMZWhD6f`?

**Current Answer**:
1. It gets saved to database
2. Shows up in `/admin/playlist-submissions`
3. **Nothing else happens** - no audio file, no playback

**Why This Doesn't Work**:
- Spotify doesn't let you download MP3s via API
- You'd need Spotify Premium + recording software
- Legal/licensing issues for public broadcast

## Three Practical Options (Ranked by Easibility)

### Option 1: Mix-Only Station (EASIEST - Works Now)
**What it is**: Focus on pre-recorded mixes, like Boiler Room or Mixmag

**Workflow**:
1. Community submits full mixes (30-90 min) via `/submit-mix`
2. Admin reviews in `/admin/mix-submissions`
3. Click "Upload to AzuraCast" → File goes to server
4. Create playlists in AzuraCast ("Friday House", "Sunday Chill")
5. Schedule them to play at specific times

**Pros**:
- Already 90% built
- Legal (mixes are fair use/promotional)
- Low maintenance

**Cons**:
- Can't play individual Spotify tracks
- Less flexible than live DJ

**What's Missing**:
- Better AzuraCast scheduling UI (currently manual)
- Calendar view showing what plays when

---

### Option 2: Resident DJ Program (MEDIUM - Needs Infrastructure)
**What it is**: Like NTS - people book time slots and live stream

**Workflow**:
1. Users apply to be residents via `/resident-application`
2. Admin approves → Gives them Icecast/AzuraCast credentials
3. Resident uses DJ software (Mixxx, Serato, even Spotify + audio routing)
4. They stream to your server during their time slot
5. AzuraCast automatically switches to their stream when live

**Pros**:
- True radio experience
- Can play anything (Spotify, vinyl, etc.)
- Community engagement

**Cons**:
- Needs live streaming setup (Icecast/Liquidsoap)
- More complex moderation
- Requires consistent scheduling

**What's Missing**:
- Live streaming endpoint configuration
- Booking calendar
- Stream key management

---

### Option 3: Spotify Playlist → Show (COMPLEX - Needs Manual Work)
**What it is**: Accept Spotify playlists, but someone manually recreates them

**Workflow**:
1. User submits Spotify playlist
2. Admin reviews, likes it
3. **Manual step**: Admin or volunteer:
   - Opens playlist in Spotify
   - Uses DJ software + audio capture to record a mix of those tracks
   - OR finds those tracks elsewhere (YouTube, Bandcamp) and downloads legally
4. Upload the resulting mix to AzuraCast
5. Schedule it

**Pros**:
- Can feature Spotify playlists
- Still legal (you're not automating downloads)

**Cons**:
- Labor intensive
- Can't be fully automated

**What Could Be Built**:
- Spotify API integration to show track list
- Task assignment system ("Alex, please record this playlist")
- Progress tracking

---

## What I Recommend Building Next

### Phase 1: Make Mix Workflow Excellent (1-2 days)
1. Improve `/admin/azuracast` page:
   - Test actual upload to your server
   - Add scheduling UI
   - Show what's currently in rotation

2. Create Schedule Calendar:
   - Visual weekly grid showing what plays when
   - Drag-and-drop mixes to time slots
   - Sends schedule to AzuraCast

3. Fix Community Feed:
   - Show "Now Playing" mix with liner notes
   - Link to submit mixes more prominently
   - Show upcoming schedule

### Phase 2: Add Live Streaming (3-5 days)
1. Configure AzuraCast for live input
2. Build resident dashboard:
   - Show stream key
   - Show booked time slots
   - Test connection button

3. Build booking system:
   - Calendar for residents to claim slots
   - Auto-switches to live when resident connects

### Phase 3: Spotify Integration (Optional, 5+ days)
1. Add "Request a Track" form (separate from playlists)
2. Build "Recreation Queue":
   - Shows Spotify playlists that need to be recorded
   - Assign to volunteers
   - Track completion

---

## Immediate Action Items

**To make what you have feel professional**:

1. **Test the upload flow right now**:
   - Submit a test mix
   - Try uploading to AzuraCast
   - Document what breaks

2. **Add clear messaging**:
   - On `/submit-playlist`: "Your playlist will be featured in our community feed. For airplay, submit a pre-recorded mix."
   - On `/community`: Add "Submit a Mix" button prominently

3. **Create a "What We Play" page**:
   - Explain you're a mix-focused station
   - Show submission guidelines
   - Link to schedule

4. **Fix the disconnect**:
   - Remove confusing pages (AdminQueue if not using it)
   - Consolidate AzuraCast controls into one unified page

---

## The Live DJ Dream (Long Term)

To achieve "make it easy for anyone to play an hour of music":

**Hardware** (when ready):
- Mixer (Pioneer DJM or similar): $500-2000
- Mics: $50-200 each
- Audio interface (Focusrite Scarlett): $150-300
- Headphones: $100-200

**Software** (free options exist):
- Mixxx (free, open source DJ software)
- OBS Studio (for streaming to AzuraCast)
- Icecast/Liquidsoap (already part of AzuraCast)

**Website Features Needed**:
- [ ] Resident booking calendar
- [ ] Stream health monitoring
- [ ] Auto-recording of live sets
- [ ] Simple "Go Live" button that handles everything
- [ ] Mobile app for remote broadcasting

This is 100% achievable, but start with the mix workflow first.
