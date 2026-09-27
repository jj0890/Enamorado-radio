# Enamorado Radio Design System - Comparison & Improvement Plan

**Analysis Date:** January 7, 2026
**Reference Sites:** SSENSE, Boiler Room, pi.fyi, Are.na

---

## Executive Summary

Your current design system is **80% there** - you have a solid foundation with design tokens, dark mode, and Tailwind integration. However, comparing against top editorial sites reveals specific opportunities to elevate the cohesiveness and sophistication of the radio + editorial experience.

### What You're Doing Right ✅
- ✅ CSS custom properties for theming (matching Are.na/pi.fyi pattern)
- ✅ Light/dark mode system
- ✅ Semantic color tokens
- ✅ Tailwind utility-first approach (matching Boiler Room)
- ✅ Custom animations (fadeInUp, marquee, blink)
- ✅ Mobile-first responsive design

### What Needs Improvement 🔧
- 🔧 No explicit grid system (SSENSE/Are.na use 12-column)
- 🔧 Spacing scale is inconsistent (no space tokens)
- 🔧 Typography scale isn't tokenized
- 🔧 Missing interaction state patterns
- 🔧 No loading/skeleton states
- 🔧 Limited component states documentation

---

## Detailed Comparison

### 1. Grid System

**Current State:**
```typescript
// tailwind.config.ts - NO grid system defined
// Relying on Tailwind defaults
```

**Best Practice (Are.na):**
```css
grid-template-columns: repeat(12, 1fr);
gap: var(--space-3);

@media (max-width: 900px) {
  grid-template-columns: 1fr; /* Single column mobile */
}
```

**Best Practice (Boiler Room):**
```css
/* Responsive column strategy */
xs: 12-column (w-grid-12)
sm: 6-column (w-grid-6)
lg: 4-column (w-grid-4)
xl: 3-column (w-grid-3)
```

**Recommendation:**
Add 12-column grid system with responsive breakpoints to Tailwind config.

---

### 2. Spacing Scale

**Current State:**
```css
/* tokens.css - NO spacing tokens */
/* Using Tailwind defaults (4px base) */
```

**Best Practice (Are.na):**
```css
--space-1: 5px
--space-3: 15px
--space-6: 35px
--space-11: 130px
```

**Best Practice (SSENSE):**
```css
.vspace1: 10px
.vspace2: 20px
.vspace3: 30px
.vspace4: 40px
.vspace5: 50px
```

**Recommendation:**
Add 5px incremental spacing tokens (Are.na's finer control is better than SSENSE's 10px jumps).

---

### 3. Typography Scale

**Current State:**
```css
/* tokens.css - Partial tokenization */
--heading-h1-size: 40px;
--heading-h2-size: 28px;
--heading-h3-size: 20px;

/* But no body text scale or line-height tokens */
```

**Best Practice (Are.na):**
```css
--fontSizes-1: 0.78125rem  /* 12.5px - Captions */
--fontSizes-3: 1rem         /* 16px - Body */
--fontSizes-5: 1.5rem       /* 24px - Headings */
--fontSizes-8: 2.5rem       /* 40px - Hero */

/* Line height tokens */
Standard: 1.45
Captions: 1.35
```

**Recommendation:**
Expand typography scale to include full range (8 levels) with line-height tokens.

---

### 4. Color Architecture

**Current State:**
```css
/* ✅ STRONG - You have comprehensive color tokens */
--accent-navy: hsl(213, 100%, 26%);
--slate-50 through --slate-950 (complete neutral palette)
--button-primary-bg, --button-secondary-bg
--hover-border, --hover-bg-subtle, --hover-text
```

**Best Practice (pi.fyi):**
```css
/* 25+ theme variants */
--brand-background
--brand-highlight
--brand-menu-background
```

**Best Practice (Are.na):**
```css
/* Multi-mode with semantic states */
Private: #B93D3D (red)
Public: #238020 (green)
Closed: gray
```

