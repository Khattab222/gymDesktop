import React, { useState, useEffect } from 'react';
import statisticsService from '../../services/statisticsService';
import * as formatters from '../../utils/formatters';
import * as dateUtils from '../../utils/dateUtils';
import './DailyDashboard.css';

const DailyDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  // Use ISO date (YYYY-MM-DD) for the date input and statistics service
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

      // statisticsService exposes getDailyStatistics, not getStatisticsByDate
      const result = await statisticsService.getDailyStatistics(selectedDate);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to load statistics data');
      }

      // Service returns { success, data }
      setStatistics(result.data);
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
      if (!statistics) {
        alert('No statistics data available to export');
        return;
      }

      setExportLoading(true);

      // Use the current statistics data for export
      const csvContent = convertToCSV(statistics);
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
    const rows = [];

    // Overview section
    rows.push(['Daily Statistics Report - ' + data.date]);
    rows.push([]);
    rows.push(['Overview']);
    rows.push(['Total Visits', data.overview?.totalVisits || 0]);
    rows.push(['Completed Visits', data.overview?.completedVisits || 0]);
    rows.push(['Currently Inside', data.overview?.currentlyInside || 0]);
    rows.push(['Average Duration', formatters.formatDuration(data.overview?.averageDuration || 0)]);
    rows.push(['Total Revenue', formatters.formatCurrency(data.revenue?.total || 0)]);
    rows.push([]);

    // Hourly data
    if (data.hourlyData && data.hourlyData.length > 0) {
      rows.push(['Hourly Visitor Flow']);
      rows.push(['Hour', 'Entries', 'Exits']);
      data.hourlyData.forEach(hour => {
        rows.push([hour.timeLabel || `${hour.hour}:00`, hour.entries || 0, hour.exits || 0]);
      });
      rows.push([]);
    }

    // Membership breakdown
    if (data.membershipBreakdown) {
      rows.push(['Membership Breakdown']);
      Object.entries(data.membershipBreakdown).forEach(([type, count]) => {
        rows.push([type.charAt(0).toUpperCase() + type.slice(1), count]);
      });
      rows.push([]);
    }

    // Service usage
    if (data.serviceUsage) {
      rows.push(['Service Usage']);
      Object.entries(data.serviceUsage).forEach(([service, count]) => {
        rows.push([service.charAt(0).toUpperCase() + service.slice(1), count]);
      });
    }

    return rows.map(row => row.join(',')).join('\n');
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
            <div className="metric-value">{statistics?.overview?.totalVisits || 0}</div>
            <div className="metric-change">
              {statistics?.overview?.completedVisits || 0} completed today
            </div>
          </div>
        </div>

        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <div className="metric-value">{formatters.formatCurrency(statistics?.revenue?.total || 0)}</div>
            <div className="metric-change">
              Average per visit: {formatters.formatCurrency(statistics?.revenue?.averagePerVisit || 0)}
            </div>
          </div>
        </div>

        <div className="metric-card avg-duration">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <h3>Avg Duration</h3>
            <div className="metric-value">{formatters.formatDuration(statistics?.overview?.averageDuration || 0)}</div>
            <div className="metric-change">
              Per visit average
            </div>
          </div>
        </div>

        <div className="metric-card peak-hour">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Peak Hour</h3>
            <div className="metric-value">{statistics?.peakHour?.timeRange || 'N/A'}</div>
            <div className="metric-change">
              {statistics?.peakHour?.entries || 0} entries
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Visits Chart */}
      <div className="chart-section">
        <h2>Hourly Visitor Flow</h2>
        <div className="hourly-chart">
          {statistics?.hourlyData?.length > 0 &&
            statistics.hourlyData.map((hour, index) => {
              const maxEntries = Math.max(...statistics.hourlyData.map(h => h.entries || 0)) || 1;
              return (
                <div key={index} className="hour-bar">
                  <div
                    className="bar"
                    style={{
                      height: `${((hour.entries || 0) / maxEntries) * 100}%`
                    }}
                    title={`${hour.timeLabel || `${hour.hour}:00`} - ${hour.entries || 0} entries`}
                  ></div>
                  <div className="hour-label">{hour.hour}</div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Membership Breakdown */}
      <div className="breakdown-section">
        <div className="membership-breakdown">
          <h2>Membership Breakdown</h2>
          <div className="breakdown-chart">
            {statistics?.membershipBreakdown &&
              Object.entries(statistics.membershipBreakdown).map(([type, count], index) => {
                const totalVisits = statistics.overview?.totalVisits || 0;
                const percentage = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
                return (
                  <div key={type} className="breakdown-item">
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: ['#667eea', '#f093fb', '#4facfe'][index % 3]
                        }}
                      ></div>
                    </div>
                    <div className="breakdown-info">
                      <span className="breakdown-type">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      <span className="breakdown-count">{count} ({percentage}%)</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        <div className="services-breakdown">
          <h2>Services Usage</h2>
          <div className="services-grid">
            {statistics?.serviceUsage &&
              Object.entries(statistics.serviceUsage).map(([serviceName, count], index) => (
                <div key={serviceName} className="service-card">
                  <div className="service-icon">
                    {serviceName === 'gym' ? '🏋️' : serviceName === 'spa' ? '🧖' : '🏃'}
                  </div>
                  <div className="service-info">
                    <h4>{serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}</h4>
                    <div className="service-count">{count} visits</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Summary Info */}
      <div className="summary-section">
        <h2>Daily Summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Date:</span>
            <span className="summary-value">{statistics?.date}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Currently Inside:</span>
            <span className="summary-value">{statistics?.overview?.currentlyInside || 0} visitors</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Duration:</span>
            <span className="summary-value">{formatters.formatDuration(statistics?.overview?.totalDuration || 0)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Generated At:</span>
            <span className="summary-value">{statistics?.generatedAt ? new Date(statistics.generatedAt).toLocaleTimeString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyDashboard;