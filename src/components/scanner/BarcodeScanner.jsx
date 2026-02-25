import React, { useState, useEffect, useRef } from 'react';
import barcodeService from '../../services/barcodeService';
import { formatCustomerName, formatMembershipStatus, formatServices } from '../../utils/formatters';
import { formatDate, formatDuration } from '../../utils/dateUtils';

const BarcodeScanner = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(true);
  const inputRef = useRef(null);

  // Auto-focus on input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Load scan history on mount
  useEffect(() => {
    const history = barcodeService.getScanHistory(5); // Get last 5 scans
    setScanHistory(history);
  }, []);

  // Handle barcode scan/input
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    
    if (!barcodeInput.trim()) {
      setError('Please enter a barcode');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setScanResult(null);

    try {
      // Process barcode entry/exit
      const result = await barcodeService.processBarcodeEntry(
        barcodeInput.trim(),
        ['gym'] // Default to gym service
      );

      setScanResult(result);
      
      if (result.success) {
        // Update scan history
        const updatedHistory = barcodeService.getScanHistory(5);
        setScanHistory(updatedHistory);
        
        // Clear input after successful scan
        setBarcodeInput('');
        
        // Auto-focus back to input
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      } else {
        setError(result.message);
      }

    } catch (error) {
      console.error('Barcode processing error:', error);
      setError('An error occurred while processing the barcode');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle quick test scans
  const handleQuickScan = async (customerId) => {
    setBarcodeInput(customerId);
    setError(null);
    
    // Simulate scanning the barcode
    const mockEvent = { preventDefault: () => {} };
    await handleBarcodeSubmit(mockEvent);
  };

  // Clear scan result
  const clearResult = () => {
    setScanResult(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Get result styling based on scan type and success
  const getResultStyling = (result) => {
    if (!result.success) return 'error';
    
    switch (result.type) {
      case 'entry':
        return 'success';
      case 'exit':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="barcode-scanner">
      <div className="scanner-header">
        <h1>📱 Barcode Scanner</h1>
        <p>Scan or enter customer barcodes for entry/exit</p>
      </div>

      <div className="scanner-layout">
        {/* Main Scanner Interface */}
        <div className="scanner-main">
          {/* Input Section */}
          <div className="scanner-input-section">
            <form onSubmit={handleBarcodeSubmit} className="barcode-form">
              <div className="input-group">
                <label htmlFor="barcode-input">Customer ID / Barcode</label>
                <div className="barcode-input-container">
                  <input
                    ref={inputRef}
                    id="barcode-input"
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter or scan barcode..."
                    className="barcode-input"
                    disabled={isProcessing}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !barcodeInput.trim()}
                    className="scan-button"
                  >
                    {isProcessing ? '⏳' : '🔍'}
                    {isProcessing ? 'Processing...' : 'Scan'}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Test Buttons */}
            <div className="quick-test-section">
              <h3>Quick Test (Demo)</h3>
              <div className="quick-test-buttons">
                <button onClick={() => handleQuickScan('12345678')} className="quick-test-btn">
                  Ahmed Hassan (Monthly)
                </button>
                <button onClick={() => handleQuickScan('87654321')} className="quick-test-btn">
                  Fatima Ali (Annual) - Inside
                </button>
                <button onClick={() => handleQuickScan('11223344')} className="quick-test-btn">
                  Omar Mohamed (Daily)
                </button>
                <button onClick={() => handleQuickScan('55667788')} className="quick-test-btn">
                  Nour Ibrahim (Expired)
                </button>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="scanner-result-section">
            {error && (
              <div className="result-card error">
                <div className="result-header">
                  <span className="result-icon">❌</span>
                  <h3>Error</h3>
                  <button onClick={clearResult} className="close-btn">✕</button>
                </div>
                <div className="error-message">
                  {error}
                </div>
              </div>
            )}

            {scanResult && (
              <div className={`result-card ${getResultStyling(scanResult)}`}>
                <div className="result-header">
                  <span className="result-icon">
                    {scanResult.success ? 
                      (scanResult.type === 'entry' ? '✅' : '🚪') : 
                      '❌'
                    }
                  </span>
                  <h3>
                    {scanResult.success ? 
                      (scanResult.type === 'entry' ? 'Entry Recorded' : 'Exit Recorded') :
                      'Access Denied'
                    }
                  </h3>
                  <button onClick={clearResult} className="close-btn">✕</button>
                </div>

                {scanResult.customer && (
                  <div className="customer-info">
                    <div className="customer-header">
                      <h4>{formatCustomerName(scanResult.customer.personalInfo)}</h4>
                      <span className="customer-id">ID: {scanResult.customer.customerId}</span>
                    </div>

                    <div className="customer-details">
                      <div className="detail-row">
                        <span>Membership:</span>
                        <span className={`membership-badge ${scanResult.customer.membership?.status}`}>
                          {formatMembershipStatus(scanResult.customer.membership?.status)}
                        </span>
                      </div>
                      
                      <div className="detail-row">
                        <span>Services:</span>
                        <span>{formatServices(scanResult.customer.membership?.services)}</span>
                      </div>
                      
                      {scanResult.type === 'entry' && scanResult.entryTime && (
                        <div className="detail-row">
                          <span>Entry Time:</span>
                          <span>{formatDate(scanResult.entryTime, 'time')}</span>
                        </div>
                      )}
                      
                      {scanResult.type === 'exit' && scanResult.duration && (
                        <div className="detail-row">
                          <span>Visit Duration:</span>
                          <span className="duration-highlight">
                            {formatDuration(scanResult.duration)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="result-message">
                  {scanResult.message}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="scanner-sidebar">
          {/* Recent Scans */}
          <div className="recent-scans">
            <h3>Recent Scans</h3>
            {scanHistory.length > 0 ? (
              <div className="scan-history">
                {scanHistory.map((scan) => (
                  <div key={scan.id} className="history-item">
                    <div className="history-header">
                      <span className="history-icon">
                        {scan.action === 'entry' ? '➡️' : '⬅️'}
                      </span>
                      <span className="history-name">{scan.customerName}</span>
                    </div>
                    <div className="history-details">
                      <span className="history-action">
                        {scan.action.toUpperCase()}
                      </span>
                      <span className="history-time">
                        {formatDate(scan.timestamp, 'time')}
                      </span>
                    </div>
                    {scan.duration && (
                      <div className="history-duration">
                        Duration: {formatDuration(scan.duration)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-history">
                <p>No recent scans</p>
              </div>
            )}
          </div>

          {/* Scanner Status */}
          <div className="scanner-status">
            <h3>Scanner Status</h3>
            <div className="status-indicators">
              <div className="status-item">
                <div className="status-dot active"></div>
                <span>Scanner Ready</span>
              </div>
              <div className="status-item">
                <div className="status-dot active"></div>
                <span>Database Connected</span>
              </div>
              <div className="status-item">
                <div className="status-dot active"></div>
                <span>Services Online</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="scanner-instructions">
            <h3>Instructions</h3>
            <ol>
              <li>Enter customer ID or scan barcode</li>
              <li>System will validate subscription</li>
              <li>Entry/exit will be recorded automatically</li>
              <li>Customer info will be displayed</li>
            </ol>
          </div>
        </div>
      </div>

      <style jsx>{`
        .barcode-scanner {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .scanner-header {
          margin-bottom: 24px;
        }

        .scanner-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .scanner-header p {
          color: #718096;
          font-size: 16px;
          margin: 0;
        }

        .scanner-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          overflow: hidden;
        }

        .scanner-main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Input Section */
        .scanner-input-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .barcode-form {
          margin-bottom: 24px;
        }

        .input-group label {
          display: block;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
          font-size: 16px;
        }

        .barcode-input-container {
          display: flex;
          gap: 12px;
        }

        .barcode-input {
          flex: 1;
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 18px;
          font-family: 'Courier New', monospace;
          transition: all 0.2s;
        }

        .barcode-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .barcode-input:disabled {
          background: #f7fafc;
          cursor: not-allowed;
        }

        .scan-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          white-space: nowrap;
        }

        .scan-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }

        .scan-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Quick Test Section */
        .quick-test-section {
          border-top: 1px solid #e2e8f0;
          padding-top: 24px;
        }

        .quick-test-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 12px;
        }

        .quick-test-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .quick-test-btn {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          padding: 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
          text-align: left;
          color: #4a5568;
        }

        .quick-test-btn:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        /* Result Section */
        .scanner-result-section {
          min-height: 200px;
        }

        .result-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 24px;
          border-left: 4px solid #e2e8f0;
        }

        .result-card.success {
          border-left-color: #48bb78;
          background: #f0fff4;
        }

        .result-card.error {
          border-left-color: #f56565;
          background: #fef5f5;
        }

        .result-card.info {
          border-left-color: #4299e1;
          background: #ebf8ff;
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .result-icon {
          font-size: 24px;
        }

        .result-header h3 {
          flex: 1;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #718096;
          padding: 4px;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .customer-info {
          margin-bottom: 16px;
        }

        .customer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .customer-header h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .customer-id {
          font-size: 12px;
          color: #718096;
          font-family: 'Courier New', monospace;
        }

        .customer-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .detail-row span:first-child {
          color: #718096;
        }

        .membership-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .membership-badge.active {
          background: #c6f6d5;
          color: #22543d;
        }

        .membership-badge.expired {
          background: #fed7d7;
          color: #c53030;
        }

        .membership-badge.suspended {
          background: #faf089;
          color: #744210;
        }

        .duration-highlight {
          font-weight: 600;
          color: #4299e1;
        }

        .result-message {
          font-size: 14px;
          color: #4a5568;
          padding: 12px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 6px;
        }

        .error-message {
          font-size: 14px;
          color: #c53030;
          padding: 12px;
          background: rgba(245, 101, 101, 0.1);
          border-radius: 6px;
        }

        /* Sidebar */
        .scanner-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .recent-scans,
        .scanner-status,
        .scanner-instructions {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .recent-scans h3,
        .scanner-status h3,
        .scanner-instructions h3 {
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 16px 0;
        }

        .scan-history {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
        }

        .history-item {
          padding: 12px;
          background: #f7fafc;
          border-radius: 6px;
          border-left: 3px solid #e2e8f0;
        }

        .history-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .history-icon {
          font-size: 14px;
        }

        .history-name {
          font-size: 12px;
          font-weight: 600;
          color: #2d3748;
        }

        .history-details {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #718096;
          margin-bottom: 4px;
        }

        .history-action {
          font-weight: 600;
        }

        .history-duration {
          font-size: 11px;
          color: #4299e1;
          font-weight: 500;
        }

        .empty-history {
          text-align: center;
          color: #718096;
          font-size: 14px;
          padding: 20px;
        }

        .status-indicators {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #4a5568;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.active {
          background: #48bb78;
          animation: pulse 2s infinite;
        }

        .scanner-instructions ol {
          margin: 0;
          padding-left: 16px;
        }

        .scanner-instructions li {
          font-size: 12px;
          color: #718096;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .scanner-layout {
            grid-template-columns: 1fr;
          }

          .scanner-sidebar {
            order: -1;
            flex-direction: row;
          }

          .recent-scans,
          .scanner-status,
          .scanner-instructions {
            flex: 1;
          }
        }

        @media (max-width: 768px) {
          .barcode-input-container {
            flex-direction: column;
          }

          .scanner-sidebar {
            flex-direction: column;
          }

          .quick-test-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;