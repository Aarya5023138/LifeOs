import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlineBell,
  HiOutlineX, HiOutlineRefresh,
} from 'react-icons/hi';
import { HiOutlineBellSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { reminderAPI } from '../api';
import './Reminders.css';

// ─── Recurring label map ──────────────────────────────────────────────────────
const PATTERN_LABELS = {
  daily:   'Daily',
  weekly:  'Weekly',
  monthly: '1 Month',
  '3month':'3 Months',
  '6month':'6 Months',
  yearly:  '1 Year',
  none:    '',
};

export default function Reminders() {
  const [reminders, setReminders]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '',
    isRecurring: false, recurringPattern: 'none',
  });

  // ── Request notification permission on mount ───────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(setNotifPermission);
    }
  }, []);

  // ── Load reminders ─────────────────────────────────────────────────────────
  const loadReminders = useCallback(async () => {
    try {
      const res = await reminderAPI.getAll();
      setReminders(res.data);
    } catch { setReminders([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadReminders(); }, [loadReminders]);

  // ── Listen for global alarm events (fired from App.jsx) to refresh list ────
  useEffect(() => {
    const handler = () => loadReminders();
    window.addEventListener('reminders-updated', handler);
    return () => window.removeEventListener('reminders-updated', handler);
  }, [loadReminders]);

  // ── Create reminder ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.date || !form.time) return toast.error('Date & time is required');
    try {
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString();
      await reminderAPI.create({ ...form, dateTime });
      toast.success('Reminder set! 🔔');
      setShowModal(false);
      setForm({ title: '', description: '', date: '', time: '', isRecurring: false, recurringPattern: 'none' });
      loadReminders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating reminder');
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const toggleActive = async (reminder) => {
    try {
      await reminderAPI.update(reminder._id, { isActive: !reminder.isActive });
      toast.success(reminder.isActive ? 'Reminder muted' : 'Reminder activated');
      loadReminders();
    } catch { toast.error('Error updating reminder'); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await reminderAPI.delete(id);
      toast.success('Reminder deleted');
      loadReminders();
    } catch { toast.error('Error deleting reminder'); }
  };

  // ── Test alarm — manually triggers one alarm cycle + notification ──────────
  const handleTestAlarm = () => {
    // Play the alarm sound (will create/resume AudioContext since this is a user gesture)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      const pattern = [
        { freq: 880, start: 0, dur: 0.12 },
        { freq: 660, start: 0.18, dur: 0.12 },
        { freq: 880, start: 0.36, dur: 0.12 },
        { freq: 660, start: 0.54, dur: 0.12 },
        { freq: 880, start: 0.72, dur: 0.12 },
        { freq: 660, start: 0.90, dur: 0.12 },
      ];
      pattern.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t + start);
        gain.gain.setValueAtTime(0.7, t + start);
        gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
        osc.start(t + start);
        osc.stop(t + start + dur + 0.02);
      });
      // Close context after sound finishes
      setTimeout(() => ctx.close(), 2000);
    } catch (_) {}

    // Send a test browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 Test Alarm', {
        body: 'Your alarm and notifications are working!',
        icon: '/favicon.ico',
      });
    }

    toast.success('🔔 Alarm test played! Check your speakers.');
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const now = new Date();
  const upcoming = reminders.filter(r => new Date(r.dateTime) >= now && r.isActive);
  const past     = reminders.filter(r => new Date(r.dateTime) <  now || !r.isActive);

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getTimeUntil = (dt) => {
    const diff = new Date(dt) - now;
    if (diff < 0) return 'Past';
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days  > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${mins % 60}m`;
    return `in ${mins}m`;
  };

  const requestPermission = async () => {
    const p = await Notification.requestPermission();
    setNotifPermission(p);
    if (p === 'granted') toast.success('Notifications enabled! 🔔');
    else toast.error('Notifications blocked by browser');
  };

  return (
    <div className="reminders-page">

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>Reminders</h1>
          <p className="subtitle">{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <div className="header-actions">
          {notifPermission !== 'granted' && (
            <button className="btn-notif-enable" onClick={requestPermission} title="Enable browser notifications">
              <HiOutlineBell /> Enable Notifications
            </button>
          )}
          <button className="btn-test-alarm" onClick={handleTestAlarm} title="Test alarm sound & notification">
            🔊 Test Alarm
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> New Reminder
          </button>
        </div>
      </div>

      {/* ─── Notification permission banner ────────────────────────────────── */}
      {notifPermission === 'denied' && (
        <div className="notif-banner">
          ⚠️ Browser notifications are blocked. Go to your browser settings to allow notifications
          for this site. Reminders will still ring in-app with alarm sounds.
        </div>
      )}

      {/* ─── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : reminders.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <h3>No reminders</h3>
          <p>Set reminders to never miss important moments</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> Create Your First Reminder
          </button>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="reminder-section">
              <h3 className="reminder-section-title">🔔 Upcoming</h3>
              <div className="reminder-list">
                {upcoming.map((reminder, idx) => (
                  <div
                    key={reminder._id}
                    className="reminder-card glass-card"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="reminder-bell active"><HiOutlineBell /></div>
                    <div className="reminder-info">
                      <h4>{reminder.title}</h4>
                      {reminder.description && <p className="reminder-desc">{reminder.description}</p>}
                      <div className="reminder-meta">
                        <span className="reminder-time">{formatDateTime(reminder.dateTime)}</span>
                        <span className="reminder-countdown">{getTimeUntil(reminder.dateTime)}</span>
                        {reminder.isRecurring && (
                          <span className="reminder-recurring">
                            <HiOutlineRefresh /> {PATTERN_LABELS[reminder.recurringPattern]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="reminder-actions">
                      <button className="btn-icon" onClick={() => toggleActive(reminder)} title="Mute">
                        <HiOutlineBellSlash />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(reminder._id)}>
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past / Muted */}
          {past.length > 0 && (
            <div className="reminder-section">
              <h3 className="reminder-section-title past">🔕 Past / Muted</h3>
              <div className="reminder-list">
                {past.map((reminder, idx) => (
                  <div
                    key={reminder._id}
                    className="reminder-card glass-card past"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="reminder-bell muted"><HiOutlineBellSlash /></div>
                    <div className="reminder-info">
                      <h4>{reminder.title}</h4>
                      <div className="reminder-meta">
                        <span className="reminder-time">{formatDateTime(reminder.dateTime)}</span>
                        {reminder.isRecurring && (
                          <span className="reminder-recurring">
                            <HiOutlineRefresh /> {PATTERN_LABELS[reminder.recurringPattern]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="reminder-actions">
                      {!reminder.isActive && (
                        <button className="btn-icon" onClick={() => toggleActive(reminder)} title="Re-activate">
                          <HiOutlineBell />
                        </button>
                      )}
                      <button className="btn-icon" onClick={() => handleDelete(reminder._id)}>
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Create modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <h2>🔔 New Reminder</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text" placeholder="Reminder title" autoFocus
                  value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Details (optional)..."
                  value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm(p => ({ ...p, time: e.target.value }))}
                  />
                </div>
              </div>

              {/* Recurring pattern ─ includes 1m / 3m / 6m / 1yr */}
              <div className="form-group">
                <label>Repeat</label>
                <div className="repeat-grid">
                  {[
                    { value: 'none',    label: 'No repeat' },
                    { value: 'daily',   label: 'Daily' },
                    { value: 'weekly',  label: 'Weekly' },
                    { value: 'monthly', label: '1 Month' },
                    { value: '3month',  label: '3 Months' },
                    { value: '6month',  label: '6 Months' },
                    { value: 'yearly',  label: '1 Year' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`repeat-chip ${form.recurringPattern === opt.value ? 'active' : ''}`}
                      onClick={() => setForm(p => ({
                        ...p,
                        recurringPattern: opt.value,
                        isRecurring: opt.value !== 'none',
                      }))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  <HiOutlineX /> Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <HiOutlineBell /> Set Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
