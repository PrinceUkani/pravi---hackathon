import Category from '../models/Category.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, code, description, icon, expectedLifespanYears } = req.body;
    const category = new Category({
      name,
      code: code.toUpperCase().trim(),
      description,
      icon,
      expectedLifespanYears: Number(expectedLifespanYears) || 5,
    });
    await category.save();
    res.status(201).json({ success: true, message: 'Category created.', data: category });
  } catch (error) {
    next(error);
  }
};
