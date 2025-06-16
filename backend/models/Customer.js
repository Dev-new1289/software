const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  cust_id: {
    type: Number,
  },
  customer_name: {
    type: String,
    required: true,
  },
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true,
  },
  balance_bf: {
    type: Number,
    default: 0,
  },
  sales: {
    type: Number,
    required: true,
  },
  received: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  less: {
    type: Number,
    default: 0,
  },
  phone: {
    type: String,
    default: '',
  },
}
);

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
