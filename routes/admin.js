// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Leave = require('../models/Leave');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware: admin-only
const requireAdmin = authMiddleware(['admin']);

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// GET /api/admin/pending-users
router.get('/pending-users', requireAdmin, async (req, res) => {
  const pendingUsers = await User.find({ is_approved: false });
  res.json(pendingUsers);
});

// PATCH /api/admin/approve-user/:id
router.patch('/approve-user/:id', requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { is_approved: true });
  res.json({ message: 'User approved' });
});

// GET /api/admin/leaves
router.get('/leaves', requireAdmin, async (req, res) => {
  const leaves = await Leave.find().populate('user', 'name email role');
  res.json(leaves);
});

module.exports = router;
