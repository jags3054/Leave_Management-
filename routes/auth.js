const express = require('express'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const LeaveBalance = require('../models/LeaveBalance');
const sendMail = require('../utils/sendMail');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', // or another email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      department,
      designation,
      doj,
    } = req.body;

    // 1. Basic Validation
    if (!name || !email || !password || !role || !doj) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    // 2. Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create and save the user (leave balance NOT initialized here)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      department,
      designation,
      doj: new Date(doj),
      is_approved: false, // admin approval required
    });

    await user.save();

  await LeaveBalance.create({
      user: user._id,
      CL: 0,
      SL: 0,
      HalfDay: 0,
      DL: 0,
      CO: 0,
    });

const admins = await User.find({ role: 'admin' });
    admins.forEach(admin => {
      sendMail({
        to: admin.email,
        subject: 'New User Registration Awaiting Approval',
        text: `User ${user.name} has registered and is awaiting your approval.`,
        html: `<p>User <strong>${user.name} Department ${user.department}</strong> has registered and is awaiting your approval.</p>`,
      }).catch(console.error);
    });

    res.status(201).json({ message: 'User registered successfully. Await approval.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: 'Invalid email or password' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

  if (!user.is_approved)
    return res.status(403).json({ message: 'Account not approved by admin yet.' });

  // 🔐 Generate token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // const resetUrl = `https://leave-management-zeta.vercel.app/reset-password?token=${token}`;
     const resetUrl = `https://leave-management-le4p.onrender.com/reset-password?token=${token}`;

    await transporter.sendMail({
      from: '"Leave System" <noreply@example.com>',
      to: email,
      subject: 'Password Reset Link',
      html: `<p>Click to reset password:</p><a href="${resetUrl}">${resetUrl}</a>`
    });

    res.json({ message: 'Reset link sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = password; // assume hashed in pre-save hook
    await user.save();

    res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});




module.exports = router