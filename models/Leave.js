const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: Date,
  endDate: Date,
  reason: String,
  days: Number,
  leaveType: String,
  status: String, // pending/approved/rejected
  hod_status: { type: String, enum: ['pending', 'recommended', 'rejected'], default: 'pending' },
  principal_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  current_stage: { type: String, enum: ['hod', 'principal', 'final'], default: 'hod' },
  reject_reason: String,
});

module.exports = mongoose.model('Leave', leaveSchema);
