// server/controllers/menuController.js

const MenuItem = require('../models/MenuItem.js');

const getMenu = async (req, res) => {
  try {
    const items = await MenuItem.find({});
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch menu' });
  }
};

const addMenuItem = async (req, res) => {
  const { name, description, price, image, isSpecial } = req.body;
  try {
    const newItem = new MenuItem({ name, description, price, image, isSpecial });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add item' });
  }
};

const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updated = await MenuItem.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Item not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
};

const deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Deletion failed' });
  }
};

module.exports = {
  getMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
