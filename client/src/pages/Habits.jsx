import { useState, useEffect } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineFire,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { habitAPI } from '../api';
import './Habits.css';

const HABIT_ICONS = ['✅', '💪', '📚', '🏃', '🧘', '💧', '🎯', '🎨', '🎸', '💤', '🥗', '📝', '🧹', '💊', '🚶'];

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [form, setForm] = useState({
    title: '', description: '', icon: '✅', color: '#6C5CE7', frequency: 'daily',
  });

  useEffect(() => { loadHabits(); }, []);

  const loadHabits = async () => {
    try {
      const res = await habitAPI.getAll();
      setHabits(res.data);
    } catch {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Habit name is required');
    try {
      if (editingId) {
        await habitAPI.update(editingId, form);
        toast.success('Habit updated!');
      } else {
        await habitAPI.create(form);
        toast.success('Habit created! 🔥');
      }
      closeModal();
      loadHabits();
    } catch {
      toast.error('Error saving habit');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this habit and all its history?')) return;
    try {
      await habitAPI.delete(id);
      toast.success('Habit deleted');
      loadHabits();
    } catch {
      toast.error('Error deleting habit');
    }
  };

  const handleToggle = async (habitId, dateStr) => {
    try {
      const res = await habitAPI.toggle(habitId, dateStr);
      setHabits(prev => prev.map(h => h._id === habitId ? res.data : h));
      const wasCompleted = res.data.completedDates.includes(dateStr);
      if (wasCompleted) toast.success('Nice! Keep it up! 🎯', { duration: 1500 });
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleEdit = (habit) => {
    setForm({
      title: habit.title,
      description: habit.description || '',
      icon: habit.icon,
      color: habit.color,
      frequency: habit.frequency,
    });
    setEditingId(habit._id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ title: '', description: '', icon: '✅', color: '#6C5CE7', frequency: 'daily' });
  };

  // Week date helpers
  const getWeekDates = (offset = 0) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + (offset * 7)); // Start from Sunday
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const formatDateStr = (d) => d.toISOString().split('T')[0];
  const isToday = (d) => formatDateStr(d) === formatDateStr(new Date());
  const weekDates = getWeekDates(weekOffset);

  const weekLabel = (() => {
    const s = weekDates[0];
    const e = weekDates[6];
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  })();

  // Stats
  const todayStr = formatDateStr(new Date());
  const completedToday = habits.filter(h => h.completedDates?.includes(todayStr)).length;
  const totalActive = habits.filter(h => h.isActive).length;
  const bestStreak = Math.max(0, ...habits.map(h => h.currentStreak || 0));

  // Completion rate for the current week
  const weekCompletionRate = (() => {
    if (habits.length === 0) return 0;
    const weekDateStrs = weekDates.map(formatDateStr);
    let total = 0, completed = 0;
    habits.forEach(h => {
      weekDateStrs.forEach(ds => {
        total++;
        if (h.completedDates?.includes(ds)) completed++;
      });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  })();

  const COLORS = ['#6C5CE7', '#00cec9', '#e17055', '#00b894', '#fdcb6e', '#74b9ff', '#e84393', '#a29bfe'];

  return (
    <div className="habits-page animate-in">
      <div className="page-header">
        <div>
          <h1>Habit Tracker</h1>
          <p className="subtitle">Build consistency, one day at a time</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> New Habit
        </button>
      </div>

      {/* Stats Overview */}
      <div className="habits-stats-row">
        <div className="habit-stat-card glass-card">
          <div className="habit-stat-icon" style={{ background: 'rgba(108, 92, 231, 0.15)', color: 'var(--accent-primary)' }}>
            <HiOutlineCheckCircle />
          </div>
          <div className="habit-stat-info">
            <span className="habit-stat-value">{completedToday}/{totalActive}</span>
            <span className="habit-stat-label">Done Today</span>
          </div>
        </div>
        <div className="habit-stat-card glass-card">
          <div className="habit-stat-icon" style={{ background: 'rgba(255, 107, 107, 0.15)', color: '#ff6b6b' }}>
            <HiOutlineFire />
          </div>
          <div className="habit-stat-info">
            <span className="habit-stat-value">{bestStreak}</span>
            <span className="habit-stat-label">Best Streak</span>
          </div>
        </div>
        <div className="habit-stat-card glass-card">
          <div className="habit-stat-icon" style={{ background: 'rgba(0, 206, 201, 0.15)', color: '#00cec9' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>%</span>
          </div>
          <div className="habit-stat-info">
            <span className="habit-stat-value">{weekCompletionRate}%</span>
            <span className="habit-stat-label">Week Rate</span>
          </div>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="week-nav glass-card">
        <button className="btn-icon" onClick={() => setWeekOffset(w => w - 1)}>
          <HiOutlineChevronLeft />
        </button>
        <div className="week-label">
          <span>{weekLabel}</span>
          {weekOffset !== 0 && (
            <button className="today-btn" onClick={() => setWeekOffset(0)}>Today</button>
          )}
        </div>
        <button className="btn-icon" onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0}>
          <HiOutlineChevronRight />
        </button>
      </div>

      {/* Habit Grid */}
      {loading ? (
        <div className="card-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : habits.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔁</div>
          <h3>No habits yet</h3>
          <p>Start building daily habits to transform your routine</p>
        </div>
      ) : (
        <div className="habits-tracker">
          {/* Day labels header */}
          <div className="habits-header-row">
            <div className="habit-name-col">Habit</div>
            {weekDates.map(d => (
              <div key={formatDateStr(d)} className={`habit-day-label ${isToday(d) ? 'today' : ''}`}>
                <span className="day-abbr">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="day-num">{d.getDate()}</span>
              </div>
            ))}
            <div className="habit-streak-col">🔥</div>
          </div>

          {/* Habit rows */}
          {habits.map((habit, idx) => {
            const weekCompleted = weekDates.filter(d => habit.completedDates?.includes(formatDateStr(d))).length;
            return (
              <div
                key={habit._id}
                className="habit-row glass-card"
                style={{ animationDelay: `${idx * 0.05}s`, '--habit-color': habit.color }}
              >
                <div className="habit-name-col">
                  <span className="habit-icon">{habit.icon}</span>
                  <div className="habit-titles">
                    <span className="habit-title">{habit.title}</span>
                    <span className="habit-week-progress">{weekCompleted}/7 this week</span>
                  </div>
                  <div className="habit-row-actions">
                    <button className="btn-icon" onClick={() => handleEdit(habit)}><HiOutlinePencil /></button>
                    <button className="btn-icon" onClick={() => handleDelete(habit._id)}><HiOutlineTrash /></button>
                  </div>
                </div>

                {weekDates.map(d => {
                  const ds = formatDateStr(d);
                  const done = habit.completedDates?.includes(ds);
                  const isFuture = d > new Date() && !isToday(d);
                  return (
                    <div
                      key={ds}
                      className={`habit-cell ${done ? 'completed' : ''} ${isToday(d) ? 'today-cell' : ''} ${isFuture ? 'future' : ''}`}
                      onClick={() => !isFuture && handleToggle(habit._id, ds)}
                      style={done ? { background: `${habit.color}22`, borderColor: `${habit.color}55` } : {}}
                    >
                      {done && <div className="check-mark" style={{ color: habit.color }}>✓</div>}
                    </div>
                  );
                })}

                <div className="habit-streak-col">
                  <span className="streak-number">{habit.currentStreak || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <h2>{editingId ? 'Edit Habit' : 'New Habit'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Drink 8 glasses of water"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  placeholder="Why this habit matters to you"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <div className="icon-picker">
                  {HABIT_ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      className={`icon-option ${form.icon === ic ? 'selected' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, icon: ic }))}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker-row">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm(prev => ({ ...prev, color: c }))}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  <HiOutlineX /> Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <HiOutlinePlus /> {editingId ? 'Save' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
