const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // adjust path if needed

 const MONGO_URI="mongodb+srv://patilj922:JQjoh6JwDSvRb0cR@cluster0.m6n6kd7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"


async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin already exists.');
    return process.exit();
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await User.create({
    name: 'Admin',
    email: 'admin@college.com',
    password: hashedPassword,
    role: 'admin',
    is_approved: true,
  });

  console.log('✅ Admin created: admin@college.com / admin123');
  process.exit();
}

createAdmin();
