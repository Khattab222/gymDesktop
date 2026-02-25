import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Navigation from './Navigation';
import { formatDate } from '../../utils/dateUtils';

const Layout = ({ children, currentPage = 'dashboard' }) => {
  const { user, getUserDisplayName, logout, getSessionTimeRemaining, isSessionExpiringSoon } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check session expiration warning
  useEffect(() => {
    const checkSession = () => {
      if (isSessionExpiringSoon(15)) { // 15 minutes warning
        setShowSessionWarning(true);
      } else {
        setShowSessionWarning(false);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isSessionExpiringSoon]);

  // Handle logout
  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  // Handle session extend
  const handleExtendSession = () => {
    setShowSessionWarning(false);
    // In a real app, this would refresh the session
    window.location.reload();
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="layout-header">
        <div className="header-left">
          <h1 className="app-title">
            🏋️‍♂️ Gym & Spa Manager
          </h1>
          <div className="current-time">
            {formatDate(currentTime, 'datetime')}
          </div>
        </div>

        <div className="header-right">
          {/* Session Warning */}
          {showSessionWarning && (
            <div className="session-warning">
              <span className="warning-icon">⚠️</span>
              <span>Session expires soon</span>
              <button onClick={handleExtendSession} className="extend-btn">
                Extend
              </button>
            </div>
          )}

          {/* User Menu */}
          <div className="user-menu-container">
            <button 
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {getUserDisplayName().split(' ').map(n => n[0]).join('')}
              </div>
              <div className="user-info">
                <div className="user-name">{getUserDisplayName()}</div>
                <div className="user-role">{user?.role || 'Employee'}</div>
              </div>
              <div className="dropdown-arrow">▼</div>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="user-details">
                    <strong>{getUserDisplayName()}</strong>
                    <div className="user-meta">
                      <div>@{user?.username}</div>
                      <div className="user-role-badge">{user?.role}</div>
                    </div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-items">
                  <button className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    ⚙️ Settings
                  </button>
                  <button className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    ❓ Help
                  </button>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="layout-main">
        {/* Sidebar Navigation */}
        <aside className="layout-sidebar">
          <Navigation currentPage={currentPage} />
        </aside>

        {/* Content Area */}
        <main className="layout-content">
          <div className="content-wrapper">
            {children}
          </div>
        </main>
      </div>

      <style jsx>{`
        .layout-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f8f9fa;
        }

        /* Header Styles */
        .layout-header {
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
          position: relative;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .app-title {
          font-size: 24px;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .current-time {
          font-size: 14px;
          color: #718096;
          background: #f7fafc;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Session Warning */
        .session-warning {
          background: #fed7d7;
          color: #c53030;
          padding: 8px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .warning-icon {
          font-size: 16px;
        }

        .extend-btn {
          background: #c53030;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 600;
        }

        .extend-btn:hover {
          background: #9b2c2c;
        }

        /* User Menu */
        .user-menu-container {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-menu-trigger:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .user-info {
          text-align: left;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #2d3748;
        }

        .user-role {
          font-size: 12px;
          color: #718096;
          text-transform: capitalize;
        }

        .dropdown-arrow {
          font-size: 12px;
          color: #718096;
          transition: transform 0.2s;
        }

        .user-menu-trigger:hover .dropdown-arrow {
          transform: rotate(180deg);
        }

        /* User Dropdown */
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          min-width: 240px;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 16px;
        }

        .user-details strong {
          display: block;
          color: #2d3748;
          font-size: 16px;
          margin-bottom: 4px;
        }

        .user-meta {
          font-size: 12px;
          color: #718096;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-role-badge {
          background: #edf2f7;
          color: #4a5568;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: capitalize;
          font-weight: 500;
        }

        .dropdown-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 8px 0;
        }

        .dropdown-items {
          padding: 8px 0;
        }

        .dropdown-item {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-size: 14px;
          color: #4a5568;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dropdown-item:hover {
          background: #f7fafc;
        }

        .logout-item {
          color: #e53e3e;
        }

        .logout-item:hover {
          background: #fed7d7;
        }

        /* Main Layout */
        .layout-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .layout-sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e2e8f0;
          flex-shrink: 0;
        }

        .layout-content {
          flex: 1;
          overflow-y: auto;
          background: #f8f9fa;
        }

        .content-wrapper {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .layout-header {
            padding: 12px 16px;
          }

          .header-left {
            gap: 16px;
          }

          .app-title {
            font-size: 20px;
          }

          .current-time {
            display: none;
          }

          .user-info {
            display: none;
          }

          .layout-sidebar {
            width: 240px;
          }

          .content-wrapper {
            padding: 16px;
          }
        }

        @media (max-width: 640px) {
          .layout-main {
            flex-direction: column;
          }

          .layout-sidebar {
            width: 100%;
            height: auto;
          }

          .session-warning span:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;