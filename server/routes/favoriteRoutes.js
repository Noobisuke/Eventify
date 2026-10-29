const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { addFavorite, removeFavorite, getFavorites } = require('../controllers/favoriteController');

router.get('/', protect, getFavorites);
router.post('/:eventId', protect, addFavorite);
router.delete('/:eventId', protect, removeFavorite);

module.exports = router;
