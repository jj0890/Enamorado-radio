export type Filterable = {
  genre: string;
  tags?: string[];
  [key: string]: any;
};

export type Mix = Filterable & {
  id: number;
  title: string;
  name: string;   // Artist / submitter name
  url: string;
  status?: string | null;
  artwork_url?: string | null;
  coverUrl?: string | null;
  artUrl?: string | null;
  platform?: string | null;
  about?: string | null;
  approved?: boolean | null;
  featured?: boolean | null;
};

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const explode = (s?: string): string[] =>
  (s ?? '')
    .split(/[,/|+&]+|\s{2,}/g)
    .map(x => x.trim())
    .filter(Boolean);

export function filterByTags<T extends Filterable>(
  items: T[],
  activeTags: string[],
  mode: 'AND' | 'OR' = 'OR'
): T[] {
  if (!activeTags.length) return items;

  const activeNormalized = activeTags.map(normalize);

  return items.filter((item) => {
    const source = [
      ...explode(item.genre),
      ...(item.tags ?? []),
    ]
      .map(normalize)
      .filter(Boolean);

    const uniqueTags = new Set(source);

    return mode === 'AND'
      ? activeNormalized.every(t => uniqueTags.has(t))
      : activeNormalized.some(t => uniqueTags.has(t));
  });
}

export function extractUniqueTags<T extends Filterable>(items: T[]): string[] {
  const allTags = new Set<string>();
  
  items.forEach(item => {
    explode(item.genre).forEach(tag => allTags.add(tag));
    (item.tags ?? []).forEach(tag => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}
