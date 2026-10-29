const User = require('../models/User');
const Event = require('../models/Event');
const Rsvp = require('../models/Rsvp');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/users/:id
 * @desc    Get a public user profile (organizer info page, etc.)
 * @access  Public
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name avatar bio role createdAt');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const createdEvents = await Event.find({ organizer: user._id, isApproved: true })
    .select('title date images city category')
    .sort({ date: -1 })
    .limit(20);

  res.status(200).json({ success: true, user, createdEvents });
});

// ---------- Admin-only endpoints ----------

/**
 * @route   GET /api/users
 * @desc    List all users (admin)
 * @access  Private (admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [
    { name: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
  ];

  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(query),
  ]);

  res.status(200).json({ success: true, count: users.length, total, page: pageNum, users });
});

/**
 * @route   PUT /api/users/:id/role
 * @desc    Change a user's role (admin)
 * @access  Private (admin)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'organizer', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  res.status(200).json({ success: true, message: 'User role updated', user });
});

/**
 * @route   PUT /api/users/:id/status
 * @desc    Activate/deactivate a user account (admin)
 * @access  Private (admin)
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user account (admin)
 * @access  Private (admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, message: 'User deleted' });
});

/**
 * @route   GET /api/users/admin/analytics
 * @desc    Dashboard analytics summary (admin)
 * @access  Private (admin)
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const [totalUsers, totalOrganizers, totalEvents, totalRsvps, topCategories, reportedEvents] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'organizer' }),
      Event.countDocuments(),
      Rsvp.countDocuments({ status: { $ne: 'cancelled' } }),
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Event.find({ reportCount: { $gt: 0 } })
        .select('title reportCount organizer')
        .sort({ reportCount: -1 })
        .limit(10),
    ]);

  res.status(200).json({
    success: true,
    analytics: {
      totalUsers,
      totalOrganizers,
      totalEvents,
      totalRsvps,
      topCategories,
      reportedEvents,
    },
  });
});

/**
 * @route   PUT /api/users/admin/events/:id/approve
 * @desc    Approve/unapprove an event, or clear its report count (moderation)
 * @access  Private (admin)
 */
const moderateEvent = asyncHandler(async (req, res) => {
  const { isApproved, clearReports } = req.body;
  const update = {};
  if (isApproved !== undefined) update.isApproved = isApproved;
  if (clearReports) update.reportCount = 0;

  const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  res.status(200).json({ success: true, message: 'Event moderated', event });
});

module.exports = {
  getUserProfile,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAnalytics,
  moderateEvent,
};
