const mongoose = require('mongoose');

const cashDataSchema = new mongoose.Schema({
  inv_no: {
    type: Number,
    required: true,
  },
  date: {
    type: Date, // Change type to Date
    required: true,
  },
  cust_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // Reference to the Customer collection
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  detail: {
    type: String,
    required: false, // Optional field
  },
}
);

const CashData = mongoose.model('CashData', cashDataSchema);

module.exports = CashData;
