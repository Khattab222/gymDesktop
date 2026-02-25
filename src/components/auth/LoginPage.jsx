import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { validateLoginCredentials } from '../../utils/validators';

// CSS Styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    position: 'relative'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2d3748',
    margin: '0 0 8px 0'
  },
  subtitle: {
    color: '#718096',
    fontSize: '16px',
    margin: '0'
  },
  errorMessage: {
    background: '#fed7d7',
    border: '1px solid #feb2b2',
    color: '#c53030',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  errorIcon: {
    fontSize: '16px'
  },
  form: {
    marginBottom: '30px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '6px',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  },
  inputError: {
    borderColor: '#e53e3e'
  },
  inputDisabled: {
    backgroundColor: '#f7fafc',
    cursor: 'not-allowed'
  },
  passwordContainer: {
    position: 'relative'
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '18px',
    color: '#718096',
    transition: 'color 0.2s'
  },
  fieldError: {
    color: '#e53e3e',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block'
  },
  formOptions: {
    marginBottom: '24px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#4a5568',
    cursor: 'pointer'
  },
  checkbox: {
    width: 'auto',
    margin: '0'
  },
  loginButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  loginButtonDisabled: {
    opacity: '0.7',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none'
  },
  loadingSpinner: {
    animation: 'spin 1s linear infinite'
  },
  quickLoginSection: {
    marginBottom: '20px'
  },
  divider: {
    textAlign: 'center',
    margin: '20px 0',
    position: 'relative'
  },
  dividerLine: {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '0',
    right: '0',
    height: '1px',
    background: '#e2e8f0'
  },
  dividerText: {
    background: 'white',
    color: '#718096',
    fontSize: '12px',
    padding: '0 12px',
    position: 'relative'
  },
  quickLoginButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  quickLoginBtn: {
    flex: '1',
    background: '#f7fafc',
    border: '1px solid #e2e8f0',
    color: '#4a5568',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center'
  },
  quickLoginBtnDisabled: {
    opacity: '0.5',
    cursor: 'not-allowed'
  },
  systemInfo: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '12px',
    color: '#6c757d',
    textAlign: 'center'
  },
  code: {
    background: '#e9ecef',
    padding: '2px 4px',
    borderRadius: '4px',
    fontFamily: "'Courier New', monospace",
    color: '#495057'
  }
};

// Add keyframe animation for spinner
const spinnerKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoginPage = () => {
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Inject keyframes
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = spinnerKeyframes;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Clear errors when component unmounts or user starts typing
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Clear field-specific errors when user starts typing
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Clear general error
    if (error) {
      clearError();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    clearError();

    // Validate form data
    const validation = validateLoginCredentials(formData.username, formData.password);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    // Attempt login
    const result = await login(formData.username, formData.password);
    
    if (!result.success) {
      // The error is already set in the AuthProvider
      console.log('Login failed:', result.message);
    }
  };

  // Handle quick login (for testing purposes)
  const handleQuickLogin = async (username) => {
    setFormData({ username, password: 'Loading...' });
    
    // Get the employee data to auto-fill password for demo
    const employees = [
      { username: 'admin', password: 'admin123' },
      { username: 'sarah.jones', password: 'password123' },
      { username: 'mike.wilson', password: 'wilson2024' }
    ];
    
    const employee = employees.find(emp => emp.username === username);
    if (employee) {
      setFormData({ username: employee.username, password: employee.password });
      await login(employee.username, employee.password);
    }
  };

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Gym & Spa Management</h1>
          <p style={styles.subtitle}>Employee Login</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorMessage}>
            <span style={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter your username"
              style={{
                ...styles.input,
                ...(formErrors.username ? styles.inputError : {}),
                ...(isLoading ? styles.inputDisabled : {})
              }}
              disabled={isLoading}
              autoComplete="username"
            />
            {formErrors.username && (
              <span style={styles.fieldError}>{formErrors.username}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                style={{
                  ...styles.input,
                  ...(formErrors.password ? styles.inputError : {}),
                  ...(isLoading ? styles.inputDisabled : {})
                }}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formErrors.password && (
              <span style={styles.fieldError}>{formErrors.password}</span>
            )}
          </div>

          <div style={styles.formOptions}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                style={styles.checkbox}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            style={{
              ...styles.loginButton,
              ...(isLoading ? styles.loginButtonDisabled : {})
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span style={styles.loadingSpinner}>⏳</span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Quick Login Options (for development/demo) */}
        <div style={styles.quickLoginSection}>
          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>Quick Login (Demo)</span>
          </div>
          
          <div style={styles.quickLoginButtons}>
            <button
              type="button"
              style={{
                ...styles.quickLoginBtn,
                ...(isLoading ? styles.quickLoginBtnDisabled : {})
              }}
              onClick={() => handleQuickLogin('admin')}
              disabled={isLoading}
            >
              👨‍💼 Admin
            </button>
            <button
              type="button"
              style={{
                ...styles.quickLoginBtn,
                ...(isLoading ? styles.quickLoginBtnDisabled : {})
              }}
              onClick={() => handleQuickLogin('sarah.jones')}
              disabled={isLoading}
            >
              👩‍💼 Sarah Jones
            </button>
            <button
              type="button"
              style={{
                ...styles.quickLoginBtn,
                ...(isLoading ? styles.quickLoginBtnDisabled : {})
              }}
              onClick={() => handleQuickLogin('mike.wilson')}
              disabled={isLoading}
            >
              👨‍💼 Mike Wilson
            </button>
          </div>
        </div>

        {/* System Info */}
        <div style={styles.systemInfo}>
          <p>
            <strong>Default Credentials:</strong><br />
            Username: <code style={styles.code}>admin</code><br />
            Password: <code style={styles.code}>admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;