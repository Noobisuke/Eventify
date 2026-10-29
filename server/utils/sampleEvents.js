/**
 * Sample event generator - 5 events for each of the 12 categories (60 total),
 * spread across Ludhiana and across the next ~6 weeks so Home, Search, Map,
 * "Nearby You" and "Upcoming" all have plenty to show.
 *
 * Dates are generated relative to *now* every time this runs, so re-running the
 * seed (or addSampleEvents.js) always gives you upcoming events.
 * Coordinates are approximate neighbourhood positions - good enough for the map.
 */

const DAY = 24 * 60 * 60 * 1000;

// Approximate positions of well-known Ludhiana areas [lat, lng]
const AREAS = [
  { road: 'Civil Lines', lat: 30.9050, lng: 75.8500 },
  { road: 'Model Town', lat: 30.9100, lng: 75.8420 },
  { road: 'Ferozepur Road', lat: 30.8900, lng: 75.8200 },
  { road: 'Sarabha Nagar', lat: 30.8890, lng: 75.8350 },
  { road: 'Pakhowal Road', lat: 30.8700, lng: 75.8300 },
  { road: 'BRS Nagar', lat: 30.8800, lng: 75.8700 },
  { road: 'Ghumar Mandi', lat: 30.9000, lng: 75.8650 },
  { road: 'Stadium Road', lat: 30.9000, lng: 75.8600 },
  { road: 'Clock Tower Chowk', lat: 30.9115, lng: 75.8575 },
  { road: 'Dugri', lat: 30.8750, lng: 75.8850 },
];

// Days from today for each event (cycled) - mix of "this week" and "next month"
const DAY_OFFSETS = [1, 2, 3, 4, 5, 6, 7, 9, 11, 13, 15, 18, 21, 24, 28, 32, 36, 40];

