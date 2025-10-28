/**
 * Design Tokens for Enamorado Radio
 * Central source of truth for colors, typography, spacing, and radii
 */

export const tokens = {
  colors: {
    // Brand
    brand: 'hsl(12 84% 56%)',      // Warm red accent
    brandSubtle: 'hsl(12 84% 96%)', // Very light red tint
    
    // Text
    ink: '#111',                    // Primary text (dark mode: white)
    inkSubtle: '#5b5b5b',          // Secondary text (muted)
    
    // Backgrounds
    paper: '#f7f5f3',              // Off-white background (light mode)
    paper2: '#ffffff',             // Pure white (cards, overlays)
    
    // Borders
    stroke: '#E7E2DD',             // Subtle borders and dividers
  },
  
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  typography: {
    heading: {
      h1: {
        fontSize: '40px',
        lineHeight: '1.1',
        fontWeight: '700',
      },
      h2: {
        fontSize: '28px',
        lineHeight: '1.2',
        fontWeight: '700',
      },
      h3: {
        fontSize: '20px',
        lineHeight: '1.25',
        fontWeight: '600',
      },
    },
    body: {
      base: {
        fontSize: '16px',
        lineHeight: '1.5',
      },
      sm: {
        fontSize: '14px',
        lineHeight: '1.4',
      },
      xs: {
        fontSize: '12px',
        lineHeight: '1.3',
      },
    },
  },
} as const;

// Helper type for token paths
export type TokenPath = typeof tokens;

// CSS custom properties (for use in global styles)
export const tokensCSS = `
  :root {
    /* Colors */
    --brand: ${tokens.colors.brand};
    --brand-subtle: ${tokens.colors.brandSubtle};
    --ink: ${tokens.colors.ink};
    --ink-subtle: ${tokens.colors.inkSubtle};
    --paper: ${tokens.colors.paper};
    --paper-2: ${tokens.colors.paper2};
    --stroke: ${tokens.colors.stroke};
    
    /* Radii */
    --radius-sm: ${tokens.radii.sm};
    --radius-md: ${tokens.radii.md};
    --radius-lg: ${tokens.radii.lg};
    --radius-xl: ${tokens.radii.xl};
    
    /* Typography */
    --h1-size: ${tokens.typography.heading.h1.fontSize};
    --h1-lh: ${tokens.typography.heading.h1.lineHeight};
    --h2-size: ${tokens.typography.heading.h2.fontSize};
    --h2-lh: ${tokens.typography.heading.h2.lineHeight};
    --h3-size: ${tokens.typography.heading.h3.fontSize};
    --h3-lh: ${tokens.typography.heading.h3.lineHeight};
  }
`;
