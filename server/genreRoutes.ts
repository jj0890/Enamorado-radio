import type { Express } from "express";
import { db } from "./db";
import { genres, contentGenres, mixSubmissions, episodes, playlistSubmissions } from "@shared/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";

export function registerGenreRoutes(app: Express) {

  // GET /api/genres - List all genres
  app.get("/api/genres", async (req, res) => {
    try {
      const allGenres = await db.query.genres.findMany({
        orderBy: (genres, { asc }) => [asc(genres.sortOrder), asc(genres.name)],
      });

      // Group by category
      const grouped = allGenres.reduce((acc, genre) => {
        const category = genre.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(genre);
        return acc;
      }, {} as Record<string, typeof allGenres>);

      res.json({
        ok: true,
        data: {
          all: allGenres,
          byCategory: grouped,
        }
      });
    } catch (error) {
      console.error('Error fetching genres:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch genres' });
    }
  });

  // GET /api/genres/:slug - Get single genre details
  app.get("/api/genres/:slug", async (req, res) => {
    try {
      const { slug } = req.params;

      const genre = await db.query.genres.findFirst({
        where: eq(genres.slug, slug),
      });

      if (!genre) {
        return res.status(404).json({ ok: false, error: 'Genre not found' });
      }

      // Get content count for this genre
      const contentCount = await db.select({ count: sql<number>`count(*)` })
        .from(contentGenres)
        .where(eq(contentGenres.genreId, genre.id));

      res.json({
        ok: true,
        data: {
          ...genre,
          contentCount: contentCount[0]?.count || 0,
        }
      });
    } catch (error) {
      console.error('Error fetching genre:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch genre' });
    }
  });

  // GET /api/genres/:slug/related - Get related genres (same category)
  app.get("/api/genres/:slug/related", async (req, res) => {
    try {
      const { slug } = req.params;

      const genre = await db.query.genres.findFirst({
        where: eq(genres.slug, slug),
      });

      if (!genre) {
        return res.status(404).json({ ok: false, error: 'Genre not found' });
      }

      // Get other genres in same category
      const relatedGenres = await db.query.genres.findMany({
        where: and(
          eq(genres.category, genre.category || ''),
          sql`${genres.slug} != ${slug}`
        ),
        limit: 6,
      });

      res.json({
        ok: true,
        data: relatedGenres,
      });
    } catch (error) {
      console.error('Error fetching related genres:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch related genres' });
    }
  });

  // GET /api/content/browse - Browse all content with filters
  app.get("/api/content/browse", async (req, res) => {
    try {
      const {
        genres: genreSlugs,
        type,
        search,
        limit = '20',
        offset = '0'
      } = req.query;

      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      let genreIds: number[] = [];

      // Convert genre slugs to IDs
      if (genreSlugs && typeof genreSlugs === 'string') {
        const slugArray = genreSlugs.split(',');
        const genreRecords = await db.query.genres.findMany({
          where: inArray(genres.slug, slugArray),
        });
        genreIds = genreRecords.map(g => g.id);
      }

      // Build results array
      const results: any[] = [];

      // Fetch mixes
      if (!type || type === 'mix') {
        let mixQuery = db.select({
          id: mixSubmissions.id,
          title: mixSubmissions.title,
          artist: mixSubmissions.name,
          artwork: mixSubmissions.artwork_url,
          date: mixSubmissions.submittedAt,
          status: mixSubmissions.status,
        }).from(mixSubmissions);

        // Apply genre filter if specified
        if (genreIds.length > 0) {
          mixQuery = mixQuery
            .innerJoin(contentGenres, and(
              eq(contentGenres.contentType, 'mix'),
              eq(contentGenres.contentId, mixSubmissions.id),
              inArray(contentGenres.genreId, genreIds)
            )) as any;
        }

        const mixes = await mixQuery
          .where(eq(mixSubmissions.status, 'approved'))
          .orderBy(desc(mixSubmissions.submittedAt))
          .limit(limitNum)
          .offset(offsetNum);

        // Fetch genres for each mix
        for (const mix of mixes) {
          const mixGenres = await db.select({
            slug: genres.slug,
            name: genres.name,
            isPrimary: contentGenres.isPrimary,
          })
            .from(contentGenres)
            .innerJoin(genres, eq(genres.id, contentGenres.genreId))
            .where(and(
              eq(contentGenres.contentType, 'mix'),
              eq(contentGenres.contentId, mix.id)
            ));

          results.push({
            ...mix,
            type: 'mix',
            genres: mixGenres,
          });
        }
      }

      // Fetch episodes
      if (!type || type === 'episode') {
        let episodeQuery = db.select({
          id: episodes.id,
          title: episodes.title,
          host: episodes.hostName,
          artwork: episodes.artworkUrl,
          date: episodes.airDate,
          duration: episodes.duration,
          status: episodes.status,
        }).from(episodes);

        if (genreIds.length > 0) {
          episodeQuery = episodeQuery
            .innerJoin(contentGenres, and(
              eq(contentGenres.contentType, 'episode'),
              eq(contentGenres.contentId, episodes.id),
              inArray(contentGenres.genreId, genreIds)
            )) as any;
        }

        const episodeResults = await episodeQuery
          .where(eq(episodes.status, 'published'))
          .orderBy(desc(episodes.airDate))
          .limit(limitNum)
          .offset(offsetNum);

        for (const episode of episodeResults) {
          const episodeGenres = await db.select({
            slug: genres.slug,
            name: genres.name,
            isPrimary: contentGenres.isPrimary,
          })
            .from(contentGenres)
            .innerJoin(genres, eq(genres.id, contentGenres.genreId))
            .where(and(
              eq(contentGenres.contentType, 'episode'),
              eq(contentGenres.contentId, episode.id)
            ));

          results.push({
            ...episode,
            type: 'episode',
            genres: episodeGenres,
          });
        }
      }

      // Fetch playlists
      if (!type || type === 'playlist') {
        let playlistQuery = db.select({
          id: playlistSubmissions.id,
          title: playlistSubmissions.title,
          creator: playlistSubmissions.curatorName,
          artwork: playlistSubmissions.artworkUrl,
          date: playlistSubmissions.submittedAt,
          trackCount: playlistSubmissions.trackCount,
          status: playlistSubmissions.status,
        }).from(playlistSubmissions);

        if (genreIds.length > 0) {
          playlistQuery = playlistQuery
            .innerJoin(contentGenres, and(
              eq(contentGenres.contentType, 'playlist'),
              eq(contentGenres.contentId, playlistSubmissions.id),
              inArray(contentGenres.genreId, genreIds)
            )) as any;
        }

        const playlists = await playlistQuery
          .where(eq(playlistSubmissions.status, 'approved'))
          .orderBy(desc(playlistSubmissions.submittedAt))
          .limit(limitNum)
          .offset(offsetNum);

        for (const playlist of playlists) {
          const playlistGenres = await db.select({
            slug: genres.slug,
            name: genres.name,
            isPrimary: contentGenres.isPrimary,
          })
            .from(contentGenres)
            .innerJoin(genres, eq(genres.id, contentGenres.genreId))
            .where(and(
              eq(contentGenres.contentType, 'playlist'),
              eq(contentGenres.contentId, playlist.id)
            ));

          results.push({
            ...playlist,
            type: 'playlist',
            genres: playlistGenres,
          });
        }
      }

      // Sort by date
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json({
        ok: true,
        data: results.slice(0, limitNum),
      });
    } catch (error) {
      console.error('Error browsing content:', error);
      res.status(500).json({ ok: false, error: 'Failed to browse content' });
    }
  });

  // GET /api/content/by-genre/:slug - Get content for specific genre
  app.get("/api/content/by-genre/:slug", async (req, res) => {
    try {
      const { slug } = req.params;

      const genre = await db.query.genres.findFirst({
        where: eq(genres.slug, slug),
      });

      if (!genre) {
        return res.status(404).json({ ok: false, error: 'Genre not found' });
      }

      // Get all content for this genre
      const contentLinks = await db.select()
        .from(contentGenres)
        .where(eq(contentGenres.genreId, genre.id))
        .limit(50);

      const results: any[] = [];

      // Fetch actual content for each link
      for (const link of contentLinks) {
        if (link.contentType === 'mix') {
          const mix = await db.query.mixSubmissions.findFirst({
            where: and(
              eq(mixSubmissions.id, link.contentId),
              eq(mixSubmissions.status, 'approved')
            ),
          });
          if (mix) {
            results.push({
              id: mix.id,
              type: 'mix',
              title: mix.title,
              artist: mix.name,
              artwork: mix.artwork_url,
              date: mix.submittedAt,
            });
          }
        } else if (link.contentType === 'episode') {
          const episode = await db.query.episodes.findFirst({
            where: and(
              eq(episodes.id, link.contentId),
              eq(episodes.status, 'published')
            ),
          });
          if (episode) {
            results.push({
              id: episode.id,
              type: 'episode',
              title: episode.title,
              host: episode.hostName,
              artwork: episode.artworkUrl,
              date: episode.airDate,
              duration: episode.duration,
            });
          }
        } else if (link.contentType === 'playlist') {
          const playlist = await db.query.playlistSubmissions.findFirst({
            where: and(
              eq(playlistSubmissions.id, link.contentId),
              eq(playlistSubmissions.status, 'approved')
            ),
          });
          if (playlist) {
            results.push({
              id: playlist.id,
              type: 'playlist',
              title: playlist.title,
              creator: playlist.curatorName,
              artwork: playlist.artworkUrl,
              date: playlist.submittedAt,
              trackCount: playlist.trackCount,
            });
          }
        }
      }

      res.json({
        ok: true,
        data: results,
      });
    } catch (error) {
      console.error('Error fetching genre content:', error);
      res.status(500).json({ ok: false, error: 'Failed to fetch genre content' });
    }
  });

  // POST /api/content/:type/:id/genres - Add genres to content (admin only)
  app.post("/api/content/:type/:id/genres", async (req, res) => {
    try {
      const { type, id } = req.params;
      const { genreSlugs, primary } = req.body;

      if (!['mix', 'episode', 'playlist'].includes(type)) {
        return res.status(400).json({ ok: false, error: 'Invalid content type' });
      }

      // Convert slugs to IDs
      const genreRecords = await db.query.genres.findMany({
        where: inArray(genres.slug, genreSlugs),
      });

      // Delete existing genre associations
      await db.delete(contentGenres)
        .where(and(
          eq(contentGenres.contentType, type),
          eq(contentGenres.contentId, parseInt(id))
        ));

      // Insert new associations
      for (const genre of genreRecords) {
        await db.insert(contentGenres).values({
          genreId: genre.id,
          contentType: type,
          contentId: parseInt(id),
          isPrimary: genre.slug === primary,
        });
      }

      res.json({ ok: true, data: { message: 'Genres updated successfully' } });
    } catch (error) {
      console.error('Error updating genres:', error);
      res.status(500).json({ ok: false, error: 'Failed to update genres' });
    }
  });
}
