const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  area_id: {
    type: Number,
    required: true,
  },
  area_name: {
    type: String,
    required: true,
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AreaGroup', // Reference to the AreaGroup collection
    required: true,
  },
}

);

const Area = mongoose.model('Area', areaSchema);

module.exports = Area;
const mongoose = require('mongoose');

const areaGroupSchema = new mongoose.Schema({
  group_id: {
    type: Number,
    required: true,
  },
  area_group: {
    type: String,
    required: true,
  },
}
);

const AreaGroup = mongoose.model('AreaGroup', areaGroupSchema);

module.exports = AreaGroup;
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
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  cust_id: {
    type: Number,
    required: true,
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
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  item_id: {
    type: Number,
    required: true,
  },
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
  received: {
    type: Number,
    required: true,
  },
  issued: {
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
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  sale_id: {
    type: Number,
    required: true,
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
const mongoose = require('mongoose');

const salesItemSchema = new mongoose.Schema({
  sales_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sales', // Assuming this refers to the Sale model
    required: true,
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'inventories', // Assuming this refers to the Item model
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
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // Adds `createdAt` and `updatedAt` fields
});

const User = mongoose.model('User', userSchema);

module.exports = User;
