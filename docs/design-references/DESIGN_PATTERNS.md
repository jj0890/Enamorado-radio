# Enamorado Radio - Design Patterns Guide

**Last Updated:** December 28, 2024

This guide documents the core design patterns used in the Enamorado Radio platform, inspired by Nina Protocol, NTS.live, and other modern music platforms.

---

## Table of Contents

1. [Auto-Scroll Carousels](#auto-scroll-carousels)
2. [Card Layouts](#card-layouts)
3. [Fixed Bottom Player](#fixed-bottom-player)
4. [Tag Navigation](#tag-navigation)
5. [Responsive Breakpoints](#responsive-breakpoints)
6. [CSS Variables](#css-variables)

---

## Auto-Scroll Carousels

### Usage

Auto-scrolling carousels showcase content discovery without user interaction. Perfect for:
- Recently uploaded mixes
- Trending playlists
- Editorial features
- Album suggestions
- Community submissions

### Implementation

```tsx
import AutoScrollCarousel, {
  CarouselCard,
  CarouselArtwork,
  CarouselInfo,
} from '@/components/auto-scroll-carousel';

function MixesCarousel({ mixes }: { mixes: Mix[] }) {
  return (
    <section className="py-16 px-6">
      <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-8">
        WHAT PEOPLE ARE LISTENING TO
      </h2>

      <AutoScrollCarousel
        interval={7000}
        cardWidth={220}
        gap={20}
        pauseOnHover={true}
        enabled={true}
      >
        {mixes.map((mix) => (
          <CarouselCard key={mix.id} width={200} onClick={() => playMix(mix)}>
            <CarouselArtwork
              src={mix.artwork}
              alt={mix.title}
              size={200}
              showPlayButton={true}
            />
            <CarouselInfo
              title={mix.title}
              subtitle={mix.artist}
              onSubtitleClick={() => goToArtist(mix.artistId)}
            />
          </CarouselCard>
        ))}
      </AutoScrollCarousel>
    </section>
  );
}
```

### Props Reference

**AutoScrollCarousel:**
- `interval` (number, default: 7000) - Milliseconds between scrolls
- `cardWidth` (number, default: 220) - Width of each card including gap
- `gap` (number, default: 20) - Space between cards in pixels
- `pauseOnHover` (boolean, default: true) - Pause scrolling on hover
- `enabled` (boolean, default: true) - Enable/disable auto-scroll

**CarouselCard:**
- `width` (number, default: 200) - Card width in pixels
- `onClick` (function) - Click handler

**CarouselArtwork:**
- `src` (string) - Image URL
- `alt` (string) - Alt text
- `size` (number, default: 200) - Square size in pixels
- `showPlayButton` (boolean, default: true) - Show play overlay on hover

**CarouselInfo:**
- `title` (string) - Primary text
- `subtitle` (string, optional) - Secondary text
- `onSubtitleClick` (function, optional) - Subtitle click handler

### Behavior

- **Auto-scroll:** Advances every 7 seconds (configurable)
- **Pause on hover:** Stops scrolling when user hovers
- **Manual scroll:** Pauses auto-scroll, resumes after 3 seconds of inactivity
- **Touch support:** Pauses on mobile touch, resumes after 3 seconds
- **Loop:** Returns to start when reaching the end
- **Smooth scroll:** CSS `scroll-behavior: smooth`

---

## Card Layouts

### Flexbox Patterns

All cards follow vertical stacking patterns inspired by Nina Protocol:

```css
/* Card Container */
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0; /* Prevents compression in carousels */
  width: 200px;
  cursor: pointer;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-4px);
}

/* Card Artwork */
.card-artwork {
  width: 200px;
  height: 200px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background: var(--slate);
}

/* Card Info */
.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px;
}
```

### Responsive Card Sizes

| Breakpoint | Card Width | Artwork Size | Gap |
|------------|-----------|--------------|-----|
| Desktop (1400px+) | 200px | 200x200 | 20px |
| Tablet (768-1023px) | 160px | 160x160 | 16px |
| Mobile (375-767px) | 140px | 140x140 | 12px |
| Small Mobile (<375px) | 120px | 120x120 | 10px |

---

## Fixed Bottom Player

### Layout Pattern

```css
.music-player {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;

  padding: 12px 24px;
  background: rgba(15, 15, 15, 0.98);
  backdrop-filter: blur(20px);

  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;

  border-top: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 2000;
}
```

### Component Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [Artwork] [Info: flex:1] [Progress: flex:2] [Controls] [Volume] │
└─────────────────────────────────────────────────────────────────┘
```

- **Artwork:** 48x48px, `flex-shrink: 0`
- **Info:** `flex: 1`, `min-width: 0` (enables text truncation)
- **Progress:** `flex: 2`, `min-width: 200px`
- **Controls:** `flex-shrink: 0`
- **Volume:** `flex-shrink: 0`

### Responsive Behavior

**Mobile (<768px):**
- Hide info section
- Hide volume control
- Smaller controls (28px → 36px for play button)
- Reduce padding (8px 12px)

---

## Tag Navigation

### Pattern

Horizontal scrolling tag chips with distinct colors:

```tsx
function TagCarousel({ tags }: { tags: Tag[] }) {
  return (
    <section className="py-16 px-6">
      <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-8">
        POPULAR TAGS
      </h2>

      <AutoScrollCarousel interval={7000} cardWidth={196} gap={16}>
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-center flex-shrink-0 w-[180px] h-[140px] rounded-lg text-lg font-semibold lowercase cursor-pointer transition-all hover:scale-105"
            style={{
              background: tag.color,
              color: tag.textColor,
            }}
          >
            {tag.name}
          </div>
        ))}
      </AutoScrollCarousel>
    </section>
  );
}
```

### Tag Color Palette

```typescript
const TAG_COLORS = {
  electronic: { bg: '#b89fc9', text: '#2d1f3a' },
  ambient: { bg: '#7a7a7a', text: '#1a1a1a' },
  experimental: { bg: '#c7577f', text: '#3d1a28' },
  alternative: { bg: '#87ceeb', text: '#1a3a4d' },
  indie: { bg: '#f4a460', text: '#3d2a1a' },
  techno: { bg: '#ff6b6b', text: '#2d1010' },
  house: { bg: '#4ecdc4', text: '#1a3d3a' },
  jazz: { bg: '#ffe66d', text: '#3d3310' },
};
```

---

## Responsive Breakpoints

### Standard Breakpoints

```css
/* Desktop (default) - 1400px+ */
.container {
  max-width: 1400px;
  padding: 64px 24px;
}

/* Large Tablet - 1024px to 1399px */
@media (max-width: 1399px) {
  .container {
    max-width: 1200px;
    padding: 48px 24px;
  }
}

/* Tablet - 768px to 1023px */
@media (max-width: 1023px) {
  .container {
    max-width: 100%;
    padding: 40px 16px;
  }
}

/* Mobile - 375px to 767px */
@media (max-width: 767px) {
  .container {
    padding: 32px 12px;
  }
}

/* Small Mobile - 320px to 374px */
@media (max-width: 374px) {
  .container {
    padding: 24px 8px;
  }
}
```

### Touch Targets

iOS recommends **44px minimum** touch targets:

```css
@media (max-width: 767px) {
  button,
  .card {
    min-height: 44px;
  }

  /* Expand touch area without changing visual size */
  button::after {
    content: '';
    position: absolute;
    top: -8px;
    right: -8px;
    bottom: -8px;
    left: -8px;
  }
}
```

---

## CSS Variables

### Design Tokens

```css
:root {
  /* Colors */
  --color-bg-primary: #0a0a0a;
  --color-bg-secondary: #1a1a1a;
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.6);
  --color-text-tertiary: rgba(255, 255, 255, 0.4);
  --color-accent: #3291ff;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 48px;
  --spacing-4xl: 64px;

  /* Component Sizes */
  --card-width-desktop: 200px;
  --card-width-tablet: 160px;
  --card-width-mobile: 140px;
  --card-gap-desktop: 20px;
  --card-gap-tablet: 16px;
  --card-gap-mobile: 12px;
  --player-height: 72px;
  --header-height: 64px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 24px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;

  /* Z-index Layers */
  --z-header: 1000;
  --z-player: 2000;
  --z-modal: 3000;
  --z-toast: 4000;
}
```

### Usage

```css
.component {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}
```

---

## Best Practices

### Do's ✅

- **Use carousels** for discovery (mixes, playlists, editorial)
- **Hide scrollbars** on carousels (maintain functionality)
- **Implement auto-scroll** with pause on hover/touch
- **Fixed bottom player** for persistent playback
- **Text truncation** on card titles/artists
- **Hover effects** for interactivity (scale, translate)
- **Responsive images** with `object-fit: cover`
- **Touch optimization** on mobile (44px targets)

### Don'ts ❌

- **Don't auto-scroll too fast** (7 seconds minimum)
- **Don't hide controls** without user interaction
- **Don't use `flex-shrink` on carousels** (causes compression)
- **Don't forget mobile touch events** (touchstart, touchend)
- **Don't use fixed widths** without responsive breakpoints
- **Don't block scrolling** with auto-scroll (pause on interaction)

---

## Examples in Codebase

### Reference Implementations

1. **Homepage Mix Carousel** - `/client/src/pages/Home.tsx`
2. **Editorial Content Grid** - `/client/src/pages/Editorial.tsx`
3. **Music Player** - `/client/src/components/MusicPlayer.tsx`
4. **Tag Navigation** - `/client/src/components/TagCarousel.tsx` (to be created)

### External Inspiration

- **Nina Protocol:** https://ninaprotocol.com
- **NTS.live:** https://www.nts.live
- **Bandcamp:** https://bandcamp.com
- **SoundCloud:** https://soundcloud.com/discover

---

**Last Updated:** December 28, 2024
**Maintained By:** Enamorado Radio Development Team
