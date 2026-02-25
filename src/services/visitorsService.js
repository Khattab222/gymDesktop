import dataService from './dataService.js';
import customerService from './customerService.js';
import { getCurrentTimestamp, calculateDuration } from '../utils/dateUtils.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

class VisitorsService {
  constructor() {
    this.visitorUpdateCallbacks = [];
  }

  /**
   * Get all customers currently inside the facility
   * @returns {Promise<object>} Current visitors data
   */
  async getCurrentVisitors() {
    try {
      const currentVisitors = dataService.getCurrentVisitors();
      
      // Enrich visitor data with real-time information
      const enrichedVisitors = currentVisitors.map(visitor => {
        const entryTime = visitor.currentVisitData?.entryTime;
        const currentDuration = entryTime 
          ? calculateDuration(entryTime, new Date())
          : 0;

        return {
          ...visitor,
          currentDuration,
          entryTime,
          visitId: visitor.currentVisitData?.visitId,
          services: visitor.currentVisitData?.services || []
        };
      });

      // Sort by entry time (most recent first)
      enrichedVisitors.sort((a, b) => {
        const timeA = new Date(a.entryTime || 0);
        const timeB = new Date(b.entryTime || 0);
        return timeB - timeA;
      });

      return {
        success: true,
        data: enrichedVisitors,
        count: enrichedVisitors.length,
        timestamp: getCurrentTimestamp()
      };

    } catch (error) {
      console.error('Get current visitors error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: [],
        count: 0
      };
    }
  }

  /**
   * Get visitor count
   * @returns {Promise<object>} Visitor count information
   */
  async getVisitorCount() {
    try {
      const count = dataService.getVisitorCount();
      const maxCapacity = 100; // This could be configurable

      return {
        success: true,
        current: count,
        maximum: maxCapacity,
        percentage: Math.round((count / maxCapacity) * 100),
        available: maxCapacity - count,
        isNearCapacity: count >= maxCapacity * 0.8,
        isAtCapacity: count >= maxCapacity
      };

    } catch (error) {
      console.error('Get visitor count error:', error);
      return {
        success: false,
        current: 0,
        maximum: 0,
        percentage: 0
      };
    }
  }

  /**
   * Get visitor by customer ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<object>} Visitor information
   */
  async getVisitorById(customerId) {
    try {
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required'
        };
      }

      const visitors = await this.getCurrentVisitors();
      if (!visitors.success) {
        return visitors;
      }

      const visitor = visitors.data.find(v => v.customerId === customerId);
      
      if (!visitor) {
        return {
          success: false,
          message: 'Visitor not found or not currently inside'
        };
      }

