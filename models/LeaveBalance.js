const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  casualLeave: { type: Number, default: 0 },
  sickLeave: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
