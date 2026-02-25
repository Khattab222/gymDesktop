import dataService from './dataService.js';
import customerService from './customerService.js';
import { validateBarcode } from '../utils/validators.js';
import { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  MEMBERSHIP_STATUS 
} from '../utils/constants.js';
import { 
  getCurrentTimestamp,
  calculateDuration,
  isSubscriptionExpired 
} from '../utils/dateUtils.js';

class BarcodeService {
  constructor() {
    this.isScanning = false;
    this.scanHistory = [];
  }

  /**
   * Process barcode scan for entry/exit
   * @param {string} barcode - Scanned barcode
   * @param {Array<string>} services - Services to access (gym, spa)
   * @returns {Promise<object>} Scan result
   */
  async processBarcodeEntry(barcode, services = ['gym']) {
    try {
      // Validate barcode format
      const barcodeValidation = validateBarcode(barcode);
      if (!barcodeValidation.isValid) {
        return {
          success: false,
          message: barcodeValidation.message,
          type: 'validation_error'
        };
      }

      // Get customer by barcode
      const customerResult = await customerService.getCustomerByBarcode(barcode);
      if (!customerResult.success) {
        return {
          success: false,
          message: customerResult.message,
          type: 'customer_not_found'
        };
      }

      const customer = customerResult.data;

      // Validate subscription
      const subscriptionResult = await customerService.validateSubscription(customer.customerId);
      if (!subscriptionResult.isValid) {
        return {
          success: false,
          message: subscriptionResult.message,
          customer: customer,
          type: 'subscription_invalid',
          warnings: subscriptionResult.warnings || []
        };
      }

      // Check current visit status and process entry/exit
      if (customer.currentVisit?.isInside) {
        // Customer is inside - process exit
        return await this.processExit(customer);
      } else {
        // Customer is outside - process entry
        return await this.processEntry(customer, services);
      }

    } catch (error) {
      console.error('Process barcode entry error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        type: 'system_error'
      };
    }
  }

  /**
   * Process customer entry
   * @param {object} customer - Customer data
   * @param {Array<string>} services - Services to access
   * @returns {Promise<object>} Entry result
   */
  async processEntry(customer, services) {
    try {
      const entryTime = getCurrentTimestamp();

      // Create new visit record
      const visitData = {
        customerId: customer.customerId,
        entryTime: entryTime,
        exitTime: null,
        duration: null,
        services: services || ['gym'],
        date: new Date().toISOString().split('T')[0]
      };

      const newVisit = dataService.addVisit(visitData);

      // Update customer visit status
      dataService.updateCustomerVisitStatus(
        customer.customerId, 
        true, 
        entryTime, 
        null
      );

      // Add to scan history
      this.addToScanHistory({
        customerId: customer.customerId,
        customerName: `${customer.personalInfo.firstName} ${customer.personalInfo.lastName}`,
        action: 'entry',
        timestamp: entryTime,
        services: services
      });

      return {
        success: true,
        message: SUCCESS_MESSAGES.ENTRY_RECORDED,
        type: 'entry',
        customer: customer,
        visit: newVisit,
        entryTime: entryTime,
        services: services
      };

    } catch (error) {
      console.error('Process entry error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        type: 'system_error'
      };
    }
  }

  /**
   * Process customer exit
   * @param {object} customer - Customer data
   * @returns {Promise<object>} Exit result
   */
  async processExit(customer) {
    try {
      if (!customer.currentVisit?.isInside) {
        return {
          success: false,
          message: ERROR_MESSAGES.NOT_INSIDE,
          type: 'not_inside'
        };
      }

      const exitTime = getCurrentTimestamp();
      const entryTime = customer.currentVisit.entryTime;

      // Find current visit record
      const currentVisits = dataService.getCurrentVisits();
      const currentVisit = currentVisits.find(v => v.customerId === customer.customerId);

      if (!currentVisit) {
        return {
          success: false,
          message: 'No active visit found',
          type: 'no_active_visit'
        };
      }

      // Calculate visit duration
      const duration = calculateDuration(entryTime, exitTime);

      // Update visit record
      dataService.endVisit(currentVisit.visitId, exitTime);

      // Update customer visit status
      dataService.updateCustomerVisitStatus(
        customer.customerId, 
        false, 
        null, 
        exitTime
      );

      // Add to scan history
      this.addToScanHistory({
        customerId: customer.customerId,
        customerName: `${customer.personalInfo.firstName} ${customer.personalInfo.lastName}`,
        action: 'exit',
        timestamp: exitTime,
        duration: duration
      });

      return {
        success: true,
        message: SUCCESS_MESSAGES.EXIT_RECORDED,
        type: 'exit',
        customer: customer,
        visit: currentVisit,
        entryTime: entryTime,
        exitTime: exitTime,
        duration: duration
      };

    } catch (error) {
      console.error('Process exit error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        type: 'system_error'
      };
    }
  }

