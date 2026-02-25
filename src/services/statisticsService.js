import dataService from './dataService.js';
import { 
  getDayBounds, 
  getWeekBounds, 
  getMonthBounds,
  getCurrentTimestamp,
  formatDuration,
  isToday
} from '../utils/dateUtils.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

class StatisticsService {
  constructor() {
    this.cachedStats = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get daily statistics
   * @param {string} date - Date in YYYY-MM-DD format (defaults to today)
   * @returns {Promise<object>} Daily statistics
   */
  async getDailyStatistics(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const cacheKey = `daily_${targetDate}`;

      // Check cache first (except for today's data which should be real-time)
      if (!isToday(targetDate) && this.cachedStats.has(cacheKey)) {
        const cached = this.cachedStats.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return { success: true, ...cached.data };
        }
      }

      // Get visit data for the date
      const visitStats = dataService.getVisitStatsByDate(targetDate);
      const hourlyStats = dataService.getHourlyVisitStats(targetDate);
      const membershipStats = dataService.getMembershipTypeStats(targetDate);
      const serviceStats = dataService.getServiceStats(targetDate);
      
      // Get current visitors (only for today)
      let currentVisitors = [];
      if (isToday(targetDate)) {
        currentVisitors = dataService.getCurrentVisitors();
      }

      // Calculate additional metrics
      const peakHour = this.calculatePeakHour(hourlyStats);
      const revenue = this.calculateDailyRevenue(targetDate, membershipStats);
      const hourlyData = this.formatHourlyData(hourlyStats);

      const statistics = {
        date: targetDate,
        isToday: isToday(targetDate),
        overview: {
          totalVisits: visitStats.totalVisits,
          completedVisits: visitStats.completedVisits,
          currentlyInside: visitStats.currentlyInside,
          totalDuration: visitStats.totalDuration,
          averageDuration: visitStats.averageDuration
        },
        hourlyData,
        peakHour,
        membershipBreakdown: membershipStats,
        serviceUsage: serviceStats,
        revenue,
        currentVisitors: currentVisitors.length,
        generatedAt: getCurrentTimestamp()
      };

      // Cache the result (except for today which updates frequently)
      if (!isToday(targetDate)) {
        this.cachedStats.set(cacheKey, {
          data: statistics,
          timestamp: Date.now()
        });
      }

      return {
        success: true,
        data: statistics
      };

    } catch (error) {
      console.error('Get daily statistics error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Get weekly statistics
   * @param {string} startDate - Week start date (defaults to current week)
   * @returns {Promise<object>} Weekly statistics
   */
  async getWeeklyStatistics(startDate = null) {
    try {
      const bounds = startDate 
        ? getWeekBounds(new Date(startDate))
        : getWeekBounds();

      const visits = dataService.getVisitsByDateRange(bounds.startOfWeek, bounds.endOfWeek);
      
      // Group visits by day
      const dailyStats = {};
      const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Initialize all days
      for (let i = 0; i < 7; i++) {
        const date = new Date(bounds.startOfWeek);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        dailyStats[dateStr] = {
          date: dateStr,
          dayName: weekDays[date.getDay()],
          visits: 0,
          duration: 0,
          entries: 0,
          exits: 0
        };
      }

      // Process visits
      visits.forEach(visit => {
        const dateStr = visit.date;
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].visits++;
          dailyStats[dateStr].duration += visit.duration || 0;
          dailyStats[dateStr].entries++;
          
          if (visit.exitTime) {
            dailyStats[dateStr].exits++;
          }
        }
      });

      // Calculate weekly totals
      const weeklyTotals = {
        totalVisits: visits.length,
        totalDuration: visits.reduce((sum, v) => sum + (v.duration || 0), 0),
        averageDailyVisits: Math.round(visits.length / 7),
        busiestDay: this.findBusiestDay(dailyStats),
        membershipBreakdown: this.calculateMembershipStats(visits),
        serviceBreakdown: this.calculateServiceStats(visits)
      };

      return {
        success: true,
        data: {
          period: {
            startDate: bounds.startOfWeek,
            endDate: bounds.endOfWeek,
            type: 'weekly'
          },
          dailyStats: Object.values(dailyStats),
          weeklyTotals,
          generatedAt: getCurrentTimestamp()
        }
      };

    } catch (error) {
      console.error('Get weekly statistics error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Get monthly statistics
   * @param {string} date - Any date in the target month (defaults to current month)
   * @returns {Promise<object>} Monthly statistics
   */
  async getMonthlyStatistics(date = null) {
    try {
      const bounds = date 
        ? getMonthBounds(new Date(date))
        : getMonthBounds();

      const visits = dataService.getVisitsByDateRange(bounds.startOfMonth, bounds.endOfMonth);
      
      // Group visits by day
      const dailyStats = {};
      const startDate = new Date(bounds.startOfMonth);
      const endDate = new Date(bounds.endOfMonth);
      
      // Initialize all days in month
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dailyStats[dateStr] = {
          date: dateStr,
          day: d.getDate(),
          visits: 0,
          duration: 0
        };
      }

      // Process visits
      visits.forEach(visit => {
        const dateStr = visit.date;
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].visits++;
          dailyStats[dateStr].duration += visit.duration || 0;
        }
      });

      // Calculate monthly totals and trends
      const monthlyTotals = {
        totalVisits: visits.length,
        totalDuration: visits.reduce((sum, v) => sum + (v.duration || 0), 0),
        averageDailyVisits: Math.round(visits.length / Object.keys(dailyStats).length),
        busiestDay: this.findBusiestDayInMonth(dailyStats),
        membershipBreakdown: this.calculateMembershipStats(visits),
        serviceBreakdown: this.calculateServiceStats(visits),
        weeklyTrend: this.calculateWeeklyTrend(dailyStats)
      };

      return {
        success: true,
        data: {
          period: {
            startDate: bounds.startOfMonth,
            endDate: bounds.endOfMonth,
            type: 'monthly',
            month: new Date(bounds.startOfMonth).toLocaleString('default', { month: 'long', year: 'numeric' })
          },
          dailyStats: Object.values(dailyStats),
          monthlyTotals,
          generatedAt: getCurrentTimestamp()
        }
      };

    } catch (error) {
      console.error('Get monthly statistics error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Get real-time dashboard statistics
   * @returns {Promise<object>} Real-time statistics
   */
  async getDashboardStatistics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's stats
      const todayStats = await this.getDailyStatistics(today);
      
      // Get current visitors
      const currentVisitors = dataService.getCurrentVisitors();
      
      // Get recent activity (last 24 hours)
      const recentVisits = dataService.getVisitsByDateRange(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        getCurrentTimestamp()
      );

      // Calculate quick metrics
      const quickMetrics = {
        visitorsInside: currentVisitors.length,
        todayVisits: todayStats.success ? todayStats.data.overview.totalVisits : 0,
        todayRevenue: todayStats.success ? todayStats.data.revenue.total : 0,
        averageStay: todayStats.success ? todayStats.data.overview.averageDuration : 0,
        capacityUsage: Math.round((currentVisitors.length / 100) * 100) // Assuming max capacity of 100
      };

      // Get hourly activity for today
      const hourlyActivity = todayStats.success ? todayStats.data.hourlyData : [];
      
      // Recent entries/exits (last hour)
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      const recentActivity = recentVisits.filter(visit => 
        new Date(visit.entryTime) > lastHour || 
        (visit.exitTime && new Date(visit.exitTime) > lastHour)
      );

      return {
        success: true,
        data: {
          quickMetrics,
          hourlyActivity,
          recentActivity: recentActivity.slice(0, 10), // Last 10 activities
          currentVisitors: currentVisitors.slice(0, 5), // Show first 5 visitors
          alerts: this.generateAlerts(quickMetrics, currentVisitors),
          lastUpdate: getCurrentTimestamp()
        }
      };

    } catch (error) {
      console.error('Get dashboard statistics error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Generate system alerts based on current data
   * @param {object} metrics - Quick metrics
   * @param {Array} visitors - Current visitors
   * @returns {Array} Array of alerts
   */
  generateAlerts(metrics, visitors) {
    const alerts = [];

    // High capacity alert
    if (metrics.capacityUsage >= 90) {
      alerts.push({
        type: 'warning',
        message: 'Facility is near capacity',
        priority: 'high'
      });
    }

    // Long stay visitors
    const longStayVisitors = visitors.filter(v => {
      const entryTime = new Date(v.currentVisitData?.entryTime);
      const now = new Date();
      const hours = (now - entryTime) / (1000 * 60 * 60);
      return hours > 4; // More than 4 hours
    });

    if (longStayVisitors.length > 0) {
      alerts.push({
        type: 'info',
        message: `${longStayVisitors.length} visitor(s) have been inside for over 4 hours`,
        priority: 'medium'
      });
    }

    // No activity alert (if it's business hours and no one is inside)
    const currentHour = new Date().getHours();
    if (currentHour >= 8 && currentHour <= 20 && metrics.visitorsInside === 0) {
      alerts.push({
        type: 'info',
        message: 'No visitors currently inside during business hours',
        priority: 'low'
      });
    }

    return alerts;
  }

  /**
   * Calculate peak hour from hourly statistics
   * @param {object} hourlyStats - Hourly statistics data
   * @returns {object} Peak hour information
   */
  calculatePeakHour(hourlyStats) {
    let peakHour = 0;
    let maxEntries = 0;

    Object.keys(hourlyStats).forEach(hour => {
      const entries = hourlyStats[hour].entries;
      if (entries > maxEntries) {
        maxEntries = entries;
        peakHour = parseInt(hour);
      }
    });

    return {
      hour: peakHour,
      entries: maxEntries,
      timeRange: `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour + 1).toString().padStart(2, '0')}:00`
    };
  }

  /**
   * Calculate daily revenue based on membership types
   * @param {string} date - Date to calculate revenue for
   * @param {object} membershipStats - Membership type statistics
   * @returns {object} Revenue breakdown
   */
  calculateDailyRevenue(date, membershipStats) {
    // Sample pricing (in real app, this would come from configuration)
    const pricing = {
      daily: 50,     // 50 EGP per day
      monthly: 500,  // 500 EGP per month (daily rate = 16.67)
      annual: 5000   // 5000 EGP per year (daily rate = 13.70)
    };

    const dailyRates = {
      daily: pricing.daily,
      monthly: pricing.monthly / 30,
      annual: pricing.annual / 365
    };

    const revenueBreakdown = {
      daily: membershipStats.daily * dailyRates.daily,
      monthly: membershipStats.monthly * dailyRates.monthly,
      annual: membershipStats.annual * dailyRates.annual
    };

    const total = Object.values(revenueBreakdown).reduce((sum, val) => sum + val, 0);

    return {
      breakdown: revenueBreakdown,
      total: Math.round(total),
      currency: 'EGP',
      averagePerVisit: membershipStats.daily + membershipStats.monthly + membershipStats.annual > 0
        ? Math.round(total / (membershipStats.daily + membershipStats.monthly + membershipStats.annual))
        : 0
    };
  }

  /**
   * Format hourly data for charts
   * @param {object} hourlyStats - Raw hourly statistics
   * @returns {Array} Formatted hourly data
   */
  formatHourlyData(hourlyStats) {
    return Object.keys(hourlyStats).map(hour => ({
      hour: parseInt(hour),
      timeLabel: `${hour.padStart(2, '0')}:00`,
      entries: hourlyStats[hour].entries,
      exits: hourlyStats[hour].exits,
      netFlow: hourlyStats[hour].entries - hourlyStats[hour].exits
    }));
  }

  /**
   * Find the busiest day in a week
   * @param {object} dailyStats - Daily statistics object
   * @returns {object} Busiest day information
   */
  findBusiestDay(dailyStats) {
    let busiestDay = null;
    let maxVisits = 0;

    Object.values(dailyStats).forEach(day => {
      if (day.visits > maxVisits) {
        maxVisits = day.visits;
        busiestDay = day;
      }
    });

    return busiestDay;
  }

  /**
   * Find the busiest day in a month
   * @param {object} dailyStats - Daily statistics object
   * @returns {object} Busiest day information
   */
  findBusiestDayInMonth(dailyStats) {
    return this.findBusiestDay(dailyStats);
  }

  /**
   * Calculate membership type statistics from visits
   * @param {Array} visits - Array of visit records
   * @returns {object} Membership statistics
   */
  calculateMembershipStats(visits) {
    const stats = { daily: 0, monthly: 0, annual: 0 };
    
    visits.forEach(visit => {
      const customer = dataService.getCustomerById(visit.customerId);
      if (customer && customer.membership) {
        const type = customer.membership.type;
        if (stats.hasOwnProperty(type)) {
          stats[type]++;
        }
      }
    });

    return stats;
  }

  /**
   * Calculate service usage statistics from visits
   * @param {Array} visits - Array of visit records
   * @returns {object} Service statistics
   */
  calculateServiceStats(visits) {
    const stats = { gym: 0, spa: 0, both: 0 };

    visits.forEach(visit => {
      if (visit.services.includes('gym') && visit.services.includes('spa')) {
        stats.both++;
      } else if (visit.services.includes('gym')) {
        stats.gym++;
      } else if (visit.services.includes('spa')) {
        stats.spa++;
      }
    });

    return stats;
  }

  /**
   * Calculate weekly trend within a month
   * @param {object} dailyStats - Daily statistics object
   * @returns {Array} Weekly trend data
   */
  calculateWeeklyTrend(dailyStats) {
    const weeks = [];
    const dailyData = Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let currentWeek = [];
    let weekStart = null;

    dailyData.forEach((day, index) => {
      const dayDate = new Date(day.date);
      
      if (currentWeek.length === 0) {
        weekStart = dayDate;
      }
      
      currentWeek.push(day);
      
      // End of week (Sunday) or last day
      if (dayDate.getDay() === 6 || index === dailyData.length - 1) {
        const weekTotal = currentWeek.reduce((sum, d) => sum + d.visits, 0);
        
        weeks.push({
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: dayDate.toISOString().split('T')[0],
          totalVisits: weekTotal,
          averageDaily: Math.round(weekTotal / currentWeek.length),
          days: currentWeek.length
        });
        
        currentWeek = [];
      }
    });

    return weeks;
  }

  /**
   * Export statistics data
   * @param {string} period - Period type ('daily', 'weekly', 'monthly')
   * @param {string} date - Reference date
   * @returns {Promise<object>} Export result
   */
  async exportStatistics(period = 'daily', date = null) {
    try {
      let statisticsData;

      switch (period) {
        case 'weekly':
          statisticsData = await this.getWeeklyStatistics(date);
          break;
        case 'monthly':
          statisticsData = await this.getMonthlyStatistics(date);
          break;
        default:
          statisticsData = await this.getDailyStatistics(date);
      }

      if (!statisticsData.success) {
        return statisticsData;
      }

      return {
        success: true,
        data: statisticsData.data,
        exportFormat: 'json',
        exportTime: getCurrentTimestamp(),
        period: period
      };

    } catch (error) {
      console.error('Export statistics error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Clear statistics cache
   */
  clearCache() {
    this.cachedStats.clear();
  }

  /**
   * Get cache info (for debugging)
   * @returns {object} Cache information
   */
  getCacheInfo() {
    return {
      size: this.cachedStats.size,
      keys: Array.from(this.cachedStats.keys()),
      timeout: this.cacheTimeout
    };
  }
}

// Create singleton instance
const statisticsService = new StatisticsService();

export default statisticsService;