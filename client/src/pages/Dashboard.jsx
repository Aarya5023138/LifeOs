import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineFire,
  HiOutlineLightningBolt,
  HiOutlineTrendingUp,
  HiOutlineCalendar,
  HiOutlineBookOpen,
  HiOutlineStar,
} from 'react-icons/hi';
import { dashboardAPI } from '../api';
import './Dashboard.css';

const moodEmojis = { amazing: '🤩', happy: '😊', neutral: '😐', sad: '😢', terrible: '😞' };
const moodColors = {
  amazing: 'var(--mood-amazing)',
  happy: 'var(--mood-happy)',
  neutral: 'var(--mood-neutral)',
  sad: 'var(--mood-sad)',
  terrible: 'var(--mood-terrible)',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await dashboardAPI.getSummary();
      setData(res.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
      // Set default data if API fails
      setData({
        tasks: { total: 0, completed: 0, pending: 0, overdue: 0, today: [] },
        reminders: [],
        events: [],
        recentDiary: [],
        gamification: { totalXP: 0, level: 1, currentStreak: 0, longestStreak: 0, tasksCompleted: 0, achievements: [] },
        moodStats: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="page-header">
          <div><h1>Dashboard</h1><p className="subtitle">Loading your overview...</p></div>
        </div>
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton stat-card" style={{height: 120}} />)}
        </div>
      </div>
    );
  }

  const { tasks, reminders, events, recentDiary, gamification, moodStats } = data;
  const xpProgress = gamification.totalXP ? Math.min(((gamification.totalXP % 100) / 100) * 100, 100) : 0;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome Back! 👋</h1>
          <p className="subtitle">Here's your productivity overview</p>
        </div>
        <div className="header-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Gamification Banner */}
      <div className="xp-banner glass-card">
        <div className="xp-info">
          <div className="xp-level">
            <HiOutlineLightningBolt className="level-icon" />
            <span>Level {gamification.level}</span>
          </div>
          <div className="xp-details">
            <span className="xp-amount">{gamification.totalXP} XP</span>
            <span className="xp-next">Next level: {gamification.level * 100} XP</span>
          </div>
          <div className="xp-bar-container">
            <div className="xp-bar" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>
        <div className="xp-streak">
          <HiOutlineFire className="streak-icon" />
          <div>
            <div className="streak-count">{gamification.currentStreak}</div>
            <div className="streak-label">Day Streak</div>
          </div>
        </div>
        <div className="xp-achievements">
          {gamification.achievements && gamification.achievements.slice(-3).map((ach, i) => (
            <div key={i} className="achievement-badge" title={ach.description}>
              <span>{ach.icon}</span>
            </div>
          ))}
          {(!gamification.achievements || gamification.achievements.length === 0) && (
            <div className="no-achievements">
              <HiOutlineStar />
              <span>Complete tasks to earn achievements!</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'rgba(108, 92, 231, 0.15)', color: 'var(--accent-primary)' }}>
            <HiOutlineClipboardCheck />
          </div>
          <div className="stat-info">
            <div className="stat-value">{tasks.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 206, 201, 0.15)', color: 'var(--color-success)' }}>
            <HiOutlineTrendingUp />
          </div>
          <div className="stat-info">
            <div className="stat-value">{tasks.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'rgba(253, 203, 110, 0.15)', color: 'var(--color-warning)' }}>
            <HiOutlineClock />
          </div>
          <div className="stat-info">
            <div className="stat-value">{tasks.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 107, 107, 0.15)', color: 'var(--color-danger)' }}>
            <HiOutlineExclamation />
          </div>
          <div className="stat-info">
            <div className="stat-value">{tasks.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Today's Tasks */}
        <div className="dashboard-section glass-card">
          <div className="section-header">
            <h3><HiOutlineClipboardCheck /> Today's Tasks</h3>
            <Link to="/tasks" className="section-link">View All →</Link>
          </div>
          <div className="section-content">
            {tasks.today && tasks.today.length > 0 ? (
              tasks.today.map(task => (
                <div key={task._id} className="mini-task-item">
                  <div className={`task-dot priority-${task.priority}`} />
                  <span className="task-title">{task.title}</span>
                  <span className={`badge badge-${task.category}`}>{task.category}</span>
                </div>
              ))
            ) : (
              <div className="section-empty">
                <span>✨</span>
                <p>No tasks due today. Enjoy your day!</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="dashboard-section glass-card">
          <div className="section-header">
            <h3><HiOutlineCalendar /> Upcoming Events</h3>
            <Link to="/calendar" className="section-link">View All →</Link>
          </div>
          <div className="section-content">
            {events && events.length > 0 ? (
              events.slice(0, 5).map(event => (
                <div key={event._id} className="mini-event-item">
                  <div className="event-color-bar" style={{ background: event.color || '#6C5CE7' }} />
                  <div className="event-details">
                    <span className="event-title">{event.title}</span>
                    <span className="event-date">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span className={`badge badge-${event.type === 'birthday' ? 'personal' : 'work'}`}>{event.type}</span>
                </div>
              ))
            ) : (
              <div className="section-empty">
                <span>📅</span>
                <p>No upcoming events this week</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Diary */}
        <div className="dashboard-section glass-card">
          <div className="section-header">
            <h3><HiOutlineBookOpen /> Recent Diary</h3>
            <Link to="/diary" className="section-link">View All →</Link>
          </div>
          <div className="section-content">
            {recentDiary && recentDiary.length > 0 ? (
              recentDiary.slice(0, 4).map(entry => (
                <div key={entry._id} className="mini-diary-item">
                  <span className="diary-mood">{moodEmojis[entry.mood] || '😐'}</span>
                  <div className="diary-details">
                    <span className="diary-preview">{entry.content.substring(0, 60)}...</span>
                    <span className="diary-date">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="section-empty">
                <span>📝</span>
                <p>Start writing your first diary entry!</p>
              </div>
            )}
          </div>
        </div>

        {/* Mood Overview */}
        <div className="dashboard-section glass-card">
          <div className="section-header">
            <h3>😊 Mood Overview</h3>
          </div>
          <div className="section-content mood-overview">
            {moodStats && moodStats.length > 0 ? (
              <div className="mood-bars">
                {moodStats.map(stat => (
                  <div key={stat._id} className="mood-bar-item">
                    <span className="mood-emoji">{moodEmojis[stat._id]}</span>
                    <div className="mood-bar-track">
                      <div
                        className="mood-bar-fill"
                        style={{
                          width: `${(stat.count / Math.max(...moodStats.map(s => s.count))) * 100}%`,
                          background: moodColors[stat._id],
                        }}
                      />
                    </div>
                    <span className="mood-count">{stat.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="section-empty">
                <span>📊</span>
                <p>Write diary entries to see mood stats</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