  /**
   * Manual entry/exit (for emergency or manual override)
   * @param {string} customerId - Customer ID
   * @param {string} action - 'entry' or 'exit'
   * @param {Array<string>} services - Services for entry
   * @returns {Promise<object>} Manual operation result
   */
  async manualEntryExit(customerId, action, services = ['gym']) {
    try {
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required'
        };
      }

      if (!['entry', 'exit'].includes(action)) {
        return {
          success: false,
          message: 'Action must be either "entry" or "exit"'
        };
      }

      // Get customer
      const customerResult = await customerService.getCustomerById(customerId);
      if (!customerResult.success) {
        return customerResult;
      }

      const customer = customerResult.data;

      // Process based on action
      if (action === 'entry') {
        if (customer.currentVisit?.isInside) {
          return {
            success: false,
            message: ERROR_MESSAGES.ALREADY_INSIDE,
            type: 'already_inside'
          };
        }
        return await this.processEntry(customer, services);
      } else {
        if (!customer.currentVisit?.isInside) {
          return {
            success: false,
            message: ERROR_MESSAGES.NOT_INSIDE,
            type: 'not_inside'
          };
        }
        return await this.processExit(customer);
      }

    } catch (error) {
      console.error('Manual entry/exit error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        type: 'system_error'
      };
    }
  }

  /**
   * Validate customer access without processing entry/exit
   * @param {string} barcode - Barcode to validate
   * @returns {Promise<object>} Validation result
   */
  async validateCustomerAccess(barcode) {
    try {
      // Validate barcode format
      const barcodeValidation = validateBarcode(barcode);
      if (!barcodeValidation.isValid) {
        return {
          success: false,
          message: barcodeValidation.message,
          isValid: false
        };
      }

      // Get customer by barcode
      const customerResult = await customerService.getCustomerByBarcode(barcode);
      if (!customerResult.success) {
        return {
          success: false,
          message: customerResult.message,
          isValid: false
        };
      }

      const customer = customerResult.data;

      // Validate subscription
      const subscriptionResult = await customerService.validateSubscription(customer.customerId);
      
      return {
        success: true,
        customer: customer,
        isValid: subscriptionResult.isValid,
        subscription: subscriptionResult,
        canEnter: subscriptionResult.isValid && !customer.currentVisit?.isInside,
        canExit: customer.currentVisit?.isInside || false,
        warnings: subscriptionResult.warnings || []
      };

    } catch (error) {
      console.error('Validate customer access error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        isValid: false
      };
    }
  }

  /**
   * Get scan history
   * @param {number} limit - Number of recent scans to return
   * @returns {Array<object>} Recent scan history
   */
  getScanHistory(limit = 10) {
    return this.scanHistory
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Add entry to scan history
   * @param {object} scanData - Scan data to add
   */
  addToScanHistory(scanData) {
    const historyEntry = {
      ...scanData,
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.scanHistory.push(historyEntry);

    // Keep only last 100 entries to prevent memory issues
    if (this.scanHistory.length > 100) {
      this.scanHistory = this.scanHistory.slice(-100);
    }
  }

  /**
   * Clear scan history
   */
  clearScanHistory() {
    this.scanHistory = [];
  }

  /**
   * Get current scanner status
   * @returns {object} Scanner status
   */
  getScannerStatus() {
    return {
      isScanning: this.isScanning,
      lastScan: this.scanHistory.length > 0 
        ? this.scanHistory[this.scanHistory.length - 1] 
        : null,
      totalScans: this.scanHistory.length
    };
  }

  /**
   * Set scanner status
   * @param {boolean} status - Scanning status
   */
  setScannerStatus(status) {
    this.isScanning = status;
  }

  /**
   * Simulate barcode scan (for testing)
   * @param {string} customerId - Customer ID to simulate
   * @param {Array<string>} services - Services to access
   * @returns {Promise<object>} Simulated scan result
   */
  async simulateScan(customerId, services = ['gym']) {
    console.log(`Simulating barcode scan for customer: ${customerId}`);
    return await this.processBarcodeEntry(customerId, services);
  }

  /**
   * Check for duplicate entries (prevent rapid consecutive scans)
   * @param {string} customerId - Customer ID
   * @param {number} timeWindowMs - Time window in milliseconds (default: 5 seconds)
   * @returns {boolean} True if recent scan found
   */
  checkForDuplicateEntry(customerId, timeWindowMs = 5000) {
    const now = new Date();
    const recentScans = this.scanHistory.filter(scan => {
      const scanTime = new Date(scan.timestamp);
      const timeDiff = now - scanTime;
      return scan.customerId === customerId && timeDiff < timeWindowMs;
    });

    return recentScans.length > 0;
  }

  /**
   * Get emergency override access (for system administrators)
   * @param {string} customerId - Customer ID
   * @param {string} reason - Reason for override
   * @returns {Promise<object>} Override result
   */
  async emergencyOverride(customerId, reason) {
    try {
      if (!customerId || !reason) {
        return {
          success: false,
          message: 'Customer ID and reason are required for emergency override'
        };
      }

      // Get customer (bypass subscription validation)
      const customerResult = await customerService.getCustomerById(customerId);
      if (!customerResult.success) {
        return customerResult;
      }

      const customer = customerResult.data;
      
      // Process entry/exit based on current status
      let result;
      if (customer.currentVisit?.isInside) {
        result = await this.processExit(customer);
      } else {
        result = await this.processEntry(customer, ['gym', 'spa']);
      }

      if (result.success) {
        // Add emergency override to scan history
        this.addToScanHistory({
          customerId: customer.customerId,
          customerName: `${customer.personalInfo.firstName} ${customer.personalInfo.lastName}`,
          action: `emergency_${result.type}`,
          timestamp: getCurrentTimestamp(),
          reason: reason,
          isEmergencyOverride: true
        });

        result.isEmergencyOverride = true;
        result.overrideReason = reason;
      }

      return result;

    } catch (error) {
      console.error('Emergency override error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        type: 'system_error'
      };
    }
  }

  /**
   * Get barcode scanning statistics
   * @param {string} date - Date to get statistics for (YYYY-MM-DD)
   * @returns {object} Scanning statistics
   */
  getScanStatistics(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const dayScans = this.scanHistory.filter(scan => {
      const scanDate = new Date(scan.timestamp).toISOString().split('T')[0];
      return scanDate === targetDate;
    });

    const entries = dayScans.filter(scan => scan.action === 'entry').length;
    const exits = dayScans.filter(scan => scan.action === 'exit').length;
    const emergencyOverrides = dayScans.filter(scan => scan.isEmergencyOverride).length;

    return {
      date: targetDate,
      totalScans: dayScans.length,
      entries: entries,
      exits: exits,
      currentlyInside: entries - exits,
      emergencyOverrides: emergencyOverrides,
      peakHour: this.calculatePeakScanningHour(dayScans)
    };
  }

  /**
   * Calculate peak scanning hour for given scans
   * @param {Array<object>} scans - Scan data
   * @returns {object} Peak hour information
   */
  calculatePeakScanningHour(scans) {
    const hourCounts = {};
    
    scans.forEach(scan => {
      const hour = new Date(scan.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    if (Object.keys(hourCounts).length === 0) {
      return { hour: null, count: 0 };
    }

    const peakHour = Object.keys(hourCounts)
      .reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);

    return {
      hour: parseInt(peakHour),
      count: hourCounts[peakHour]
    };
  }

  /**
   * Export scan history
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {object} Export data
   */
  exportScanHistory(startDate = null, endDate = null) {
    let filteredHistory = [...this.scanHistory];

    if (startDate || endDate) {
      filteredHistory = this.scanHistory.filter(scan => {
        const scanDate = new Date(scan.timestamp).toISOString().split('T')[0];
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date();
        const current = new Date(scanDate);
        
        return current >= start && current <= end;
      });
    }

    return {
      data: filteredHistory,
      total: filteredHistory.length,
      dateRange: { startDate, endDate },
      exportTime: getCurrentTimestamp()
    };
  }
}

// Create singleton instance
const barcodeService = new BarcodeService();

export default barcodeService;