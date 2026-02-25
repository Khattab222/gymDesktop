import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import { validateCustomerData } from '../../utils/validators';
import { formatCustomerName, formatMembershipStatus, formatServices } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';

const CustomerRegistration = () => {
  const [currentView, setCurrentView] = useState('register'); // register | search | profile
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Registration form data
  const [formData, setFormData] = useState({
    customerId: '',
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
        zipCode: ''
      }
    },
    membership: {
      membershipId: '',
      type: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      services: ['gym']
    }
  });

  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate end date based on membership type and start date
  useEffect(() => {
    if (formData.membership.startDate && formData.membership.type) {
      const startDate = new Date(formData.membership.startDate);
      let endDate = new Date(startDate);

      switch (formData.membership.type) {
        case 'daily':
          endDate.setDate(startDate.getDate() + 1);
          break;
        case 'monthly':
          endDate.setMonth(startDate.getMonth() + 1);
          break;
        case 'annual':
          endDate.setFullYear(startDate.getFullYear() + 1);
          break;
      }

      setFormData(prev => ({
        ...prev,
        membership: {
          ...prev.membership,
          endDate: endDate.toISOString().split('T')[0]
        }
      }));
    }
  }, [formData.membership.startDate, formData.membership.type]);

  // Generate membership ID based on customer info
  useEffect(() => {
    if (formData.personalInfo.firstName && formData.personalInfo.lastName) {
      const firstName = formData.personalInfo.firstName.substring(0, 3).toUpperCase();
      const lastName = formData.personalInfo.lastName.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-4);
      const membershipId = `${firstName}${lastName}${timestamp}`;
      
      setFormData(prev => ({
        ...prev,
        membership: {
          ...prev.membership,
          membershipId
        }
      }));
    }
  }, [formData.personalInfo.firstName, formData.personalInfo.lastName]);

  // Handle input changes
  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });

    // Clear related errors
    if (formErrors[path]) {
      setFormErrors(prev => ({
        ...prev,
        [path]: ''
      }));
    }

    setMessage(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});
    setMessage(null);

    try {
      const result = await customerService.registerCustomer(formData);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        });
        
        // Reset form after successful registration
        setTimeout(() => {
          resetForm();
          setMessage(null);
        }, 3000);
      } else {
        if (result.errors) {
          setFormErrors(result.errors);
        }
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred during registration'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      const result = await customerService.searchCustomers(searchTerm);
      
      if (result.success) {
        setSearchResults(result.data);
        setMessage({
          type: 'info',
          text: `Found ${result.data.length} customer(s)`
        });
      } else {
        setSearchResults([]);
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setMessage({
        type: 'error',
        text: 'Search failed'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      customerId: '',
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: {
          street: '',
          city: '',
          zipCode: ''
        }
      },
      membership: {
        membershipId: '',
        type: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'active',
        services: ['gym']
      }
    });
    setFormErrors({});
  };

  // View customer profile
  const viewCustomerProfile = (customer) => {
    setSelectedCustomer(customer);
    setCurrentView('profile');
  };

  return (
    <div className="customer-management">
      <div className="page-header">
        <h1>👤 Customer Management</h1>
        <p>Register new customers and manage existing ones</p>
      </div>

      {/* Navigation Tabs */}
      <div className="view-tabs">
        <button
          className={`tab-button ${currentView === 'register' ? 'active' : ''}`}
          onClick={() => setCurrentView('register')}
        >
          ➕ Register New Customer
        </button>
        <button
          className={`tab-button ${currentView === 'search' ? 'active' : ''}`}
          onClick={() => setCurrentView('search')}
        >
          🔍 Search Customers
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${message.type}`}>
          <span className="message-icon">
            {message.type === 'success' ? '✅' : 
             message.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          {message.text}
        </div>
      )}

      {/* Content Area */}
      <div className="content-area">
        {currentView === 'register' && (
          <div className="register-view">
            <form onSubmit={handleSubmit} className="registration-form">
              <div className="form-sections">
                {/* Personal Information */}
                <div className="form-section">
                  <h3>Personal Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="customerId">Customer ID</label>
                      <input
                        id="customerId"
                        type="text"
                        value={formData.customerId}
                        onChange={(e) => handleInputChange('customerId', e.target.value)}
                        placeholder="Leave empty to auto-generate"
                        className={formErrors.customerId ? 'error' : ''}
                      />
                      {formErrors.customerId && (
                        <span className="error-text">{formErrors.customerId}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        id="firstName"
                        type="text"
                        value={formData.personalInfo.firstName}
                        onChange={(e) => handleInputChange('personalInfo.firstName', e.target.value)}
                        className={formErrors.firstName ? 'error' : ''}
                        required
                      />
                      {formErrors.firstName && (
                        <span className="error-text">{formErrors.firstName}</span>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <input
                        id="lastName"
                        type="text"
                        value={formData.personalInfo.lastName}
                        onChange={(e) => handleInputChange('personalInfo.lastName', e.target.value)}
                        className={formErrors.lastName ? 'error' : ''}
                        required
                      />
                      {formErrors.lastName && (
                        <span className="error-text">{formErrors.lastName}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        id="email"
                        type="email"
                        value={formData.personalInfo.email}
                        onChange={(e) => handleInputChange('personalInfo.email', e.target.value)}
                        className={formErrors.email ? 'error' : ''}
                        required
                      />
                      {formErrors.email && (
                        <span className="error-text">{formErrors.email}</span>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone">Phone *</label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.personalInfo.phone}
                        onChange={(e) => handleInputChange('personalInfo.phone', e.target.value)}
                        placeholder="+20-123-456-7890"
                        className={formErrors.phone ? 'error' : ''}
                        required
                      />
                      {formErrors.phone && (
                        <span className="error-text">{formErrors.phone}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="dateOfBirth">Date of Birth</label>
                      <input
                        id="dateOfBirth"
                        type="date"
                        value={formData.personalInfo.dateOfBirth}
                        onChange={(e) => handleInputChange('personalInfo.dateOfBirth', e.target.value)}
                        className={formErrors.dateOfBirth ? 'error' : ''}
                      />
                      {formErrors.dateOfBirth && (
                        <span className="error-text">{formErrors.dateOfBirth}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="street">Street Address</label>
                      <input
                        id="street"
                        type="text"
                        value={formData.personalInfo.address.street}
                        onChange={(e) => handleInputChange('personalInfo.address.street', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        id="city"
                        type="text"
                        value={formData.personalInfo.address.city}
                        onChange={(e) => handleInputChange('personalInfo.address.city', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="zipCode">Zip Code</label>
                      <input
                        id="zipCode"
                        type="text"
                        value={formData.personalInfo.address.zipCode}
                        onChange={(e) => handleInputChange('personalInfo.address.zipCode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Membership Information */}
                <div className="form-section">
                  <h3>Membership Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="membershipId">Membership ID</label>
                      <input
                        id="membershipId"
                        type="text"
                        value={formData.membership.membershipId}
                        onChange={(e) => handleInputChange('membership.membershipId', e.target.value)}
                        placeholder="Auto-generated"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="membershipType">Membership Type *</label>
                      <select
                        id="membershipType"
                        value={formData.membership.type}
                        onChange={(e) => handleInputChange('membership.type', e.target.value)}
                        required
                      >
                        <option value="daily">Daily Pass - 50 EGP</option>
                        <option value="monthly">Monthly Membership - 500 EGP</option>
                        <option value="annual">Annual Membership - 5000 EGP</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="startDate">Start Date *</label>
                      <input
                        id="startDate"
                        type="date"
                        value={formData.membership.startDate}
                        onChange={(e) => handleInputChange('membership.startDate', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="endDate">End Date</label>
                      <input
                        id="endDate"
                        type="date"
                        value={formData.membership.endDate}
                        onChange={(e) => handleInputChange('membership.endDate', e.target.value)}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Services *</label>
                      <div className="checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.membership.services.includes('gym')}
                            onChange={(e) => {
                              const services = formData.membership.services;
                              if (e.target.checked) {
                                handleInputChange('membership.services', [...services, 'gym']);
                              } else {
                                handleInputChange('membership.services', services.filter(s => s !== 'gym'));
                              }
                            }}
                          />
                          Gym Access
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.membership.services.includes('spa')}
                            onChange={(e) => {
                              const services = formData.membership.services;
                              if (e.target.checked) {
                                handleInputChange('membership.services', [...services, 'spa']);
                              } else {
                                handleInputChange('membership.services', services.filter(s => s !== 'spa'));
                              }
                            }}
                          />
                          Spa Access
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="reset-button"
                  disabled={isSubmitting}
                >
                  🔄 Reset Form
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '⏳ Registering...' : '✅ Register Customer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {currentView === 'search' && (
          <SearchView
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            searchResults={searchResults}
            onViewProfile={viewCustomerProfile}
          />
        )}

        {currentView === 'profile' && selectedCustomer && (
          <CustomerProfile
            customer={selectedCustomer}
            onBack={() => setCurrentView('search')}
          />
        )}
      </div>

      <style jsx>{`
        .customer-management {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-header p {
          color: #718096;
          font-size: 16px;
          margin: 0;
        }

        /* View Tabs */
        .view-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }

        .tab-button {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          color: #4a5568;
        }

        .tab-button:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .tab-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
        }

        /* Message */
        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message.success {
          background: #f0fff4;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }

        .message.error {
          background: #fef5f5;
          color: #c53030;
          border: 1px solid #feb2b2;
        }

        .message.info {
          background: #ebf8ff;
          color: #2c5282;
          border: 1px solid #90cdf4;
        }

        .message-icon {
          font-size: 16px;
        }

        /* Content Area */
        .content-area {
          flex: 1;
          overflow-y: auto;
        }

        /* Registration Form */
        .registration-form {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .form-sections {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-section {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
        }

        .form-section h3 {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 20px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .form-row .form-group:only-child {
          grid-column: 1 / -1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group input.error,
        .form-group select.error {
          border-color: #f56565;
        }

        .form-group input:read-only {
          background: #f7fafc;
          color: #718096;
        }

        .error-text {
          color: #f56565;
          font-size: 12px;
          margin-top: 4px;
        }

        .checkbox-group {
          display: flex;
          gap: 16px;
          padding: 8px 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .reset-button,
        .submit-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .reset-button {
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .reset-button:hover:not(:disabled) {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .submit-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .reset-button:disabled,
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .checkbox-group {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

// Search View Component
const SearchView = ({ searchTerm, setSearchTerm, onSearch, searchResults, onViewProfile }) => (
  <div className="search-view">
    <form onSubmit={onSearch} className="search-form">
      <div className="search-input-group">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, ID, email, or phone..."
          className="search-input"
        />
        <button type="submit" className="search-button">
          🔍 Search
        </button>
      </div>
    </form>

    {searchResults.length > 0 && (
      <div className="search-results">
        {searchResults.map(customer => (
          <div key={customer.customerId} className="customer-card">
            <div className="customer-info">
              <h4>{formatCustomerName(customer.personalInfo)}</h4>
              <p>ID: {customer.customerId}</p>
              <p>Email: {customer.personalInfo.email}</p>
              <p>Phone: {customer.personalInfo.phone}</p>
              <div className="membership-info">
                <span className={`status-badge ${customer.membership?.status}`}>
                  {formatMembershipStatus(customer.membership?.status)}
                </span>
                <span className="services-info">
                  {formatServices(customer.membership?.services)}
                </span>
              </div>
            </div>
            <button 
              onClick={() => onViewProfile(customer)}
              className="view-button"
            >
              👁️ View Profile
            </button>
          </div>
        ))}
      </div>
    )}

    <style jsx>{`
      .search-view {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .search-form {
        margin-bottom: 24px;
      }

      .search-input-group {
        display: flex;
        gap: 12px;
      }

      .search-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 16px;
      }

      .search-input:focus {
        outline: none;
        border-color: #667eea;
      }

      .search-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }

      .search-results {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 16px;
      }

      .customer-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .customer-info h4 {
        margin: 0 0 8px 0;
        color: #2d3748;
      }

      .customer-info p {
        margin: 4px 0;
        font-size: 14px;
        color: #718096;
      }

      .membership-info {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-top: 8px;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-badge.active {
        background: #c6f6d5;
        color: #22543d;
      }

      .status-badge.expired {
        background: #fed7d7;
        color: #c53030;
      }

      .services-info {
        font-size: 12px;
        color: #4a5568;
        background: #f7fafc;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .view-button {
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      }

      .view-button:hover {
        background: #edf2f7;
        border-color: #cbd5e0;
      }

      @media (max-width: 768px) {
        .search-input-group {
          flex-direction: column;
        }

        .search-results {
          grid-template-columns: 1fr;
        }

        .customer-card {
          flex-direction: column;
          gap: 12px;
        }
      }
    `}</style>
  </div>
);

// Customer Profile Component
const CustomerProfile = ({ customer, onBack }) => (
  <div className="customer-profile">
    <div className="profile-header">
      <button onClick={onBack} className="back-button">
        ← Back to Search
      </button>
      <h2>{formatCustomerName(customer.personalInfo)}</h2>
    </div>

    <div className="profile-content">
      <div className="info-section">
        <h3>Personal Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Customer ID:</label>
            <span>{customer.customerId}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{customer.personalInfo.email}</span>
          </div>
          <div className="info-item">
            <label>Phone:</label>
            <span>{customer.personalInfo.phone}</span>
          </div>
          <div className="info-item">
            <label>Date of Birth:</label>
            <span>{customer.personalInfo.dateOfBirth || 'Not provided'}</span>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>Membership Details</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Type:</label>
            <span>{customer.membership?.type}</span>
          </div>
          <div className="info-item">
            <label>Status:</label>
            <span className={`status-badge ${customer.membership?.status}`}>
              {formatMembershipStatus(customer.membership?.status)}
            </span>
          </div>
          <div className="info-item">
            <label>Services:</label>
            <span>{formatServices(customer.membership?.services)}</span>
          </div>
          <div className="info-item">
            <label>Valid Until:</label>
            <span>{formatDate(customer.membership?.endDate, 'date')}</span>
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
      .customer-profile {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .profile-header {
        margin-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 16px;
      }

      .back-button {
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 12px;
      }

      .profile-header h2 {
        margin: 0;
        color: #2d3748;
      }

      .profile-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .info-section h3 {
        margin: 0 0 12px 0;
        color: #4a5568;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .info-item label {
        font-weight: 600;
        color: #718096;
        font-size: 14px;
      }

      .info-item span {
        color: #2d3748;
      }
    `}</style>
  </div>
);

export default CustomerRegistration;