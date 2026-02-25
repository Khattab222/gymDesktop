import React from 'react';
import { useAuth } from './AuthProvider';
import LoginPage from './LoginPage';

/**
 * ProtectedRoute component that wraps components requiring authentication
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @param {string} props.requiredRole - Required role for access (optional)
 * @param {string} props.requiredPermission - Required permission for access (optional)
 * @param {React.ReactNode} props.fallback - Component to render when unauthorized (optional)
 * @returns {React.ReactNode} Protected content or login page
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null, 
  fallback = null 
}) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission, user } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || <UnauthorizedScreen requiredRole={requiredRole} userRole={user?.role} />;
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <UnauthorizedScreen requiredPermission={requiredPermission} />;
  }

  // All checks passed, render the protected content
  return children;
};

/**
 * Loading screen component
 */
const LoadingScreen = () => (
  <div style={loadingScreenStyles.container}>
    <div style={loadingScreenStyles.content}>
      <div style={loadingScreenStyles.spinner}>⏳</div>
      <h2 style={loadingScreenStyles.title}>Loading...</h2>
      <p style={loadingScreenStyles.subtitle}>Checking authentication status</p>
    </div>
  </div>
);

const loadingScreenStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  content: {
    textAlign: 'center',
    color: 'white'
  },
  spinner: {
    fontSize: '48px',
    marginBottom: '20px',
    animation: 'spin 1s linear infinite'
  },
  title: {
    fontSize: '24px',
    margin: '0 0 8px 0',
    fontWeight: '600'
  },
  subtitle: {
    fontSize: '16px',
    margin: '0',
    opacity: '0.9'
  }
};

/**
 * Unauthorized access screen component
 */
const UnauthorizedScreen = ({ requiredRole, requiredPermission, userRole }) => (
  <div style={unauthorizedStyles.screen}>
    <div style={unauthorizedStyles.content}>
      <div style={unauthorizedStyles.icon}>🚫</div>
      <h2 style={unauthorizedStyles.title}>Access Denied</h2>
      <p style={unauthorizedStyles.subtitle}>You don't have permission to access this resource.</p>
      
      {requiredRole && (
        <div style={unauthorizedStyles.requirementInfo}>
          <p><strong>Required Role:</strong> {requiredRole}</p>
          {userRole && <p><strong>Your Role:</strong> {userRole}</p>}
        </div>
      )}
      
      {requiredPermission && (
        <div style={unauthorizedStyles.requirementInfo}>
          <p><strong>Required Permission:</strong> {requiredPermission}</p>
        </div>
      )}
      
      <div style={unauthorizedStyles.actions}>
        <button
          onClick={() => window.location.reload()}
          style={unauthorizedStyles.retryButton}
        >
          Refresh Page
        </button>
        <button
          onClick={() => window.history.back()}
          style={unauthorizedStyles.backButton}
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

const unauthorizedStyles = {
  screen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  content: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2d3748',
    margin: '0 0 16px 0'
  },
  subtitle: {
    color: '#718096',
    fontSize: '16px',
    margin: '0 0 20px 0'
  },
  requirementInfo: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    margin: '20px 0',
    textAlign: 'left'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  retryButton: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  backButton: {
    padding: '12px 24px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#f7fafc',
    color: '#4a5568'
  }
};

/**
 * Higher-order component for protecting routes
 * @param {React.Component} Component - Component to protect
 * @param {object} options - Protection options
 * @returns {React.Component} Protected component
 */
export const withAuth = (Component, options = {}) => {
  const WrappedComponent = (props) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for checking if user has required access
 * @param {object} requirements - Access requirements
 * @returns {object} Access status
 */
export const useRequireAuth = (requirements = {}) => {
  const { isAuthenticated, hasRole, hasPermission, user } = useAuth();
  
  const hasRequiredRole = requirements.role 
    ? hasRole(requirements.role) 
    : true;
    
  const hasRequiredPermission = requirements.permission 
    ? hasPermission(requirements.permission) 
    : true;

  return {
    isAuthenticated,
    hasRequiredRole,
    hasRequiredPermission,
    hasAccess: isAuthenticated && hasRequiredRole && hasRequiredPermission,
    user
  };
};

export default ProtectedRoute;