import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HiOutlineViewGrid, 
  HiOutlineClipboardList, 
  HiOutlineCalendar, 
  HiOutlineBookOpen, 
  HiOutlineBell,
  HiOutlineLightningBolt,
  HiOutlineCog,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineStar,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { path: '/tasks', icon: HiOutlineClipboardList, label: 'Tasks' },
  { path: '/calendar', icon: HiOutlineCalendar, label: 'Calendar' },
  { path: '/diary', icon: HiOutlineBookOpen, label: 'Diary' },
  { path: '/reminders', icon: HiOutlineBell, label: 'Reminders' },
  { path: '/goals', icon: HiOutlineStar, label: 'Goals' },
  { path: '/gamification', icon: HiOutlineLightningBolt, label: 'Gamification' },
  { path: '/notes', icon: HiOutlineDocumentText, label: 'Notes' },
  { path: '/habits', icon: HiOutlineRefresh, label: 'Habits' },
];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    closeMobile();
    logout();
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
      </button>

      {/* Backdrop */}
      {mobileOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <HiOutlineLightningBolt />
          </div>
          <div className="brand-text">
            <h1>LifeOS</h1>
            <span>Productivity Suite</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <div className="nav-icon-wrapper">
                  <Icon className="nav-icon" />
                </div>
                <span className="nav-label">{item.label}</span>
                {isActive && <div className="nav-indicator" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={`nav-item settings-nav ${location.pathname === '/settings' ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <div className="nav-icon-wrapper">
              <HiOutlineCog className="nav-icon" />
            </div>
            <span className="nav-label">Settings</span>
            {location.pathname === '/settings' && <div className="nav-indicator" />}
          </NavLink>

          {/* User info + logout */}
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-email">{user.email}</span>
              </div>
              <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
                <HiOutlineLogout />
              </button>
            </div>
          )}
          <div className="sidebar-version">v2.0.0</div>
        </div>
      </aside>
    </>
  );
}
