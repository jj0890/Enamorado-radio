# AzuraCast Integration - Enamorado Radio

**Last Tested:** December 28, 2024
**Status:** ✅ API Access Confirmed

---

## API Access

**Base URL:** `http://24.199.109.18`
**Station ID:** `1`
**Station Name:** Enamorado Radio
**API Key:** Connected and working

---

## Working Endpoints

### 1. Now Playing (`/api/station/1/nowplaying`)
**Status:** ✅ Working

Returns:
- Currently playing song (title, artist, album, artwork)
- Song history (last 5 tracks)
- Live status (is someone streaming live?)
- Listener count
- Elapsed/remaining time
- Playlist information

**Use Cases:**
- Homepage "Now Playing" display
- Recently played history
- Live indicator
- AutoDJ vs Live DJ distinction

### 2. Schedule (`/api/station/1/schedule`)
**Status:** ✅ Working (currently empty)

Returns scheduled shows and playlists.

**Use Cases:**
- Show schedule display
- Upcoming shows
- Resident DJ time slots

### 3. Station Info (`/api/station/1`)
**Available in nowplaying response**

Returns:
- Listen URL: `http://24.199.109.18/listen/enamorado_radio/radio.mp3`
- Public player URL
- Mount points
- Bitrate: 192kbps MP3

---

## Current Issues & Solutions

### Issue 1: Recently Played Not Showing

**Problem:** Web player is playing but recently played section is empty

**Root Cause:** Frontend isn't polling the AzuraCast API

**Solution:** Create polling hook that fetches `/api/station/1/nowplaying` every 15 seconds

```tsx
// Needed: useNowPlaying hook
const { nowPlaying, songHistory, isLive } = useNowPlaying({
  pollInterval: 15000 // 15 seconds
});
```

### Issue 2: AutoDJ vs Live Status

**Problem:** Users see "AutoDJ" technical term

**Solution:** Check `live.is_live` field:
- If `true`: Show "LIVE NOW: {streamer_name}"
- If `false`: Just show "NOW PLAYING" without mentioning AutoDJ

```tsx
{isLive ? (
  <div>🔴 LIVE NOW: {streamerName}</div>
) : (
  <div>NOW PLAYING</div>
)}
```

---

## NTS.live Comparison

### What NTS Does Well:
1. **Live Indicators:** Clear visual distinction between live and automated
2. **Resident Pages:** Each DJ has their own page with past shows
3. **Show Archives:** Complete history of all broadcasts
4. **Schedule Grid:** Weekly schedule with resident photos
5. **Tracklists:** Every show has a full tracklist
6. **Guest Upload:** DJs can upload their own shows

### What We Can Implement:

#### Phase 1 (Immediate):
- ✅ Live status indicator
- ✅ Now playing with history
- ✅ Hide "AutoDJ" terminology
- ✅ Schedule display (when populated)

#### Phase 2 (Short-term):
- Resident DJ profiles
- Show archive system
- Tracklist management
- Guest DJ show upload portal

#### Phase 3 (Long-term):
- Weekly schedule grid
- Show recording system
- Auto-tracklist from AzuraCast
- DJ dashboard for uploads

---

## Shared Frequencies Radio Comparison

### What Shared Frequencies Does:
1. **Show Focus:** Homepage shows current/upcoming shows
2. **Community Calendar:** Public events and DJ nights
3. **Submission Portal:** Easy guest mix submission
4. **Archive Player:** Browse past shows by date
5. **Resident Bios:** Rich DJ profiles with links

### Implementation Plan:
- Use AzuraCast schedule for show calendar
- Keep submission portal simple (current design good)
- Build archive from AzuraCast history
- Resident profiles in our database

---

## DJ/Guest Workflow

### For Enamorado Friends (Guest DJs):

**Option 1: Direct Upload (Recommended for non-technical users)**
1. Record mix locally
2. Submit via our portal (like Magazine mockup design)
3. Admin uploads to AzuraCast SFTP
4. Admin schedules in AzuraCast

**Option 2: SFTP Upload (For technical residents)**
1. Give trusted residents SFTP credentials
2. They upload directly to AzuraCast
3. Files auto-import to station
4. Admin schedules them

**Option 3: Live Streaming (For live shows)**
1. Provide resident with Icecast credentials
2. They stream live via OBS/Mixxx/etc.
3. AzuraCast automatically marks as `live.is_live = true`
4. Our site shows "LIVE NOW" indicator

---

## API Integration TODO

### High Priority:
- [ ] Create `useNowPlaying` hook with 15s polling
- [ ] Update homepage to show real now playing
- [ ] Add recently played section using `song_history`
- [ ] Hide "AutoDJ" terminology
- [ ] Show live indicator when `live.is_live = true`

### Medium Priority:
- [ ] Schedule display page
- [ ] Show archive system
- [ ] Resident DJ management
- [ ] Tracklist display

### Low Priority:
- [ ] Listener stats dashboard
- [ ] Request system integration
- [ ] Auto-tweet now playing

---

## Admin Portal Features

### Currently Connected:
- ✅ API credentials stored in `.env`
- ✅ SFTP credentials for file uploads
- ✅ Now playing data accessible

### Need to Build:
- [ ] Upload show to AzuraCast button
- [ ] Schedule manager (create shows in AzuraCast)
- [ ] Resident DJ Icecast credentials generator
- [ ] Show archive manager

---

## Example API Responses

### Now Playing (AutoDJ):
```json
{
  "live": {
    "is_live": false,
    "streamer_name": "",
    "broadcast_start": null
  },
  "now_playing": {
    "song": {
      "text": "Playboi Carti ft Leven Kali - Flex (Dirty)",
      "artist": "Playboi Carti ft Leven Kali",
      "title": "Flex (Dirty)",
      "art": "http://24.199.109.18/api/station/..."
    },
    "elapsed": 181,
    "remaining": 59,
    "playlist": "Background Music to fill time"
  }
}
```

### Now Playing (Live DJ):
```json
{
  "live": {
    "is_live": true,
    "streamer_name": "DJ Jarrad",
    "broadcast_start": 1735435200
  },
  "now_playing": {
    "song": {
      "text": "Unknown - Unknown",
      "artist": "Unknown",
      "title": "Unknown"
    },
    "streamer": "DJ Jarrad"
  }
}
```

---

## Next Steps

1. **Fix recently played** - Poll API every 15s
2. **Redesign live indicator** - Hide AutoDJ, show LIVE status
3. **Build schedule page** - Display AzuraCast schedule
4. **Create resident system** - Profiles + show history
5. **Guest upload portal** - Simple file upload + metadata

---

**Maintained By:** Enamorado Radio Development Team
