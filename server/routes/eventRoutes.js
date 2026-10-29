const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getEventAttendees,
  reportEvent,
  rateEvent,
} = require('../controllers/eventController');

// Order matters: specific routes before /:id
router.get('/organizer/mine', protect, authorize('organizer', 'admin'), getMyEvents);

router.get('/', optionalAuth, getEvents);

router.post(
  '/',
  protect,
  authorize('organizer', 'admin'),
  upload.array('images', 5),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    body('venue').notEmpty().withMessage('Venue is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
  ],
  validate,
  createEvent
);

router.get('/:id', getEventById);
router.put('/:id', protect, upload.array('images', 5), updateEvent);
router.delete('/:id', protect, deleteEvent);

router.get('/:id/attendees', protect, getEventAttendees);
router.post('/:id/report', protect, reportEvent);
router.post(
  '/:id/rate',
  protect,
  [body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5')],
  validate,
  rateEvent
);

module.exports = router;
