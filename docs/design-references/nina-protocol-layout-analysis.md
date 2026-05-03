# Nina Protocol - Complete Flexbox Layout Analysis

**Site:** https://ninaprotocol.com
**Analysis Date:** December 28, 2024
**Layout Type:** Music Streaming Platform with Auto-Scrolling Carousels
**Application:** Enamorado Radio Platform Development

---

## Implementation Priority for Enamorado Radio

Based on this analysis, we should implement:

1. ✅ **Auto-scrolling carousels** for mixes, playlists, and editorial content
2. ✅ **Fixed bottom player** (already have basic version)
3. ✅ **Horizontal scroll carousels** with hidden scrollbars
4. ✅ **Tag-based navigation** for content discovery
5. ✅ **Responsive card layouts** for albums/mixes

---

## Table of Contents

1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Header/Navigation](#headernavigation)
4. [Album Carousel Section](#album-carousel-section)
5. [Popular Tags Section](#popular-tags-section)
6. [Music Player](#music-player)
7. [Auto-Scroll Implementation](#auto-scroll-implementation)
8. [Responsive Design](#responsive-design)
9. [Complete CSS Reference](#complete-css-reference)
10. [Flexbox Pattern Summary](#flexbox-pattern-summary)

---

## Overview

Nina Protocol uses a **modern flexbox-based layout** with the following key features:

- ✅ Auto-scrolling horizontal carousels (7-second intervals)
- ✅ Fixed bottom music player
- ✅ Vertical card layouts for album information
- ✅ Centered tag navigation
- ✅ Responsive design for mobile/tablet/desktop
- ✅ Smooth scroll behavior
- ✅ Hidden scrollbars with maintained functionality

**Primary Layout Pattern:** Horizontal carousels with vertical card content

---

## Page Structure

### Overall Layout

```css
/* Root container */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0a0a0a;
  color: white;
  min-height: 100vh;
}

.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 72px; /* Space for fixed player */
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}
```

**Flexbox Pattern:**
- `display: flex`
- `flex-direction: column`
- `min-height: 100vh`

**Why this pattern?**
- Ensures footer (music player) stays at bottom
- Allows content to grow dynamically
- Centers content with `max-width` constraint

---

## Header/Navigation

### Layout Structure

```css
.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);

  position: sticky;
  top: 0;
  z-index: 1000;

  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Left Side (Logo)

```css
.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -1px;
  color: white;
  text-decoration: none;
}

.logo:hover {
  opacity: 0.8;
}
```

### Right Side (Actions)

```css
.header-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.btn-open-app {
  padding: 10px 24px;
  border: 1px solid white;
  border-radius: 24px;
  background: transparent;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-open-app:hover {
  background: white;
  color: black;
}

.btn-search,
.btn-menu {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}

.btn-search:hover,
.btn-menu:hover {
  opacity: 0.7;
}
```

**Flexbox Pattern:**
- Parent: `flex-direction: row | justify-content: space-between | align-items: center`
- Children: `flex-direction: row | gap: 16px | align-items: center`

**HTML Structure:**
```html
<header class="header">
  <div class="header-left">
    <a href="/" class="logo">nina</a>
  </div>
  <div class="header-right">
    <button class="btn-open-app">Open app</button>
    <button class="btn-search">🔍</button>
    <button class="btn-menu">☰</button>
  </div>
</header>
```

---

## Album Carousel Section

### Section Container

```css
.listening-section {
  padding: 64px 24px;
  width: 100%;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 32px;
}
```

### Carousel Container

```css
.album-carousel {
  display: flex;
  flex-direction: row;
  gap: 20px;

  overflow-x: scroll;
  overflow-y: hidden;
  scroll-behavior: smooth;

  /* Hide scrollbar but keep scroll functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;

  /* Add momentum scrolling on iOS */
  -webkit-overflow-scrolling: touch;
}

.album-carousel::-webkit-scrollbar {
  display: none;
}

/* Fade effect on edges */
.album-carousel::before,
.album-carousel::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  pointer-events: none;
  z-index: 1;
}

.album-carousel::before {
  left: 0;
  background: linear-gradient(to right, #0a0a0a, transparent);
}

.album-carousel::after {
  right: 0;
  background: linear-gradient(to left, #0a0a0a, transparent);
}
```

**Flexbox Pattern:**
- `display: flex`
- `flex-direction: row`
- `gap: 20px`
- `overflow-x: scroll`

**Why this pattern?**
- Creates horizontal scrolling carousel
- `gap` provides consistent spacing
- `scroll-behavior: smooth` enables smooth auto-scroll
- Hidden scrollbar maintains clean aesthetic

### Album Card

```css
.album-card {
  display: flex;
  flex-direction: column;
  gap: 12px;

  flex-shrink: 0; /* Prevents cards from shrinking in carousel */
  width: 200px;

  cursor: pointer;
  transition: transform 0.2s;
}

.album-card:hover {
  transform: translateY(-4px);
}

.album-card:active {
  transform: translateY(-2px);
}
```

### Album Artwork

```css
.album-artwork {
  width: 200px;
  height: 200px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background: #1a1a1a;
}

.album-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.album-card:hover .album-artwork img {
  transform: scale(1.05);
}

/* Play button overlay (appears on hover) */
.album-artwork::after {
  content: '▶';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: black;

  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;

  opacity: 0;
  transition: opacity 0.2s;
}

.album-card:hover .album-artwork::after {
  opacity: 1;
}
```

### Album Info

```css
.album-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px;
}

.album-title {
  font-size: 14px;
  font-weight: 600;
  color: white;
  line-height: 1.4;

  /* Truncate long titles */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-artist {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;

  /* Truncate long artist names */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-artist:hover {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: underline;
}
```

**Flexbox Pattern:**
- `display: flex`
- `flex-direction: column`
- `gap: 12px` (card) / `gap: 4px` (info)
- `flex-shrink: 0`

**Why this pattern?**
- Vertical stacking of artwork + info
- `flex-shrink: 0` prevents carousel compression
- Fixed width maintains grid alignment
- Gap creates visual hierarchy

**HTML Structure:**
```html
<section class="listening-section">
  <h2 class="section-title">WHAT PEOPLE ARE LISTENING TO</h2>

  <div class="album-carousel">
    <div class="album-card">
      <div class="album-artwork">
        <img src="album-cover.jpg" alt="Album cover">
      </div>
      <div class="album-info">
        <div class="album-title">Vanities</div>
        <div class="album-artist">Malibu</div>
      </div>
    </div>

    <!-- Repeat for more albums -->
  </div>
</section>
```

---

## Auto-Scroll Implementation

### JavaScript for 7-Second Auto-Scroll

```javascript
class AutoScrollCarousel {
  constructor(element, options = {}) {
    this.carousel = element;
    this.scrollInterval = options.interval || 7000; // 7 seconds
    this.cardWidth = options.cardWidth || 220; // 200px + 20px gap
    this.isPaused = false;
    this.scrollTimer = null;

    this.init();
  }

  init() {
    this.startAutoScroll();
    this.addEventListeners();
  }

  startAutoScroll() {
    this.scrollTimer = setInterval(() => {
      if (!this.isPaused) {
        this.scrollNext();
      }
    }, this.scrollInterval);
  }

  scrollNext() {
    const currentScroll = this.carousel.scrollLeft;
    const maxScroll = this.carousel.scrollWidth - this.carousel.clientWidth;

    // Calculate next scroll position
    let nextScroll = currentScroll + this.cardWidth;

    // If we've reached the end, loop back to start
    if (nextScroll >= maxScroll) {
      nextScroll = 0;
    }

    // Smooth scroll to next position
    this.carousel.scrollTo({
      left: nextScroll,
      behavior: 'smooth'
    });
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  stop() {
    clearInterval(this.scrollTimer);
  }

  addEventListeners() {
    // Pause on hover
    this.carousel.addEventListener('mouseenter', () => {
      this.pause();
    });

    // Resume on mouse leave
    this.carousel.addEventListener('mouseleave', () => {
      this.resume();
    });

    // Pause on manual scroll
    this.carousel.addEventListener('scroll', () => {
      this.pause();

      // Resume after 3 seconds of no scrolling
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = setTimeout(() => {
        this.resume();
      }, 3000);
    });

    // Pause on touch (mobile)
    this.carousel.addEventListener('touchstart', () => {
      this.pause();
    });

    this.carousel.addEventListener('touchend', () => {
      setTimeout(() => {
        this.resume();
      }, 3000);
    });
  }
}

// Initialize carousels
document.addEventListener('DOMContentLoaded', () => {
  const albumCarousel = document.querySelector('.album-carousel');
  const tagsCarousel = document.querySelector('.tags-carousel');

  if (albumCarousel) {
    new AutoScrollCarousel(albumCarousel, {
      interval: 7000,
      cardWidth: 220 // 200px card + 20px gap
    });
  }

  if (tagsCarousel) {
    new AutoScrollCarousel(tagsCarousel, {
      interval: 7000,
      cardWidth: 196 // 180px card + 16px gap
    });
  }
});
```

### Alternative: CSS Scroll Snap (Smoother)

```css
.album-carousel {
  scroll-snap-type: x mandatory;
  scroll-padding: 24px;
}

.album-card {
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
```

**Why Auto-Scroll?**
- ✅ Showcases more content without user interaction
- ✅ Creates dynamic, engaging experience
- ✅ Encourages discovery of new music
- ✅ Pauses on hover to allow interaction
- ✅ Loops back to start for continuous browsing

---

## Flexbox Pattern Summary

### Quick Reference Table

| Component | Container Pattern | Children Pattern | Key Properties |
|-----------|------------------|------------------|----------------|
| **Page Layout** | `flex` `column` | - | `min-height: 100vh` |
| **Header** | `flex` `row` `space-between` `center` | `flex` `row` `center` | Sticky, backdrop blur |
| **Album Carousel** | `flex` `row` | `column` `0` | `overflow-x: scroll`, `gap: 20px` |
| **Album Card** | `flex` `column` | - | `flex-shrink: 0`, `width: 200px` |
| **Album Info** | `flex` `column` | - | `gap: 4px`, text truncation |
| **Tags Carousel** | `flex` `row` | `center` `center` | `overflow-x: scroll`, `gap: 16px` |
| **Tag Card** | `flex` `center` `center` | - | Fixed size, colored backgrounds |
| **Music Player** | `flex` `row` `center` | `flex` `row/column` | Fixed bottom, full width |
| **Player Info** | `flex` `column` | - | `flex: 1`, `min-width: 0` |
| **Player Controls** | `flex` `row` `center` | `flex` `center` `center` | Icon buttons |

### Pattern Categories

#### **1. Horizontal Carousels**
```css
display: flex;
flex-direction: row;
gap: 16px-20px;
overflow-x: scroll;
scroll-behavior: smooth;
```
**Used in:** Album carousel, tags carousel

#### **2. Vertical Stacking**
```css
display: flex;
flex-direction: column;
gap: 4px-12px;
```
**Used in:** Album cards, player info, page layout

#### **3. Centered Content**
```css
display: flex;
justify-content: center;
align-items: center;
```
**Used in:** Tag cards, buttons, player controls

#### **4. Space Between**
```css
display: flex;
flex-direction: row;
justify-content: space-between;
align-items: center;
```
**Used in:** Header navigation

#### **5. Flexible Growing**
```css
display: flex;
flex: 1;
min-width: 0;
```
**Used in:** Player info section (allows text truncation)

---

## Key Takeaways for Enamorado Radio

### Implementation Priorities

1. **Horizontal Carousels**
   - Use for: Mix submissions, playlists, editorial content, album suggestions
   - Pattern: `flex-direction: row` + `overflow-x: scroll`
   - Key: `flex-shrink: 0` on children, hidden scrollbars

2. **Auto-Scrolling**
   - Implement 7-second intervals for discovery
   - Pause on hover/touch for user interaction
   - Loop back to start for continuous experience

3. **Vertical Cards**
   - Use for: Individual mixes, submissions, content cards
   - Pattern: `flex-direction: column` + `gap`
   - Key: Fixed widths, text truncation

4. **Fixed Player**
   - Already implemented, refine with Nina patterns
   - Ensure `flex: 1` on info for dynamic sizing
   - `flex-shrink: 0` on controls

5. **Responsive Design**
   - Mobile: Smaller cards, hide volume/info
   - Tablet: Medium cards, adjusted gaps
   - Desktop: Full layout

---

## Additional Resources

### Similar Music Platform Layouts

- **Spotify Web Player** - Complex grid + flexbox hybrid
- **Bandcamp** - Simpler flexbox carousels
- **NTS.live** - Similar auto-scrolling carousels
- **Rinse.FM** - Tag-based navigation
- **SoundCloud** - Waveform player + carousels

---

**End of Analysis** | Created: December 28, 2024 | For: Enamorado Radio Platform Development
