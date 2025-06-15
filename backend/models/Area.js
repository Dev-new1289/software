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