// [title, description, venue, ticketPrice, capacity (null = unlimited), time]
const CATALOG = {
  Music: [
    ['Open Mic Night at Blue Note Cafe', 'An evening of poetry, music and comedy. All performers and audiences welcome!', 'Blue Note Cafe', 0, 50, '19:00'],
    ['Sufi Evening with Live Qawwali', 'Soulful Sufi and Qawwali performances by local artists under the evening sky.', 'Punjab Kala Bhawan', 300, 200, '18:30'],
    ['Indie Band Battle', 'Six up-and-coming bands compete live. The crowd votes for the winner.', 'The Backstage Arena', 250, 150, '17:00'],
    ['Classical Sitar Recital', 'A calm evening of Hindustani classical sitar with tabla accompaniment.', 'Guru Nanak Bhawan', 150, 120, '18:00'],
    ['Bollywood Beats DJ Night', 'Dance the night away to Bollywood and Punjabi hits spun live by city DJs.', 'Skyline Lounge', 500, 180, '21:00'],
  ],
  Workshop: [
    ['Pottery for Beginners', 'Learn to centre clay and shape your first bowl on the wheel. Materials included.', 'The Clay Studio', 799, 15, '11:00'],
    ['Photography Walk & Basics', 'Learn composition and light while walking through the Rose Garden. Bring any camera or phone.', 'Rose Garden', 399, 20, '06:30'],
    ['Candle Making Workshop', 'Make two scented soy candles to take home. No experience needed.', 'Craft Corner', 599, 18, '15:00'],
    ['Public Speaking Masterclass', 'Beat stage fright with practical exercises, feedback and a short live speech.', 'The Learning Loft', 499, 25, '16:00'],
    ['Home Gardening Basics', 'Start a kitchen garden: soil, seeds, pots and seasonal plants for Punjab weather.', 'PAU Garden Nursery', 0, 40, '09:00'],
  ],
  Festival: [
    ['Diwali Mela & Festival of Lights', 'Stalls, diyas, rangoli contests, sweets and a fireworks finale for the whole family.', 'City Grounds', 0, null, '17:00'],
    ['Lohri Bonfire Night', 'Celebrate Lohri around a giant bonfire with bhangra, gajak, rewri and popcorn.', 'Gurdev Lawns', 100, 400, '18:30'],
    ['Rang Utsav Holi Bash', 'Organic colours, dhol beats, water guns and a thandai counter. Wear white!', 'Sunrise Farms', 350, 500, '10:00'],
    ['Winter Carnival', 'Rides, games, hot chocolate and live music in a festive winter-market setting.', 'Aarti Chowk Grounds', 50, null, '16:00'],
    ['Virsa Punjabi Folk Festival', 'Folk music, giddha, bhangra, handicrafts and traditional Punjabi food.', 'Punjab Kala Bhawan', 0, 600, '15:00'],
  ],
  Sports: [
    ['Weekend Football Meetup', 'Casual 5-a-side football for all skill levels. Bring your own boots!', 'Guru Nanak Stadium', 0, 20, '07:00'],
    ['Ludhiana 10K Fun Run', 'A friendly 10K and 5K run through the city. Timing chips and medals for all finishers.', 'Rose Garden Gate 1', 300, 500, '05:30'],
    ['Badminton Doubles Tournament', 'Knock-out doubles tournament with separate beginner and advanced brackets.', 'PAU Indoor Stadium', 200, 64, '09:00'],
    ['Box Cricket League Trials', 'Open trials for the city box-cricket league. Teams of six, tennis ball.', 'Sports Arena Dugri', 100, 60, '16:00'],
    ['Sunrise Yoga & Fitness Session', 'A guided morning of yoga, stretching and light cardio for all levels.', 'Rose Garden Lawn', 0, 60, '06:00'],
  ],
  Food: [
    ['City Food Festival', 'Street food, live cooking demos and local delicacies from across the region.', 'City Grounds', 0, null, '12:00'],
    ['Punjabi Street Food Walk', 'A guided tasting walk through old-city lanes: kulcha, lassi, jalebi and more.', 'Chaura Bazaar', 250, 20, '17:00'],
    ['Sourdough Baking Masterclass', 'Make and bake your own sourdough loaf, with starter to take home.', "The Baker's Table", 899, 12, '10:30'],
    ['Chai & Chaat Evening', 'Unlimited chai paired with chaat, pakoras and live acoustic music.', 'Model Town Market Square', 99, 80, '17:30'],
    ['Vegan Food Pop-up', 'A one-day pop-up with plant-based Punjabi comfort food and desserts.', 'Green Bowl Cafe', 150, 40, '13:00'],
  ],
  Education: [
    ['Career Guidance Seminar for Class 12', 'Experts explain courses, entrance exams and career paths after school.', 'DAV Auditorium', 0, 300, '10:00'],
    ['Free Spoken English Class', 'Practical conversation practice with activities, games and feedback.', 'Community Learning Centre', 0, 35, '17:00'],
    ['Junior Science Fair', 'Kids showcase their working models and experiments. Judges, prizes and demos.', 'Govt. College for Girls Hall', 0, null, '10:30'],
    ['Study Abroad Info Session', 'Admissions, scholarships, visas and budgeting for studying overseas.', 'The Learning Loft', 0, 100, '15:00'],
    ['Competitive Exam Strategy Talk', 'Toppers share study plans, time management and revision strategies.', 'PAU Auditorium', 50, 250, '11:00'],
  ],
  Meetup: [
    ['Book Lovers Meetup', 'Bring a book you love, swap recommendations and chat over coffee.', 'Page Turner Cafe', 0, 30, '16:00'],
    ['Board Game Night', 'Catan, Codenames, Uno and more. Beginners welcome, snacks available.', 'Dice & Dine', 100, 24, '19:00'],
    ['Startup Founders Coffee Meetup', 'An informal catch-up for founders and aspiring founders to share notes.', 'Tech Hub Coworking', 0, 40, '09:30'],
    ['Sunday Cyclists Ride', 'A relaxed 20 km group ride around the city. Helmets recommended.', 'Rose Garden Gate 2', 0, 50, '06:00'],
    ['Language Exchange Meetup', 'Practise English, Hindi, Punjabi or French with friendly native speakers.', 'The Reading Room', 0, 30, '18:00'],
  ],
  Technology: [
    ['React Native Bootcamp', 'A hands-on full-day workshop covering React Native fundamentals and Expo.', 'Tech Hub Coworking', 499, 30, '10:00'],
    ['Intro to AI & Machine Learning', 'A beginner-friendly session on how AI works, with live demos and Q&A.', 'Innovation Lab, GNDEC', 0, 120, '14:00'],
    ['24-Hour Hackathon', 'Form a team, build a project overnight and pitch it to judges. Food provided.', 'Startup Hub Ludhiana', 200, 100, '09:00'],
    ['Cybersecurity Awareness Talk', 'Learn to spot phishing, secure your accounts and stay safe online.', 'Chitkara Seminar Hall', 0, 150, '15:30'],
    ['Women in Tech Panel', 'Engineers and founders share their journeys and advice for the next generation.', 'Tech Hub Coworking', 0, 80, '17:00'],
  ],
  Business: [
    ['Startup Pitch Night', 'Ten early-stage startups pitch to local investors and mentors.', 'Startup Hub Ludhiana', 100, 120, '18:00'],
    ['Small Business Marketing Summit', 'Practical social media, branding and local advertising tips for shop owners.', 'Hotel Park Plaza Banquet', 500, 200, '10:00'],
    ['Entrepreneurs Networking Breakfast', 'Meet fellow business owners over a relaxed breakfast with a short keynote.', 'The Grand Cafe', 300, 60, '08:30'],
    ['Financial Planning for Young Professionals', 'Savings, SIPs, insurance and taxes explained in plain language.', 'Chamber of Commerce Hall', 0, 100, '17:00'],
    ['Manufacturers Networking Meet', "Ludhiana's hosiery, cycle and engineering makers connect with buyers and suppliers.", 'Industrial Area Convention Centre', 250, 250, '11:00'],
  ],
  Art: [
    ['Local Artists Exhibition', 'Paintings, sketches and mixed media from 25 Ludhiana artists.', 'Punjab Kala Bhawan Gallery', 0, null, '11:00'],
    ['Live Mural Painting', 'Watch local artists paint a community mural live, and add a brushstroke yourself.', 'Ghumar Mandi Wall', 0, null, '10:00'],
    ['Watercolour Sunday', 'A relaxed beginner-friendly watercolour session. Paper and paints provided.', 'The Clay Studio', 449, 20, '11:00'],
    ['Street Photography Showcase', 'An exhibition of city street photographs with the photographers present.', 'Gallery 22', 0, null, '12:00'],
    ['Kids Art & Craft Fair', 'Craft stalls, face painting and a drawing competition for children.', 'City Grounds', 50, null, '10:30'],
  ],
  Culture: [
    ['Bhangra Dance Workshop', "Learn bhangra steps from professional dancers, with a short group performance at the end.", 'Dance Studio One', 250, 40, '17:00'],
    ['Old Ludhiana Heritage Walk', 'A guided walk through old markets, havelis and historic gurdwaras.', 'Clock Tower Chowk', 100, 25, '07:30'],
    ['Shayari & Poetry Evening', 'Urdu, Hindi and Punjabi poetry with open-mic slots for new voices.', 'Page Turner Cafe', 0, 60, '18:30'],
    ['Kathak Dance Performance', 'A classical Kathak recital by award-winning performers.', 'Guru Nanak Bhawan', 200, 150, '18:00'],
    ['Street Play Festival', 'Local theatre groups perform socially themed street plays across the day.', 'Aarti Chowk Grounds', 0, null, '16:00'],
  ],
  Charity: [
    ['Blood Donation Camp', 'Donate blood and save lives. Refreshments and certificates for all donors.', 'Civil Hospital Annexe', 0, 200, '09:00'],
    ['Charity Run for Education', 'Every registration funds school supplies for children in need.', 'Rose Garden Gate 1', 200, 300, '06:00'],
    ['Winter Clothes Donation Drive', 'Drop off warm clothes and blankets for families in need this winter.', 'Community Hall, Model Town', 0, null, '10:00'],
    ['Tree Plantation Drive', 'Plant native saplings with volunteers. Tools and saplings provided.', 'Sidhwan Canal Bank', 0, 150, '08:00'],
    ['Free Health Check-up Camp', 'Free BP, sugar and general check-ups with doctors from local hospitals.', 'Gurudwara Dukh Niwaran Hall', 0, null, '09:30'],
  ],
};

