const crypto = require('crypto');
const Rsvp = require('../models/Rsvp');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/rsvp/:eventId
 * @desc    RSVP to an event (going / interested)
 * @access  Private
 */
const createRsvp = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status = 'going' } = req.body;

  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  if (!event.isUpcoming) {
    return res.status(400).json({ success: false, message: 'This event has already taken place' });
  }

  if (event.capacity) {
    const goingCount = event.attendees.filter((a) => a.status === 'going').length;
    if (status === 'going' && goingCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event has reached full capacity' });
    }
  }

  // Generate a unique token for QR-code check-in
  const qrCode = crypto.randomBytes(16).toString('hex');

  const rsvp = await Rsvp.findOneAndUpdate(
    { user: req.user._id, event: eventId },
    { status, qrCode },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Keep Event.attendees in sync for quick reads (e.g. attendee list, capacity check)
  const attendeeIndex = event.attendees.findIndex((a) => a.user.toString() === req.user._id.toString());
  if (attendeeIndex >= 0) {
    event.attendees[attendeeIndex].status = status;
  } else {
    event.attendees.push({ user: req.user._id, status });
  }
  await event.save();

  await Notification.create({
    user: req.user._id,
    type: 'rsvp_confirmation',
    title: 'RSVP Confirmed',
    message: `You're marked as "${status}" for ${event.title}`,
    relatedEvent: event._id,
  });

  res.status(201).json({ success: true, message: 'RSVP recorded', rsvp });
});

/**
 * @route   DELETE /api/rsvp/:eventId
 * @desc    Cancel an RSVP
 * @access  Private
 */
const cancelRsvp = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  await Rsvp.findOneAndUpdate(
    { user: req.user._id, event: eventId },
    { status: 'cancelled' }
  );

  await Event.updateOne(
    { _id: eventId, 'attendees.user': req.user._id },
    { $set: { 'attendees.$.status': 'cancelled' } }
  );

  res.status(200).json({ success: true, message: 'RSVP cancelled' });
});

/**
 * @route   GET /api/rsvp/mine
 * @desc    Get all events the logged-in user has RSVP'd to
 * @access  Private
 */
const getMyRsvps = asyncHandler(async (req, res) => {
  const rsvps = await Rsvp.find({ user: req.user._id, status: { $ne: 'cancelled' } })
    .populate('event')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: rsvps.length, rsvps });
});

/**
 * @route   POST /api/rsvp/checkin
 * @desc    Organizer scans attendee's QR code to check them in
 * @access  Private (organizer, admin)
 */
const checkInByQrCode = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;
  if (!qrCode) return res.status(400).json({ success: false, message: 'qrCode is required' });

  const rsvp = await Rsvp.findOne({ qrCode }).populate('event').populate('user', 'name email');
  if (!rsvp) return res.status(404).json({ success: false, message: 'Invalid QR code' });

  const isOwner = rsvp.event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to check in attendees for this event' });
  }

  if (rsvp.checkedIn) {
    return res.status(400).json({ success: false, message: 'Attendee already checked in', rsvp });
  }

  rsvp.checkedIn = true;
  rsvp.checkedInAt = new Date();
  await rsvp.save();

  res.status(200).json({ success: true, message: `${rsvp.user.name} checked in successfully`, rsvp });
});

module.exports = { createRsvp, cancelRsvp, getMyRsvps, checkInByQrCode };