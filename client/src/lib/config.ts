/** Returns true if the site is in pre-launch/coming-soon mode */
export function isPrelaunch(): boolean {
  return import.meta.env.VITE_PRELAUNCH === 'true';
}

/** Returns true if a feature flag is enabled */
export function isFeatureEnabled(flag: string): boolean {
  return import.meta.env[`VITE_FEATURE_${flag.toUpperCase()}`] === 'true';
}

/**
 * Hook — returns admin status info.
 * Auth is determined server-side; this is a client-side hint only.
 */
export function useAdminStatus(): { isAdmin: boolean; isEditor: boolean } {
  return { isAdmin: false, isEditor: false };
}
