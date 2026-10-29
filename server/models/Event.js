const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 3000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Music',
        'Workshop',
        'Festival',
        'Sports',
        'Food',
        'Education',
        'Meetup',
        'Technology',
        'Business',
        'Art',
        'Culture',
        'Charity',
      ],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String, // e.g. "18:30"
      required: [true, 'Event time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      index: true,
    },
    // GeoJSON location for geospatial queries ($near, $geoWithin)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        // [longitude, latitude] - GeoJSON order
        type: [Number],
        required: true,
      },
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketPrice: {
      type: Number,
      default: 0, // 0 = free
      min: 0,
    },
    capacity: {
      type: Number,
      default: null, // null = unlimited
    },
    images: [{ type: String }], // Cloudinary URLs or local paths
    contactNumber: { type: String, default: '' },
    website: { type: String, default: '' },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    attendees: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: {
          type: String,
          enum: ['going', 'interested', 'cancelled'],
          default: 'going',
        },
        rsvpDate: { type: Date, default: Date.now },
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true, // set false if you want admin moderation before publish
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Geospatial index for "nearby events" queries
eventSchema.index({ location: '2dsphere' });

// Text index for full-text search across title/description/venue/city
eventSchema.index({ title: 'text', description: 'text', venue: 'text', city: 'text' });

// Virtual: average rating
eventSchema.virtual('averageRating').get(function () {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Virtual: is event upcoming
eventSchema.virtual('isUpcoming').get(function () {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return this.date >= startOfToday;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);