
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import AuthProvider from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/common/Layout';

// Import page components (we'll create these next)
import Dashboard from './components/dashboard/Dashboard';
import BarcodeScanner from './components/scanner/BarcodeScanner';
import CurrentVisitorsList from './components/visitors/CurrentVisitorsList';
import DailyDashboard from './components/statistics/DailyDashboard';
import CustomerRegistration from './components/customer/CustomerRegistration';

const App = () => {
  const [currentPage, setCurrentPage] = useState('scanner'); // Default to scanner page
  const [pageProps, setPageProps] = useState({});

  // Handle navigation events from Navigation component
  useEffect(() => {
    const handleNavigation = (event) => {
      const { page, path } = event.detail;
      setCurrentPage(page);
      setPageProps({});
    };

    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, []);

  // Render current page component
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...pageProps} />;
      case 'scanner':
        return <BarcodeScanner {...pageProps} />;
      case 'current-visitors':
        return <CurrentVisitorsList {...pageProps} />;
      case 'statistics':
        return <DailyDashboard {...pageProps} />;
      case 'customers':
        return <CustomerRegistration {...pageProps} />;
      default:
        return <BarcodeScanner {...pageProps} />;
    }
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Layout currentPage={currentPage}>
          {renderCurrentPage()}
        </Layout>
      </ProtectedRoute>
    </AuthProvider>
  );
};

// Global CSS Reset and Base Styles
const globalStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    line-height: 1.5;
    color: #2d3748;
    background: #f8f9fa;
  }

  #root {
    height: 100%;
  }

  button {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* Focus styles for accessibility */
  :focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }

  button:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .font-medium { font-weight: 500; }

  .text-sm { font-size: 0.875rem; }
  .text-lg { font-size: 1.125rem; }
  .text-xl { font-size: 1.25rem; }
  .text-2xl { font-size: 1.5rem; }

  .mb-2 { margin-bottom: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .mb-8 { margin-bottom: 2rem; }

  .mt-2 { margin-top: 0.5rem; }
  .mt-4 { margin-top: 1rem; }
  .mt-6 { margin-top: 1.5rem; }
  .mt-8 { margin-top: 2rem; }

  .p-2 { padding: 0.5rem; }
  .p-4 { padding: 1rem; }
  .p-6 { padding: 1.5rem; }
  .p-8 { padding: 2rem; }

  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }

  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
  .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }

  .flex { display: flex; }
  .inline-flex { display: inline-flex; }
  .grid { display: grid; }
  .block { display: block; }
  .inline-block { display: inline-block; }
  .hidden { display: none; }

  .items-center { align-items: center; }
  .items-start { align-items: flex-start; }
  .items-end { align-items: flex-end; }

  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .justify-start { justify-content: flex-start; }
  .justify-end { justify-content: flex-end; }

  .flex-1 { flex: 1; }
  .flex-col { flex-direction: column; }
  .flex-row { flex-direction: row; }

  .gap-2 { gap: 0.5rem; }
  .gap-4 { gap: 1rem; }
  .gap-6 { gap: 1.5rem; }
  .gap-8 { gap: 2rem; }

  .rounded { border-radius: 0.25rem; }
  .rounded-md { border-radius: 0.375rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-xl { border-radius: 0.75rem; }

  .border { border: 1px solid #e2e8f0; }
  .border-t { border-top: 1px solid #e2e8f0; }
  .border-b { border-bottom: 1px solid #e2e8f0; }

  .bg-white { background-color: white; }
  .bg-gray-50 { background-color: #f9fafb; }
  .bg-gray-100 { background-color: #f3f4f6; }
  .bg-blue-50 { background-color: #eff6ff; }
  .bg-green-50 { background-color: #f0fff4; }
  .bg-red-50 { background-color: #fef2f2; }
  .bg-yellow-50 { background-color: #fffbeb; }

  .text-gray-500 { color: #6b7280; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-700 { color: #374151; }
  .text-gray-800 { color: #1f2937; }
  .text-gray-900 { color: #111827; }

  .text-blue-600 { color: #2563eb; }
  .text-green-600 { color: #059669; }
  .text-red-600 { color: #dc2626; }
  .text-yellow-600 { color: #d97706; }

  .shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
  .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
  .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }

  .cursor-pointer { cursor: pointer; }
  .cursor-not-allowed { cursor: not-allowed; }

  .select-none { user-select: none; }

  .transition { transition: all 0.15s ease-in-out; }
  .transition-colors { transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out; }

  .hover\\:bg-gray-50:hover { background-color: #f9fafb; }
  .hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
  .hover\\:text-blue-600:hover { color: #2563eb; }

  .focus\\:outline-none:focus { outline: none; }
  .focus\\:ring:focus { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); }

  .disabled\\:opacity-50:disabled { opacity: 0.5; }
  .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }

  @media (max-width: 640px) {
    .sm\\:hidden { display: none; }
    .sm\\:block { display: block; }
  }

  @media (max-width: 768px) {
    .md\\:hidden { display: none; }
    .md\\:block { display: block; }
  }

  @media (max-width: 1024px) {
    .lg\\:hidden { display: none; }
    .lg\\:block { display: block; }
  }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
