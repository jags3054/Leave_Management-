
const express = require('express'), mongoose = require('mongoose'), cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const leaveRoutes = require('./routes/leaves');
const adminRoutes = require('./routes/admin');

const app = express();

console.log('JWT_SECRET:', process.env.JWT_SECRET);

app.use(cors({
  origin: 'http://localhost:3000', // or '*' for all, but not secure for auth
  credentials: true,
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin',adminRoutes);

const PORT = process.env.PORT||5000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });