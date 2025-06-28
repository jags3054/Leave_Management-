const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

// GET all notifications for logged-in user
router.get('/', authMiddleware(), async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
});

// Mark all as read
router.patch('/mark-all-read', authMiddleware(), async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ message: 'Marked all as read' });
});


router.delete('/clear', authMiddleware(), async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId; // or however you identify the user

    if (!userId) return res.status(400).json({ message: 'User ID required' });

    await Notification.deleteMany({ userId }); // assuming notifications are linked to a user

    res.status(200).json({ message: 'Notifications cleared' });
  } catch (err) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
