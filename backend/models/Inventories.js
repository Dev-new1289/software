const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  length: {
    type: String,
    required: true,
  },
  gauge: {
    type: String,
    required: true,
  },
  net_rate: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  sequence: {
    type: String,
    required: true,
  },
}
);

const Inventories = mongoose.model('Inventories', inventorySchema);

module.exports = Inventories;
