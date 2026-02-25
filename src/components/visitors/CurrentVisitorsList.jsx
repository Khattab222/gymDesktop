import React, { useState, useEffect } from 'react';
import visitorsService from '../../services/visitorsService';
import { formatCustomerName, formatServices, formatCapacityStatus } from '../../utils/formatters';
import { formatDate, formatDuration, calculateDuration } from '../../utils/dateUtils';

const CurrentVisitorsList = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data and set up real-time updates
  useEffect(() => {
    loadVisitors();
    loadCapacityInfo();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Load visitors data
  const loadVisitors = async () => {
    try {
      setLoading(true);
      const result = await visitorsService.getCurrentVisitors();
      
      if (result.success) {
        setVisitors(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error loading visitors:', error);
      setError('Failed to load current visitors');
    } finally {
      setLoading(false);
    }
  };

  // Load capacity information
  const loadCapacityInfo = async () => {
    try {
      const result = await visitorsService.getVisitorCount();
      if (result.success) {
        setCapacityInfo(result);
      }
    } catch (error) {
      console.error('Error loading capacity info:', error);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadVisitors(), loadCapacityInfo()]);
    setRefreshing(false);
  };

  // Handle manual exit
  const handleForceExit = async (customerId, customerName) => {
    if (!confirm(`Are you sure you want to manually exit ${customerName}?`)) {
      return;
    }

    try {
      const result = await visitorsService.forceExitVisitor(
        customerId, 
        'Manual exit by staff'
      );

      if (result.success) {
        await refreshData();
      } else {
        alert(`Failed to exit visitor: ${result.message}`);
      }
    } catch (error) {
      console.error('Error forcing exit:', error);
      alert('An error occurred while processing the exit');
    }
  };

  // Handle emergency evacuation
  const handleEmergencyEvacuation = async () => {
    if (!confirm('Are you sure you want to initiate emergency evacuation? This will exit ALL current visitors.')) {
      return;
    }

    try {
      const promises = visitors.map(visitor => 
        visitorsService.forceExitVisitor(visitor.customerId, 'Emergency evacuation')
      );
      
      await Promise.all(promises);
      await refreshData();
      alert('Emergency evacuation completed');
    } catch (error) {
      console.error('Error during emergency evacuation:', error);
      alert('Error during emergency evacuation');
    }
  };

  // Filter visitors based on search and service filter
  const filteredVisitors = visitors.filter(visitor => {
    const nameMatch = formatCustomerName(visitor.personalInfo)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const idMatch = visitor.customerId.includes(searchTerm);
    
    const serviceMatch = filterService === 'all' || 
      visitor.services.includes(filterService);

    return (nameMatch || idMatch) && serviceMatch;
  });

  // Calculate current duration for each visitor
  const getUpdatedDuration = (visitor) => {
    if (!visitor.entryTime) return 0;
    return calculateDuration(visitor.entryTime, new Date());
  };

  return (
    <div className="current-visitors">
      <div className="visitors-header">
        <div className="header-content">
          <h1>👥 Current Visitors</h1>
          <p>Real-time tracking of customers currently inside</p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={refreshData} 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            disabled={refreshing}
          >
            {refreshing ? '⏳' : '🔄'} 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          {visitors.length > 0 && (
            <button 
              onClick={handleEmergencyEvacuation}
              className="emergency-btn"
            >
              🚨 Emergency Exit All
            </button>
          )}
        </div>
      </div>

      {/* Capacity Status */}
      {capacityInfo && (
        <div className="capacity-status">
          <div className="capacity-card">
            <h3>Facility Capacity</h3>
            <div className="capacity-info">
              <div className="capacity-numbers">
                <span className="current-count">{capacityInfo.current}</span>
                <span className="divider">/</span>
                <span className="max-count">{capacityInfo.maximum}</span>
              </div>
              <div className="capacity-percentage">
                {capacityInfo.percentage}% Full
              </div>
            </div>
            <div className="capacity-bar">
              <div 
                className={`capacity-fill ${capacityInfo.isNearCapacity ? 'warning' : capacityInfo.isAtCapacity ? 'danger' : 'normal'}`}
                style={{ width: `${capacityInfo.percentage}%` }}
              ></div>
            </div>
            <div className="capacity-status-text">
              {capacityInfo.isAtCapacity ? 'At Capacity' :
               capacityInfo.isNearCapacity ? 'Near Capacity' :
               'Normal'}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="visitors-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search visitors by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-section">
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="service-filter"
          >
            <option value="all">All Services</option>
            <option value="gym">Gym Only</option>
            <option value="spa">Spa Only</option>
          </select>
        </div>
        
        <div className="results-count">
          Showing {filteredVisitors.length} of {visitors.length} visitors
        </div>
      </div>

      {/* Visitors List */}
      <div className="visitors-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Loading current visitors...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">❌</div>
            <p>{error}</p>
            <button onClick={loadVisitors} className="retry-btn">
              Try Again
            </button>
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👻</div>
            <h3>
              {visitors.length === 0 
                ? 'No visitors currently inside'
                : 'No visitors match your search'
              }
            </h3>
            <p>
              {visitors.length === 0
                ? 'All customers have exited the facility'
                : 'Try adjusting your search terms or filters'
              }
            </p>
          </div>
        ) : (
          <div className="visitors-grid">
            {filteredVisitors.map((visitor) => (
              <VisitorCard
                key={visitor.customerId}
                visitor={visitor}
                currentDuration={getUpdatedDuration(visitor)}
                onForceExit={handleForceExit}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .current-visitors {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .visitors-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .header-content h1 {
          font-size: 32px;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-content p {
          color: #718096;
          font-size: 16px;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .refresh-btn, .emergency-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .refresh-btn {
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .refresh-btn.refreshing {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .emergency-btn {
          background: #fed7d7;
          color: #c53030;
          border: 1px solid #feb2b2;
        }

        .emergency-btn:hover {
          background: #fbb6ce;
          border-color: #f687b3;
        }

        /* Capacity Status */
        .capacity-status {
          margin-bottom: 24px;
        }

        .capacity-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .capacity-card h3 {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 12px 0;
        }

        .capacity-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .capacity-numbers {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .current-count {
          font-size: 32px;
          font-weight: 700;
          color: #2d3748;
        }

        .divider {
          font-size: 24px;
          color: #a0aec0;
        }

        .max-count {
          font-size: 24px;
          color: #718096;
        }

        .capacity-percentage {
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
        }

        .capacity-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .capacity-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .capacity-fill.normal {
          background: #48bb78;
        }

        .capacity-fill.warning {
          background: #ed8936;
        }

        .capacity-fill.danger {
          background: #f56565;
        }

        .capacity-status-text {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Controls */
        .visitors-controls {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .search-section {
          flex: 1;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .service-filter {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .results-count {
          font-size: 14px;
          color: #718096;
          white-space: nowrap;
        }

        /* Content Area */
        .visitors-content {
          flex: 1;
          overflow-y: auto;
        }

        .visitors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        /* Loading, Error, Empty States */
        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: #718096;
        }

        .loading-spinner,
        .error-icon,
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .loading-state p,
        .error-state p,
        .empty-state p {
          margin: 8px 0;
        }

        .empty-state h3 {
          color: #4a5568;
          margin: 0 0 8px 0;
        }

        .retry-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 16px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .visitors-header {
            flex-direction: column;
            gap: 16px;
          }

          .visitors-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .visitors-grid {
            grid-template-columns: 1fr;
          }

          .header-actions {
            align-self: stretch;
          }

          .capacity-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

// Individual Visitor Card Component
const VisitorCard = ({ visitor, currentDuration, onForceExit }) => {
  const [realTimeDuration, setRealTimeDuration] = useState(currentDuration);

  // Update duration every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      if (visitor.entryTime) {
        const newDuration = calculateDuration(visitor.entryTime, new Date());
        setRealTimeDuration(newDuration);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [visitor.entryTime]);

  const customerName = formatCustomerName(visitor.personalInfo);
  const services = formatServices(visitor.services);

  return (
    <div className="visitor-card">
      <div className="visitor-header">
        <div className="visitor-avatar">
          {customerName.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="visitor-info">
          <h3 className="visitor-name">{customerName}</h3>
          <div className="visitor-id">ID: {visitor.customerId}</div>
        </div>
        <div className="visitor-status">
          <div className="status-dot active"></div>
          <span>Inside</span>
        </div>
      </div>

      <div className="visitor-details">
        <div className="detail-row">
          <span>Services:</span>
          <span className="services-badge">{services}</span>
        </div>
        
        <div className="detail-row">
          <span>Entry Time:</span>
          <span>{formatDate(visitor.entryTime, 'time')}</span>
        </div>
        
        <div className="detail-row">
          <span>Duration:</span>
          <span className="duration-display">
            {formatDuration(realTimeDuration)}
          </span>
        </div>
        
        <div className="detail-row">
          <span>Membership:</span>
          <span className={`membership-badge ${visitor.membership?.status}`}>
            {visitor.membership?.type || 'Unknown'}
          </span>
        </div>
      </div>

      <div className="visitor-actions">
        <button
          onClick={() => onForceExit(visitor.customerId, customerName)}
          className="exit-btn"
        >
          🚪 Manual Exit
        </button>
      </div>

      <style jsx>{`
        .visitor-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #48bb78;
          transition: all 0.2s;
        }

        .visitor-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .visitor-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .visitor-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }

        .visitor-info {
          flex: 1;
        }

        .visitor-name {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 4px 0;
        }

        .visitor-id {
          font-size: 12px;
          color: #718096;
          font-family: 'Courier New', monospace;
        }

        .visitor-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #22543d;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #48bb78;
          animation: pulse 2s infinite;
        }

        .visitor-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .detail-row span:first-child {
          color: #718096;
        }

        .detail-row span:last-child {
          color: #2d3748;
          font-weight: 500;
        }

        .services-badge {
          background: #bee3f8;
          color: #2c5282;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .membership-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .membership-badge.active {
          background: #c6f6d5;
          color: #22543d;
        }

        .membership-badge.expired {
          background: #fed7d7;
          color: #c53030;
        }

        .duration-display {
          color: #4299e1 !important;
          font-weight: 600 !important;
          font-family: 'Courier New', monospace;
        }

        .visitor-actions {
          display: flex;
          gap: 8px;
        }

        .exit-btn {
          flex: 1;
          background: #fed7d7;
          color: #c53030;
          border: 1px solid #feb2b2;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .exit-btn:hover {
          background: #fbb6ce;
          border-color: #f687b3;
        }
      `}</style>
    </div>
  );
};

export default CurrentVisitorsList;