const mongoose = require('mongoose');
const balSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref:'User' },
  casualLeave: { type: Number, default: 12 },
  sickLeave: { type: Number, default: 8 },
  halfDay: { type: Number, default: 4 }
});
module.exports = mongoose.model('LeaveBalance', balSchema);
