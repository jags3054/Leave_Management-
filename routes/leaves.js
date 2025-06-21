const express = require('express');
const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Apply Leave
router.post('/apply', authMiddleware(['staff', 'hod']), async (req, res) => {
  const start = new Date(req.body.startDate);
  const end = new Date(req.body.endDate);

  let days = ((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // For half-day leave, set days to 0.5
  if (req.body.leaveType === 'half-day') {
    days = 0.5;
  }

  const leave = new Leave({
    user: req.user.id,
    ...req.body,
    days,
    currentStage: 'hod',
    status: 'pending',
    hodStatus: 'pending',
    principalStatus: 'pending',
  });

  await leave.save();
  res.status(201).json(leave);
});

// Get Leaves
router.get('/', authMiddleware(), async (req, res) => {
  const { role, id } = req.user;
  let filter = {};

  if (role === 'staff') filter.user = id;
  else if (role === 'hod') filter.currentStage = 'hod';
  else if (role === 'principal') filter.currentStage = 'principal';

  const leaves = await Leave.find(filter).populate('user', 'name email');
  res.json(leaves);
});

// HOD Review
router.patch('/hod/:id', authMiddleware(['hod']), async (req, res) => {
  const { action, reason } = req.body;
  const leave = await Leave.findById(req.params.id);

  if (!leave) return res.status(404).json({ message: 'Leave not found' });

  if (action === 'recommend') {
    leave.hodStatus = 'recommended';
    leave.currentStage = 'principal';
  } else if (action === 'reject') {
    leave.hodStatus = 'rejected';
    leave.status = 'rejected';
    leave.currentStage = 'final';
    leave.rejectReason = reason;
  }

  await leave.save();
  res.json(leave);
});

// Principal Approval
router.patch('/principal/:id', authMiddleware(['principal']), async (req, res) => {
  const { action, reason } = req.body;
  const leave = await Leave.findById(req.params.id).populate('user');

  if (!leave) return res.status(404).json({ message: 'Leave not found' });

  if (action === 'approve') {
    leave.principalStatus = 'approved';
    leave.status = 'approved';
    leave.currentStage = 'final';

    let bal = await LeaveBalance.findOne({ user: leave.user._id });

    if (!bal) {
      // Default leave balance setup based on designation
      const isLabAssistant = leave.user.designation === 'Lab assistant';
      bal = new LeaveBalance({
        user: leave.user._id,
        casualLeave: isLabAssistant ? 10 : 12,
        sickLeave: isLabAssistant ? 5 : 8,
      });
    }

    // Deduct leave
    if (leave.leaveType === 'casual') {
      bal.casualLeave -= leave.days;
    } else if (leave.leaveType === 'sick') {
      bal.sickLeave -= leave.days;
    } else if (leave.leaveType === 'half-day') {
      bal.casualLeave -= 0.5; // Deduct 0.5 CL
    }

    // Prevent negative balances
    bal.casualLeave = Math.max(0, bal.casualLeave);
    bal.sickLeave = Math.max(0, bal.sickLeave);

    await bal.save();
  } else if (action === 'reject') {
    leave.principalStatus = 'rejected';
    leave.status = 'rejected';
    leave.currentStage = 'final';
    leave.rejectReason = reason;
  }

  await leave.save();
  res.json(leave);
});

module.exports = router;
