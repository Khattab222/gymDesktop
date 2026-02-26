import { VALIDATION_RULES } from './constants';

/**
 * Validate customer ID format
 * @param {string} customerId - Customer ID to validate
 * @returns {object} Validation result with isValid and message
 */
export const validateCustomerId = (customerId) => {
  if (!customerId) {
    return { isValid: false, message: 'Customer ID is required' };
  }
  
  if (customerId.length < VALIDATION_RULES.CUSTOMER_ID.MIN_LENGTH) {
    return { isValid: false, message: `Customer ID must be at least ${VALIDATION_RULES.CUSTOMER_ID.MIN_LENGTH} characters` };
  }
  
  if (customerId.length > VALIDATION_RULES.CUSTOMER_ID.MAX_LENGTH) {
    return { isValid: false, message: `Customer ID must be no more than ${VALIDATION_RULES.CUSTOMER_ID.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION_RULES.CUSTOMER_ID.PATTERN.test(customerId)) {
    return { isValid: false, message: 'Customer ID must contain only numbers' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} Validation result with isValid and message
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!VALIDATION_RULES.EMAIL.PATTERN.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  if (!VALIDATION_RULES.PHONE.PATTERN.test(phone)) {
    return { isValid: false, message: 'Please enter a valid phone number (e.g., +20-123-456-7890)' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return { isValid: false, message: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters long` };
  }
  
  if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    return { isValid: false, message: `Password must be no more than ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters long` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} Validation result with isValid and message
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate date format and validity
 * @param {string} date - Date to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} Validation result with isValid and message
 */
export const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: `${fieldName} is not a valid date` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate that a date is in the future
 * @param {string} date - Date to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} Validation result with isValid and message
 */
export const validateFutureDate = (date, fieldName = 'Date') => {
  const dateValidation = validateDate(date, fieldName);
  if (!dateValidation.isValid) {
    return dateValidation;
  }
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (dateObj <= now) {
    return { isValid: false, message: `${fieldName} must be in the future` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate that end date is after start date
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {object} Validation result with isValid and message
 */
export const validateDateRange = (startDate, endDate) => {
  const startValidation = validateDate(startDate, 'Start date');
  if (!startValidation.isValid) {
    return startValidation;
  }
  
  const endValidation = validateDate(endDate, 'End date');
  if (!endValidation.isValid) {
    return endValidation;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end <= start) {
    return { isValid: false, message: 'End date must be after start date' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate customer registration data
 * @param {object} customerData - Customer data to validate
 * @returns {object} Validation result with isValid, message, and field errors
 */
export const validateCustomerData = (customerData) => {
  const errors = {};
  let isValid = true;
  
  // Validate customer ID
  const customerIdValidation = validateCustomerId(customerData.customerId);
  if (!customerIdValidation.isValid) {
    errors.customerId = customerIdValidation.message;
    isValid = false;
  }
  
  // Validate first name
  const firstNameValidation = validateRequired(customerData.personalInfo?.firstName, 'First name');
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.message;
    isValid = false;
  }
  
  // Validate last name
  const lastNameValidation = validateRequired(customerData.personalInfo?.lastName, 'Last name');
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.message;
    isValid = false;
  }
  
  // Validate email
  const emailValidation = validateEmail(customerData.personalInfo?.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
    isValid = false;
  }
  
  // Validate phone
  const phoneValidation = validatePhone(customerData.personalInfo?.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.message;
    isValid = false;
  }
  
  // Validate date of birth
  if (customerData.personalInfo?.dateOfBirth) {
    const dobValidation = validateDate(customerData.personalInfo.dateOfBirth, 'Date of birth');
    if (!dobValidation.isValid) {
      errors.dateOfBirth = dobValidation.message;
      isValid = false;
    } else {
      // Check if date of birth is not in the future
      const dob = new Date(customerData.personalInfo.dateOfBirth);
      const now = new Date();
      if (dob > now) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
        isValid = false;
      }
    }
  }
  
  // Validate membership dates
  if (customerData.membership) {
    const startDateValidation = validateDate(customerData.membership.startDate, 'Start date');
    if (!startDateValidation.isValid) {
      errors.startDate = startDateValidation.message;
      isValid = false;
    }
    
    const endDateValidation = validateDate(customerData.membership.endDate, 'End date');
    if (!endDateValidation.isValid) {
      errors.endDate = endDateValidation.message;
      isValid = false;
    }
    
    if (startDateValidation.isValid && endDateValidation.isValid) {
      const dateRangeValidation = validateDateRange(customerData.membership.startDate, customerData.membership.endDate);
      if (!dateRangeValidation.isValid) {
        errors.dateRange = dateRangeValidation.message;
        isValid = false;
      }
    }
  }
  
  return {
    isValid,
    message: isValid ? 'Customer data is valid' : 'Please fix the validation errors',
    errors
  };
};

/**
 * Validate login credentials
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {object} Validation result with isValid, message, and field errors
 */
export const validateLoginCredentials = (username, password) => {
  const errors = {};
  let isValid = true;
  
  // Validate username
  const usernameValidation = validateRequired(username, 'Username');
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.message;
    isValid = false;
  }
  
  // Validate password
  const passwordValidation = validateRequired(password, 'Password');
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
    isValid = false;
  }
  
  return {
    isValid,
    message: isValid ? 'Login credentials are valid' : 'Please enter both username and password',
    errors
  };
};

/**
 * Validate barcode input
 * @param {string} barcode - Barcode to validate
 * @returns {object} Validation result with isValid and message
 */
export const validateBarcode = (barcode) => {
  if (!barcode) {
    return { isValid: false, message: 'Barcode is required' };
  }
  
  // Remove any whitespace
  const cleanBarcode = barcode.trim();
  
  if (cleanBarcode.length === 0) {
    return { isValid: false, message: 'Barcode cannot be empty' };
  }
  
  // Use the same validation as customer ID since barcode contains customer ID
  return validateCustomerId(cleanBarcode);
};

/**
 * Validate numeric input
 * @param {string|number} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @returns {object} Validation result with isValid and message
 */
export const validateNumeric = (value, fieldName = 'Value', min = null, max = null) => {
  if (value === '' || value === null || value === undefined) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return { isValid: false, message: `${fieldName} must be a number` };
  }
  
  if (min !== null && numValue < min) {
    return { isValid: false, message: `${fieldName} must be at least ${min}` };
  }
  
  if (max !== null && numValue > max) {
    return { isValid: false, message: `${fieldName} must be no more than ${max}` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate and sanitize all form inputs
 * @param {object} formData - Form data to validate and sanitize
 * @param {object} validationRules - Custom validation rules
 * @returns {object} Processed form data with validation results
 */
export const processFormData = (formData, validationRules = {}) => {
  const processedData = {};
  const errors = {};
  let isValid = true;
  
  Object.keys(formData).forEach(key => {
    const value = formData[key];
    
    // Sanitize string inputs
    if (typeof value === 'string') {
      processedData[key] = sanitizeInput(value.trim());
    } else {
      processedData[key] = value;
    }
    
    // Apply custom validation rules if provided
    if (validationRules[key]) {
      const validation = validationRules[key](processedData[key]);
      if (!validation.isValid) {
        errors[key] = validation.message;
        isValid = false;
      }
    }
  });
  
  return {
    data: processedData,
    isValid,
    errors
  };
};