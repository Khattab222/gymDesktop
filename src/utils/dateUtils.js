// Date and Time Utility Functions

/**
 * Get current timestamp in ISO format
 * @returns {string} Current timestamp
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('date', 'time', 'datetime', 'relative')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'datetime') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const options = {
    date: { year: 'numeric', month: '2-digit', day: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    datetime: { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }
  };
  
  if (format === 'relative') {
    return getRelativeTime(dateObj);
  }
  
  return dateObj.toLocaleDateString('en-GB', options[format] || options.datetime);
};

/**
 * Get relative time (e.g., "2 hours ago", "in 30 minutes")
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (Math.abs(diffInMinutes) < 1) {
    return 'Just now';
  } else if (Math.abs(diffInMinutes) < 60) {
    return diffInMinutes > 0 
      ? `${diffInMinutes} minutes ago`
      : `in ${Math.abs(diffInMinutes)} minutes`;
  } else if (Math.abs(diffInHours) < 24) {
    return diffInHours > 0
      ? `${diffInHours} hours ago`
      : `in ${Math.abs(diffInHours)} hours`;
  } else {
    return diffInDays > 0
      ? `${diffInDays} days ago`
      : `in ${Math.abs(diffInDays)} days`;
  }
};

/**
 * Calculate duration between two dates in minutes
 * @param {string|Date} startTime - Start time
 * @param {string|Date} endTime - End time (defaults to current time)
 * @returns {number} Duration in minutes
 */
export const calculateDuration = (startTime, endTime = new Date()) => {
  if (!startTime) return 0;
  
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  const diffInMs = end - start;
  return Math.floor(diffInMs / (1000 * 60)); // Convert to minutes
};

/**
 * Format duration in a human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "2h 30m", "45m")
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 1) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

/**
 * Check if a date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Check if a date is yesterday
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is yesterday
 */
export const isYesterday = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.toDateString() === yesterday.toDateString();
};

/**
 * Check if a subscription is expired
 * @param {string} endDate - Subscription end date
 * @returns {boolean} True if expired
 */
export const isSubscriptionExpired = (endDate) => {
  if (!endDate) return true;
  
  const end = new Date(endDate);
  const now = new Date();
  
  return end < now;
};

/**
 * Check if a subscription expires soon (within grace period)
 * @param {string} endDate - Subscription end date
 * @param {number} gracePeriodDays - Grace period in days
 * @returns {boolean} True if expires soon
 */
export const isSubscriptionExpiringSoon = (endDate, gracePeriodDays = 7) => {
  if (!endDate) return false;
  
  const end = new Date(endDate);
  const warning = new Date();
  warning.setDate(warning.getDate() + gracePeriodDays);
  
  return end <= warning && end >= new Date();
};

/**
 * Get start and end of day for a given date
 * @param {string|Date} date - Date (defaults to today)
 * @returns {object} Object with startOfDay and endOfDay
 */
export const getDayBounds = (date = new Date()) => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);
  
  return {
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString()
  };
};

/**
 * Get start and end of week for a given date
 * @param {string|Date} date - Date (defaults to today)
 * @returns {object} Object with startOfWeek and endOfWeek
 */
export const getWeekBounds = (date = new Date()) => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  
  const startOfWeek = new Date(dateObj);
  const dayOfWeek = startOfWeek.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as first day
  startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return {
    startOfWeek: startOfWeek.toISOString(),
    endOfWeek: endOfWeek.toISOString()
  };
};

/**
 * Get start and end of month for a given date
 * @param {string|Date} date - Date (defaults to today)
 * @returns {object} Object with startOfMonth and endOfMonth
 */
export const getMonthBounds = (date = new Date()) => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  
  const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return {
    startOfMonth: startOfMonth.toISOString(),
    endOfMonth: endOfMonth.toISOString()
  };
};

/**
 * Generate time slots for a day (useful for statistics charts)
 * @param {number} intervalMinutes - Interval in minutes (default: 60)
 * @returns {Array<string>} Array of time slots
 */
export const generateTimeSlots = (intervalMinutes = 60) => {
  const slots = [];
  const totalMinutes = 24 * 60;
  
  for (let minutes = 0; minutes < totalMinutes; minutes += intervalMinutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
  }
  
  return slots;
};

/**
 * Parse date from various input formats
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Get age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  
  const birth = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};