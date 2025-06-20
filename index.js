// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leaveRoutes = require('./routes/leaves');
const adminRoutes = require('./routes/admin');

const app = express();

// Configure allowed origins
const allowedOrigins = ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl or mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ❗ DO NOT use app.listen() on Vercel
// Instead, export the app as a module
module.exports = app;
