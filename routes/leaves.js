const express = require('express');
const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Apply Leave
router.post('/apply', authMiddleware(['staff']), async (req,res)=>{
  const days = ((new Date(req.body.endDate) - new Date(req.body.startDate)) / (1000*60*60*24)) + 1;
  const leave = new Leave({
    user: req.user.id,
    ...req.body,
    days,
    currentStage: 'HOD', // 👈 ADD THIS LINE
    status: 'pending',   // Optional, helps with filtering
    hodStatus: 'pending',
    principalStatus: 'pending',
  });

  await leave.save();
  res.status(201).json(leave);
});

// Get leaves by stage
router.get('/', authMiddleware(), async (req,res)=>{
  const { role, id } = req.user;
  let filter = {};
  if (role==='staff') filter.user = id;
  else if(role==='HOD') filter.currentStage = 'HOD';
  else if(role==='principal') filter.currentStage = 'principal';
  const leaves = await Leave.find(filter).populate('user','name email');
  res.json(leaves);
});

// HOD recommendation
router.patch('/hod/:id', authMiddleware(['hod']), async (req,res)=>{
  const { action, reason } = req.body;
  const leave = await Leave.findById(req.params.id);
  if(action==='recommend'){ leave.hodStatus='recommended';leave.currentStage='principal'; }
  else if (action==='reject'){ leave.hodStatus='rejected'; leave.status='rejected';leave.currentStage='final'; leave.rejectReason=reason; }
  await leave.save(); res.json(leave);
});

// Principal approval
router.patch('/principal/:id', authMiddleware(['principal']), async (req,res)=>{
  const { action, reason } = req.body;
  const leave = await Leave.findById(req.params.id).populate('user');
  if(action==='approve'){
    leave.principalStatus='approved';
    leave.status='approved';
    leave.currentStage='final';

    let bal = await LeaveBalance.findOne({user: leave.user._id});
    if(!bal){ bal=new LeaveBalance({ user: leave.user._id}); }
    if(leave.leaveType==='casual') bal.casualLeave -= leave.days;
    if(leave.leaveType==='sick') bal.sickLeave -= leave.days;
    if(leave.leaveType==='half-day') bal.halfDay -= 1;
    await bal.save();
  }
  else if(action==='reject'){
    leave.principalStatus='rejected'; leave.status='rejected'; leave.currentStage='final'; leave.rejectReason=reason;
  }
  await leave.save(); res.json(leave);
});

module.exports = router;
