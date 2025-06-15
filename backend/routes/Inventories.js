const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventories');
const SalesItems = require('../models/SalesItems');

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ sequence: 1 });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new inventory item
router.post('/', async (req, res) => {
  const inventory = new Inventory({
    length: req.body.length,
    gauge: req.body.gauge,
    net_rate: req.body.net_rate,
    cost: req.body.cost,
    stock: req.body.stock,
    sequence: req.body.sequence
  });

  try {
    const newInventory = await inventory.save();
    res.status(201).json(newInventory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    Object.assign(inventory, req.body);
    const updatedInventory = await inventory.save();
    res.json(updatedInventory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if the inventory item is used in any sales items
    const salesItems = await SalesItems.findOne({ item_id: req.params.id });
    if (salesItems) {
      return res.status(400).json({ 
        message: 'Cannot delete this inventory item as it is being used in sales records' 
      });
    }

    await inventory.deleteOne();
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;