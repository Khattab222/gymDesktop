import dataService from './dataService.js';
import { validateCustomerData, validateBarcode } from '../utils/validators.js';
import { 
  MEMBERSHIP_STATUS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} from '../utils/constants.js';
import { 
  isSubscriptionExpired, 
  isSubscriptionExpiringSoon,
  getCurrentTimestamp 
} from '../utils/dateUtils.js';

class CustomerService {
  constructor() {
    // Initialize service
  }

  /**
   * Get all customers
   * @returns {Promise<object>} Result with customers data
   */
  async getAllCustomers() {
    try {
      const customers = dataService.getAllCustomers();
      return {
        success: true,
        data: customers,
        total: customers.length
      };
    } catch (error) {
      console.error('Get customers error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: []
      };
    }
  }

  /**
   * Get customer by ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<object>} Result with customer data
   */
  async getCustomerById(customerId) {
    try {
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required'
        };
      }

      const customer = dataService.getCustomerById(customerId);
      
      if (!customer) {
        return {
          success: false,
          message: ERROR_MESSAGES.CUSTOMER_NOT_FOUND
        };
      }

      // Add computed fields
      const enrichedCustomer = this.enrichCustomerData(customer);

      return {
        success: true,
        data: enrichedCustomer
      };

    } catch (error) {
      console.error('Get customer error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Search customers by various criteria
   * @param {string} query - Search query
   * @returns {Promise<object>} Result with matching customers
   */
  async searchCustomers(query) {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          message: 'Search query must be at least 2 characters',
          data: []
        };
      }

      const customers = dataService.searchCustomers(query.trim());
      const enrichedCustomers = customers.map(c => this.enrichCustomerData(c));

      return {
        success: true,
        data: enrichedCustomers,
        total: customers.length,
        query
      };

    } catch (error) {
      console.error('Search customers error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: []
      };
    }
  }

  /**
   * Register new customer
   * @param {object} customerData - Customer data
   * @returns {Promise<object>} Result with new customer data
   */
  async registerCustomer(customerData) {
    try {
      // Validate customer data
      const validation = validateCustomerData(customerData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          errors: validation.errors
        };
      }

      // Check if customer ID is unique
      if (customerData.customerId && !dataService.isCustomerIdUnique(customerData.customerId)) {
        return {
          success: false,
          message: 'Customer ID already exists',
          errors: { customerId: 'This customer ID is already in use' }
        };
      }

      // Add new customer
      const newCustomer = dataService.addCustomer(customerData);
      const enrichedCustomer = this.enrichCustomerData(newCustomer);

      return {
        success: true,
        message: SUCCESS_MESSAGES.CUSTOMER_REGISTERED,
        data: enrichedCustomer
      };

    } catch (error) {
      console.error('Register customer error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Update customer information
   * @param {string} customerId - Customer ID
   * @param {object} updates - Updates to apply
   * @returns {Promise<object>} Result with updated customer data
   */
  async updateCustomer(customerId, updates) {
    try {
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required'
        };
      }

      // Check if customer exists
      const existingCustomer = dataService.getCustomerById(customerId);
      if (!existingCustomer) {
        return {
          success: false,
          message: ERROR_MESSAGES.CUSTOMER_NOT_FOUND
        };
      }

      // Validate updates
      const updatedCustomerData = { ...existingCustomer, ...updates };
      const validation = validateCustomerData(updatedCustomerData);
      
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          errors: validation.errors
        };
      }

      // Apply updates
      const updatedCustomer = dataService.updateCustomer(customerId, updates);
      const enrichedCustomer = this.enrichCustomerData(updatedCustomer);

      return {
        success: true,
        message: 'Customer updated successfully',
        data: enrichedCustomer
      };

    } catch (error) {
      console.error('Update customer error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Validate customer subscription
   * @param {string} customerId - Customer ID
   * @returns {Promise<object>} Validation result
   */
  async validateSubscription(customerId) {
    try {
      const customer = dataService.getCustomerById(customerId);
      
      if (!customer) {
        return {
          success: false,
          message: ERROR_MESSAGES.CUSTOMER_NOT_FOUND,
          isValid: false
        };
      }

      const membership = customer.membership;
      if (!membership) {
        return {
          success: false,
          message: 'No membership found',
          isValid: false
        };
      }

      // Check subscription status
      const isExpired = isSubscriptionExpired(membership.endDate);
      const isExpiringSoon = isSubscriptionExpiringSoon(membership.endDate, 7);
      const isSuspended = membership.status === MEMBERSHIP_STATUS.SUSPENDED;

      let validationResult = {
        success: true,
        isValid: !isExpired && !isSuspended,
        customer: this.enrichCustomerData(customer),
        warnings: []
      };

      if (isSuspended) {
        validationResult.message = 'Membership is suspended';
        validationResult.isValid = false;
      } else if (isExpired) {
        validationResult.message = ERROR_MESSAGES.EXPIRED_MEMBERSHIP;
        validationResult.isValid = false;
      } else if (isExpiringSoon) {
        validationResult.message = 'Membership expires soon';
        validationResult.warnings.push('Subscription expires within 7 days');
      } else {
        validationResult.message = 'Membership is valid';
      }

      return validationResult;

    } catch (error) {
      console.error('Validate subscription error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        isValid: false
      };
    }
  }

  /**
   * Get customer by barcode
   * @param {string} barcode - Scanned barcode
   * @returns {Promise<object>} Result with customer data
   */
  async getCustomerByBarcode(barcode) {
    try {
      // Validate barcode format
      const barcodeValidation = validateBarcode(barcode);
      if (!barcodeValidation.isValid) {
        return {
          success: false,
          message: barcodeValidation.message
        };
      }

      // Extract customer ID from barcode (assuming barcode contains customer ID)
      const customerId = barcode.trim();
      
      return await this.getCustomerById(customerId);

    } catch (error) {
      console.error('Get customer by barcode error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_BARCODE
      };
    }
  }

  /**
   * Get customers by membership type
   * @param {string} membershipType - Membership type filter
   * @returns {Promise<object>} Result with filtered customers
   */
  async getCustomersByMembershipType(membershipType) {
    try {
      const allCustomers = dataService.getAllCustomers();
      const filteredCustomers = allCustomers.filter(customer => 
        customer.membership && customer.membership.type === membershipType
      );

      const enrichedCustomers = filteredCustomers.map(c => this.enrichCustomerData(c));

      return {
        success: true,
        data: enrichedCustomers,
        total: filteredCustomers.length,
        filter: membershipType
      };

    } catch (error) {
      console.error('Get customers by membership type error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: []
      };
    }
  }

  /**
   * Get customers by status
   * @param {string} status - Status filter
   * @returns {Promise<object>} Result with filtered customers
   */
  async getCustomersByStatus(status) {
    try {
      const allCustomers = dataService.getAllCustomers();
      const filteredCustomers = allCustomers.filter(customer => 
        customer.membership && customer.membership.status === status
      );

      const enrichedCustomers = filteredCustomers.map(c => this.enrichCustomerData(c));

      return {
        success: true,
        data: enrichedCustomers,
        total: filteredCustomers.length,
        filter: status
      };

    } catch (error) {
      console.error('Get customers by status error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: []
      };
    }
  }

  /**
   * Get customer visit history
   * @param {string} customerId - Customer ID
   * @param {number} limit - Maximum number of visits to return
   * @returns {Promise<object>} Result with visit history
   */
  async getCustomerVisitHistory(customerId, limit = 10) {
    try {
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required'
        };
      }

      const visits = dataService.getVisitsByCustomerId(customerId);
      
      // Sort by entry time (most recent first) and limit
      const sortedVisits = visits
        .sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime))
        .slice(0, limit);

      return {
        success: true,
        data: sortedVisits,
        total: visits.length,
        showing: sortedVisits.length
      };

    } catch (error) {
      console.error('Get customer visit history error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: []
      };
    }
  }

  /**
   * Enrich customer data with computed fields
   * @param {object} customer - Customer data
   * @returns {object} Enriched customer data
   */
  enrichCustomerData(customer) {
    if (!customer) return null;

    const membership = customer.membership;
    const currentVisit = customer.currentVisit;

    // Calculate subscription status
    let subscriptionStatus = {
      isValid: false,
      isExpired: false,
      isExpiringSoon: false,
      isSuspended: false,
      daysUntilExpiry: 0,
      statusText: 'Unknown'
    };

    if (membership) {
      const isExpired = isSubscriptionExpired(membership.endDate);
      const isExpiringSoon = isSubscriptionExpiringSoon(membership.endDate, 7);
      const isSuspended = membership.status === MEMBERSHIP_STATUS.SUSPENDED;

      const endDate = new Date(membership.endDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      subscriptionStatus = {
        isValid: !isExpired && !isSuspended && membership.status === MEMBERSHIP_STATUS.ACTIVE,
        isExpired,
        isExpiringSoon,
        isSuspended,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        statusText: isSuspended ? 'Suspended' : 
                   isExpired ? 'Expired' : 
                   isExpiringSoon ? `Expires in ${daysUntilExpiry} days` : 'Active'
      };
    }

    // Calculate current visit duration
    let visitDuration = 0;
    if (currentVisit && currentVisit.isInside && currentVisit.entryTime) {
      const entryTime = new Date(currentVisit.entryTime);
      const now = new Date();
      visitDuration = Math.floor((now - entryTime) / (1000 * 60)); // minutes
    }

    return {
      ...customer,
      subscriptionStatus,
      visitDuration,
      fullName: `${customer.personalInfo?.firstName || ''} ${customer.personalInfo?.lastName || ''}`.trim(),
      displayId: customer.customerId.padStart(8, '0')
    };
  }

  /**
   * Get customer statistics
   * @param {string} customerId - Customer ID
   * @returns {Promise<object>} Result with customer statistics
   */
  async getCustomerStatistics(customerId) {
    try {
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required'
        };
      }

      const customer = dataService.getCustomerById(customerId);
      if (!customer) {
        return {
          success: false,
          message: ERROR_MESSAGES.CUSTOMER_NOT_FOUND
        };
      }

      const visits = dataService.getVisitsByCustomerId(customerId);
      const completedVisits = visits.filter(v => v.exitTime !== null);
      
      const totalDuration = completedVisits.reduce((sum, v) => sum + (v.duration || 0), 0);
      const averageDuration = completedVisits.length > 0 
        ? Math.round(totalDuration / completedVisits.length) 
        : 0;

      // Get most used services
      const serviceUsage = {
        gym: 0,
        spa: 0,
        both: 0
      };

      visits.forEach(visit => {
        if (visit.services.includes('gym') && visit.services.includes('spa')) {
          serviceUsage.both++;
        } else if (visit.services.includes('gym')) {
          serviceUsage.gym++;
        } else if (visit.services.includes('spa')) {
          serviceUsage.spa++;
        }
      });

      const mostUsedService = Object.keys(serviceUsage)
        .reduce((a, b) => serviceUsage[a] > serviceUsage[b] ? a : b);

      return {
        success: true,
        data: {
          totalVisits: visits.length,
          completedVisits: completedVisits.length,
          currentlyInside: customer.currentVisit?.isInside || false,
          totalDuration: totalDuration,
          averageDuration: averageDuration,
          mostUsedService,
          serviceUsage,
          firstVisit: visits.length > 0 
            ? visits.sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime))[0].date
            : null,
          lastVisit: visits.length > 0
            ? visits.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime))[0].date
            : null
        }
      };

    } catch (error) {
      console.error('Get customer statistics error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Export customer data
   * @param {Array<string>} customerIds - Optional array of customer IDs to export
   * @returns {Promise<object>} Export result
   */
  async exportCustomersData(customerIds = null) {
    try {
      let customers;
      
      if (customerIds && Array.isArray(customerIds)) {
        customers = customerIds
          .map(id => dataService.getCustomerById(id))
          .filter(customer => customer !== undefined);
      } else {
        customers = dataService.getAllCustomers();
      }

      const enrichedCustomers = customers.map(c => this.enrichCustomerData(c));

      return {
        success: true,
        data: enrichedCustomers,
        timestamp: getCurrentTimestamp(),
        total: customers.length
      };

    } catch (error) {
      console.error('Export customers error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }
}

// Create singleton instance
const customerService = new CustomerService();

export default customerService;