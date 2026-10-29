/**
 * Downloads topical, free-to-use photos for every event category from Pixabay and
 * saves them INTO your server's uploads folder (server/uploads/samples/), then writes
 * utils/sampleImages.json so the sample events use them.
 *
 * Why download instead of linking: Pixabay doesn't allow permanent hotlinking of its
 * image URLs in an app, and your backend already serves /uploads, so local files are
 * also the most reliable option. Pixabay Content License = free to use, no attribution
 * required (they appreciate a credit, e.g. "Images from Pixabay").
 *
 * One-time setup:
 *   1. Sign up (free, instant) at https://pixabay.com, then open https://pixabay.com/api/docs/
 *      while logged in - your API key is shown at the top of that page.
 *   2. Add it to server/.env:   PIXABAY_API_KEY=your_key_here
 *   3. Run:   node utils/fetchSampleImages.js
 *   4. Then refresh the events:   node utils/addSampleEvents.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const QUERIES = {
  Music: 'live music concert',
  Workshop: 'pottery workshop craft',
  Festival: 'festival celebration lights',
  Sports: 'sports team game',
  Food: 'street food market',
  Education: 'students classroom',
  Meetup: 'friends meeting cafe',
  Technology: 'coding laptop developer',
  Business: 'business networking conference',
  Art: 'art exhibition painting',
  Culture: 'indian classical dance',
  Charity: 'volunteers charity',
};

const PHOTOS_PER_CATEGORY = 5;
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'samples');
const JSON_FILE = path.join(__dirname, 'sampleImages.json');

// Picks up to N usable image links from Pixabay's "hits" (largest size available)
const pickHits = (hits, count = PHOTOS_PER_CATEGORY) =>
  (hits || [])
    .map((h) => (h && (h.largeImageURL || h.webformatURL)) || null)
    .filter(Boolean)
    .slice(0, count);

const download = async (url, filePath) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Eventify sample image fetch)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.writeFileSync(filePath, Buffer.from(await res.arrayBuffer()));
};

const run = async () => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    console.error('PIXABAY_API_KEY is missing.\nSign up at https://pixabay.com, open https://pixabay.com/api/docs/ while logged in, copy your key, and add it to server/.env');
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const result = {};

  for (const [category, query] of Object.entries(QUERIES)) {
    const url =
      `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}` +
      '&image_type=photo&orientation=horizontal&safesearch=true&min_width=900&per_page=20';
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  ${category}: search failed (HTTP ${res.status}) - keeping built-in/fallback photos`);
        continue;
      }
      const data = await res.json();
      const links = pickHits(data.hits, PHOTOS_PER_CATEGORY + 3); // a few spares in case a download fails

      const saved = [];
      for (let i = 0; i < links.length && saved.length < PHOTOS_PER_CATEGORY; i += 1) {
        const name = `${category.toLowerCase()}-${saved.length + 1}.jpg`;
        try {
          await download(links[i], path.join(UPLOAD_DIR, name));
          saved.push(`/uploads/samples/${name}`);
        } catch (err) {
          console.warn(`    skipped one image for ${category}: ${err.message}`);
        }
      }

      if (saved.length) {
        result[category] = saved;
        console.log(`  ${category}: ${saved.length} photos ("${query}")`);
      } else {
        console.warn(`  ${category}: nothing downloaded for "${query}"`);
      }
    } catch (err) {
      console.warn(`  ${category}: ${err.message}`);
    }
  }

  fs.writeFileSync(JSON_FILE, JSON.stringify(result, null, 2));
  console.log(`\n✅ Saved photos for ${Object.keys(result).length} of ${Object.keys(QUERIES).length} categories.`);
  console.log('Now run: node utils/addSampleEvents.js');
};

if (require.main === module) {
  run();
}

module.exports = { pickHits };