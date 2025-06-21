// routes/options.js
const express = require('express');
const router = express.Router();

const departments = [
  'BSH', 'CSE', 'AI&DS', 'EE', 'E&TC', 'MECH', 'CIVIL', 'BCA/MCA/OFFICE'
];
const designations = [
  'Professor', 'Assistant Professor', 'Lab Assistant', 'Office Staff', 'Peon'
];

// GET /api/options
router.get('/', (req, res) => {
  res.json({ departments, designations });
});

module.exports = router;
