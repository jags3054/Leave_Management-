const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['staff', 'hod', 'principal','admin'], required: true },
  phone: String,
  department: String,
  designation: String,
  doj: Date,
  is_approved: { type: Boolean, default: false },
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);