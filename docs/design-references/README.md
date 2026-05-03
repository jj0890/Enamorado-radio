# Design References

This directory contains comprehensive design analysis and pattern documentation for the Enamorado Radio platform.

---

## 📚 Documents

### [Nina Protocol Layout Analysis](./nina-protocol-layout-analysis.md)
**Complete breakdown of Nina Protocol's flexbox-based design**

- Auto-scrolling carousel implementation
- Fixed bottom player architecture
- Responsive card layouts
- Tag navigation patterns
- Full CSS reference with examples

**Use this for:** Understanding horizontal carousels, auto-scroll mechanics, and music platform UI patterns

---

### [Design Patterns Guide](./DESIGN_PATTERNS.md)
**Practical implementation guide for Enamorado Radio**

- Auto-scroll carousel component usage
- Card layout patterns
- Fixed bottom player implementation
- Tag navigation components
- Responsive breakpoints
- CSS variables and design tokens

**Use this for:** Day-to-day development, component implementation, maintaining consistency

---

## 🎨 Design Philosophy

Enamorado Radio blends inspiration from multiple platforms:

| Platform | What We Take |
|----------|-------------|
| **Nina Protocol** | Auto-scrolling carousels, clean card layouts |
| **NTS.live** | Editorial-focused design, show/resident structure |
| **dirt.fyi** | Magazine aesthetic, content curation |
| **pi.fyi** | Minimalist typography, brutalist touches |
| **Shared Frequencies Radio** | Community-driven content model |
| **Vogue.com** | Editorial sophistication, image-first design |

---

## 🚀 Quick Start

### Using Auto-Scroll Carousels

```tsx
import AutoScrollCarousel, {
  CarouselCard,
  CarouselArtwork,
  CarouselInfo,
} from '@/components/auto-scroll-carousel';

<AutoScrollCarousel interval={7000} cardWidth={220} gap={20}>
  {items.map(item => (
    <CarouselCard key={item.id} width={200}>
      <CarouselArtwork src={item.image} alt={item.title} size={200} />
      <CarouselInfo title={item.title} subtitle={item.artist} />
    </CarouselCard>
  ))}
</AutoScrollCarousel>
```

### Applying Design Patterns

1. **Read** [Design Patterns Guide](./DESIGN_PATTERNS.md) for implementation details
2. **Reference** [Nina Protocol Analysis](./nina-protocol-layout-analysis.md) for deep dives
3. **Use** the `auto-scroll-carousel.tsx` component for horizontal content
4. **Follow** responsive breakpoints and CSS variables

---

## 📐 Core Patterns

### 1. Horizontal Carousels
- **Auto-scroll every 7 seconds**
- **Pause on hover/touch**
- **Hidden scrollbars**
- **Smooth scroll behavior**
- **Loop back to start**

### 2. Card Layouts
- **Flexbox column stacking**
- **Fixed widths** (200px desktop, scales down on mobile)
- **flex-shrink: 0** prevents compression
- **Hover effects** (translateY, scale)
- **Text truncation** on overflow

### 3. Fixed Player
- **72px height**
- **Fixed bottom positioning**
- **Backdrop blur**
- **Flexbox horizontal layout**
- **Responsive hiding** (volume/info on mobile)

### 4. Responsive Design
- **Desktop:** 1400px max-width, 64px padding
- **Tablet:** 1024-1399px, 48px padding
- **Mobile:** 375-767px, 32px padding
- **Small Mobile:** 320-374px, 24px padding

---

## 🎯 Implementation Checklist

When implementing new features, ensure:

- [ ] Uses auto-scroll carousels for discovery content
- [ ] Cards follow vertical stacking pattern
- [ ] Responsive breakpoints are implemented
- [ ] Touch targets are 44px minimum on mobile
- [ ] Text truncation prevents overflow
- [ ] Hover states provide visual feedback
- [ ] CSS variables are used for colors/spacing
- [ ] Fixed player doesn't interfere with content

---

## 🔗 External Resources

### Inspiration Sites
- [Nina Protocol](https://ninaprotocol.com) - Carousel patterns
- [NTS.live](https://www.nts.live) - Radio platform UX
- [dirt.fyi](https://dirt.fyi) - Editorial magazine design
- [pi.fyi](https://pi.fyi) - Minimalist aesthetics
- [Shared Frequencies Radio](https://sharedfrequenciesradio.com) - Community model
- [Icehouse Radio](https://icehouseradio.com) - Clean radio interface

### Technical References
- [CSS Tricks - Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [MDN - Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout)
- [Swiper.js](https://swiperjs.com/) - Carousel library (alternative)
- [Embla Carousel](https://www.embla-carousel.com/) - Modern carousel (alternative)

---

## 📝 Contributing

When adding new design references:

1. Create a new markdown file in this directory
2. Use consistent formatting (headings, code blocks, tables)
3. Include visual examples when possible
4. Update this README with a link and description
5. Cross-reference with DESIGN_PATTERNS.md

---

## 📅 Changelog

**December 28, 2024**
- Added Nina Protocol layout analysis
- Created design patterns guide
- Implemented auto-scroll carousel component
- Established responsive breakpoints
- Documented CSS variables and design tokens

---

**Maintained By:** Enamorado Radio Development Team
**Last Updated:** December 28, 2024
