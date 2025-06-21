const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const LeaveBalance = require('../models/LeaveBalance');

const router = express.Router();

// Get current user's leave balance
router.get('/balance', authMiddleware(), async (req, res) => {
  const userId = req.user.id;

  let balance = await LeaveBalance.findOne({ user: userId });

  if (!balance) {
    // You may return default values if not found
    balance = {
      casualLeave: req.user.designation === 'Lab assistant' ? 10 : 12,
      sickLeave: req.user.designation === 'Lab assistant' ? 5 : 8
    };
  }

  res.json(balance);
});

module.exports = router;
