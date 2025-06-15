const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  sale_id: {
    type: Number,

  },
  date: {
    type: Date, // Use Date type for the date field
    required: true,
  },
  cust_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // Assuming the sale is linked to a Customer model
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  special_less: {
    type: Number,
    required: true,
  },
  remarks: {
    type: String,
    required: false, // Optional field
  },
}, {
  timestamps: true, // Adds `createdAt` and `updatedAt` fields
});

const Sales = mongoose.model('Sales', saleSchema);

module.exports = Sales;
