const express = require('express')
const LeaveBalance = require('../models/LeaveBalance')
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router()

// Get leave balance for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const balance = await LeaveBalance.findOne({ user: req.user.id })
    if (!balance) return res.status(404).json({ message: 'Leave balance not found' })
    res.json(balance)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
