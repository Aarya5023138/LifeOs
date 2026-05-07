const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const taskRoutes = require('./routes/tasks');
const reminderRoutes = require('./routes/reminders');
const calendarRoutes = require('./routes/calendar');
const diaryRoutes = require('./routes/diary');
const gamificationRoutes = require('./routes/gamification');
const dashboardRoutes = require('./routes/dashboard');
const goalRoutes = require('./routes/goals');
const noteRoutes = require('./routes/notes');
const habitRoutes = require('./routes/habits');

const { processRecurringReminders } = require('./utils/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/habits', habitRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schedule recurring reminders check every minute
cron.schedule('* * * * *', () => {
  processRecurringReminders();
});

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ Connected to MongoDB');
      return;
    } catch (err) {
      console.error('⚠️  MongoDB connection error:', err.message);
    }
  }

  // Fallback to in-memory only in development
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      console.log('🔄 Starting in-memory MongoDB (first run takes time)...');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('✅ Connected to in-memory MongoDB');
      console.log('💡 Note: Data is lost on restart. Set MONGODB_URI for persistence.');
    } catch (err) {
      console.error('❌ Could not start in-memory MongoDB:', err.message);
    }
  } else {
    console.warn('⚠️  No MONGODB_URI provided in production. Database will not connect.');
  }
};

// Add DB connection middleware for serverless environments (like Vercel)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Start server if not running in a serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 LifeOS server running on http://localhost:${PORT}`);
    });
  });
}

// Export the app for Vercel Serverless
module.exports = app;
