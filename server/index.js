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

// Connect to MongoDB - try local first, then fall back to in-memory
async function startServer() {
  let connected = false;

  // Try connecting to local MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅ Connected to local MongoDB');
    connected = true;
  } catch (err) {
    console.log('⚠️  Local MongoDB not available:', err.message);
  }

  // Fall back to in-memory MongoDB
  if (!connected) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      console.log('🔄 Starting in-memory MongoDB (first run may take a moment to download binary)...');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('✅ Connected to in-memory MongoDB');
      console.log('💡 Note: Data will be lost when server stops. Install MongoDB locally for persistence.');
      connected = true;
    } catch (err2) {
      console.error('❌ Could not start in-memory MongoDB:', err2.message);
      console.log('⚠️  Server starting without database - API calls will fail');
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 LifeOS server running on http://localhost:${PORT}`);
    if (!connected) {
      console.log('⚠️  No database connected. Install MongoDB or run: npm install mongodb-memory-server');
    }
  });
}

startServer();
