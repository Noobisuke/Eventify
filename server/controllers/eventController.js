const Event = require('../models/Event');
const { asyncHandler } = require('../middleware/errorHandler');
const { useCloudinary } = require('../config/cloudinary');

// Cloudinary storage puts the hosted URL in file.path; local disk storage puts
// the absolute filesystem path there instead, which is useless to the client -
// build a `/uploads/<filename>` URL from file.filename in that case.
const resolveUploadedImage = (file) => (useCloudinary ? file.path : `/uploads/${file.filename}`);

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private (organizer, admin)
 */
const createEvent = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    date,
    time,
    venue,
    address,
    city,
    latitude,
    longitude,
    ticketPrice,
    capacity,
    contactNumber,
    website,
    socialLinks,
  } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
  }

  const images = (req.files || []).map(resolveUploadedImage);

  const event = await Event.create({
    title,
    description,
    category,
    date,
    time,
    venue,
    address,
    city,
    location: {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    },
    organizer: req.user._id,
    ticketPrice: ticketPrice || 0,
    capacity: capacity || null,
    images,
    contactNumber,
    website,
    socialLinks,
  });

  res.status(201).json({ success: true, message: 'Event created', event });
});

/**
 * @route   GET /api/events
 * @desc    List events with search, filters, and pagination
 * @access  Public
 * Query params:
 *   search, category, city, freeOnly, dateFrom, dateTo,
 *   lat, lng, distance (meters), sort (trending|upcoming|popular|newest),
 *   page, limit
 */
const getEvents = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    city,
    freeOnly,
    dateFrom,
    dateTo,
    includePast,
    lat,
    lng,
    distance,
    sort,
    page = 1,
    limit = 10,
  } = req.query;

  const query = { isApproved: true };

  if (category) query.category = category;
  if (city) query.city = new RegExp(`^${city}$`, 'i');
  if (freeOnly === 'true') query.ticketPrice = 0;

  // By default only show events that haven't happened yet (today counts as upcoming).
  // Pass includePast=true (e.g. admin moderation) to see everything, or dateFrom/dateTo
  // to choose an explicit range.
  if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) query.date.$gte = new Date(dateFrom);
    if (dateTo) query.date.$lte = new Date(dateTo);
  } else if (includePast !== 'true') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    query.date = { $gte: startOfToday };
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Geospatial "near me" filter
  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: distance ? parseInt(distance, 10) : 20000, // default 20km
      },
    };
  }

  let sortOption = { date: 1 }; // default: soonest first
  if (sort === 'trending' || sort === 'popular') sortOption = { viewCount: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };
  if (sort === 'upcoming') sortOption = { date: 1 };

  // $near queries in Mongo require location to be the primary sort; skip custom sort in that case
  const useGeoSort = Boolean(lat && lng);

  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
  const skip = (pageNum - 1) * limitNum;

  let eventsQuery = Event.find(query).populate('organizer', 'name avatar');
  if (!useGeoSort) eventsQuery = eventsQuery.sort(sortOption);

  // countDocuments() runs as an aggregation $match internally, and $near/$nearSphere
  // are rejected there ("not allowed in this context... require sorting geospatial
  // data") since $match can't honor their implicit distance sort. $geoWithin has no
  // such restriction and, given the same center + radius, matches the same
  // documents as $near with $maxDistance - so swap to it just for the count.
  let countQuery = query;
  if (useGeoSort) {
    const EARTH_RADIUS_METERS = 6378100;
    const { $geometry, $maxDistance } = query.location.$near;
    countQuery = {
      ...query,
      location: {
        $geoWithin: {
          $centerSphere: [$geometry.coordinates, $maxDistance / EARTH_RADIUS_METERS],
        },
      },
    };
  }

  const [events, total] = await Promise.all([
    eventsQuery.skip(skip).limit(limitNum),
    Event.countDocuments(countQuery),
  ]);

  res.status(200).json({
    success: true,
    count: events.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    events,
  });
});

/**
 * @route   GET /api/events/:id
 * @desc    Get single event details, increments view count
 * @access  Public
 */
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate('organizer', 'name avatar email bio')
    .populate('attendees.user', 'name avatar')
    .populate('ratings.user', 'name avatar');

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  res.status(200).json({ success: true, event });
});

/**
 * @route   PUT /api/events/:id
 * @desc    Update an event (organizer who owns it, or admin)
 * @access  Private
 */
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
  }

  if (!event.isUpcoming && req.user.role !== 'admin') {
    return res.status(400).json({ success: false, message: 'This event has already taken place and can no longer be edited' });
  }

  const updatableFields = [
    'title', 'description', 'category', 'date', 'time', 'venue', 'address', 'city',
    'ticketPrice', 'capacity', 'contactNumber', 'website', 'socialLinks', 'isFeatured',
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      // Only admins can toggle isFeatured
      if (field === 'isFeatured' && req.user.role !== 'admin') return;
      event[field] = req.body[field];
    }
  });

  if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
    event.location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
    };
  }

  if (req.body.removeImages) {
    let toRemove = [];
    try {
      toRemove = JSON.parse(req.body.removeImages);
    } catch (e) {
      toRemove = [];
    }
    if (Array.isArray(toRemove) && toRemove.length > 0) {
      event.images = event.images.filter((img) => !toRemove.includes(img));
    }
  }

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(resolveUploadedImage);
    event.images = [...event.images, ...newImages];
  }

  await event.save();
  res.status(200).json({ success: true, message: 'Event updated', event });
});

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event (owner or admin)
 * @access  Private
 */
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
  }

  await event.deleteOne();
  res.status(200).json({ success: true, message: 'Event deleted' });
});

/**
 * @route   GET /api/events/organizer/mine
 * @desc    Get all events created by the logged-in organizer
 * @access  Private (organizer, admin)
 */
const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: events.length, events });
});

/**
 * @route   GET /api/events/:id/attendees
 * @desc    View attendee list for an event (organizer/admin only)
 * @access  Private
 */
const getEventAttendees = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('attendees.user', 'name email avatar');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to view attendees' });
  }

  res.status(200).json({ success: true, attendees: event.attendees });
});

/**
 * @route   POST /api/events/:id/report
 * @desc    Report an event as inappropriate
 * @access  Private
 */
const reportEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { $inc: { reportCount: 1 } },
    { new: true }
  );
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.status(200).json({ success: true, message: 'Event reported, thank you for the feedback' });
});

/**
 * @route   POST /api/events/:id/rate
 * @desc    Add or update a rating/comment for an event
 * @access  Private
 */
const rateEvent = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const existing = event.ratings.find((r) => r.user.toString() === req.user._id.toString());
  if (existing) {
    existing.rating = rating;
    existing.comment = comment || existing.comment;
  } else {
    event.ratings.push({ user: req.user._id, rating, comment });
  }

  await event.save();
  res.status(200).json({ success: true, message: 'Rating submitted', averageRating: event.averageRating });
});

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getEventAttendees,
  reportEvent,
  rateEvent,
};