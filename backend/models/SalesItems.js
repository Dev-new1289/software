const mongoose = require('mongoose');

const salesItemSchema = new mongoose.Schema({
  sales_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sales', // Assuming this refers to the Sale model
    required: true,
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventories', // Changed from 'inventories' to 'Inventories'
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
}

);

const SalesItems = mongoose.model('SalesItems', salesItemSchema);

module.exports = SalesItems;
