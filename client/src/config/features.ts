/**
 * Feature Flags Configuration
 * 
 * Controls visibility and availability of features across the platform.
 * Set to `false` to hide/disable incomplete or in-development features.
 */

export const FEATURES = {
  // Schedule page - Radio programming schedule
  SCHEDULE: false,
  
  // Residents page - Resident DJ profiles and info
  RESIDENTS: false,
  
  // Albums of the Month - Community album curation
  ALBUMS: true,
  
  // Mixes - Community mix submissions
  MIXES: true,
  
  // Episodes - Radio episodes and shows
  EPISODES: true,
  
  // Genres - Genre discovery and filtering
  GENRES: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as FeatureFlag);
}

/**
 * Get all disabled features
 */
export function getDisabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature as FeatureFlag);
}
