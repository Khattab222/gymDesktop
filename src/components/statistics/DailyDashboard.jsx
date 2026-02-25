import React, { useState, useEffect } from 'react';
import statisticsService from '../../services/statisticsService';
import * as formatters from '../../utils/formatters';
import * as dateUtils from '../../utils/dateUtils';

const DailyDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dateUtils.formatDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, [selectedDate]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await statisticsService.getStatisticsByDate(selectedDate);
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError('Failed to load statistics data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const exportData = await statisticsService.exportDailyReport(selectedDate);
      
      // Create and download CSV file
      const csvContent = convertToCSV(exportData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `gym-stats-${selectedDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  const convertToCSV = (data) => {
    const headers = ['Time', 'Customer Name', 'Action', 'Duration', 'Membership Type', 'Revenue'];
    const rows = data.visits.map(visit => [
      formatters.formatTime(visit.timestamp),
      visit.customerName,
      visit.type,
      visit.duration ? formatters.formatDuration(visit.duration) : 'N/A',
      visit.membershipType,
      formatters.formatCurrency(visit.revenue || 0)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-container">
        <div className="error-message">
          <h3>Error Loading Statistics</h3>
          <p>{error}</p>
          <button onClick={loadStatistics}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="statistics-header">
        <h1>Daily Statistics Dashboard</h1>
        <div className="date-controls">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-picker"
          />
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="export-btn"
          >
            {exportLoading ? 'Exporting...' : '📊 Export CSV'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card total-visits">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Visits</h3>
            <div className="metric-value">{statistics?.totalVisits || 0}</div>
            <div className="metric-change">
              {statistics?.visitsChange > 0 ? '↗️' : statistics?.visitsChange < 0 ? '↘️' : '➡️'}
              {Math.abs(statistics?.visitsChange || 0)}% vs yesterday
            </div>
          </div>
        </div>

        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <div className="metric-value">{formatters.formatCurrency(statistics?.totalRevenue || 0)}</div>
            <div className="metric-change">
              {statistics?.revenueChange > 0 ? '↗️' : statistics?.revenueChange < 0 ? '↘️' : '➡️'}
              {Math.abs(statistics?.revenueChange || 0)}% vs yesterday
            </div>
          </div>
        </div>

        <div className="metric-card avg-duration">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <h3>Avg Duration</h3>
            <div className="metric-value">{formatters.formatDuration(statistics?.averageDuration || 0)}</div>
            <div className="metric-change">
              Per visit average
            </div>
          </div>
        </div>

        <div className="metric-card peak-hour">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Peak Hour</h3>
            <div className="metric-value">{statistics?.peakHour || 'N/A'}</div>
            <div className="metric-change">
              Busiest time period
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Visits Chart */}
      <div className="chart-section">
        <h2>Hourly Visitor Flow</h2>
        <div className="hourly-chart">
          {statistics?.hourlyData?.map((hour, index) => (
            <div key={index} className="hour-bar">
              <div 
                className="bar" 
                style={{ 
                  height: `${(hour.visits / Math.max(...statistics.hourlyData.map(h => h.visits))) * 100}%` 
                }}
                title={`${hour.hour}:00 - ${hour.visits} visits`}
              ></div>
              <div className="hour-label">{hour.hour}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Membership Breakdown */}
      <div className="breakdown-section">
        <div className="membership-breakdown">
          <h2>Membership Breakdown</h2>
          <div className="breakdown-chart">
            {statistics?.membershipBreakdown?.map((type, index) => (
              <div key={index} className="breakdown-item">
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill" 
                    style={{ 
                      width: `${(type.count / statistics.totalVisits) * 100}%`,
                      backgroundColor: ['#667eea', '#f093fb', '#4facfe'][index % 3]
                    }}
                  ></div>
                </div>
                <div className="breakdown-info">
                  <span className="breakdown-type">{type.type}</span>
                  <span className="breakdown-count">{type.count} ({Math.round((type.count / statistics.totalVisits) * 100)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="services-breakdown">
          <h2>Services Usage</h2>
          <div className="services-grid">
            {statistics?.servicesBreakdown?.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">
                  {service.service === 'gym' ? '🏋️' : service.service === 'spa' ? '🧖' : '🏃'}
                </div>
                <div className="service-info">
                  <h4>{service.service.charAt(0).toUpperCase() + service.service.slice(1)}</h4>
                  <div className="service-count">{service.count} visits</div>
                  <div className="service-revenue">{formatters.formatCurrency(service.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Visits Table */}
      <div className="recent-visits">
        <h2>Recent Visits</h2>
        <div className="visits-table">
          <div className="table-header">
            <div>Time</div>
            <div>Customer</div>
            <div>Action</div>
            <div>Duration</div>
            <div>Membership</div>
            <div>Revenue</div>
          </div>
          <div className="table-body">
            {statistics?.recentVisits?.slice(0, 10).map((visit, index) => (
              <div key={index} className="table-row">
                <div>{formatters.formatTime(visit.timestamp)}</div>
                <div>{visit.customerName}</div>
                <div>
                  <span className={`action-badge ${visit.type}`}>
                    {visit.type === 'entry' ? 'Entry' : 'Exit'}
                  </span>
                </div>
                <div>{visit.duration ? formatters.formatDuration(visit.duration) : '-'}</div>
                <div>{visit.membershipType}</div>
                <div>{formatters.formatCurrency(visit.revenue || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inline Styles */}
      <style jsx>{`
        .statistics-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .statistics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .statistics-header h1 {
          color: #2c3e50;
          margin: 0;
        }

        .date-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .date-picker {
          padding: 0.5rem;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 1rem;
        }

        .export-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.7rem 1.2rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.2s;
        }

        .export-btn:hover:not(:disabled) {
          background: #5a6fd8;
        }

        .export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 1.5rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .total-visits {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .revenue {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .avg-duration {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }

        .peak-hour {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .metric-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }

        .metric-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-size: 1.8rem;
          font-weight: bold;
          margin-bottom: 0.3rem;
        }

        .metric-change {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .chart-section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .chart-section h2 {
          color: #2c3e50;
          margin-bottom: 1.5rem;
        }

        .hourly-chart {
          display: flex;
          align-items: end;
          gap: 0.5rem;
          height: 200px;
          padding: 1rem 0;
        }

        .hour-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .bar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          width: 100%;
          min-height: 4px;
          border-radius: 2px 2px 0 0;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }

        .bar:hover {
          opacity: 0.8;
        }

        .hour-label {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .breakdown-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .membership-breakdown, .services-breakdown {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .membership-breakdown h2, .services-breakdown h2 {
          color: #2c3e50;
          margin-bottom: 1.5rem;
        }

        .breakdown-item {
          margin-bottom: 1rem;
        }

        .breakdown-bar {
          height: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .breakdown-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .breakdown-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }

        .breakdown-type {
          font-weight: 500;
          color: #2c3e50;
        }

        .breakdown-count {
          color: #6c757d;
        }

        .services-grid {
          display: grid;
          gap: 1rem;
        }

        .service-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid #f8f9fa;
          border-radius: 8px;
          transition: border-color 0.2s;
        }

        .service-card:hover {
          border-color: #667eea;
        }

        .service-icon {
          font-size: 2rem;
        }

        .service-info h4 {
          margin: 0 0 0.3rem 0;
          color: #2c3e50;
        }

        .service-count {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .service-revenue {
          font-weight: 500;
          color: #28a745;
        }

        .recent-visits {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .recent-visits h2 {
          color: #2c3e50;
          margin-bottom: 1.5rem;
        }

        .visits-table {
          overflow-x: auto;
        }

        .table-header, .table-row {
          display: grid;
          grid-template-columns: 100px 1fr 80px 100px 120px 100px;
          gap: 1rem;
          padding: 0.8rem;
          align-items: center;
        }

        .table-header {
          background: #f8f9fa;
          border-radius: 6px;
          font-weight: 600;
          color: #495057;
          margin-bottom: 0.5rem;
        }

        .table-row {
          border-bottom: 1px solid #f8f9fa;
          transition: background 0.2s;
        }

        .table-row:hover {
          background: #f8f9fa;
        }

        .action-badge {
          padding: 0.3rem 0.6rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          text-align: center;
        }

        .action-badge.entry {
          background: #d4edda;
          color: #155724;
        }

        .action-badge.exit {
          background: #f8d7da;
          color: #721c24;
        }

        .loading-spinner, .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          text-align: center;
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
        }

        @media (max-width: 1024px) {
          .breakdown-section {
            grid-template-columns: 1fr;
          }
          
          .metrics-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .statistics-container {
            padding: 1rem;
          }
          
          .statistics-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          
          .date-controls {
            justify-content: center;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .table-header, .table-row {
            grid-template-columns: 80px 1fr 60px 80px 100px 80px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyDashboard;