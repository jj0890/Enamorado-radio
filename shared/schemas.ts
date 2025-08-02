import { z } from 'zod';

// MusicBrainz API Response Schemas
export const MusicBrainzArtistCredit = z.object({
  name: z.string(),
  artist: z.object({
    id: z.string(),
    name: z.string(),
    'sort-name': z.string().optional(),
  })
});

export const MusicBrainzRelease = z.object({
  id: z.string(),
  title: z.string(),
  score: z.number().optional(),
  date: z.string().optional(),
  'artist-credit': z.array(MusicBrainzArtistCredit).optional(),
  'cover-art-archive': z.object({
    count: z.number(),
    front: z.boolean(),
    back: z.boolean(),
    artwork: z.boolean()
  }).optional()
});

export const MusicBrainzSearchResponse = z.object({
  releases: z.array(MusicBrainzRelease),
  count: z.number(),
  offset: z.number()
});

// Album Schemas
export const AlbumSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  coverUrl: z.string().optional(),
  spotifyUrl: z.string().optional(),
  appleMusicUrl: z.string().optional(),
  bandcampUrl: z.string().optional(),
  description: z.string(),
  genre: z.array(z.string()),
  releaseYear: z.number(),
  featured: z.boolean().default(false),
  month: z.string(),
  year: z.number()
});

export type Album = z.infer<typeof AlbumSchema>;
export type MusicBrainzRelease = z.infer<typeof MusicBrainzRelease>;
export type MusicBrainzSearchResponse = z.infer<typeof MusicBrainzSearchResponse>;

// Form Schemas for Submissions
export const MixSubmissionSchema = z.object({
  djName: z.string().min(1, "DJ name is required"),
  realName: z.string().min(1, "Real name is required"),
  email: z.string().email("Valid email required"),
  location: z.string().min(1, "Location is required"),
  showTitle: z.string().min(1, "Show title is required"),
  showDescription: z.string().min(10, "Description must be at least 10 characters"),
  primaryGenre: z.string().min(1, "Primary genre is required"),
  showLength: z.number().min(1).max(180),
  additionalGenres: z.string().optional(),
  djExperience: z.string().min(1, "Experience description is required"),
  musicDiscovery: z.string().min(1, "Music discovery method is required"),
  socialMedia: z.string().url("Valid URL required").optional(),
  demoMixTitle: z.string().min(1, "Mix title is required"),
  demoMixDescription: z.string().min(10, "Mix description required"),
  soundcloudUrl: z.string().url("Valid SoundCloud URL required")
});

export const SongSubmissionSchema = z.object({
  songTitle: z.string().min(1, "Song title is required"),
  artistName: z.string().min(1, "Artist name is required"),
  platformUrl: z.string().url("Valid platform URL required"),
  submitterName: z.string().min(1, "Your name is required"),
  submitterEmail: z.string().email("Valid email required"),
  requestedDate: z.string().min(1, "Theme selection required"),
  additionalNotes: z.string().optional()
});

export const ResidentApplicationSchema = z.object({
  djName: z.string().min(1, "DJ name is required"),
  realName: z.string().min(1, "Real name is required"),
  email: z.string().email("Valid email required"),
  location: z.string().min(1, "Location is required"),
  experience: z.string().min(10, "Experience description required"),
  genres: z.string().min(1, "Genres are required"),
  availability: z.string().min(1, "Availability is required"),
  equipment: z.string().min(1, "Equipment description required"),
  socialMedia: z.string().url("Valid URL required").optional(),
  mixUrls: z.string().min(1, "Mix URLs are required"),
  whyJoin: z.string().min(20, "Please explain why you want to join")
});

export type MixSubmission = z.infer<typeof MixSubmissionSchema>;
export type SongSubmission = z.infer<typeof SongSubmissionSchema>;
export type ResidentApplication = z.infer<typeof ResidentApplicationSchema>;