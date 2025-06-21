const express = require('express'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const LeaveBalance = require('../models/LeaveBalance');
const sendMail = require('../utils/sendMail');


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

module.exports = router