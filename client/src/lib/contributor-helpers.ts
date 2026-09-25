/**
 * Contributor URL and display helpers
 * Ensures consistent handle normalization across the application.
 */

/** Normalize handle for URL paths — strips any @ prefix */
export function formatContributorPath(handle: string | null | undefined): string {
  if (!handle) return '';
  return handle.replace(/^@+/, '').trim();
}

/** Format handle for display — ensures @ prefix */
export function formatContributorDisplay(handle: string | null | undefined): string {
  if (!handle) return '';
  const cleaned = handle.replace(/^@+/, '').trim();
  return cleaned ? `@${cleaned}` : '';
}

/** Build contributor profile URL */
export function getContributorUrl(handle: string | null | undefined): string {
  const normalizedHandle = formatContributorPath(handle);
  return normalizedHandle ? `/contributor/${normalizedHandle}` : '';
}
