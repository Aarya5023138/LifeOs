import { useState, useEffect } from 'react';
import {
  HiOutlineLightningBolt,
  HiOutlineFire,
  HiOutlineStar,
  HiOutlineTrendingUp,
  HiOutlineRefresh,
  HiOutlineClipboardCheck,
  HiOutlineBookOpen,
  HiOutlineChartBar,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { gamificationAPI } from '../api';
import './Gamification.css';

const levelTitles = [
  'Beginner', 'Novice', 'Apprentice', 'Journeyman', 'Adept',
  'Expert', 'Master', 'Grandmaster', 'Legend', 'Mythic',
  'Transcendent', 'Immortal', 'Godlike', 'Ascended', 'Eternal',
];

export default function Gamification() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animateXP, setAnimateXP] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await gamificationAPI.getStats();
      setStats(res.data);
      setTimeout(() => setAnimateXP(true), 300);
    } catch (err) {
      console.error(err);
      setStats({
        totalXP: 0, level: 1, currentStreak: 0, longestStreak: 0,
        tasksCompleted: 0, diaryEntries: 0, achievements: [],
        xpForNextLevel: 100, currentLevelXP: 0, xpProgress: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all progress? This cannot be undone!')) return;
    try {
      await gamificationAPI.reset();
      toast.success('Progress reset');
      setAnimateXP(false);
      loadStats();
    } catch {
      toast.error('Error resetting progress');
    }
  };

  const handleResetStreak = async () => {
    if (!window.confirm('Are you sure you want to reset your streak?')) return;
    try {
      await gamificationAPI.resetStreak();
      toast.success('Streak reset');
      loadStats();
    } catch {
      toast.error('Error resetting streak');
    }
  };

  if (loading) {
    return (
      <div className="gamification-page">
        <div className="page-header">
          <div><h1>Gamification</h1><p className="subtitle">Loading your stats...</p></div>
        </div>
        <div className="gamification-hero skeleton" style={{ height: 280 }} />
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      </div>
    );
  }

  const {
    totalXP, level, currentStreak, longestStreak,
    tasksCompleted, diaryEntries, achievements,
    xpForNextLevel, currentLevelXP, xpProgress,
  } = stats;

  const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];
  const xpNeeded = xpForNextLevel - currentLevelXP;

  return (
    <div className="gamification-page">
      <div className="page-header">
        <div>
          <h1>Gamification</h1>
          <p className="subtitle">Level up by completing tasks and writing diary entries</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleResetStreak}>
            <HiOutlineRefresh /> Reset Streak
          </button>
          <button className="btn-danger" onClick={handleReset}>
            <HiOutlineRefresh /> Reset All
          </button>
        </div>
      </div>

      {/* Hero Level Card */}
      <div className="level-hero glass-card">
        <div className="level-hero-bg" />
        <div className="level-ring-container">
          <div className="level-ring">
            <svg viewBox="0 0 120 120" className="level-ring-svg">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(108,92,231,0.15)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="url(#xpGradient)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={animateXP ? `${2 * Math.PI * 54 * (1 - xpProgress / 100)}` : `${2 * Math.PI * 54}`}
                className="level-ring-fill"
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6C5CE7" />
                  <stop offset="100%" stopColor="#a29bfe" />
                </linearGradient>
              </defs>
            </svg>
            <div className="level-number">
              <HiOutlineLightningBolt className="level-bolt" />
              <span>{level}</span>
            </div>
          </div>
          <div className="level-title">{levelTitle}</div>
        </div>

        <div className="level-hero-info">
          <div className="xp-display">
            <div className="xp-total">{totalXP.toLocaleString()} XP</div>
            <div className="xp-subtitle">Total Experience</div>
          </div>
          <div className="xp-progress-section">
            <div className="xp-progress-header">
              <span className="xp-current-level">Level {level}</span>
              <span className="xp-next-level">Level {level + 1}</span>
            </div>
            <div className="xp-progress-bar">
              <div
                className="xp-progress-fill"
                style={{ width: animateXP ? `${xpProgress}%` : '0%' }}
              />
              <div className="xp-progress-glow" style={{ left: animateXP ? `${xpProgress}%` : '0%' }} />
            </div>
            <div className="xp-progress-footer">
              <span>{currentLevelXP} / 100 XP</span>
              <span>{xpNeeded} XP to next level</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="gamification-stats-grid">
        <div className="gamification-stat-card glass-card">
          <div className="gamification-stat-icon streak-icon-bg">
            <HiOutlineFire />
          </div>
          <div className="gamification-stat-info">
            <div className="gamification-stat-value">{currentStreak}</div>
            <div className="gamification-stat-label">Current Streak</div>
          </div>
          <div className="gamification-stat-sparkle">🔥</div>
        </div>

        <div className="gamification-stat-card glass-card">
          <div className="gamification-stat-icon best-streak-icon-bg">
            <HiOutlineTrendingUp />
          </div>
          <div className="gamification-stat-info">
            <div className="gamification-stat-value">{longestStreak}</div>
            <div className="gamification-stat-label">Best Streak</div>
          </div>
          <div className="gamification-stat-sparkle">⭐</div>
        </div>

        <div className="gamification-stat-card glass-card">
          <div className="gamification-stat-icon tasks-icon-bg">
            <HiOutlineClipboardCheck />
          </div>
          <div className="gamification-stat-info">
            <div className="gamification-stat-value">{tasksCompleted}</div>
            <div className="gamification-stat-label">Tasks Done</div>
          </div>
          <div className="gamification-stat-sparkle">✅</div>
        </div>

        <div className="gamification-stat-card glass-card">
          <div className="gamification-stat-icon diary-icon-bg">
            <HiOutlineBookOpen />
          </div>
          <div className="gamification-stat-info">
            <div className="gamification-stat-value">{diaryEntries}</div>
            <div className="gamification-stat-label">Diary Entries</div>
          </div>
          <div className="gamification-stat-sparkle">📝</div>
        </div>
      </div>

      {/* XP Breakdown */}
      <div className="xp-breakdown glass-card">
        <div className="xp-breakdown-header">
          <h3><HiOutlineChartBar /> How to Earn XP</h3>
        </div>
        <div className="xp-breakdown-grid">
          <div className="xp-source">
            <div className="xp-source-icon">🎯</div>
            <div className="xp-source-info">
              <h4>Complete Tasks</h4>
              <p>Low: 5 XP · Medium: 10 XP · High: 20 XP · Urgent: 30 XP</p>
            </div>
          </div>
          <div className="xp-source">
            <div className="xp-source-icon">📝</div>
            <div className="xp-source-info">
              <h4>Write Diary Entries</h4>
              <p>Each diary entry: 15 XP</p>
            </div>
          </div>
          <div className="xp-source">
            <div className="xp-source-icon">🔥</div>
            <div className="xp-source-info">
              <h4>Maintain Streaks</h4>
              <p>Stay consistent daily to build your streak counter</p>
            </div>
          </div>
          <div className="xp-source">
            <div className="xp-source-icon">🏆</div>
            <div className="xp-source-info">
              <h4>Unlock Achievements</h4>
              <p>Hit milestones to earn permanent badges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="achievements-section">
        <h3><HiOutlineStar /> Achievements ({achievements ? achievements.length : 0})</h3>
        {achievements && achievements.length > 0 ? (
          <div className="achievements-grid">
            {achievements.map((ach, i) => (
              <div key={i} className="achievement-card glass-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="achievement-icon-lg">{ach.icon}</div>
                <div className="achievement-info">
                  <h4>{ach.name}</h4>
                  <p>{ach.description}</p>
                  {ach.unlockedAt && (
                    <span className="achievement-date">
                      Unlocked {new Date(ach.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="achievements-empty glass-card">
            <div className="achievements-empty-icon">🏆</div>
            <h4>No achievements yet</h4>
            <p>Complete tasks and write diary entries to unlock achievements!</p>
            <div className="achievements-preview">
              <div className="preview-badge locked">🎯 <span>First Step</span></div>
              <div className="preview-badge locked">📝 <span>Dear Diary</span></div>
              <div className="preview-badge locked">🔥 <span>Getting Rolling</span></div>
              <div className="preview-badge locked">📖 <span>Week of Reflection</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