**Recommendation:**
You're ahead of the curve here! Consider adding:
- Semantic state colors (like Are.na's private/public indicators)
- Theme variants for special events/shows (like pi.fyi's 25+ themes)

---

### 5. Component Patterns

**Current State:**
```css
/* ✅ Custom utilities */
.glassmorphism
.album-glow
.live-indicator (blink animation)

/* ✅ Button tokens */
--button-primary-bg
--button-primary-hover
```

**Best Practice (Boiler Room):**
```css
/* Card with overlay metadata */
<div class="aspect-2-1">
  <img />
  <div class="absolute bottom-4 left-4">
    <!-- Metadata -->
  </div>
</div>
```

**Best Practice (Are.na):**
```css
/* Input states */
height: 40px
background: transparent (option)
focus: colors-focus indicator
disabled: reduced opacity
```

**Recommendation:**
Document component patterns:
- Card with aspect ratios
- Input field states
- Navigation patterns
- Footer patterns

---

### 6. Interaction States

**Current State:**
```css
/* ✅ Hover tokens defined */
--hover-border: var(--accent-navy);
--hover-bg-subtle: hsl(210, 40%, 98%);
--hover-text: var(--accent-navy);

/* ✅ Disabled states */
--disabled-bg, --disabled-text, --disabled-border

/* ❌ Missing focus states */
/* ❌ Missing loading states */
```

**Best Practice (Boiler Room):**
```css
/* Hover */
hover:brightness-90

/* Loading */
animate-lightPulse
animate-fadeInForwards
```

**Best Practice (Are.na):**
```css
/* Focus */
token: colors-focus

/* Disabled */
reduced opacity
```

**Recommendation:**
Add:
- Focus state tokens (beyond just ring)
- Loading/skeleton states
- Brightness filter patterns for hover

---

### 7. Animation Library

**Current State:**
```css
/* ✅ Custom animations */
@keyframes marquee
@keyframes fadeInUp
@keyframes blink (live indicator)

/* ❌ Missing */
/* No float animation (pi.fyi has) */
/* No pulse animation (Boiler Room has) */
/* No entrance/exit animations library */
```

**Best Practice (pi.fyi):**
```css
@keyframes float {
  duration: 6s;
  easing: ease-in-out;
  loop: infinite;
}

@keyframes fadeIn {
  properties: opacity, scale
}

@keyframes snowfall {
  direction: vertical descent
}
```

**Best Practice (Boiler Room):**
```css
animate-lightPulse
animate-fadeInForwards
```

**Recommendation:**
Build animation library:
- Pulse (for skeleton loading)
- Float (for ambient motion)
- Scale entrance (for modal/overlay)
- Slide transitions

---

### 8. Breakpoint Strategy

**Current State:**
```css
/* Using Tailwind defaults */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

**Best Practice (Are.na):**
```css
Desktop: > 900px (12-column grid)
Tablet: 520px - 900px
Mobile: < 520px (single column)
```

**Best Practice (SSENSE):**
```css
Mobile: < 480px
Tablet Portrait: 480-768px
Tablet Landscape: 768-1024px
Desktop: 1024px+
Large Desktop: 1440px+
```

**Recommendation:**
Your breakpoints are fine, but document how grid columns change:
- Mobile (< 640px): 1-column
- Tablet (640-1024px): 6-column
- Desktop (> 1024px): 12-column

---

## Missing Patterns from Reference Sites

### 1. Block-Based Content Architecture (Are.na)

**What it is:** Content as modular blocks that can link to each other

**Why it matters for radio:**
- Mixes can link to playlists
- Artists can link to shows
- Albums can link to episodes

**Current state:** You have entity relationships in the database, but no visual "block" pattern

**Implementation:**
```tsx
// Block component
interface Block {
  id: string;
  type: 'mix' | 'playlist' | 'album' | 'artist' | 'episode';
  relationships: {
    connectedTo: string[];
    visibilityState: 'public' | 'private' | 'featured';
  };
}

// Visual indicator
<div className="block" data-type={block.type} data-state={block.visibilityState}>
  {block.type === 'mix' && <MixCard />}
  {block.type === 'playlist' && <PlaylistCard />}

  {/* Connection indicators */}
  <div className="block-connections">
    {block.relationships.connectedTo.map(id => (
      <Link to={`/block/${id}`} className="connection-link" />
    ))}
  </div>
</div>
```

---

### 2. Persistent Player State (Boiler Room)

**What it is:** Player stays anchored while content behind it swaps

**Why it matters for radio:** Users shouldn't lose playback when navigating

**Current state:** You have StickyRadioPlayer, but is it truly persistent across all routes?

**Best Practice (Boiler Room):**
```tsx
// RSC streaming architecture
<Suspense fallback={<SkeletonUI />}>
  <PersistentPlayer />
  <StreamingContent />
</Suspense>
```

**Recommendation:**
Verify StickyRadioPlayer persists across:
- Route changes
- Modal overlays
- Admin panel navigation

---

### 3. Skeleton Loading States (Boiler Room)

**What it is:** Show content structure while data loads

**Why it matters:** Better UX than spinners

**Current state:** Missing

**Implementation:**
```css
.skeleton {
  background: var(--muted);
  color: transparent;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

```tsx
{isLoading ? (
  <div className="skeleton h-24 w-full rounded-lg" />
) : (
  <MixCard data={mix} />
)}
```

---

### 4. Theme Switching System (pi.fyi)

**What it is:** Multiple brand identities swappable via CSS custom properties

**Why it matters for radio:** Different shows could have different themes

**Current state:** You have light/dark, but no show-specific themes

**Implementation:**
```css
/* Default Enamorado theme */
[data-theme="default"] {
  --brand-background: hsl(42, 100%, 95%);
  --accent-navy: hsl(213, 100%, 26%);
}

/* Friday Night House theme */
[data-theme="friday-house"] {
  --brand-background: #000;
  --accent-navy: #FFBB00;
}

/* Sunday Morning Jazz theme */
[data-theme="sunday-jazz"] {
  --brand-background: #F5E6D3;
  --accent-navy: #8B4513;
}
```

---

## Actionable Improvement Plan

### Phase 1: Foundation (2-3 days)

**Goal:** Match industry standards for grid, spacing, typography

#### Task 1.1: Add Grid System to Tailwind Config
```typescript
// tailwind.config.ts
theme: {
  extend: {
    gridTemplateColumns: {
      '12': 'repeat(12, 1fr)',
      '6': 'repeat(6, 1fr)',
      '4': 'repeat(4, 1fr)',
      '3': 'repeat(3, 1fr)',
    },
    gap: {
      'grid': 'var(--space-3)',
    }
  }
}
```

#### Task 1.2: Add Spacing Tokens
```css
/* tokens.css */
:root {
  /* Spacing scale (5px increments) */
  --space-1: 5px;
  --space-2: 10px;
  --space-3: 15px;
  --space-4: 20px;
  --space-5: 25px;
  --space-6: 35px;
  --space-8: 50px;
  --space-10: 80px;
  --space-11: 130px;
}
```

#### Task 1.3: Expand Typography Scale
```css
/* tokens.css */
:root {
  /* Font sizes (8-level scale) */
  --font-size-1: 0.78125rem;  /* 12.5px - Captions */
  --font-size-2: 0.875rem;     /* 14px - Small */
  --font-size-3: 1rem;         /* 16px - Body */
  --font-size-4: 1.125rem;     /* 18px - Large body */
  --font-size-5: 1.5rem;       /* 24px - H3 */
  --font-size-6: 1.875rem;     /* 30px - H2 */
  --font-size-7: 2.25rem;      /* 36px - H1 */
  --font-size-8: 2.5rem;       /* 40px - Hero */

  /* Line heights */
  --leading-tight: 1.1;
  --leading-snug: 1.25;
  --leading-normal: 1.45;
  --leading-relaxed: 1.6;
}
```

---

### Phase 2: Component Patterns (3-4 days)

**Goal:** Create reusable, documented component patterns

#### Task 2.1: Card Pattern Library
```tsx
// MixCard.tsx (standardized pattern)
export function MixCard({ mix }: { mix: Mix }) {
  return (
    <div className="group relative aspect-[2/1] overflow-hidden rounded-lg">
      {/* Background image */}
      <img
        src={mix.artwork}
        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Metadata overlay (Boiler Room pattern) */}
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-white font-bold text-lg">{mix.title}</h3>
        <p className="text-white/80 text-sm">{mix.artist}</p>
        <div className="flex gap-2 mt-2">
          <Badge>{mix.genre}</Badge>
          <Badge variant="outline">{mix.duration}min</Badge>
        </div>
      </div>

      {/* Hover state indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="w-16 h-16 text-white" />
      </div>
    </div>
  );
}
```

#### Task 2.2: Skeleton Loading States
```tsx
// SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div className="skeleton aspect-[2/1] rounded-lg">
      <div className="skeleton-text h-6 w-3/4 mb-2" />
      <div className="skeleton-text h-4 w-1/2" />
    </div>
  );
}
```

```css
/* index.css */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 0%,
    var(--muted-foreground) 50%,
    var(--muted) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

#### Task 2.3: Input Field States
```tsx
// Following Are.na pattern
<Input
  className="h-10 bg-transparent border-border focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:opacity-50"
/>
```

---

### Phase 3: Interaction Polish (2-3 days)

**Goal:** Smooth, consistent interactions across the site

#### Task 3.1: Brightness Filter Hovers (Boiler Room pattern)
```css
/* index.css - Add to utilities */
.hover-brightness {
  transition: filter 0.2s ease;
}

.hover-brightness:hover {
  filter: brightness(0.9);
}
```

#### Task 3.2: Animation Library
```css
/* index.css */
@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-10px) translateX(5px);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-scaleIn {
  animation: scaleIn 0.2s ease-out;
}
```

---

### Phase 4: Editorial Features (5-7 days)

**Goal:** Make radio and editorial feel like one cohesive system

#### Task 4.1: Block-Based Content Model
Create `Block` component that wraps all content types:

```tsx
// Block.tsx
interface BlockProps {
  id: string;
  type: 'mix' | 'playlist' | 'album' | 'episode' | 'artist';
  state: 'public' | 'featured' | 'private';
  connections?: string[];
  children: React.ReactNode;
}

export function Block({ id, type, state, connections, children }: BlockProps) {
  return (
    <div
      className={cn(
        "block relative",
        state === 'featured' && "ring-2 ring-navy",
        state === 'private' && "opacity-50"
      )}
      data-block-id={id}
      data-block-type={type}
    >
      {/* State indicator (Are.na pattern) */}
      <div className={cn(
        "absolute top-2 right-2 w-3 h-3 rounded-full",
        state === 'public' && "bg-green-500",
        state === 'featured' && "bg-navy",
        state === 'private' && "bg-red-500"
      )} />

      {children}

      {/* Connections */}
      {connections && connections.length > 0 && (
        <div className="mt-2 flex gap-1">
          {connections.map(connId => (
            <Link
              key={connId}
              to={`/block/${connId}`}
              className="text-xs text-muted-foreground hover:text-navy"
            >
              →
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Task 4.2: Show-Specific Themes
```tsx
// ThemeProvider.tsx
const SHOW_THEMES = {
  'friday-house': {
    '--brand-background': '#000',
    '--accent-navy': '#FFBB00',
  },
  'sunday-jazz': {
    '--brand-background': '#F5E6D3',
    '--accent-navy': '#8B4513',
  },
  'techno-tuesday': {
    '--brand-background': '#1a1a1a',
    '--accent-navy': '#FF0080',
  },
};

export function ThemeProvider({ showSlug, children }: { showSlug?: string; children: React.ReactNode }) {
  useEffect(() => {
    if (showSlug && SHOW_THEMES[showSlug]) {
      const root = document.documentElement;
      Object.entries(SHOW_THEMES[showSlug]).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    return () => {
      // Reset to default theme on unmount
      const root = document.documentElement;
      root.removeAttribute('data-theme');
    };
  }, [showSlug]);

  return <>{children}</>;
}

// Usage in episode page
<ThemeProvider showSlug="friday-house">
  <EpisodePage />
</ThemeProvider>
```

---

## Quick Wins (Can Do Today)

### 1. Add Brightness Hover to All Interactive Elements
```diff
// Button.tsx
<button
  className={cn(
    "transition-all",
+   "hover:brightness-90"
  )}
>
```

### 2. Add Skeleton States to Loading Components
```diff
// MixesGrid.tsx
{isLoading ? (
-  <div>Loading...</div>
+  <div className="grid grid-cols-3 gap-4">
+    {[...Array(6)].map((_, i) => (
+      <SkeletonCard key={i} />
+    ))}
+  </div>
) : (
  <MixesGrid data={mixes} />
)}
```

### 3. Add Space Tokens to Tailwind Config
```typescript
// tailwind.config.ts
theme: {
  extend: {
    spacing: {
      'grid': 'var(--space-3)',
      '1': 'var(--space-1)',
      '3': 'var(--space-3)',
      '6': 'var(--space-6)',
    }
  }
}
```

---

## Summary: What Makes Editorial Sites Feel Cohesive

After analyzing SSENSE, Boiler Room, pi.fyi, and Are.na, here's what they all share:

1. **Consistent Grid System** - Every page uses the same column structure
2. **Token-Based Everything** - Colors, spacing, typography all use CSS variables
3. **State-Driven Interactions** - Loading, hover, focus, disabled all have clear patterns
4. **Component Reusability** - Cards, buttons, inputs look identical everywhere
5. **Animation Consistency** - Same easing, same duration across all transitions
6. **Semantic Meaning** - Colors/states communicate (red = private, green = public)
7. **Block-Based Content** - All content can link to other content
8. **Theme Flexibility** - Easy to swap entire visual identity

**Your site has #2, #4, and #7 mostly done. Adding #1, #3, #5, and #6 will make it feel world-class.**

The key insight: **It's not about having more features - it's about having fewer patterns that are applied everywhere consistently.**

---

## Next Steps

1. **Read this document** and decide which phase to prioritize
2. **Choose 3 quick wins** to implement today
3. **Pick one phase** to complete this week
4. **Test the changes** on your /submit page (new users will see this first)
5. **Iterate based on feel** - does it feel like one site or many pages?

Want me to start implementing any of these improvements?
