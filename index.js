const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leaveRoutes = require('./routes/leaves');
const adminRoutes = require('./routes/admin');
const optionsRoutes = require('./routes/options');
const userRoute = require('./routes/userRoute');
const NotificationRoute=require('./routes/notifications');

const { setupSocket } = require('./socket'); // ⬅️ socket setup

const app = express();
const server = http.createServer(app);

// Middleware
// app.use(cors({ origin: ['http://localhost:3000', ], credentials: true }));

app.use(cors({
  origin: ['https://leavetracker.cloud', 'http://localhost:3000'], // include your frontend domains
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/me', userRoute);
app.use('/api/notifications',NotificationRoute);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
  
  // Start server and setup sockets
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  setupSocket(server); // ✅ Move this after server starts for cleaner logs
}).catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
