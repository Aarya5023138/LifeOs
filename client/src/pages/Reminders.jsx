import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineBell, HiOutlineX, HiOutlineRefresh } from 'react-icons/hi';
import { HiOutlineBellSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { reminderAPI } from '../api';
import './Reminders.css';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '', isRecurring: false, recurringPattern: 'none',
  });

  useEffect(() => { loadReminders(); }, []);

  const loadReminders = async () => {
    try {
      const res = await reminderAPI.getAll();
      setReminders(res.data);
    } catch { setReminders([]); }
    finally { setLoading(false); }
  };

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

  const toggleActive = async (reminder) => {
    try {
      await reminderAPI.update(reminder._id, { isActive: !reminder.isActive });
      toast.success(reminder.isActive ? 'Reminder muted' : 'Reminder activated');
      loadReminders();
    } catch { toast.error('Error updating reminder'); }
  };

  const handleDelete = async (id) => {
    try {
      await reminderAPI.delete(id);
      toast.success('Reminder deleted');
      loadReminders();
    } catch { toast.error('Error deleting reminder'); }
  };

  const now = new Date();
  const upcoming = reminders.filter(r => new Date(r.dateTime) >= now && r.isActive);
  const past = reminders.filter(r => new Date(r.dateTime) < now || !r.isActive);

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTimeUntil = (dt) => {
    const diff = new Date(dt) - now;
    if (diff < 0) return 'Past';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h`;
    const mins = Math.floor(diff / (1000 * 60));
    return `in ${mins}m`;
  };

  const patternLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', none: '' };

  return (
    <div className="reminders-page">
      <div className="page-header">
        <div>
          <h1>Reminders</h1>
          <p className="subtitle">{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> New Reminder
        </button>
      </div>

      {loading ? (
        <div className="card-grid">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}</div>
      ) : reminders.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <h3>No reminders</h3>
          <p>Set reminders to never miss important moments</p>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="reminder-section">
              <h3 className="reminder-section-title">🔔 Upcoming</h3>
              <div className="reminder-list">
                {upcoming.map((reminder, idx) => (
                  <div key={reminder._id} className="reminder-card glass-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="reminder-bell active">
                      <HiOutlineBell />
                    </div>
                    <div className="reminder-info">
                      <h4>{reminder.title}</h4>
                      {reminder.description && <p className="reminder-desc">{reminder.description}</p>}
                      <div className="reminder-meta">
                        <span className="reminder-time">{formatDateTime(reminder.dateTime)}</span>
                        <span className="reminder-countdown">{getTimeUntil(reminder.dateTime)}</span>
                        {reminder.isRecurring && (
                          <span className="reminder-recurring">
                            <HiOutlineRefresh /> {patternLabels[reminder.recurringPattern]}
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

          {/* Past */}
          {past.length > 0 && (
            <div className="reminder-section">
              <h3 className="reminder-section-title past">🔕 Past / Muted</h3>
              <div className="reminder-list">
                {past.map((reminder, idx) => (
                  <div key={reminder._id} className="reminder-card glass-card past" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="reminder-bell muted">
                      <HiOutlineBellSlash />
                    </div>
                    <div className="reminder-info">
                      <h4>{reminder.title}</h4>
                      <div className="reminder-meta">
                        <span className="reminder-time">{formatDateTime(reminder.dateTime)}</span>
                        {reminder.isRecurring && (
                          <span className="reminder-recurring">
                            <HiOutlineRefresh /> {patternLabels[reminder.recurringPattern]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="reminder-actions">
                      {!reminder.isActive && (
                        <button className="btn-icon" onClick={() => toggleActive(reminder)} title="Activate">
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <h2>New Reminder</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" placeholder="Reminder title" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Details..." value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input type="time" value={form.time} onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Recurring</label>
                  <select value={form.recurringPattern} onChange={(e) => setForm(prev => ({ ...prev, recurringPattern: e.target.value, isRecurring: e.target.value !== 'none' }))}>
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-group"></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}><HiOutlineX /> Cancel</button>
                <button type="submit" className="btn-primary"><HiOutlinePlus /> Set Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