      return {
        success: true,
        data: visitor
      };

    } catch (error) {
      console.error('Get visitor by ID error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Search current visitors
   * @param {string} query - Search query (name, ID, etc.)
   * @returns {Promise<object>} Search results
   */
  async searchCurrentVisitors(query) {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          message: 'Search query must be at least 2 characters',
          data: []
        };
      }

      const visitors = await this.getCurrentVisitors();
      if (!visitors.success) {
        return visitors;
      }

      const searchTerm = query.toLowerCase();
      const filteredVisitors = visitors.data.filter(visitor => {
        const fullName = `${visitor.personalInfo.firstName} ${visitor.personalInfo.lastName}`.toLowerCase();
        return fullName.includes(searchTerm) ||
               visitor.customerId.includes(searchTerm) ||
               visitor.personalInfo.firstName.toLowerCase().includes(searchTerm) ||
               visitor.personalInfo.lastName.toLowerCase().includes(searchTerm);
      });

      return {
        success: true,
        data: filteredVisitors,
        count: filteredVisitors.length,
        query: query.trim()
      };

    } catch (error) {
      console.error('Search current visitors error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: []
      };
    }
  }

  /**
   * Get visitors by service type
   * @param {string} serviceType - Service type (gym, spa)
   * @returns {Promise<object>} Filtered visitors
   */
  async getVisitorsByService(serviceType) {
    try {
      const visitors = await this.getCurrentVisitors();
      if (!visitors.success) {
        return visitors;
      }

      const filteredVisitors = visitors.data.filter(visitor => 
        visitor.services.includes(serviceType)
      );

      return {
        success: true,
        data: filteredVisitors,
        count: filteredVisitors.length,
        service: serviceType
      };

    } catch (error) {
      console.error('Get visitors by service error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: []
      };
    }
  }

  /**
   * Get visitors by duration (long-stay visitors)
   * @param {number} minDuration - Minimum duration in minutes
   * @returns {Promise<object>} Long-stay visitors
   */
  async getLongStayVisitors(minDuration = 180) { // 3 hours default
    try {
      const visitors = await this.getCurrentVisitors();
      if (!visitors.success) {
        return visitors;
      }

      const longStayVisitors = visitors.data.filter(visitor => 
        visitor.currentDuration >= minDuration
      );

      // Sort by duration (longest first)
      longStayVisitors.sort((a, b) => b.currentDuration - a.currentDuration);

      return {
        success: true,
        data: longStayVisitors,
        count: longStayVisitors.length,
        threshold: minDuration
      };

    } catch (error) {
      console.error('Get long stay visitors error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: []
      };
    }
  }

  /**
   * Force exit a visitor (emergency or manual override)
   * @param {string} customerId - Customer ID
   * @param {string} reason - Reason for force exit
   * @returns {Promise<object>} Force exit result
   */
  async forceExitVisitor(customerId, reason = 'Manual override') {
    try {
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required'
        };
      }

      // Check if visitor is currently inside
      const visitor = await this.getVisitorById(customerId);
      if (!visitor.success) {
        return visitor;
      }

      const exitTime = getCurrentTimestamp();
      const entryTime = visitor.data.entryTime;
      const duration = calculateDuration(entryTime, exitTime);

      // Find and update the visit record
      const currentVisits = dataService.getCurrentVisits();
      const visitToEnd = currentVisits.find(v => v.customerId === customerId);
      
      if (!visitToEnd) {
        return {
          success: false,
          message: 'No active visit found'
        };
      }

      // End the visit
      dataService.endVisit(visitToEnd.visitId, exitTime);

      // Update customer visit status
      dataService.updateCustomerVisitStatus(customerId, false, null, exitTime);

      // Trigger visitor update callbacks
      this.notifyVisitorUpdate('force_exit', {
        customerId,
        customerName: `${visitor.data.personalInfo.firstName} ${visitor.data.personalInfo.lastName}`,
        duration,
        reason
      });

      return {
        success: true,
        message: 'Visitor successfully exited',
        type: 'force_exit',
        visitor: visitor.data,
        exitTime,
        duration,
        reason
      };

    } catch (error) {
      console.error('Force exit visitor error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Get visitor statistics
   * @returns {Promise<object>} Visitor statistics
   */
  async getVisitorStatistics() {
    try {
      const visitors = await this.getCurrentVisitors();
      const count = await this.getVisitorCount();
      
      if (!visitors.success || !count.success) {
        throw new Error('Failed to get visitor data');
      }

      // Calculate statistics
      const durations = visitors.data.map(v => v.currentDuration);
      const averageDuration = durations.length > 0 
        ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
        : 0;

      const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
      const minDuration = durations.length > 0 ? Math.min(...durations) : 0;

      // Service usage
      const serviceStats = {
        gym: 0,
        spa: 0,
        both: 0
      };

      visitors.data.forEach(visitor => {
        if (visitor.services.includes('gym') && visitor.services.includes('spa')) {
          serviceStats.both++;
        } else if (visitor.services.includes('gym')) {
          serviceStats.gym++;
        } else if (visitor.services.includes('spa')) {
          serviceStats.spa++;
        }
      });

      // Membership type distribution
      const membershipStats = {
        daily: 0,
        monthly: 0,
        annual: 0
      };

      visitors.data.forEach(visitor => {
        const type = visitor.membership?.type;
        if (membershipStats.hasOwnProperty(type)) {
          membershipStats[type]++;
        }
      });

      return {
        success: true,
        data: {
          currentCount: count.current,
          capacity: count,
          averageDuration,
          maxDuration,
          minDuration,
          serviceStats,
          membershipStats,
          longStayVisitors: visitors.data.filter(v => v.currentDuration >= 180).length, // 3+ hours
          recentEntries: visitors.data.filter(v => v.currentDuration <= 30).length // Last 30 minutes
        }
      };

    } catch (error) {
      console.error('Get visitor statistics error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Get entry/exit flow for current day
   * @returns {Promise<object>} Entry/exit flow data
   */
  async getTodayEntryExitFlow() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = dataService.getVisitsByDate(today);

      const hourlyFlow = {};
      
      // Initialize all hours
      for (let hour = 0; hour < 24; hour++) {
        hourlyFlow[hour] = { entries: 0, exits: 0, net: 0 };
      }

      // Count entries and exits by hour
      todayVisits.forEach(visit => {
        const entryHour = new Date(visit.entryTime).getHours();
        hourlyFlow[entryHour].entries++;

        if (visit.exitTime) {
          const exitHour = new Date(visit.exitTime).getHours();
          hourlyFlow[exitHour].exits++;
        }
      });

      // Calculate net flow
      Object.keys(hourlyFlow).forEach(hour => {
        hourlyFlow[hour].net = hourlyFlow[hour].entries - hourlyFlow[hour].exits;
      });

      return {
        success: true,
        data: hourlyFlow,
        date: today
      };

    } catch (error) {
      console.error('Get entry/exit flow error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Subscribe to visitor updates
   * @param {Function} callback - Callback function to call on updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToVisitorUpdates(callback) {
    if (typeof callback === 'function') {
      this.visitorUpdateCallbacks.push(callback);
      
      // Return unsubscribe function
      return () => {
        const index = this.visitorUpdateCallbacks.indexOf(callback);
        if (index > -1) {
          this.visitorUpdateCallbacks.splice(index, 1);
        }
      };
    }
    
    return () => {};
  }

  /**
   * Notify all subscribers of visitor updates
   * @param {string} eventType - Type of update
   * @param {object} data - Update data
   */
  notifyVisitorUpdate(eventType, data) {
    this.visitorUpdateCallbacks.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error('Error in visitor update callback:', error);
      }
    });
  }

  /**
   * Export current visitors data
   * @returns {Promise<object>} Export data
   */
  async exportCurrentVisitors() {
    try {
      const visitors = await this.getCurrentVisitors();
      const statistics = await this.getVisitorStatistics();

      if (!visitors.success) {
        return visitors;
      }

      return {
        success: true,
        data: {
          visitors: visitors.data,
          statistics: statistics.success ? statistics.data : null,
          exportTime: getCurrentTimestamp(),
          total: visitors.count
        }
      };

    } catch (error) {
      console.error('Export current visitors error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Get emergency evacuation list
   * @returns {Promise<object>} Emergency evacuation data
   */
  async getEmergencyEvacuationList() {
    try {
      const visitors = await this.getCurrentVisitors();
      
      if (!visitors.success) {
        return visitors;
      }

      // Format for emergency use - essential info only
      const evacuationList = visitors.data.map(visitor => ({
        customerId: visitor.customerId,
        name: `${visitor.personalInfo.firstName} ${visitor.personalInfo.lastName}`,
        phone: visitor.personalInfo.phone,
        entryTime: visitor.entryTime,
        duration: visitor.currentDuration,
        services: visitor.services.join(', '),
        emergencyContact: visitor.personalInfo.phone // In real app, there would be separate emergency contact
      }));

      return {
        success: true,
        data: evacuationList,
        count: evacuationList.length,
        generatedAt: getCurrentTimestamp(),
        isEmergencyList: true
      };

    } catch (error) {
      console.error('Get emergency evacuation list error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: []
      };
    }
  }

  /**
   * Get real-time visitor updates (for live dashboard)
   * @returns {Promise<object>} Real-time visitor data
   */
  async getRealTimeVisitorData() {
    try {
      const [visitors, count, statistics] = await Promise.all([
        this.getCurrentVisitors(),
        this.getVisitorCount(),
        this.getVisitorStatistics()
      ]);

      return {
        success: true,
        data: {
          visitors: visitors.success ? visitors.data : [],
          count: count.success ? count : { current: 0, maximum: 100, percentage: 0 },
          statistics: statistics.success ? statistics.data : null,
          lastUpdate: getCurrentTimestamp()
        }
      };

    } catch (error) {
      console.error('Get real-time visitor data error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }
}

// Create singleton instance
const visitorsService = new VisitorsService();

export default visitorsService;