/**
 * Moves the sample events (the ones owned by the seeded organizer account,
 * organizer@example.com) that are already in the past to dates in the near future.
 *
 * Unlike `npm run seed`, this does NOT delete anything - your users, your own events,
 * RSVPs and categories are left untouched.
 *
 * Run with: node utils/refreshSampleEvents.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');

const DAY = 24 * 60 * 60 * 1000;
const OFFSETS_DAYS = [3, 5, 10, 15, 20, 25, 30];

const run = async () => {
  await connectDB();

  const organizer = await User.findOne({ email: 'organizer@example.com' });
  if (!organizer) {
    console.log('Seeded organizer account (organizer@example.com) not found - nothing to refresh.');
    return;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const pastEvents = await Event.find({ organizer: organizer._id, date: { $lt: startOfToday } }).sort({ createdAt: 1 });

  for (let i = 0; i < pastEvents.length; i += 1) {
    const days = OFFSETS_DAYS[i % OFFSETS_DAYS.length];
    await Event.updateOne({ _id: pastEvents[i]._id }, { $set: { date: new Date(Date.now() + days * DAY) } });
    console.log(`Moved "${pastEvents[i].title}" to ${days} days from now`);
  }

  console.log(pastEvents.length ? `✅ Refreshed ${pastEvents.length} event(s).` : 'No past sample events to refresh.');
};

run()
  .catch((err) => {
    console.error('Refresh error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });