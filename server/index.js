const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const reminderRoutes = require('./routes/reminders');
const calendarRoutes = require('./routes/calendar');
const diaryRoutes = require('./routes/diary');
const gamificationRoutes = require('./routes/gamification');
const dashboardRoutes = require('./routes/dashboard');
const goalRoutes = require('./routes/goals');
const noteRoutes = require('./routes/notes');
const habitRoutes = require('./routes/habits');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.VERCEL ? true : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── MongoDB connection (Vercel-optimized global cache) ──────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (global._mongooseConnectionPromise) {
    await global._mongooseConnectionPromise;
    return mongoose.connection;
  }
  if (!MONGODB_URI) {
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        console.log('🔄 Starting in-memory MongoDB...');
        const mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
        console.log('✅ In-memory MongoDB ready (data lost on restart)');
        return mongoose.connection;
      } catch (err) {
        console.error('❌ In-memory MongoDB failed:', err.message);
        return null;
      }
    }
    console.warn('⚠️  No MONGODB_URI set. Database unavailable.');
    return null;
  }
  try {
    global._mongooseConnectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      bufferCommands: false,
    });
    await global._mongooseConnectionPromise;
    console.log('✅ Connected to MongoDB');
    return mongoose.connection;
  } catch (err) {
    console.error('⚠️  MongoDB connection error:', err.message);
    global._mongooseConnectionPromise = null;
    return null;
  }
}

const connectionReady = connectDB();

app.use(async (req, res, next) => {
  try {
    await connectionReady;
    if (mongoose.connection.readyState !== 1) await connectDB();
  } catch (_) {}
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/habits', habitRoutes);

// Health check (public — no auth)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── Start server (local dev only — ignored on Vercel) ────────────────────────
if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 LifeOS server running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
