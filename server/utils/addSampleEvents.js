/**
 * Adds (or refreshes) the sample events WITHOUT deleting anything else.
 *
 * - Uses the seeded organizer account (organizer@example.com), creating it if missing.
 * - Removes only that organizer's previous sample events (matched by sample title),
 *   then inserts fresh ones with new upcoming dates - so it's safe to run repeatedly.
 * - Your users, your own events, RSVPs and categories are untouched.
 *
 * Run with: node utils/addSampleEvents.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const { buildSampleEvents } = require('./sampleEvents');

const run = async () => {
  await connectDB();

  let organizer = await User.findOne({ email: 'organizer@example.com' });
  if (!organizer) {
    organizer = await User.create({
      name: 'Priya Sharma',
      email: 'organizer@example.com',
      password: 'organizer123',
      role: 'organizer',
      bio: 'Community event organizer passionate about local culture.',
    });
    console.log('Created organizer account organizer@example.com / organizer123');
  }

  const events = buildSampleEvents(organizer._id);
  const titles = events.map((e) => e.title);

  const removed = await Event.deleteMany({ organizer: organizer._id, title: { $in: titles } });
  await Event.insertMany(events);

  console.log(`✅ Added ${events.length} sample events (replaced ${removed.deletedCount} older copies).`);
};

run()
  .catch((err) => {
    console.error('Add sample events error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });