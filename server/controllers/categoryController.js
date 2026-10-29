const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/categories
 * @desc    List all categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({ success: true, count: categories.length, categories });
});

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private (admin)
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, color, description } = req.body;
  const existing = await Category.findOne({ name });
  if (existing) return res.status(400).json({ success: false, message: 'Category already exists' });

  const category = await Category.create({ name, icon, color, description });
  res.status(201).json({ success: true, category });
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category
 * @access  Private (admin)
 */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.status(200).json({ success: true, category });
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Private (admin)
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.status(200).json({ success: true, message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
