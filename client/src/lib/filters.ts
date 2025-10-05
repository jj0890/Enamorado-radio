export type Mix = {
  id: number;
  genre: string;
  tags?: string[];
  title: string;
  artist?: string;
  name?: string;
  [key: string]: any;
};

export function filterByTags(
  mixes: Mix[],
  active: string[],
  mode: 'AND' | 'OR' = 'OR'
): Mix[] {
  if (!active.length) return mixes;
  
  return mixes.filter(mix => {
    // Combine genre and tags into a single array
    const mixGenres = [
      mix.genre,
      ...(mix.tags || [])
    ].filter(Boolean);
    
    return mode === 'AND'
      ? active.every(tag => mixGenres.includes(tag))
      : active.some(tag => mixGenres.includes(tag));
  });
}
