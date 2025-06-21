const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, enum: ['casual', 'sick', 'half-day'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  days: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  currentStage: { type: String, enum: ['hod', 'principal', 'final'], default: 'hod' },
  hodStatus: { type: String, enum: ['pending', 'recommended', 'rejected'], default: 'pending' },
  principalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
