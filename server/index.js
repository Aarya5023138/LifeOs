const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── MongoDB connection (Vercel-optimized global cache) ──────────────────────
// In serverless environments, module-level variables can be lost between
// invocations. Using `global` ensures the connection persists across
// warm invocations within the same container.

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  // 1. If mongoose is already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. If a connection promise is already in-flight, reuse it
  //    (prevents multiple parallel connection attempts on cold start)
  if (global._mongooseConnectionPromise) {
    await global._mongooseConnectionPromise;
    return mongoose.connection;
  }

  // 3. No URI? Fall back to in-memory for local dev only
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

  // 4. Create a new connection and cache the promise globally
  try {
    global._mongooseConnectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,           // Lower pool for serverless
      bufferCommands: false,    // Fail fast instead of hanging
    });

    await global._mongooseConnectionPromise;
    console.log('✅ Connected to MongoDB');
    return mongoose.connection;
  } catch (err) {
    console.error('⚠️  MongoDB connection error:', err.message);
    global._mongooseConnectionPromise = null; // Allow retry on next request
    return null;
  }
}

// ── Eagerly start connecting on module load ──────────────────────────────────
// This runs once when Vercel loads the function, so the connection is
// already in-flight by the time the first request arrives.
const connectionReady = connectDB();

// ── DB middleware — ensures connection before handling request ────────────────
app.use(async (req, res, next) => {
  try {
    await connectionReady; // Wait for the eager connection
    // If it failed, try again
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (_) { /* connection errors are logged above */ }
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
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

// Export for Vercel Serverless
module.exports = app;
