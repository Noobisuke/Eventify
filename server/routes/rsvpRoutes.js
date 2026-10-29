const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createRsvp, cancelRsvp, getMyRsvps, checkInByQrCode } = require('../controllers/rsvpController');

router.get('/mine', protect, getMyRsvps);
router.post('/checkin', protect, authorize('organizer', 'admin'), checkInByQrCode);
router.post('/:eventId', protect, createRsvp);
router.delete('/:eventId', protect, cancelRsvp);

module.exports = router;
