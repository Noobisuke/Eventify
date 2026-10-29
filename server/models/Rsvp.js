const mongoose = require('mongoose');

/**
 * Standalone RSVP collection, kept in addition to Event.attendees so that
 * we can query "events a user is attending" efficiently without scanning
 * every event document.
 */
const rsvpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['going', 'interested', 'cancelled'],
      default: 'going',
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    qrCode: {
      type: String, // unique token encoded into the QR for check-in
      default: '',
    },
  },
  { timestamps: true }
);

rsvpSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Rsvp', rsvpSchema);
