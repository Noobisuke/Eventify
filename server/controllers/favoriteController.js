const Favorite = require('../models/Favorite');
const Event = require('../models/Event');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/favorites/:eventId
 * @desc    Save/favorite an event
 * @access  Private
 */
const addFavorite = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const existing = await Favorite.findOne({ user: req.user._id, event: eventId });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Event already saved' });
  }

  await Favorite.create({ user: req.user._id, event: eventId });
  res.status(201).json({ success: true, message: 'Event saved to favorites' });
});

/**
 * @route   DELETE /api/favorites/:eventId
 * @desc    Remove an event from favorites
 * @access  Private
 */
const removeFavorite = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const result = await Favorite.findOneAndDelete({ user: req.user._id, event: eventId });

  if (!result) {
    return res.status(404).json({ success: false, message: 'Favorite not found' });
  }

  res.status(200).json({ success: true, message: 'Event removed from favorites' });
});

/**
 * @route   GET /api/favorites
 * @desc    Get all favorited events for logged-in user
 * @access  Private
 */
const getFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id })
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name avatar' },
    })
    .sort({ createdAt: -1 });

  // Filter out any favorites whose event was deleted
  const events = favorites.filter((f) => f.event).map((f) => f.event);

  res.status(200).json({ success: true, count: events.length, events });
});

module.exports = { addFavorite, removeFavorite, getFavorites };
