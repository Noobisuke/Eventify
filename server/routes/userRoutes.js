const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUserProfile,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAnalytics,
  moderateEvent,
} = require('../controllers/userController');

// Admin routes (placed before /:id to avoid route collisions)
router.get('/admin/analytics', protect, authorize('admin'), getAnalytics);
router.put('/admin/events/:id/approve', protect, authorize('admin'), moderateEvent);
router.get('/', protect, authorize('admin'), getAllUsers);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);
router.put('/:id/status', protect, authorize('admin'), toggleUserStatus);
router.delete('/:id', protect, authorize('admin'), deleteUser);

// Public profile route
router.get('/:id', getUserProfile);

module.exports = router;
