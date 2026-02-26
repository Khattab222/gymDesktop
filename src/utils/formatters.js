import { formatDate, formatDuration } from './dateUtils';
import { MEMBERSHIP_TYPES, SERVICE_TYPES, MEMBERSHIP_STATUS } from './constants';

/**
 * Format time for display (HH:MM format)
 * @param {string|Date} date - Date/time to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  return formatDate(date, 'time');
};

/**
 * Format customer name for display
 * @param {object} personalInfo - Customer personal info
 * @returns {string} Formatted full name
 */
export const formatCustomerName = (personalInfo) => {
  if (!personalInfo) return 'Unknown Customer';
  
  const { firstName, lastName } = personalInfo;
  if (!firstName && !lastName) return 'Unknown Customer';
  
  return `${firstName || ''} ${lastName || ''}`.trim();
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format Egyptian phone numbers
  if (cleaned.startsWith('+20')) {
    const number = cleaned.slice(3);
    if (number.length === 10) {
      return `+20-${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
    }
  }
  
  return phone; // Return original if can't format
};

/**
 * Format membership type for display
 * @param {string} membershipType - Membership type
 * @returns {string} Formatted membership type
 */
export const formatMembershipType = (membershipType) => {
  const types = {
    [MEMBERSHIP_TYPES.DAILY]: 'Daily Pass',
    [MEMBERSHIP_TYPES.MONTHLY]: 'Monthly Membership',
    [MEMBERSHIP_TYPES.ANNUAL]: 'Annual Membership'
  };
  
  return types[membershipType] || 'Unknown';
};

/**
 * Format membership status for display
 * @param {string} status - Membership status
 * @returns {string} Formatted status
 */
export const formatMembershipStatus = (status) => {
  const statuses = {
    [MEMBERSHIP_STATUS.ACTIVE]: 'Active',
    [MEMBERSHIP_STATUS.EXPIRED]: 'Expired',
    [MEMBERSHIP_STATUS.SUSPENDED]: 'Suspended'
  };
  
  return statuses[status] || 'Unknown';
};

/**
 * Format services array for display
 * @param {Array<string>} services - Services array
 * @returns {string} Formatted services string
 */
export const formatServices = (services) => {
  if (!services || services.length === 0) return 'No Services';
  
  const serviceMap = {
    [SERVICE_TYPES.GYM]: 'Gym',
    [SERVICE_TYPES.SPA]: 'Spa'
  };
  
  if (services.includes('both') || (services.includes('gym') && services.includes('spa'))) {
    return 'Gym & Spa';
  }
  
  return services.map(service => serviceMap[service] || service).join(', ');
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: EGP)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'EGP') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `0.00 ${currency}`;
  }
  
  return `${amount.toFixed(2)} ${currency}`;
};

/**
 * Re-export formatDuration from dateUtils for convenience
 */
export { formatDuration } from './dateUtils';

/**
 * Format customer ID for display (add leading zeros if needed)
 * @param {string} customerId - Customer ID
 * @returns {string} Formatted customer ID
 */
export const formatCustomerId = (customerId) => {
  if (!customerId) return '';
  
  // Ensure 8 digits with leading zeros
  return customerId.toString().padStart(8, '0');
};

/**
 * Format address for display
 * @param {object} address - Address object
 * @returns {string} Formatted address string
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  const { street, city, zipCode } = address;
  const parts = [street, city, zipCode].filter(part => part && part.trim());
  
  return parts.join(', ');
};

/**
 * Format percentage for display
 * @param {number} value - Percentage value (0-1 or 0-100)
 * @param {boolean} isDecimal - Whether the input is decimal (0-1) or percentage (0-100)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, isDecimal = true) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(1)}%`;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes === 0) {
    return '0 B';
  }
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Format visit status for display
 * @param {object} currentVisit - Current visit object
 * @returns {object} Formatted visit status with text and color
 */
export const formatVisitStatus = (currentVisit) => {
  if (!currentVisit) {
    return { text: 'No Visit Data', color: 'neutral' };
  }
  
  if (currentVisit.isInside) {
    const duration = currentVisit.entryTime 
      ? formatDuration(Math.floor((new Date() - new Date(currentVisit.entryTime)) / (1000 * 60)))
      : '0m';
    
    return { 
      text: `Inside (${duration})`, 
      color: 'success',
      duration 
    };
  }
  
  return { text: 'Outside', color: 'neutral' };
};

/**
 * Format subscription expiry status
 * @param {string} endDate - Subscription end date
 * @param {string} status - Current membership status
 * @returns {object} Formatted expiry status with text and color
 */
export const formatExpiryStatus = (endDate, status) => {
  if (!endDate || status === MEMBERSHIP_STATUS.SUSPENDED) {
    return { text: 'Suspended', color: 'warning' };
  }
  
  if (status === MEMBERSHIP_STATUS.EXPIRED) {
    return { text: 'Expired', color: 'error' };
  }
  
  const end = new Date(endDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    return { text: 'Expired', color: 'error' };
  } else if (daysUntilExpiry <= 7) {
    return { text: `Expires in ${daysUntilExpiry} days`, color: 'warning' };
  } else if (daysUntilExpiry <= 30) {
    return { text: `Expires in ${daysUntilExpiry} days`, color: 'info' };
  }
  
  return { text: `Valid until ${formatDate(endDate, 'date')}`, color: 'success' };
};

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString();
};

/**
 * Format statistics value based on type
 * @param {number} value - Value to format
 * @param {string} type - Type of statistic ('count', 'duration', 'currency', 'percentage')
 * @returns {string} Formatted value
 */
export const formatStatistic = (value, type) => {
  switch (type) {
    case 'count':
      return formatNumber(value);
    case 'duration':
      return formatDuration(value);
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value, false);
    default:
      return value?.toString() || '0';
  }
};

/**
 * Format error message for display
 * @param {string} error - Error message
 * @returns {string} User-friendly error message
 */
export const formatErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // Common error message mappings
  const errorMappings = {
    'Network Error': 'Unable to connect to the server. Please check your connection.',
    'Unauthorized': 'You are not authorized to perform this action.',
    'Forbidden': 'Access denied. Please contact your administrator.',
    'Not Found': 'The requested resource was not found.',
    'Internal Server Error': 'A server error occurred. Please try again later.',
    'Bad Request': 'Invalid request. Please check your input and try again.'
  };
  
  return errorMappings[error] || error;
};

/**
 * Format search results highlight
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Search term to highlight
 * @returns {string} Text with highlighted search term
 */
export const formatSearchHighlight = (text, searchTerm) => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add when truncated
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Format initials from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Formatted initials (e.g., "JD" for John Doe)
 */
export const formatInitials = (firstName, lastName) => {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return firstInitial + lastInitial || '?';
};

/**
 * Format capacity status
 * @param {number} current - Current count
 * @param {number} maximum - Maximum capacity
 * @returns {object} Formatted capacity status with percentage and color
 */
export const formatCapacityStatus = (current, maximum) => {
  if (typeof current !== 'number' || typeof maximum !== 'number' || maximum === 0) {
    return { text: '0/0', percentage: 0, color: 'neutral' };
  }
  
  const percentage = (current / maximum) * 100;
  let color = 'success';
  
  if (percentage >= 90) {
    color = 'error';
  } else if (percentage >= 75) {
    color = 'warning';
  } else if (percentage >= 50) {
    color = 'info';
  }
  
  return {
    text: `${current}/${maximum}`,
    percentage: Math.round(percentage),
    color
  };
};