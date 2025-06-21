// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Leave = require('../models/Leave');
const authMiddleware = require('../middleware/authMiddleware');
const LeaveBalance= require('../models/LeaveBalance')

// Middleware: admin-only
const requireAdmin = authMiddleware(['admin']);


router.post('/user/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { is_approved: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User approved successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve user' });
  }
});
// GET /api/admin/users
router.get('/users', authMiddleware(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password'); // exclude password
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/pending-users
router.get('/pending-users', requireAdmin, async (req, res) => {
  const pendingUsers = await User.find({ is_approved: false });
  res.json(pendingUsers);
});

// PATCH /api/admin/approve-user/:id
router.patch('/approve-user/:userId', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.is_approved = true;
    await user.save();

    await sendMail({
      to: user.email,
      subject: 'Your account has been approved',
      text: `Hi ${user.name}, your account has been verified and approved. You can now log in.`,
      html: `<p>Hi <strong>${user.name}</strong>, your account has been verified and approved. You can now log in.</p>`,
    });

    res.json({ message: 'User approved and notified.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/leaves
router.get('/leaves', requireAdmin, async (req, res) => {
  const leaves = await Leave.find().populate('user', 'name email role');
  res.json(leaves);
});

router.post('/init-leave/:userId', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingBalance = await LeaveBalance.findOne({ user: user._id });
    if (existingBalance) {
      return res.status(400).json({ message: 'Leave balance already initialized for this user' });
    }

    // Determine initial leaves based on designation
    let casualLeave = 12;
    let sickLeave = 8;
    if (user.designation === 'Lab assistant') {
      casualLeave = 10;
      sickLeave = 5;
    }

    const leaveBalance = new LeaveBalance({
      user: user._id,
      casualLeave,
      sickLeave,
      halfDay: 0,
    });

    await leaveBalance.save();

    res.json({ message: 'Leave balance initialized successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



router.delete('/user/:userId', authMiddleware(['admin']), async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete user's leaves and leave balances if you want a clean-up
    await Leave.deleteMany({ user: userId });
    await LeaveBalance.deleteOne({ user: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/user/:id/leaves', async (req, res) => {
  const { cl, sl } = req.body;
  await User.findByIdAndUpdate(req.params.id, {
    leave: { cl, sl },
  });
  res.send({ message: 'Leaves updated' });
});
module.exports = router;
