import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { calendarAPI, taskAPI } from '../api';
import './CalendarPage.css';

const eventTypes = [
  { value: 'birthday', label: '🎂 Birthday', color: '#e17055' },
  { value: 'appointment', label: '📋 Appointment', color: '#6C5CE7' },
  { value: 'vaccine', label: '💉 Vaccine', color: '#00cec9' },
  { value: 'holiday', label: '🎉 Holiday', color: '#fdcb6e' },
  { value: 'meeting', label: '💼 Meeting', color: '#74b9ff' },
  { value: 'other', label: '📌 Other', color: '#a29bfe' },
];

const typeColors = Object.fromEntries(eventTypes.map(t => [t.value, t.color]));
const typeEmoji = { birthday: '🎂', appointment: '📋', vaccine: '💉', holiday: '🎉', meeting: '💼', other: '📌' };

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', type: 'other', isRecurring: false, recurringRule: 'none', color: '#6C5CE7', allDay: true });

  useEffect(() => { loadData(); }, [currentDate]);

  const loadData = async () => {
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const [eventsRes, tasksRes] = await Promise.all([
        calendarAPI.getAll({ start: start.toISOString(), end: end.toISOString() }),
        taskAPI.getAll()
      ]);
      setEvents(eventsRes.data);
      setTasks(tasksRes.data);
    } catch {
      setEvents([]);
      setTasks([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.date) return toast.error('Date is required');
    try {
      await calendarAPI.create({ ...form, color: typeColors[form.type] || form.color });
      toast.success('Event created! 📅');
      setShowModal(false);
      setForm({ title: '', description: '', date: '', type: 'other', isRecurring: false, recurringRule: 'none', color: '#6C5CE7', allDay: true });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating event');
    }
  };

  const handleDelete = async (id) => {
    try {
      await calendarAPI.delete(id);
      toast.success('Event deleted');
      loadData();
    } catch { toast.error('Error deleting event'); }
  };

  const navigateMonth = (dir) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
  };

  // Calendar generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getEventsForDay = (day) => {
    if (!day) return [];
    return events.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getDate() === day && eDate.getMonth() === month && eDate.getFullYear() === year;
    });
  };

  const getTasksForDay = (day) => {
    if (!day) return [];
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const tDate = new Date(t.dueDate);
      return tDate.getDate() === day && tDate.getMonth() === month && tDate.getFullYear() === year;
    });
  };

  const isToday = (day) => day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setShowDayDetails(true);
  };

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div>
          <h1>Calendar</h1>
          <p className="subtitle">Track birthdays, events, and important dates</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> New Event
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="calendar-nav glass-card">
        <button className="btn-icon" onClick={() => navigateMonth(-1)}><HiOutlineChevronLeft /></button>
        <h2 className="calendar-month-title">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button className="btn-icon" onClick={() => navigateMonth(1)}><HiOutlineChevronRight /></button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid glass-card">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="weekday-label">{d}</div>
          ))}
        </div>
        <div className="calendar-days">
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const dayTasks = getTasksForDay(day);
            const totalItems = dayEvents.length + dayTasks.length;
            return (
              <div
                key={idx}
                className={`calendar-day ${day ? 'has-day' : ''} ${isToday(day) ? 'today' : ''}`}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    <div className="day-events">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev._id} className="day-event-dot" style={{ background: ev.color || '#6C5CE7' }} title={ev.title}>
                          <span className="day-event-label">{ev.title}</span>
                        </div>
                      ))}
                      {dayTasks.slice(0, Math.max(0, 3 - dayEvents.length)).map(t => (
                        <div key={t._id} className="day-event-dot" style={{ background: '#00cec9', borderRadius: '50%', width: '6px', height: '6px', alignSelf: 'center', marginTop: '2px' }} title={t.title}>
                          <span className="day-event-label">{t.title}</span>
                        </div>
                      ))}
                      {totalItems > 3 && <span className="more-events">+{totalItems - 3}</span>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Events List */}
      <div className="events-list">
        <h3>Events This Month ({events.length})</h3>
        <div className="events-list-grid">
          {events.length > 0 ? events.map(event => (
            <div key={event._id} className="event-list-card glass-card">
              <div className="event-list-color" style={{ background: event.color || '#6C5CE7' }} />
              <div className="event-list-info">
                <span className="event-list-emoji">{typeEmoji[event.type] || '📌'}</span>
                <div>
                  <h4>{event.title}</h4>
                  <span className="event-list-date">
                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  {event.description && <p className="event-list-desc">{event.description}</p>}
                </div>
              </div>
              <button className="btn-icon" onClick={() => handleDelete(event._id)}><HiOutlineTrash /></button>
            </div>
          )) : (
            <div className="empty-state">
              <div className="icon">📅</div>
              <h3>No events this month</h3>
              <p>Click on a day or use the button above to add events</p>
            </div>
          )}
        </div>
      </div>

      {/* Day Details Modal */}
      {showDayDetails && selectedDate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDayDetails(false)}>
          <div className="modal-content">
            <h2 style={{ marginBottom: '16px' }}>
              {new Date(year, month, selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            
            <div className="day-details-section">
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Events</h3>
              {getEventsForDay(selectedDate).length > 0 ? getEventsForDay(selectedDate).map(ev => (
                <div key={ev._id} className="event-list-card glass-card" style={{ marginBottom: '8px' }}>
                  <div className="event-list-color" style={{ background: ev.color || '#6C5CE7' }} />
                  <div className="event-list-info">
                    <span className="event-list-emoji">{typeEmoji[ev.type] || '📌'}</span>
                    <div>
                      <h4>{ev.title}</h4>
                      {ev.description && <p className="event-list-desc">{ev.description}</p>}
                    </div>
                  </div>
                </div>
              )) : <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No events for this day</p>}
            </div>

            <div className="day-details-section" style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Tasks</h3>
              {getTasksForDay(selectedDate).length > 0 ? getTasksForDay(selectedDate).map(t => (
                <div key={t._id} className="event-list-card glass-card" style={{ marginBottom: '8px' }}>
                  <div className="event-list-color" style={{ background: '#00cec9' }} />
                  <div className="event-list-info">
                    <span className="event-list-emoji">☑️</span>
                    <div>
                      <h4>{t.title}</h4>
                      <span className={`badge badge-${t.priority}`} style={{ marginTop: '4px' }}>{t.priority}</span>
                    </div>
                  </div>
                </div>
              )) : <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No tasks due on this day</p>}
            </div>

            <div className="modal-actions" style={{ marginTop: '32px' }}>
              <button className="btn-secondary" onClick={() => setShowDayDetails(false)}>Close</button>
              <button className="btn-primary" onClick={() => {
                setShowDayDetails(false);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
                setForm(prev => ({ ...prev, date: dateStr }));
                setShowModal(true);
              }}>
                <HiOutlinePlus /> Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <h2>New Event</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" placeholder="Event name" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} autoFocus />
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
                  <label>Type</label>
                  <select value={form.type} onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}>
                    {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Recurring</label>
                  <select value={form.recurringRule} onChange={(e) => setForm(prev => ({ ...prev, recurringRule: e.target.value, isRecurring: e.target.value !== 'none' }))}>
                    <option value="none">No</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-group" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}><HiOutlineX /> Cancel</button>
                <button type="submit" className="btn-primary"><HiOutlinePlus /> Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
