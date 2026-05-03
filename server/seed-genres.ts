import { db } from "./db";
import { genres } from "../shared/schema";

// Genre Categories & Seed Data
const genreCategories = {
  'Electronic / Downtempo': [
    { slug: 'ambient', name: 'Ambient', description: 'Atmospheric, immersive soundscapes' },
    { slug: 'beats', name: 'Beats', description: 'Instrumental hip-hop and beat-driven music' },
    { slug: 'downtempo', name: 'Downtempo', description: 'Relaxed, mid-tempo electronic' },
    { slug: 'idm', name: 'IDM', description: 'Intelligent Dance Music - experimental electronic' },
    { slug: 'leftfield', name: 'Leftfield', description: 'Experimental, genre-defying electronic' },
    { slug: 'chillwave', name: 'Chillwave', description: 'Dreamy, lo-fi electronic' },
  ],

  'Hip-Hop / R&B': [
    { slug: 'hip-hop', name: 'Hip Hop', description: 'Rap and hip-hop culture' },
    { slug: 'rnb', name: 'R&B', description: 'Rhythm and Blues' },
    { slug: 'soul', name: 'Soul', description: 'Classic and contemporary soul' },
    { slug: 'funk', name: 'Funk', description: 'Groove-based funk' },
    { slug: 'trap', name: 'Trap', description: 'Modern trap and 808-driven beats' },
    { slug: 'neo-soul', name: 'Neo-Soul', description: 'Contemporary soul fusion' },
  ],

  'House / Techno': [
    { slug: 'house', name: 'House', description: 'Classic house music' },
    { slug: 'techno', name: 'Techno', description: 'Detroit and Berlin techno' },
    { slug: 'deep-house', name: 'Deep House', description: 'Soulful, atmospheric house' },
    { slug: 'tech-house', name: 'Tech House', description: 'Fusion of techno and house' },
    { slug: 'minimal', name: 'Minimal', description: 'Stripped-back techno and house' },
    { slug: 'breakbeat', name: 'Breakbeat', description: 'Break-driven dance music' },
    { slug: 'garage', name: 'Garage', description: 'Garage house and speed garage' },
    { slug: 'acid-house', name: 'Acid House', description: 'TB-303 driven house' },
  ],

  'Bass Music': [
    { slug: 'dubstep', name: 'Dubstep', description: 'UK bass music' },
    { slug: 'uk-garage', name: 'UK Garage', description: '2-step and garage' },
    { slug: 'grime', name: 'Grime', description: 'UK grime and bassline' },
    { slug: 'footwork', name: 'Footwork', description: 'Chicago footwork and juke' },
    { slug: 'drum-and-bass', name: 'Drum & Bass', description: 'Fast-paced breakbeat' },
    { slug: 'jungle', name: 'Jungle', description: 'Classic jungle and ragga' },
    { slug: 'bass', name: 'Bass', description: 'General bass music' },
  ],

  'Latin / Caribbean': [
    { slug: 'reggaeton', name: 'Reggaeton', description: 'Latin urban music' },
    { slug: 'dembow', name: 'Dembow', description: 'Dominican dembow' },
    { slug: 'batida', name: 'Batida', description: 'Angolan electronic' },
    { slug: 'kuduro', name: 'Kuduro', description: 'Angolan dance music' },
    { slug: 'baile-funk', name: 'Baile Funk', description: 'Brazilian funk carioca' },
    { slug: 'cumbia', name: 'Cumbia', description: 'Latin American cumbia' },
    { slug: 'dancehall', name: 'Dancehall', description: 'Jamaican dancehall' },
    { slug: 'moombahton', name: 'Moombahton', description: 'Reggaeton-house fusion' },
  ],

  'Experimental / Alternative': [
    { slug: 'post-punk', name: 'Post-Punk', description: 'Post-punk and new wave' },
    { slug: 'industrial', name: 'Industrial', description: 'Industrial and noise' },
    { slug: 'ebm', name: 'EBM', description: 'Electronic Body Music' },
    { slug: 'wave', name: 'Wave', description: 'Darkwave and coldwave' },
    { slug: 'experimental', name: 'Experimental', description: 'Avant-garde and experimental' },
    { slug: 'noise', name: 'Noise', description: 'Noise and harsh electronics' },
    { slug: 'shoegaze', name: 'Shoegaze', description: 'Dreamy, effects-heavy rock' },
  ],

  'Global / World': [
    { slug: 'afrobeat', name: 'Afrobeat', description: 'West African afrobeat' },
    { slug: 'amapiano', name: 'Amapiano', description: 'South African house' },
    { slug: 'gqom', name: 'Gqom', description: 'South African electronic' },
    { slug: 'balearic', name: 'Balearic', description: 'Balearic and tropical house' },
    { slug: 'world', name: 'World', description: 'Global sounds and fusion' },
    { slug: 'kwaito', name: 'Kwaito', description: 'South African house music' },
    { slug: 'highlife', name: 'Highlife', description: 'Ghanaian highlife' },
  ],

  'Classic / Foundational': [
    { slug: 'disco', name: 'Disco', description: 'Classic and nu-disco' },
    { slug: 'jazz', name: 'Jazz', description: 'Jazz and jazz fusion' },
    { slug: 'reggae', name: 'Reggae', description: 'Reggae and dub' },
    { slug: 'rock', name: 'Rock', description: 'Rock and alternative' },
    { slug: 'indie', name: 'Indie', description: 'Independent and alternative' },
    { slug: 'punk', name: 'Punk', description: 'Punk rock and hardcore' },
  ],
};

export async function seedGenres() {
  console.log('🎵 Starting genre seeding...');

  try {
    let sortOrder = 0;
    let totalSeeded = 0;

    for (const [category, genreList] of Object.entries(genreCategories)) {
      console.log(`  📂 Seeding category: ${category}`);

      for (const genre of genreList) {
        // Check if genre already exists
        const existingGenre = await db.query.genres.findFirst({
          where: (genres, { eq }) => eq(genres.slug, genre.slug)
        });

        if (existingGenre) {
          console.log(`    ⏭️  Skipping "${genre.name}" (already exists)`);
          continue;
        }

        await db.insert(genres).values({
          slug: genre.slug,
          name: genre.name,
          category: category,
          description: genre.description,
          sortOrder: sortOrder++,
        });

        totalSeeded++;
        console.log(`    ✅ Added "${genre.name}"`);
      }
    }

    console.log(`\n✨ Successfully seeded ${totalSeeded} genres across ${Object.keys(genreCategories).length} categories!`);

    // Print summary
    const allGenres = await db.query.genres.findMany();
    console.log(`📊 Total genres in database: ${allGenres.length}`);

  } catch (error) {
    console.error('❌ Error seeding genres:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedGenres()
    .then(() => {
      console.log('✅ Genre seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Genre seeding failed:', error);
      process.exit(1);
    });
}
