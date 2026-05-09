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

// 1. Add: mongoose.set('bufferCommands', false) globally
mongoose.set('bufferCommands', false);

// 3. Cache mongoose connection globally for Vercel serverless.
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // 4. Prevent reconnecting on every request.
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      if (!cached.promise) {
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          console.log('🔄 Starting in-memory MongoDB...');
          const mongod = await MongoMemoryServer.create();
          cached.promise = mongoose.connect(mongod.getUri(), { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 }).then(m => m);
        } catch (err) {
          console.error('❌ In-memory MongoDB failed:', err.message);
          return null;
        }
      }
      try {
        cached.conn = await cached.promise;
        console.log('✅ In-memory MongoDB ready (data lost on restart)');
        return cached.conn;
      } catch (err) {
        return null;
      }
    }
    console.warn('⚠️  No MONGODB_URI set. Database unavailable.');
    return null;
  }

  if (!cached.promise) {
    // 2. Use: serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000
    const opts = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
    };

    console.log('🔄 Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      // 7. Add proper connection success logs.
      console.log('✅ Connected to MongoDB');
      return mongooseInstance;
    }).catch(err => {
      // 7. Add proper connection error logs.
      console.error('⚠️  MongoDB connection error:', err.message);
      // 9. Ensure no infinite connection attempts.
      cached.promise = null; 
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    return null;
  }

  return cached.conn;
}

// 8. Fix cold-start optimization for Vercel by eagerly connecting
const connectionReady = connectDB().catch(console.error);

// ── DB-readiness middleware ──────────────────────────────────────────────────
app.use(async (req, res, next) => {
  // Let health & debug endpoints through without DB
  if (req.path === '/api/health' || req.path === '/api/debug') return next();

  try {
    // 5. Await MongoDB connection before routes start.
    await connectionReady;
    if (!cached.conn || mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    console.error('Middleware DB connection error:', err.message);
  }

  // 6. Return 503 immediately if DB unavailable.
  if (!cached.conn || mongoose.connection.readyState !== 1) {
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