// Midnight (UTC) of "today + N days", based on the moment the script runs - the same
// format events created in the app use. Nothing here is a fixed calendar date.
const dayFromToday = (days) => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days));
};

// ---------------------------------------------------------------------------
// Event photos (free-to-use, no attribution required: Pexels License).
//
// 1. If utils/sampleImages.json exists (created by `node utils/fetchSampleImages.js`, which
//    downloads Pixabay photos into server/uploads/samples/), those are used - that gives
//    all 12 categories topical photos, served by your own backend.
// 2. Otherwise the built-in photos below are used for the categories that have them.
// 3. Any category with neither gets a generic photo from picsum.photos, so no event
//    is ever left without an image.
// ---------------------------------------------------------------------------
const px = (path) => `https://images.pexels.com/photos/${path}?auto=compress&cs=tinysrgb&w=1200`;

const BUILT_IN_PHOTOS = {
  Music: [
    px('3867522/pexels-photo-3867522.jpeg'),
    px('31593663/pexels-photo-31593663/free-photo-of-dramatic-concert-spotlight-on-flute-player.jpeg'),
    px('29872936/pexels-photo-29872936/free-photo-of-silhouette-of-rock-band-performing-live-on-stage.jpeg'),
    px('5179915/pexels-photo-5179915.jpeg'),
    px('15016142/pexels-photo-15016142/free-photo-of-dj-on-stage.jpeg'),
  ],
  Workshop: [
    px('26733190/pexels-photo-26733190/free-photo-of-close-up-of-a-person-making-pottery-on-a-pottery-wheel.jpeg'),
    px('17846719/pexels-photo-17846719/free-photo-of-potter-hands-working-on-clay.jpeg'),
    px('18659839/pexels-photo-18659839/free-photo-of-artisan-making-clay-pot.jpeg'),
    px('8063876/pexels-photo-8063876.jpeg'),
    px('6611314/pexels-photo-6611314.jpeg'),
  ],
  Festival: [
    px('3052306/pexels-photo-3052306.jpeg'),
    px('19488965/pexels-photo-19488965/free-photo-of-crowd-watching-a-concert-at-a-festival.jpeg'),
    px('17570361/pexels-photo-17570361/free-photo-of-view-of-audience-and-illuminated-stage-at-a-concert-during-a-festival.jpeg'),
    px('30215615/pexels-photo-30215615/free-photo-of-vibrant-concert-crowd-with-smoke-effects.jpeg'),
    px('36257830/pexels-photo-36257830/free-photo-of-vibrant-concert-scene-with-crowd-and-fire-effects.jpeg'),
  ],
  Food: [
    px('28123730/pexels-photo-28123730/free-photo-of-a-man-selling-food-on-a-street-in-a-city.jpeg'),
    px('36921226/pexels-photo-36921226/free-photo-of-street-food-chef-cooking-stir-fry-in-a-wok.jpeg'),
    px('37113412/pexels-photo-37113412/free-photo-of-traditional-flatbread-grilling-outdoors.jpeg'),
    px('37330316/pexels-photo-37330316/free-photo-of-traditional-indian-cooking-with-leaf-wrapping.jpeg'),
    px('37330314/pexels-photo-37330314.jpeg'),
  ],
};

