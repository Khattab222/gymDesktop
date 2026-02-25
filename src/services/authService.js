import dataService from './dataService.js';
import { STORAGE_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants.js';
import { validateLoginCredentials } from '../utils/validators.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.sessionTimeout = null;
    this.isAuthenticated = false;
    
    // Try to restore session on initialization
    this.restoreSession();
  }

  /**
   * Authenticate user with username and password
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<object>} Authentication result
   */
  async login(username, password) {
    try {
      // Validate input
      const validation = validateLoginCredentials(username, password);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          errors: validation.errors
        };
      }

      // Check credentials against data service
      const isValid = dataService.validateEmployeeCredentials(username, password);
      
      if (!isValid) {
        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_LOGIN
        };
      }

      // Get employee data
      const employee = dataService.getEmployeeByUsername(username);
      if (!employee || !employee.isActive) {
        return {
          success: false,
          message: ERROR_MESSAGES.PERMISSION_DENIED
        };
      }

      // Create user session
      const userData = {
        employeeId: employee.employeeId,
        username: employee.username,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        loginTime: new Date().toISOString()
      };

      // Set current user
      this.currentUser = userData;
      this.isAuthenticated = true;

      // Store session data
      this.storeSession(userData);

      // Set session timeout
      this.setSessionTimeout();

      return {
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        user: userData
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Logout current user
   * @returns {Promise<object>} Logout result
   */
  async logout() {
    try {
      // Clear current user
      this.currentUser = null;
      this.isAuthenticated = false;

      // Clear session storage
      this.clearSession();

      // Clear session timeout
      this.clearSessionTimeout();

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  /**
   * Get current authenticated user
   * @returns {object|null} Current user data or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isUserAuthenticated() {
    return this.isAuthenticated && this.currentUser !== null;
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has role
   */
  hasRole(role) {
    return this.isAuthenticated && this.currentUser && this.currentUser.role === role;
  }

  /**
   * Refresh user session
   * @returns {Promise<object>} Refresh result
   */
  async refreshSession() {
    if (!this.isAuthenticated || !this.currentUser) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }

    try {
      // Verify user still exists and is active
      const employee = dataService.getEmployeeById(this.currentUser.employeeId);
      if (!employee || !employee.isActive) {
        await this.logout();
        return {
          success: false,
          message: ERROR_MESSAGES.PERMISSION_DENIED
        };
      }

      // Update session timestamp
      this.currentUser.refreshTime = new Date().toISOString();
      this.storeSession(this.currentUser);

      // Reset session timeout
      this.setSessionTimeout();

      return {
        success: true,
        message: 'Session refreshed'
      };

    } catch (error) {
      console.error('Session refresh error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Store session data in local storage
   * @param {object} userData - User data to store
   */
  storeSession(userData) {
    try {
      const sessionData = {
        user: userData,
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
      };

      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(sessionData));
      
      // Generate and store simple auth token
      const token = btoa(`${userData.username}:${userData.loginTime}`);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Restore session from local storage
   */
  restoreSession() {
    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!storedData || !storedToken) {
        return false;
      }

      const sessionData = JSON.parse(storedData);
      const expiryTime = new Date(sessionData.expires);
      const currentTime = new Date();

      // Check if session has expired
      if (currentTime >= expiryTime) {
        this.clearSession();
        return false;
      }

      // Verify employee still exists and is active
      const employee = dataService.getEmployeeById(sessionData.user.employeeId);
      if (!employee || !employee.isActive) {
        this.clearSession();
        return false;
      }

      // Restore session
      this.currentUser = sessionData.user;
      this.isAuthenticated = true;

      // Set session timeout for remaining time
      const remainingTime = expiryTime - currentTime;
      this.setSessionTimeout(remainingTime);

      return true;

    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Clear session data from local storage
   */
  clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Set session timeout
   * @param {number} timeout - Timeout in milliseconds (default: 8 hours)
   */
  setSessionTimeout(timeout = 8 * 60 * 60 * 1000) {
    this.clearSessionTimeout();
    
    this.sessionTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeout);
  }

  /**
   * Clear session timeout
   */
  clearSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Handle session timeout
   */
  handleSessionTimeout() {
    console.log('Session expired');
    this.logout();
    
    // Dispatch custom event for components to listen to
    const event = new CustomEvent('sessionExpired', {
      detail: { message: ERROR_MESSAGES.SESSION_EXPIRED }
    });
    window.dispatchEvent(event);
  }

  /**
   * Validate current session
   * @returns {boolean} True if session is valid
   */
  validateSession() {
    if (!this.isAuthenticated || !this.currentUser) {
      return false;
    }

    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!storedData) {
        return false;
      }

      const sessionData = JSON.parse(storedData);
      const expiryTime = new Date(sessionData.expires);
      const currentTime = new Date();

      return currentTime < expiryTime;

    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Get session info
   * @returns {object} Session information
   */
  getSessionInfo() {
    if (!this.isAuthenticated) {
      return null;
    }

    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!storedData) {
        return null;
      }

      const sessionData = JSON.parse(storedData);
      const expiryTime = new Date(sessionData.expires);
      const currentTime = new Date();
      const remainingTime = expiryTime - currentTime;

      return {
        user: this.currentUser,
        loginTime: sessionData.timestamp,
        expiryTime: sessionData.expires,
        remainingTime: Math.max(0, remainingTime),
        isValid: remainingTime > 0
      };

    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }

  /**
   * Change password (for future use)
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Change password result
   */
  async changePassword(currentPassword, newPassword) {
    if (!this.isAuthenticated || !this.currentUser) {
      return {
        success: false,
        message: ERROR_MESSAGES.PERMISSION_DENIED
      };
    }

    try {
      // Validate current password
      const isValid = dataService.validateEmployeeCredentials(
        this.currentUser.username, 
        currentPassword
      );

      if (!isValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // In a real app, this would update the password in the database
      // For now, we'll just return success
      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Get user permissions (for future role-based access)
   * @returns {Array<string>} Array of user permissions
   */
  getUserPermissions() {
    if (!this.isAuthenticated || !this.currentUser) {
      return [];
    }

    // For now, all receptionists have the same permissions
    const rolePermissions = {
      receptionist: [
        'scan_barcode',
        'view_customers',
        'register_customer',
        'view_current_visitors',
        'view_statistics',
        'manual_entry_exit'
      ]
    };

    return rolePermissions[this.currentUser.role] || [];
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    const permissions = this.getUserPermissions();
    return permissions.includes(permission);
  }

  /**
   * Auto-login for development (remove in production)
   * @param {string} username - Username for auto-login
   * @returns {Promise<object>} Login result
   */
  async autoLogin(username = 'admin') {
    if (process.env.NODE_ENV === 'development') {
      const employee = dataService.getEmployeeByUsername(username);
      if (employee) {
        return this.login(username, employee.password);
      }
    }
    
    return {
      success: false,
      message: 'Auto-login not available'
    };
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;