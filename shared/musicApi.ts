// MusicBrainz and Spotify API integration for album artwork and links

export interface AlbumInfo {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  spotifyUrl?: string;
  mbid?: string;
}

// MusicBrainz API for album artwork
export async function getAlbumArtwork(artist: string, album: string): Promise<string | null> {
  try {
    // Search for the release on MusicBrainz
    const searchUrl = `https://musicbrainz.org/ws/2/release/?query=artist:"${encodeURIComponent(artist)}" AND release:"${encodeURIComponent(album)}"&fmt=json&limit=1`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.releases && data.releases.length > 0) {
      const mbid = data.releases[0].id;
      
      // Get cover art from Cover Art Archive
      const coverUrl = `https://coverartarchive.org/release/${mbid}/front-500`;
      
      // Check if cover exists
      const coverResponse = await fetch(coverUrl, { method: 'HEAD' });
      if (coverResponse.ok) {
        return coverUrl;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching album artwork:', error);
    return null;
  }
}

// Spotify search for streaming links
export async function getSpotifyAlbumUrl(artist: string, album: string): Promise<string | null> {
  try {
    // This would require Spotify API credentials
    // For now, we'll return a Spotify search URL
    const searchQuery = `${artist} ${album}`;
    return `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`;
  } catch (error) {
    console.error('Error getting Spotify URL:', error);
    return null;
  }
}

// Combined function to get both artwork and Spotify link
export async function enrichAlbumData(albumInfo: AlbumInfo): Promise<AlbumInfo> {
  const [coverUrl, spotifyUrl] = await Promise.all([
    getAlbumArtwork(albumInfo.artist, albumInfo.title),
    getSpotifyAlbumUrl(albumInfo.artist, albumInfo.title)
  ]);
  
  return {
    ...albumInfo,
    coverUrl: coverUrl || albumInfo.coverUrl,
    spotifyUrl: spotifyUrl || albumInfo.spotifyUrl
  };
}

// Function to batch process multiple albums
export async function enrichMultipleAlbums(albums: AlbumInfo[]): Promise<AlbumInfo[]> {
  const enrichedAlbums = await Promise.all(
    albums.map(album => enrichAlbumData(album))
  );
  
  return enrichedAlbums;
}