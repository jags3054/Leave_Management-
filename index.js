const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leaveRoutes = require('./routes/leaves');
const adminRoutes = require('./routes/admin');
const optionsRoutes = require('./routes/options');
const userRoute=require('./routes/userRoute');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://leave-management-zeta.vercel.app'],
  credentials: true,
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/me', userRoute); 


// MongoDB connection first
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');

  // Start server **only after DB connects**
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
});
