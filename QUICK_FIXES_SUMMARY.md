# Quick Wins - Visual Fixes in Progress

## Issues Identified from Screenshots

### 1. Button Contrast (Image 1 - Homepage)
**Problem:** "Browse Archives" button is white text on cream background - invisible
**Fix:** Update all buttons to use burnt-orange with white text
**Status:** ✅ COMPLETED (button.tsx updated)

### 2. Latest Page Grid Display (Image 2)
**Problem:** Cards use hardcoded navy/purple colors that don't exist in warm palette
**Affected components:**
- EpisodeCard: Uses `bg-navy` (doesn't exist)
- PlaylistCard: Uses `bg-purple-600` (doesn't exist)
- Button styles: Uses `bg-navy`, `bg-purple-600`
**Fix:** Replace with warm colors:
- Episodes: `bg-burnt-orange-500`
- Playlists: `bg-terracotta-500`
- Mixes: `bg-olive-500`
**Status:** ✅ COMPLETED (LatestPage.tsx updated with full warm palette)

### 3. NTS.live Inspiration (Images 3-5)
**Learnings:**
- "LIVE NOW" indicator with red dot
- NTS PICKS: Grid of large colorful cards with images
- COLLECTIONS: Curated playlists with vibrant backgrounds
- NEWS & EVENTS: Bright colored posters/graphics

**Implementation Plan:**
1. Add episode/track database schema (from NTS SQL)
2. Create colorful "Featured Picks" section (like NTS PICKS)
3. Add "LIVE NOW" indicator to replace "AutoDJ" terminology
4. Use vibrant accent colors for different content types

## Color Mapping for Content Types

```
Episodes/Shows → Burnt Orange (#CC4A00)
Mixes → Terracotta (#D47358)
Playlists → Olive Green (#5C6B4A)
Editorial → Charcoal (#3A3530)
Live → Red (#FF3333)
```

## NTS SQL Schema Integration

```sql
CREATE TABLE episodes (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255),
    date DATETIME,
    image_url VARCHAR(255),
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE tracks (
    id INTEGER PRIMARY KEY,
    episode_id INTEGER,
    title VARCHAR(255),
    artist VARCHAR(255),
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (episode_id) REFERENCES episodes(id)
);
```

**Integration:** Merge with our existing `shows` and add `tracks` table for tracklists

---

## Immediate Priorities

1. ✅ Color scheme implemented (warm aesthetic)
2. 🔄 Fix button contrast across all pages
3. ⏳ Update Latest page with warm colors
4. ⏳ Add NTS-style colorful feature cards
5. ⏳ Replace "AutoDJ" with "LIVE NOW" indicator
6. ⏳ Implement episode/track system
7. ⏳ Redesign submit portal (Magazine mockup style)

---

**Last Updated:** December 29, 2025 1:30 AM
