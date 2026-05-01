import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineCog,
  HiOutlineBell,
  HiOutlineClock,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineInformationCircle,
  HiOutlineColorSwatch,
  HiOutlineVolumeUp,
  HiOutlineRefresh,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineStop,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { taskAPI, diaryAPI, calendarAPI, reminderAPI, gamificationAPI } from '../api';
import './Settings.css';

const STORAGE_KEY = 'lifeos-settings';

const defaultSettings = {
  pomodoroWork: 25,
  pomodoroBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroAutoStart: false,
  notificationsEnabled: true,
  notificationSound: true,
  notificationReminders: true,
  accentColor: '#6C5CE7',
  userName: 'User',
};

const accentPresets = [
  { name: 'Lavender', color: '#6C5CE7' },
  { name: 'Ocean', color: '#0984e3' },
  { name: 'Emerald', color: '#00b894' },
  { name: 'Sunset', color: '#e17055' },
  { name: 'Rose', color: '#e84393' },
  { name: 'Amber', color: '#f39c12' },
  { name: 'Crimson', color: '#d63031' },
  { name: 'Teal', color: '#00cec9' },
];

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // Pomodoro state
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState('work'); // work, break, longBreak
  const [pomodoroTime, setPomodoroTime] = useState(settings.pomodoroWork * 60);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Pomodoro timer logic
  useEffect(() => {
    if (pomodoroActive) {
      intervalRef.current = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            handlePomodoroComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [pomodoroActive]);

  const handlePomodoroComplete = () => {
    setPomodoroActive(false);
    if (settings.notificationSound) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1000;
          gain2.gain.value = 0.3;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.5);
        }, 350);
      } catch {}
    }

    if (pomodoroPhase === 'work') {
      const newSessions = pomodoroSessions + 1;
      setPomodoroSessions(newSessions);
      if (newSessions % 4 === 0) {
        toast.success('🎉 Great work! Time for a long break!');
        setPomodoroPhase('longBreak');
        setPomodoroTime(settings.pomodoroLongBreak * 60);
      } else {
        toast.success('☕ Work session done! Take a short break.');
        setPomodoroPhase('break');
        setPomodoroTime(settings.pomodoroBreak * 60);
      }
      if (settings.pomodoroAutoStart) setPomodoroActive(true);
    } else {
      toast.success('💪 Break over! Ready to focus?');
      setPomodoroPhase('work');
      setPomodoroTime(settings.pomodoroWork * 60);
      if (settings.pomodoroAutoStart) setPomodoroActive(true);
    }
  };

  const resetPomodoro = () => {
    setPomodoroActive(false);
    setPomodoroPhase('work');
    setPomodoroTime(settings.pomodoroWork * 60);
    setPomodoroSessions(0);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const pomodoroProgress = (() => {
    const total =
      pomodoroPhase === 'work' ? settings.pomodoroWork * 60 :
      pomodoroPhase === 'break' ? settings.pomodoroBreak * 60 :
      settings.pomodoroLongBreak * 60;
    return ((total - pomodoroTime) / total) * 100;
  })();

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExportData = async () => {
    try {
      const [tasks, diary, calendar, reminders, gamification] = await Promise.all([
        taskAPI.getAll().then(r => r.data).catch(() => []),
        diaryAPI.getAll().then(r => r.data).catch(() => []),
        calendarAPI.getAll().then(r => r.data).catch(() => []),
        reminderAPI.getAll().then(r => r.data).catch(() => []),
        gamificationAPI.getStats().then(r => r.data).catch(() => ({})),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        tasks,
        diaryEntries: diary,
        calendarEvents: calendar,
        reminders,
        gamification,
        settings,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifeos-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully! 📦');
    } catch {
      toast.error('Error exporting data');
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('⚠️ This will delete ALL your data including tasks, diary entries, calendar events, reminders, and gamification progress. This cannot be undone!\n\nAre you sure?')) return;
    try {
      await gamificationAPI.reset();
      toast.success('All data cleared.');
    } catch {
      toast.error('Error clearing data');
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Notifications enabled! 🔔');
      updateSetting('notificationsEnabled', true);
    } else {
      toast.error('Notification permission denied');
      updateSetting('notificationsEnabled', false);
    }
  };

  const phaseLabels = { work: 'Focus Time', break: 'Short Break', longBreak: 'Long Break' };
  const phaseColors = { work: '#6C5CE7', break: '#00cec9', longBreak: '#00b894' };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">Customize your LifeOS experience</p>
        </div>
      </div>

      {/* Pomodoro Timer */}
      <div className="settings-section">
        <div className="settings-section-header">
          <HiOutlineClock className="section-icon" />
          <div>
            <h3>Pomodoro Timer</h3>
            <p>Stay focused with the Pomodoro Technique</p>
          </div>
        </div>

        <div className="pomodoro-widget glass-card">
          <div className="pomodoro-display">
            <div className="pomodoro-ring">
              <svg viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(108,92,231,0.1)" strokeWidth="6" />
                <circle
                  cx="80" cy="80" r="70" fill="none"
                  stroke={phaseColors[pomodoroPhase]}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - pomodoroProgress / 100)}`}
                  transform="rotate(-90 80 80)"
                  className="pomodoro-ring-fill"
                />
              </svg>
              <div className="pomodoro-time-display">
                <div className="pomodoro-phase-label" style={{ color: phaseColors[pomodoroPhase] }}>
                  {phaseLabels[pomodoroPhase]}
                </div>
                <div className="pomodoro-time">{formatTime(pomodoroTime)}</div>
                <div className="pomodoro-sessions">{pomodoroSessions} sessions</div>
              </div>
            </div>
          </div>

          <div className="pomodoro-controls">
            <button
              className={`pomodoro-btn ${pomodoroActive ? 'pause' : 'play'}`}
              onClick={() => setPomodoroActive(!pomodoroActive)}
            >
              {pomodoroActive ? <HiOutlinePause /> : <HiOutlinePlay />}
              {pomodoroActive ? 'Pause' : 'Start'}
            </button>
            <button className="pomodoro-btn reset" onClick={resetPomodoro}>
              <HiOutlineStop /> Reset
            </button>
          </div>

          <div className="pomodoro-settings">
            <div className="pomodoro-setting-item">
              <label>Focus (min)</label>
              <input
                type="number" min="1" max="90"
                value={settings.pomodoroWork}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 25;
                  updateSetting('pomodoroWork', val);
                  if (pomodoroPhase === 'work' && !pomodoroActive) setPomodoroTime(val * 60);
                }}
              />
            </div>
            <div className="pomodoro-setting-item">
              <label>Break (min)</label>
              <input
                type="number" min="1" max="30"
                value={settings.pomodoroBreak}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 5;
                  updateSetting('pomodoroBreak', val);
                  if (pomodoroPhase === 'break' && !pomodoroActive) setPomodoroTime(val * 60);
                }}
              />
            </div>
            <div className="pomodoro-setting-item">
              <label>Long Break (min)</label>
              <input
                type="number" min="1" max="60"
                value={settings.pomodoroLongBreak}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 15;
                  updateSetting('pomodoroLongBreak', val);
                  if (pomodoroPhase === 'longBreak' && !pomodoroActive) setPomodoroTime(val * 60);
                }}
              />
            </div>
            <div className="pomodoro-setting-item toggle-item">
              <label>Auto-start next</label>
              <button
                className={`toggle-switch ${settings.pomodoroAutoStart ? 'on' : ''}`}
                onClick={() => updateSetting('pomodoroAutoStart', !settings.pomodoroAutoStart)}
              >
                <div className="toggle-thumb" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Accent Color */}
      <div className="settings-section">
        <div className="settings-section-header">
          <HiOutlineColorSwatch className="section-icon" />
          <div>
            <h3>Accent Color</h3>
            <p>Choose a color theme for the app</p>
          </div>
        </div>
        <div className="settings-card glass-card">
          <div className="color-presets">
            {accentPresets.map(preset => (
              <button
                key={preset.color}
                className={`color-preset ${settings.accentColor === preset.color ? 'active' : ''}`}
                style={{ '--preset-color': preset.color }}
                onClick={() => {
                  updateSetting('accentColor', preset.color);
                  window.dispatchEvent(new CustomEvent('accent-color-change', { detail: preset.color }));
                  toast.success(`Theme changed to ${preset.name}`);
                }}
                title={preset.name}
              >
                <div className="color-swatch" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="settings-section">
        <div className="settings-section-header">
          <HiOutlineBell className="section-icon" />
          <div>
            <h3>Notifications</h3>
            <p>Manage notification preferences</p>
          </div>
        </div>
        <div className="settings-card glass-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <HiOutlineBell />
              <div>
                <span className="settings-row-title">Browser Notifications</span>
                <span className="settings-row-desc">Get notified about reminders</span>
              </div>
            </div>
            <button
              className={`toggle-switch ${settings.notificationsEnabled ? 'on' : ''}`}
              onClick={requestNotificationPermission}
            >
              <div className="toggle-thumb" />
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <HiOutlineVolumeUp />
              <div>
                <span className="settings-row-title">Sound Effects</span>
                <span className="settings-row-desc">Play sounds for timer events</span>
              </div>
            </div>
            <button
              className={`toggle-switch ${settings.notificationSound ? 'on' : ''}`}
              onClick={() => updateSetting('notificationSound', !settings.notificationSound)}
            >
              <div className="toggle-thumb" />
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <HiOutlineClock />
              <div>
                <span className="settings-row-title">Reminder Alerts</span>
                <span className="settings-row-desc">Notify before reminder times</span>
              </div>
            </div>
            <button
              className={`toggle-switch ${settings.notificationReminders ? 'on' : ''}`}
              onClick={() => updateSetting('notificationReminders', !settings.notificationReminders)}
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <div className="settings-section-header">
          <HiOutlineDownload className="section-icon" />
          <div>
            <h3>Data Management</h3>
            <p>Export or clear your data</p>
          </div>
        </div>
        <div className="settings-card glass-card">
          <div className="data-actions">
            <button className="data-action-btn export" onClick={handleExportData}>
              <HiOutlineDownload />
              <div>
                <span className="data-action-title">Export All Data</span>
                <span className="data-action-desc">Download a JSON backup of everything</span>
              </div>
            </button>
            <button className="data-action-btn danger" onClick={handleClearAllData}>
              <HiOutlineTrash />
              <div>
                <span className="data-action-title">Clear All Data</span>
                <span className="data-action-desc">Permanently delete everything</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <div className="settings-section-header">
          <HiOutlineInformationCircle className="section-icon" />
          <div>
            <h3>About LifeOS</h3>
            <p>App information</p>
          </div>
        </div>
        <div className="settings-card glass-card about-card">
          <div className="about-logo">
            <div className="about-logo-icon">⚡</div>
            <div className="about-logo-text">
              <h4>LifeOS</h4>
              <span>v1.0.0</span>
            </div>
          </div>
          <p className="about-desc">
            A premium productivity and life management suite. Track tasks, manage your calendar,
            write diary entries, set reminders, and level up with gamification.
          </p>
          <div className="about-tech">
            <span className="tech-badge">React</span>
            <span className="tech-badge">Vite</span>
            <span className="tech-badge">Express</span>
            <span className="tech-badge">MongoDB</span>
            <span className="tech-badge">Node.js</span>
          </div>
        </div>
      </div>
    </div>
  );
}
