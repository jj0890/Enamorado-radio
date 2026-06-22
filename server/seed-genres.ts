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
    { slug: 'cosmic-disco', name: 'Cosmic Disco', description: 'Italo and cosmic-influenced disco' },
    { slug: 'italo', name: 'Italo', description: 'Italian disco and Italo-house' },
    { slug: 'jazz', name: 'Jazz', description: 'Jazz and jazz fusion' },
    { slug: 'soul-jazz', name: 'Soul Jazz', description: 'Hard bop and soul-influenced jazz' },
    { slug: 'spiritual-jazz', name: 'Spiritual Jazz', description: 'Free and spiritual jazz traditions' },
    { slug: 'reggae', name: 'Reggae', description: 'Reggae and dub' },
    { slug: 'rocksteady', name: 'Rocksteady', description: 'Jamaican rocksteady' },
    { slug: 'folk', name: 'Folk', description: 'Folk and singer-songwriter' },
    { slug: 'krautrock', name: 'Krautrock', description: 'German kosmische and krautrock' },
    { slug: 'kosmische', name: 'Kosmische', description: 'Cosmic, meditative German electronic' },
    { slug: 'prog-rock', name: 'Prog Rock', description: 'Progressive and art rock' },
    { slug: 'psychedelic-rock', name: 'Psychedelic Rock', description: 'Psychedelic rock and garage' },
    { slug: 'rock', name: 'Rock', description: 'Rock and alternative' },
    { slug: 'indie', name: 'Indie', description: 'Independent and alternative' },
    { slug: 'punk', name: 'Punk', description: 'Punk rock and hardcore' },
    { slug: 'bossa-nova', name: 'Bossa Nova', description: 'Brazilian bossa nova and MPB' },
  ],

  'Experimental / Electronic': [
    { slug: 'drone', name: 'Drone', description: 'Drone music and sustained tonality' },
    { slug: 'dark-ambient', name: 'Dark Ambient', description: 'Dark, atmospheric electronic soundscapes' },
    { slug: 'musique-concrete', name: 'Musique Concrète', description: 'Tape music and found-sound composition' },
    { slug: 'fourth-world', name: 'Fourth World', description: 'Jon Hassell-inspired global-ambient fusion' },
    { slug: 'library', name: 'Library Music', description: 'Functional and production library music' },
    { slug: 'minimal-synth', name: 'Minimal Synth', description: 'Stripped-back analogue synth music' },
    { slug: 'new-wave', name: 'New Wave', description: 'New wave and synth-pop' },
    { slug: 'no-wave', name: 'No Wave', description: 'Anti-music and NYC no wave' },
    { slug: 'art-rock', name: 'Art Rock', description: 'Art rock and avant-pop' },
    { slug: 'noise-rock', name: 'Noise Rock', description: 'Guitar-noise and abrasive rock' },
  ],

  'Global Sounds': [
    { slug: 'electro-shaabi', name: 'Electro Shaabi', description: 'Egyptian street electronic music' },
    { slug: 'soca', name: 'Soca', description: 'Trinidadian soca and calypso' },
    { slug: 'bashment', name: 'Bashment', description: 'Jamaican dancehall bashment' },
  ],

  'Hip-Hop Variants': [
    { slug: 'chopped-screwed', name: 'Chopped & Screwed', description: 'DJ Screw-style slowed remixes' },
    { slug: 'dirty-south', name: 'Dirty South', description: 'Southern rap and crunk' },
    { slug: 'uk-drill', name: 'UK Drill', description: 'UK drill and road rap' },
    { slug: 'gangsta-rap', name: 'Gangsta Rap', description: 'Gangsta rap and West Coast hip-hop' },
  ],

  'Electronic Sub-Genres': [
    { slug: 'broken-beat', name: 'Broken Beat', description: 'UK broken beat and nu-jazz' },
    { slug: 'dub-techno', name: 'Dub Techno', description: 'Echoing, dubbed-out techno' },
    { slug: 'detroit-house', name: 'Detroit House', description: 'Soulful Detroit-style house' },
    { slug: 'leftfield-house', name: 'Leftfield House', description: 'Experimental and genre-bending house' },
    { slug: 'leftfield-techno', name: 'Leftfield Techno', description: 'Avant-garde and experimental techno' },
  ],

  'Moods': [
    { slug: 'mood-late-night', name: 'Late Night', description: 'After hours, introspective listening' },
    { slug: 'mood-dancefloor', name: 'Dancefloor', description: 'Built for the club and the crowd' },
    { slug: 'mood-peak-time', name: 'Peak Time', description: 'High-energy peak floor selections' },
    { slug: 'mood-lean-back', name: 'Lean Back', description: 'Easy listening, home sessions' },
    { slug: 'mood-deep-cuts', name: 'Deep Cuts', description: 'Collectors and rarities focus' },
    { slug: 'mood-instrumental', name: 'Instrumental', description: 'No vocals, music only' },
    { slug: 'mood-feel-good', name: 'Feel Good', description: 'Uplifting and joyful selections' },
    { slug: 'mood-slow-burn', name: 'Slow Burn', description: 'Meditative, unhurried pacing' },
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
