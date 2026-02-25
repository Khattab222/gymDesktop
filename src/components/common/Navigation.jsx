import React, { useState, useEffect } from 'react';
import visitorsService from '../../services/visitorsService';
import statisticsService from '../../services/statisticsService';

const Navigation = ({ currentPage = 'dashboard' }) => {
  const [visitorCount, setVisitorCount] = useState(0);
  const [todayStats, setTodayStats] = useState(null);

  // Update real-time data
  useEffect(() => {
    const updateData = async () => {
      try {
        // Get current visitor count
        const countResult = await visitorsService.getVisitorCount();
        if (countResult.success) {
          setVisitorCount(countResult.current);
        }

        // Get today's stats
        const statsResult = await statisticsService.getDashboardStatistics();
        if (statsResult.success) {
          setTodayStats(statsResult.data.quickMetrics);
        }
      } catch (error) {
        console.error('Error updating navigation data:', error);
      }
    };

    updateData();
    
    // Update every 30 seconds
    const interval = setInterval(updateData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
    {
      id: 'scanner',
      label: 'Scanner',
      icon: '📱',
      description: 'Barcode entry/exit',
      badge: null,
      path: '/scanner'
    },
    {
      id: 'current-visitors',
      label: 'Current Visitors',
      icon: '👥',
      description: 'Live visitor tracking',
      badge: visitorCount,
      badgeColor: visitorCount > 0 ? 'success' : 'neutral',
      path: '/current-visitors'
    },
    {
      id: 'statistics',
      label: 'Daily Statistics',
      icon: '📊',
      description: 'Analytics & reports',
      badge: todayStats?.todayVisits || null,
      badgeColor: 'info',
      path: '/statistics'
    },
    {
      id: 'customers',
      label: 'Customer Management',
      icon: '👤',
      description: 'Manage customers',
      badge: null,
      path: '/customers'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      description: 'Overview',
      badge: null,
      path: '/dashboard'
    }
  ];

  const handleNavigation = (item) => {
    // In a real app with React Router, this would use navigate()
    // For now, we'll just log the navigation
    console.log(`Navigating to: ${item.path}`);
    
    // Dispatch custom event for the main app to handle
    window.dispatchEvent(new CustomEvent('navigate', { 
      detail: { page: item.id, path: item.path } 
    }));
  };

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h3>Navigation</h3>
        <div className="nav-status">
          <div className="status-indicator online"></div>
          <span>System Online</span>
        </div>
      </div>

      <div className="nav-items">
        {navigationItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => handleNavigation(item)}
          >
            <div className="nav-item-content">
              <div className="nav-item-left">
                <span className="nav-icon">{item.icon}</span>
                <div className="nav-text">
                  <div className="nav-label">{item.label}</div>
                  <div className="nav-description">{item.description}</div>
                </div>
              </div>
              
              {item.badge !== null && (
                <div className={`nav-badge ${item.badgeColor || 'neutral'}`}>
                  {item.badge}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="nav-footer">
        <div className="quick-stats">
          <h4>Today's Summary</h4>
          <div className="stat-row">
            <span>Visitors Inside:</span>
            <span className="stat-value">{visitorCount}</span>
          </div>
          <div className="stat-row">
            <span>Total Visits:</span>
            <span className="stat-value">{todayStats?.todayVisits || 0}</span>
          </div>
          <div className="stat-row">
            <span>Revenue:</span>
            <span className="stat-value">{todayStats?.todayRevenue || 0} EGP</span>
          </div>
        </div>

        {/* System Status */}
        <div className="system-status">
          <div className="status-item">
            <div className="status-dot success"></div>
            <span>Database Connected</span>
          </div>
          <div className="status-item">
            <div className="status-dot success"></div>
            <span>Services Running</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .navigation {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: white;
        }

        /* Header */
        .nav-header {
          padding: 24px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .nav-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 12px 0;
        }

        .nav-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #48bb78;
          animation: pulse 2s infinite;
        }

        .status-indicator.online {
          background: #48bb78;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .nav-status span {
          font-size: 12px;
          color: #718096;
          font-weight: 500;
        }

        /* Navigation Items */
        .nav-items {
          flex: 1;
          padding: 20px 0;
          overflow-y: auto;
        }

        .nav-item {
          width: 100%;
          background: none;
          border: none;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        .nav-item:hover {
          background: #f7fafc;
          border-left-color: #e2e8f0;
        }

        .nav-item.active {
          background: #edf2f7;
          border-left-color: #667eea;
        }

        .nav-item.active .nav-label {
          color: #667eea;
          font-weight: 600;
        }

        .nav-item-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .nav-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-icon {
          font-size: 20px;
          width: 24px;
          text-align: center;
        }

        .nav-text {
          text-align: left;
        }

        .nav-label {
          font-size: 14px;
          font-weight: 500;
          color: #2d3748;
          margin: 0 0 2px 0;
        }

        .nav-description {
          font-size: 12px;
          color: #718096;
        }

        .nav-badge {
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          padding: 0 6px;
        }

        .nav-badge.success {
          background: #c6f6d5;
          color: #22543d;
        }

        .nav-badge.info {
          background: #bee3f8;
          color: #2c5282;
        }

        .nav-badge.warning {
          background: #faf089;
          color: #744210;
        }

        .nav-badge.neutral {
          background: #e2e8f0;
          color: #4a5568;
        }

        /* Footer */
        .nav-footer {
          border-top: 1px solid #e2e8f0;
          padding: 20px;
        }

        .quick-stats {
          margin-bottom: 20px;
        }

        .quick-stats h4 {
          font-size: 12px;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .stat-row span:first-child {
          color: #718096;
        }

        .stat-value {
          color: #2d3748;
          font-weight: 600;
        }

        .system-status {
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #718096;
          margin-bottom: 4px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .status-dot.success {
          background: #48bb78;
        }

        .status-dot.warning {
          background: #ed8936;
        }

        .status-dot.error {
          background: #f56565;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .nav-header {
            padding: 16px;
          }

          .nav-item {
            padding: 12px 16px;
          }

          .nav-footer {
            padding: 16px;
          }

          .nav-description {
            display: none;
          }
        }

        /* Scrollbar Styling */
        .nav-items::-webkit-scrollbar {
          width: 4px;
        }

        .nav-items::-webkit-scrollbar-track {
          background: transparent;
        }

        .nav-items::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 2px;
        }

        .nav-items::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </nav>
  );
};

export default Navigation;