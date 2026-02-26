import React, { useState, useEffect } from 'react';
import statisticsService from '../../services/statisticsService';
import visitorsService from '../../services/visitorsService';
import * as formatters from '../../utils/formatters';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [currentVisitors, setCurrentVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load today's statistics
        const todayStats = await statisticsService.getDailyStatistics();
        if (todayStats?.success) {
          setStats(todayStats.data);
        }

        // Load current visitors count
        const visitors = await visitorsService.getCurrentVisitors();
        if (visitors?.success) {
          setCurrentVisitors(visitors.data || []);
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Gym & Spa Dashboard</h1>
        <p className="dashboard-subtitle">
          Real-time overview of facility operations
        </p>
      </header>

      {/* Quick Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card visitors-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Current Visitors</h3>
            <div className="stat-value">{currentVisitors.length}</div>
            <div className="stat-label">People Inside</div>
          </div>
        </div>

        <div className="stat-card daily-visits-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Today's Visits</h3>
            <div className="stat-value">{stats?.overview?.totalVisits || 0}</div>
            <div className="stat-label">Total Entries</div>
          </div>
        </div>

        <div className="stat-card revenue-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Today's Revenue</h3>
            <div className="stat-value">{formatters.formatCurrency(stats?.revenue?.total || 0)}</div>
            <div className="stat-label">Daily Income</div>
          </div>
        </div>

        <div className="stat-card avg-duration-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Avg Duration</h3>
            <div className="stat-value">{formatters.formatDuration(stats?.overview?.averageDuration || 0)}</div>
            <div className="stat-label">Per Visit</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="action-btn scanner-btn"
            onClick={() => window.location.hash = '#/scanner'}
          >
            <span className="btn-icon">📱</span>
            Barcode Scanner
          </button>
          
          <button 
            className="action-btn visitors-btn"
            onClick={() => window.location.hash = '#/visitors'}
          >
            <span className="btn-icon">👥</span>
            Current Visitors
          </button>
          
          <button 
            className="action-btn customer-btn"
            onClick={() => window.location.hash = '#/customers'}
          >
            <span className="btn-icon">👤</span>
            Customer Management
          </button>
          
          <button 
            className="action-btn stats-btn"
            onClick={() => window.location.hash = '#/statistics'}
          >
            <span className="btn-icon">📊</span>
            Daily Statistics
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {stats?.recentVisits && stats.recentVisits.length > 0 ? (
            stats.recentVisits.slice(0, 5).map((visit, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {visit.type === 'entry' ? '🟢' : '🔴'}
                </div>
                <div className="activity-content">
                  <div className="activity-title">
                    {visit.customerName} - {visit.type === 'entry' ? 'Entry' : 'Exit'}
                  </div>
                  <div className="activity-time">
                    {formatters.formatTime(visit.timestamp)}
                    {visit.type === 'exit' && visit.duration && (
                      <span className="visit-duration">
                        • Duration: {formatters.formatDuration(visit.duration)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="system-status">
        <h2>System Status</h2>
        <div className="status-indicators">
          <div className="status-item">
            <div className="status-dot status-online"></div>
            <span>Barcode Scanner: Online</span>
          </div>
          <div className="status-item">
            <div className="status-dot status-online"></div>
            <span>Database: Connected</span>
          </div>
          <div className="status-item">
            <div className="status-dot status-online"></div>
            <span>System: Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;