import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CalendarPage from './pages/CalendarPage';
import Diary from './pages/Diary';
import Reminders from './pages/Reminders';
import Gamification from './pages/Gamification';
import Goals from './pages/Goals';
import Notes from './pages/Notes';
import Habits from './pages/Habits';
import Settings from './pages/Settings';
import './App.css';

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
  // Apply persisted accent color on load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeos-settings');
      if (saved) {
        const { accentColor } = JSON.parse(saved);
        if (accentColor) applyAccentColor(accentColor);
      }
    } catch {}

    // Listen for accent color changes from Settings page
    const handler = (e) => {
      if (e.key === 'lifeos-settings') {
        try {
          const { accentColor } = JSON.parse(e.newValue);
          if (accentColor) applyAccentColor(accentColor);
        } catch {}
      }
    };
    window.addEventListener('storage', handler);

    // Also listen for custom event from same-tab Settings updates
    const customHandler = (e) => applyAccentColor(e.detail);
    window.addEventListener('accent-color-change', customHandler);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('accent-color-change', customHandler);
    };
  }, []);

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
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
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
        </main>
      </div>
    </Router>
  );
}

export default App;
