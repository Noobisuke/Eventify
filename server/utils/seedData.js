/**
 * Seed script - populates the database with sample categories, users, and events.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Category = require('../models/Category');
const { buildSampleEvents } = require('./sampleEvents');

const categories = [
  { name: 'Music', icon: 'music-note', color: '#FF6B6B' },
  { name: 'Workshop', icon: 'tools', color: '#4ECDC4' },
  { name: 'Festival', icon: 'party-popper', color: '#FFD93D' },
  { name: 'Sports', icon: 'basketball', color: '#1A936F' },
  { name: 'Food', icon: 'food', color: '#FF9F1C' },
  { name: 'Education', icon: 'school', color: '#6C63FF' },
  { name: 'Meetup', icon: 'account-group', color: '#3D5A80' },
  { name: 'Technology', icon: 'laptop', color: '#118AB2' },
  { name: 'Business', icon: 'briefcase', color: '#073B4C' },
  { name: 'Art', icon: 'palette', color: '#EF476F' },
  { name: 'Culture', icon: 'bank', color: '#8338EC' },
  { name: 'Charity', icon: 'hand-heart', color: '#06D6A0' },
];

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([User.deleteMany({}), Event.deleteMany({}), Category.deleteMany({})]);

  console.log('Seeding categories...');
  await Category.insertMany(categories);

  console.log('Seeding users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  });

  const organizer = await User.create({
    name: 'Priya Sharma',
    email: 'organizer@example.com',
    password: 'organizer123',
    role: 'organizer',
    bio: 'Community event organizer passionate about local culture.',
  });

  const regularUser = await User.create({
    name: 'Rahul Verma',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
  });

  console.log('Seeding events...');
  const sampleEvents = buildSampleEvents(organizer._id);
  await Event.insertMany(sampleEvents);
  console.log(`   ${sampleEvents.length} events added (5 per category)`);

  console.log('✅ Seed complete!');
  console.log('   Admin login:     admin@example.com / admin123');
  console.log('   Organizer login: organizer@example.com / organizer123');
  console.log('   User login:      user@example.com / user123');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});