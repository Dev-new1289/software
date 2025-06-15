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
