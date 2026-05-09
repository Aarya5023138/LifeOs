const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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

// ── DB-readiness middleware ──────────────────────────────────────────────────
// On Vercel, if MONGODB_URI is missing or the connection fails, return 503
// immediately instead of letting mongoose buffer commands forever.
app.use(async (req, res, next) => {
  // Let health & debug endpoints through without DB
  if (req.path === '/api/health' || req.path === '/api/debug') return next();

  try {
    await connectionReady;
    if (mongoose.connection.readyState !== 1) await connectDB();
  } catch (_) {}

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database unavailable. Please check MONGODB_URI environment variable on Vercel.',
      hint: process.env.MONGODB_URI ? 'MONGODB_URI is set but connection failed' : 'MONGODB_URI is NOT set',
    });
  }
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

// Debug endpoint for diagnosing Vercel deployment issues
app.get('/api/debug', (req, res) => {
  res.json({
    env: {
      VERCEL: !!process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV || 'not set',
      MONGODB_URI: process.env.MONGODB_URI ? '✅ set (' + process.env.MONGODB_URI.substring(0, 20) + '...)' : '❌ NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ set' : '❌ NOT SET (using fallback)',
    },
    db: {
      readyState: mongoose.connection.readyState,
      status: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    },
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
