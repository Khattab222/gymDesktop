// Application Constants
export const APP_NAME = 'Gym & Spa Management System';
export const APP_VERSION = '1.0.0';

// Membership Types
export const MEMBERSHIP_TYPES = {
  DAILY: 'daily',
  MONTHLY: 'monthly',
  ANNUAL: 'annual'
};

// Membership Status
export const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended'
};

// Service Types
export const SERVICE_TYPES = {
  GYM: 'gym',
  SPA: 'spa',
  BOTH: 'both'
};

// Employee Roles
export const EMPLOYEE_ROLES = {
  RECEPTIONIST: 'receptionist'
};

// Status Colors
export const STATUS_COLORS = {
  ACTIVE: '#22c55e',     // Green
  EXPIRED: '#ef4444',    // Red
  WARNING: '#f59e0b',    // Yellow/Orange
  INFO: '#3b82f6',       // Blue
  NEUTRAL: '#6b7280'     // Gray
};

// Time Formats
export const TIME_FORMATS = {
  DISPLAY: 'HH:mm',
  FULL_DATE: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'gym_auth_token',
  USER_DATA: 'gym_user_data',
  SETTINGS: 'gym_settings'
};

// API Endpoints (for future use)
export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  CUSTOMERS: '/api/customers',
  VISITS: '/api/visits',
  STATISTICS: '/api/statistics'
};

// Validation Rules
export const VALIDATION_RULES = {
  CUSTOMER_ID: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 12,
    PATTERN: /^[0-9]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50
  },
  PHONE: {
    PATTERN: /^(\+20-?)?[0-9]{3}-?[0-9]{3}-?[0-9]{4}$/
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

// Default Values
export const DEFAULTS = {
  VISIT_TIMEOUT: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  PAGE_SIZE: 20,
  MAX_VISITORS: 100,
  GRACE_PERIOD_DAYS: 7
};

// Navigation Routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SCANNER: '/scanner',
  CUSTOMERS: '/customers',
  CURRENT_VISITORS: '/current-visitors',
  STATISTICS: '/statistics',
  SETTINGS: '/settings'
};

// Chart Colors (for statistics)
export const CHART_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316'  // Orange
];

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_LOGIN: 'Invalid username or password',
  CUSTOMER_NOT_FOUND: 'Customer not found',
  EXPIRED_MEMBERSHIP: 'Membership has expired',
  ALREADY_INSIDE: 'Customer is already inside',
  NOT_INSIDE: 'Customer is not currently inside',
  INVALID_BARCODE: 'Invalid barcode format',
  NETWORK_ERROR: 'Network connection error',
  PERMISSION_DENIED: 'Permission denied',
  SESSION_EXPIRED: 'Session has expired'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  ENTRY_RECORDED: 'Entry recorded successfully',
  EXIT_RECORDED: 'Exit recorded successfully',
  CUSTOMER_REGISTERED: 'Customer registered successfully',
  SETTINGS_SAVED: 'Settings saved successfully'
};

// Barcode Configuration
export const BARCODE_CONFIG = {
  FORMATS: ['CODE128', 'CODE39', 'EAN13', 'EAN8'],
  SCAN_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3
};

// Statistics Periods
export const STATISTICS_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  CUSTOM: 'custom'
};

// Export Types
export const EXPORT_TYPES = {
  PDF: 'pdf',
  EXCEL: 'xlsx',
  CSV: 'csv'
};