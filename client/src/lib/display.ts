export function getThumbUrl(url?: string): string {
  if (!url) return '/img/placeholder-audio.svg';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_MEDIA_BASE_URL || ''}${url}`;
}

export function formatDateSafe(date?: string | Date | null): string {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return !isNaN(d.getTime()) ? d.toLocaleDateString() : '—';
}
