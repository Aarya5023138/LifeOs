import { useEffect, useState, lazy, Suspense, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import api, { reminderAPI } from './api';
import './App.css';

// ── Lazy-load all pages (reduces initial bundle size) ────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Diary = lazy(() => import('./pages/Diary'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Gamification = lazy(() => import('./pages/Gamification'));
const Goals = lazy(() => import('./pages/Goals'));
const Notes = lazy(() => import('./pages/Notes'));
const Habits = lazy(() => import('./pages/Habits'));
const Settings = lazy(() => import('./pages/Settings'));

// ── Web Audio bell sound ─────────────────────────────────────────────────────
function playBellSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const times = [0, 0.35, 0.7];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + t + 0.4);
      gain.gain.setValueAtTime(0.6, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.6);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.7);
    });
  } catch (_) { /* silently ignore */ }
}

// ── Browser push notification ────────────────────────────────────────────────
function sendBrowserNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(`🔔 ${title}`, {
    body: body || 'Your reminder is due!',
    icon: '/favicon.ico',
  });
}

// ── Page loading spinner ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-spinner" />
      <p>Loading...</p>
    </div>
  );
}

// ── API warmup splash screen ─────────────────────────────────────────────────
function WarmupScreen({ progress }) {
  return (
    <div className="warmup-screen">
      <div className="warmup-content">
        <div className="warmup-logo">⚡</div>
        <h1>LifeOS</h1>
        <p className="warmup-subtitle">Waking up your productivity suite...</p>
        <div className="warmup-bar-track">
          <div className="warmup-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="warmup-hint">First load may take a few seconds</p>
      </div>
    </div>
  );
}

// Convert hex to HSL components for generating shade variants
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function applyAccentColor(hex) {
  const [h, s, l] = hexToHSL(hex);
  const root = document.documentElement;
  root.style.setProperty('--accent-primary', hex);
  root.style.setProperty('--accent-secondary', `hsl(${h}, ${Math.min(s + 10, 100)}%, ${Math.min(l + 20, 90)}%)`);
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${hex}, hsl(${h}, ${Math.min(s + 10, 100)}%, ${Math.min(l + 20, 90)}%))`);
  root.style.setProperty('--accent-glow', `0 0 20px ${hex}4d`);
  root.style.setProperty('--border-color', `${hex}26`);
  root.style.setProperty('--border-hover', `${hex}59`);
  root.style.setProperty('--shadow-glow', `0 0 30px ${hex}26`);
}

function App() {
  const [apiReady, setApiReady] = useState(false);
  const [warmupProgress, setWarmupProgress] = useState(10);
  const [firingReminder, setFiringReminder] = useState(null);
  const pollingRef = useRef(null);

  // ── Warmup: ping the API to wake the serverless function ───────────────────
  useEffect(() => {
    let cancelled = false;

    async function warmup() {
      const progressTimer = setInterval(() => {
        if (!cancelled) {
          setWarmupProgress(prev => prev >= 85 ? prev : prev + Math.random() * 8);
        }
      }, 300);

      try {
        await api.get('/health');
      } catch {
        // API failed but still show the app
      } finally {
        clearInterval(progressTimer);
        if (!cancelled) {
          setWarmupProgress(100);
          setTimeout(() => { if (!cancelled) setApiReady(true); }, 400);
        }
      }
    }

    warmup();
    return () => { cancelled = true; };
  }, []);

  // ── Global reminder polling — works from ANY page ──────────────────────────
  const checkDueReminders = useCallback(async () => {
    try {
      const res = await reminderAPI.getDue();
      const dueList = res.data;
      if (dueList.length > 0) {
        dueList.forEach((r, i) => {
          setTimeout(() => {
            playBellSound();
            sendBrowserNotification(r.title, r.description);
            setFiringReminder(r);
            toast(`🔔 ${r.title}`, {
              duration: 6000,
              icon: '⏰',
              style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid rgba(108,92,231,0.3)' },
            });
          }, i * 1500);
        });
      }
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    if (!apiReady) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check immediately on app load, then every 30s
    checkDueReminders();
    pollingRef.current = setInterval(checkDueReminders, 30_000);

    return () => clearInterval(pollingRef.current);
  }, [apiReady, checkDueReminders]);

  // ── Accent color persistence ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeos-settings');
      if (saved) {
        const { accentColor } = JSON.parse(saved);
        if (accentColor) applyAccentColor(accentColor);
      }
    } catch {}

    const handler = (e) => {
      if (e.key === 'lifeos-settings') {
        try {
          const { accentColor } = JSON.parse(e.newValue);
          if (accentColor) applyAccentColor(accentColor);
        } catch {}
      }
    };
    window.addEventListener('storage', handler);

    const customHandler = (e) => applyAccentColor(e.detail);
    window.addEventListener('accent-color-change', customHandler);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('accent-color-change', customHandler);
    };
  }, []);

  // ── Show warmup screen while API is cold starting ──────────────────────────
  if (!apiReady) {
    return <WarmupScreen progress={warmupProgress} />;
  }

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#e8e8f0',
            border: '1px solid rgba(108, 92, 231, 0.2)',
            borderRadius: '12px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#00cec9', secondary: '#1a1a2e' } },
          error: { iconTheme: { primary: '#ff6b6b', secondary: '#1a1a2e' } },
        }}
      />

      {/* Global reminder alert overlay — fires from ANY page */}
      {firingReminder && (
        <div className="global-reminder-overlay">
          <div className="global-reminder-box">
            <div className="global-reminder-bell">🔔</div>
            <h2>{firingReminder.title}</h2>
            {firingReminder.description && <p>{firingReminder.description}</p>}
            <div className="global-reminder-time">{formatDateTime(firingReminder.dateTime)}</div>
            <button className="btn-primary" onClick={() => setFiringReminder(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
