const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    icon: {
      type: String, // icon name (e.g. from a library like MaterialCommunityIcons)
      default: 'calendar',
    },
    color: {
      type: String, // hex color for UI badges
      default: '#6C63FF',
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
