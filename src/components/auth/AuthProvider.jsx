import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../../services/authService';
import { ERROR_MESSAGES } from '../../utils/constants';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
    
    // Listen for session expiration events
    const handleSessionExpired = (event) => {
      logout();
      setError(event.detail.message);
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  /**
   * Initialize authentication state from stored session
   */
  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      // Check if there's a valid session
      const isValidSession = authService.validateSession();
      
      if (isValidSession) {
        const currentUser = authService.getCurrentUser();
        const sessionData = authService.getSessionInfo();
        
        if (currentUser && sessionData) {
          setUser(currentUser);
          setIsAuthenticated(true);
          setSessionInfo(sessionData);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user with credentials
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<object>} Login result
   */
  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login(username, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        setSessionInfo(authService.getSessionInfo());
      } else {
        setError(result.message);
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setSessionInfo(null);
      setError(null);
      setIsLoading(false);
    }
  };

  /**
   * Refresh user session
   */
  const refreshSession = async () => {
    try {
      const result = await authService.refreshSession();
      
      if (result.success) {
        setSessionInfo(authService.getSessionInfo());
        return true;
      } else {
        // Session refresh failed, logout user
        await logout();
        setError(result.message);
        return false;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      await logout();
      setError(ERROR_MESSAGES.NETWORK_ERROR);
      return false;
    }
  };

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has role
   */
  const hasRole = (role) => {
    return authService.hasRole(role);
  };

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  const hasPermission = (permission) => {
    return authService.hasPermission(permission);
  };

  /**
   * Clear any authentication errors
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Get user display name
   * @returns {string} User display name
   */
  const getUserDisplayName = () => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim() || user.username;
  };

  /**
   * Get session time remaining
   * @returns {number} Time remaining in milliseconds
   */
  const getSessionTimeRemaining = () => {
    if (!sessionInfo) return 0;
    return Math.max(0, sessionInfo.remainingTime);
  };

  /**
   * Check if session is expiring soon
   * @param {number} warningThreshold - Warning threshold in minutes
   * @returns {boolean} True if session expires soon
   */
  const isSessionExpiringSoon = (warningThreshold = 15) => {
    const remainingMinutes = getSessionTimeRemaining() / (1000 * 60);
    return remainingMinutes > 0 && remainingMinutes <= warningThreshold;
  };

  // Auto-refresh session info every minute
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const updatedSessionInfo = authService.getSessionInfo();
      if (updatedSessionInfo) {
        setSessionInfo(updatedSessionInfo);
        
        // Check if session is still valid
        if (!updatedSessionInfo.isValid) {
          logout();
          setError(ERROR_MESSAGES.SESSION_EXPIRED);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Context value
  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    sessionInfo,
    
    // Actions
    login,
    logout,
    refreshSession,
    clearError,
    
    // Utilities
    hasRole,
    hasPermission,
    getUserDisplayName,
    getSessionTimeRemaining,
    isSessionExpiringSoon,
    
    // Auto-login for development
    autoLogin: authService.autoLogin.bind(authService)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;