let FETCHED_PHOTOS = {};
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  FETCHED_PHOTOS = require('./sampleImages.json');
} catch (e) {
  // not generated yet - built-in photos / fallback are used
}

const imageFor = (category, index) => {
  const pool = (FETCHED_PHOTOS[category] && FETCHED_PHOTOS[category].length ? FETCHED_PHOTOS[category] : BUILT_IN_PHOTOS[category]) || [];
  if (pool.length) return pool[index % pool.length];
  return `https://picsum.photos/seed/eventify-${category.toLowerCase()}-${index}/1200/800`;
};

/**
 * @param {*} organizerId - ObjectId of the organizer who owns every sample event
 * @returns {object[]} plain event documents, ready for Event.insertMany
 */
const buildSampleEvents = (organizerId) => {
  const events = [];
  let n = 0;

  Object.entries(CATALOG).forEach(([category, list]) => {
    list.forEach(([title, description, venue, ticketPrice, capacity, time], i) => {
      const area = AREAS[(n * 3 + i) % AREAS.length];
      const jitter = ((n % 5) - 2) * 0.0015; // keep markers from stacking on the exact same spot
      const days = DAY_OFFSETS[(n * 5 + i * 2) % DAY_OFFSETS.length];

      events.push({
        title,
        description,
        category,
        date: dayFromToday(days),
        time,
        venue,
        address: `${area.road}, Ludhiana`,
        city: 'Ludhiana',
        location: { type: 'Point', coordinates: [area.lng + jitter, area.lat - jitter] }, // GeoJSON: [lng, lat]
        organizer: organizerId,
        ticketPrice,
        capacity,
        images: [imageFor(category, i)],
        isFeatured: i === 0, // one featured event per category
        viewCount: 20 + ((n * 37) % 380), // varied counts so "Trending" has something to rank
      });
      n += 1;
    });
  });

  return events;
};

module.exports = { buildSampleEvents };