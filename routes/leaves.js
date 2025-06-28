const express = require("express");
const Leave = require("../models/Leave");
const LeaveBalance = require("../models/LeaveBalance");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
const { sendNotification } = require('../socket');

// Apply Leave
router.post("/apply", authMiddleware(["staff", "hod"]), async (req, res) => {
  const start = new Date(req.body.startDate);
  const end = new Date(req.body.endDate);

  let days = (end - start) / (1000 * 60 * 60 * 24) + 1;

  if (req.body.leaveType === "half-day") {
    days = 0.5;
  }

  const leave = new Leave({
    user: req.user.id,
    ...req.body,
    days,
    currentStage: "hod",
    status: "pending",
    hodStatus: "pending",
    principalStatus: "pending",
  });

if (['co', 'dl'].includes(req.body.leaveType)) {
  const balance = await LeaveBalance.findOne({ user: req.user.id });

  if (!balance) {
    return res.status(400).json({ message: 'Leave balance not found' });
  }

  if (req.body.leaveType === 'co' && balance.co < days) {
    return res.status(400).json({ message: 'Not enough CO balance' });
  }

  if (req.body.leaveType === 'dl' && balance.dl < days) {
    return res.status(400).json({ message: 'Not enough DL balance' });
  }
}
  await leave.save();
  res.status(201).json(leave);
});

// Get Leaves
router.get("/", authMiddleware(), async (req, res) => {
  const { role, id } = req.user;
  let filter = {};

  if (role === "staff") filter.user = id;
  else if (role === "hod") filter.currentStage = "hod";
  else if (role === "principal") filter.currentStage = "principal";

  const leaves = await Leave.find(filter).populate("user", "name email");
  res.json(leaves);
});

// HOD Review
router.patch("/hod/:id", authMiddleware(["hod"]), async (req, res) => {
  const { action, reason } = req.body;
  const leave = await Leave.findById(req.params.id);

  if (!leave) return res.status(404).json({ message: "Leave not found" });

  if (action === "recommend") {
    leave.hodStatus = "recommended";
    leave.currentStage = "principal";
  } else if (action === "reject") {
    leave.hodStatus = "rejected";
    leave.status = "rejected";
    leave.currentStage = "final";
    leave.rejectReason = reason;
  }

  await leave.save();
  res.json(leave);
});


// Principal Approval
router.patch("/principal/:id", authMiddleware(["principal"]), async (req, res) => {
  const { action, reason } = req.body;
  const leave = await Leave.findById(req.params.id).populate("user");

  if (!leave) return res.status(404).json({ message: "Leave not found" });

  if (action === "approve") {
    leave.principalStatus = "approved";
    leave.status = "approved";
    leave.currentStage = "final";

    let bal = await LeaveBalance.findOne({ user: leave.user._id });

    if (!bal) {
      bal = new LeaveBalance({
        user: leave.user._id,
        casualLeave: 0,
        sickLeave: 0,
        halfDay: 0,
        co: 0,
        dl: 0,
      });
    }

    // Deduct or credit leave balances
    switch (leave.leaveType) {
      case "casual":
        bal.casualLeave -= leave.days;
        break;
      case "sick":
        bal.sickLeave -= leave.days;
        break;
      case "half-day":
        bal.casualLeave -= 0.5;
        break;
      case "co":
        bal.co -= leave.days;
        break;
      case "dl":
        bal.dl -= leave.days;
        break;
      case "co-credit":
        bal.co += leave.days;
        break;
      case "dl-credit":
        bal.dl += leave.days;
        break;
    }

    bal.casualLeave = Math.max(0, bal.casualLeave);
    bal.sickLeave = Math.max(0, bal.sickLeave);
    bal.co = Math.max(0, bal.co);
    bal.dl = Math.max(0, bal.dl);

    await bal.save();

    // ✅ Send approval notification
    sendNotification(leave.user._id.toString(), {
      title: 'Leave Approved',
      message: `Your leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been approved.`,
      createdAt: new Date(),
    });

  } else if (action === "reject") {
    leave.principalStatus = "rejected";
    leave.status = "rejected";
    leave.currentStage = "final";
    leave.rejectReason = reason;

    // ✅ Send rejection notification
    sendNotification(leave.user._id.toString(), {
      title: 'Leave Rejected',
      message: `Your leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} was rejected. Reason: ${reason}`,
      createdAt: new Date(),
    });
  }

  await leave.save();
  res.json(leave);
});
router.put(
  "/leave-balance/:userId",
  authMiddleware(["admin"]),
  async (req, res) => {
    const { casualLeave, sickLeave, halfDay, co, dl } = req.body;

    try {
      const updated = await LeaveBalance.findOneAndUpdate(
        { user: req.params.userId },
        { $set: { casualLeave, sickLeave, halfDay, co, dl } },
        { new: true, upsert: true }
      );

      res.json({
        message: "Leave balance updated successfully",
        data: updated,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
router.get("/my", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user._id;
    const leaves = await Leave.find({ user: userId }).populate(
      "user",
      "name email department"
    );
    res.json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
