import { useEffect, useState, lazy, Suspense, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import api, { reminderAPI } from './api';
import './App.css';

// ── Lazy-load all pages ──────────────────────────────────────────────────────
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
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

// ─────────────────────────────────────────────────────────────────────────────
// ALARM SOUND ENGINE
// ─────────────────────────────────────────────────────────────────────────────
let _alarmCtx = null;
let _alarmInterval = null;
let _alarmOscillators = [];

function ensureAudioContext() {
  if (!_alarmCtx) _alarmCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_alarmCtx.state === 'suspended') _alarmCtx.resume();
  return _alarmCtx;
}

function unlockAudioOnGesture() {
  function handler() {
    ensureAudioContext();
    window.removeEventListener('click', handler, true);
    window.removeEventListener('touchstart', handler, true);
    window.removeEventListener('keydown', handler, true);
  }
  window.addEventListener('click', handler, true);
  window.addEventListener('touchstart', handler, true);
  window.addEventListener('keydown', handler, true);
}
unlockAudioOnGesture();

function playAlarmCycle() {
  try {
    const ctx = ensureAudioContext();
    if (ctx.state === 'closed') return;
    const t = ctx.currentTime;
    const pattern = [
      { freq: 880, start: 0, dur: 0.12 }, { freq: 660, start: 0.18, dur: 0.12 },
      { freq: 880, start: 0.36, dur: 0.12 }, { freq: 660, start: 0.54, dur: 0.12 },
      { freq: 880, start: 0.72, dur: 0.12 }, { freq: 660, start: 0.90, dur: 0.12 },
    ];
    pattern.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + start);
      gain.gain.setValueAtTime(0.7, t + start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      osc.start(t + start); osc.stop(t + start + dur + 0.02);
      _alarmOscillators.push(osc);
    });
  } catch (_) {}
}

function startAlarmSound() { stopAlarmSound(); playAlarmCycle(); _alarmInterval = setInterval(playAlarmCycle, 1400); }
function stopAlarmSound() {
  if (_alarmInterval) { clearInterval(_alarmInterval); _alarmInterval = null; }
  _alarmOscillators.forEach(o => { try { o.stop(); } catch (_) {} });
  _alarmOscillators = [];
}

function sendBrowserNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(`🔔 ${title}`, { body: body || 'Your reminder is due!', icon: '/favicon.ico', requireInteraction: true }); } catch (_) {}
}

// ── Loaders ──────────────────────────────────────────────────────────────────
function PageLoader() {
  return (<div className="page-loader"><div className="page-loader-spinner" /><p>Loading...</p></div>);
}

function WarmupScreen({ progress }) {
  return (
    <div className="warmup-screen"><div className="warmup-content">
      <div className="warmup-logo">⚡</div><h1>LifeOS</h1>
      <p className="warmup-subtitle">Waking up your productivity suite...</p>
      <div className="warmup-bar-track"><div className="warmup-bar-fill" style={{ width: `${progress}%` }} /></div>
      <p className="warmup-hint">First load may take a few seconds</p>
    </div></div>
  );
}

// ── Accent color helpers ─────────────────────────────────────────────────────
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

// ── Protected Route wrapper ──────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── Public Route wrapper (redirects to dashboard if already logged in) ───────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

// ── Main app content (needs auth context) ────────────────────────────────────
function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [apiReady, setApiReady] = useState(false);
  const [warmupProgress, setWarmupProgress] = useState(10);
  const [firingReminder, setFiringReminder] = useState(null);
  const [reminderQueue, setReminderQueue] = useState([]);
  const pollingRef = useRef(null);
  const alarmActiveRef = useRef(false);

  // ── Warmup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function warmup() {
      const t = setInterval(() => { if (!cancelled) setWarmupProgress(p => p >= 85 ? p : p + Math.random() * 8); }, 300);
      try { await api.get('/health'); } catch {}
      finally { clearInterval(t); if (!cancelled) { setWarmupProgress(100); setTimeout(() => { if (!cancelled) setApiReady(true); }, 400); } }
    }
    warmup();
    return () => { cancelled = true; };
  }, []);

  const dismissAlarm = useCallback(() => {
    stopAlarmSound(); alarmActiveRef.current = false;
    setReminderQueue(prev => {
      const rest = prev.slice(1);
      if (rest.length > 0) { setFiringReminder(rest[0]); startAlarmSound(); alarmActiveRef.current = true; }
      else setFiringReminder(null);
      return rest;
    });
  }, []);

  const checkDueReminders = useCallback(async () => {
    if (alarmActiveRef.current) return;
    try {
      const res = await reminderAPI.getDue();
      const dueList = res.data;
      if (dueList.length > 0) {
        setReminderQueue(dueList); setFiringReminder(dueList[0]);
        startAlarmSound(); alarmActiveRef.current = true;
        dueList.forEach(r => sendBrowserNotification(r.title, r.description));
        dueList.forEach((r, i) => {
          setTimeout(() => toast(`🔔 ${r.title}`, { duration: 8000, icon: '⏰',
            style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid rgba(255, 107, 107, 0.5)', fontWeight: '600' } }), i * 800);
        });
        window.dispatchEvent(new CustomEvent('reminders-updated'));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!apiReady || !user) return;
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    checkDueReminders();
    pollingRef.current = setInterval(checkDueReminders, 10_000);
    return () => clearInterval(pollingRef.current);
  }, [apiReady, user, checkDueReminders]);

  // ── Accent color persistence ───────────────────────────────────────────────
  useEffect(() => {
    try { const saved = localStorage.getItem('lifeos-settings'); if (saved) { const { accentColor } = JSON.parse(saved); if (accentColor) applyAccentColor(accentColor); } } catch {}
    const handler = (e) => { if (e.key === 'lifeos-settings') { try { const { accentColor } = JSON.parse(e.newValue); if (accentColor) applyAccentColor(accentColor); } catch {} } };
    window.addEventListener('storage', handler);
    const customHandler = (e) => applyAccentColor(e.detail);
    window.addEventListener('accent-color-change', customHandler);
    return () => { window.removeEventListener('storage', handler); window.removeEventListener('accent-color-change', customHandler); };
  }, []);

  if (authLoading) return <PageLoader />;
  if (!apiReady && user) return <WarmupScreen progress={warmupProgress} />;

  const formatDateTime = (dt) => new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a2e', color: '#e8e8f0', border: '1px solid rgba(108, 92, 231, 0.2)', borderRadius: '12px', fontSize: '0.875rem' },
        success: { iconTheme: { primary: '#00cec9', secondary: '#1a1a2e' } },
        error: { iconTheme: { primary: '#ff6b6b', secondary: '#1a1a2e' } },
      }} />

      {firingReminder && (
        <div className="global-reminder-overlay">
          <div className="global-reminder-box">
            <div className="global-reminder-pulse-ring" />
            <div className="global-reminder-bell">🔔</div>
            <h2>Reminder!</h2>
            <h3 className="global-reminder-title">{firingReminder.title}</h3>
            {firingReminder.description && <p className="global-reminder-desc">{firingReminder.description}</p>}
            <div className="global-reminder-time">{formatDateTime(firingReminder.dateTime)}</div>
            {reminderQueue.length > 1 && <div className="global-reminder-queue-badge">+{reminderQueue.length - 1} more</div>}
            <button className="btn-dismiss-alarm" onClick={dismissAlarm}>🔕 Stop Alarm</button>
          </div>
        </div>
      )}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* Protected app routes — wrapped in layout */}
          <Route path="/*" element={
            <ProtectedRoute>
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
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
