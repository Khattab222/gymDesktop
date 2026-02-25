import React, { useState, useEffect } from 'react';
import statisticsService from '../../services/statisticsService';
import visitorsService from '../../services/visitorsService';
import * as formatters from '../../utils/formatters';

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
        setStats(todayStats);

        // Load current visitors count
        const visitors = await visitorsService.getCurrentVisitors();
        setCurrentVisitors(visitors);

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
            <div className="stat-value">{stats?.totalVisits || 0}</div>
            <div className="stat-label">Total Entries</div>
          </div>
        </div>

        <div className="stat-card revenue-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Today's Revenue</h3>
            <div className="stat-value">{formatters.formatCurrency(stats?.totalRevenue || 0)}</div>
            <div className="stat-label">Daily Income</div>
          </div>
        </div>

        <div className="stat-card avg-duration-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Avg Duration</h3>
            <div className="stat-value">{formatters.formatDuration(stats?.averageDuration || 0)}</div>
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

      {/* Inline Styles */}
      <style jsx>{`
        .dashboard-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .dashboard-subtitle {
          color: #7f8c8d;
          font-size: 1.1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 1.5rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .visitors-card {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .daily-visits-card {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .revenue-card {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .avg-duration-card {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }

        .stat-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.2rem;
        }

        .stat-label {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .quick-actions {
          margin-bottom: 2rem;
        }

        .quick-actions h2 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .action-btn {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          color: #495057;
          font-size: 1rem;
        }

        .action-btn:hover {
          border-color: #667eea;
          background: #f8f9fa;
          transform: translateY(-1px);
        }

        .btn-icon {
          font-size: 1.5rem;
        }

        .recent-activity {
          margin-bottom: 2rem;
        }

        .recent-activity h2 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .activity-list {
          background: white;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          overflow: hidden;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #f8f9fa;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          font-size: 1.2rem;
        }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 0.2rem;
        }

        .activity-time {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .visit-duration {
          color: #495057;
        }

        .no-activity {
          padding: 2rem;
          text-align: center;
          color: #6c757d;
        }

        .system-status h2 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .status-indicators {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .status-online {
          background: #28a745;
        }

        .status-offline {
          background: #dc3545;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          text-align: center;
          padding: 4rem;
        }

        .error-message h3 {
          color: #dc3545;
          margin-bottom: 1rem;
        }

        .error-message button {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            grid-template-columns: 1fr;
          }
          
          .status-indicators {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;