import React, { useState, useEffect, useMemo } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Route, 
  createRoutesFromElements, 
  Navigate,
  Outlet 
} from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import SalesManagement from './Pages/SalesManagement';
import CustomerManagement from './Pages/CustomerManagement';
import RootLayout from './Pages/RootLayout'
import AreaManagement from './Pages/AreaManagement';
import InventoryManagement from './Pages/InventoryManagement';
import CashManagement from './Pages/CashManagement';
import CustomerLedger from './Pages/CustomerLedger';
import IncomeReport from './Pages/IncomeReport';
import AccountReceivable from './Pages/AccountReceivable';
import Reports from './Pages/Reports';

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated, loading }) => {
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated 
    ? children 
    : <Navigate to="/login" replace />;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const checkToken = () => {
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Math.floor(Date.now() / 1000);

          if (decodedToken.exp && decodedToken.exp < currentTime) {
            setIsAuthenticated(false);
            localStorage.removeItem('token');
          } else {
            setIsAuthenticated(true);
            setUserInfo({
              userId: decodedToken.userId,
              name: decodedToken.name,
            });
          }
        } catch (error) {
          console.error('Invalid Token:', error);
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkToken();

    window.addEventListener('storage', checkToken);

    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, []);

  const router = useMemo(() => 
    createBrowserRouter([
      {
        path: '/',
        element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />,
      },
      {
        path: '/login',
        element: <Login setAuth={setIsAuthenticated} />,
      },
      {
        path: '/dashboard',
        element: <RootLayout />,
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <Dashboard />
              </ProtectedRoute>
            ),
          },
         {
            path: 'sales-management',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <SalesManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer-managment',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <CustomerManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: 'area-management',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <AreaManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: 'inventory-management',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <InventoryManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: 'cash-management',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <CashManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer-ledger',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <CustomerLedger />
              </ProtectedRoute>
            ),
          },
          {
            path: 'income-report',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <IncomeReport />
              </ProtectedRoute>
            ),
          },

          {
            path: 'account-receivable',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <AccountReceivable />
              </ProtectedRoute>
            ),
          },
          
          {
            path: 'reports',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <Reports />
              </ProtectedRoute>
            ),
          },
          
{/*           {
            path: 'NotifyStaff',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <NotifyStaff />
              </ProtectedRoute>
            ),
          },


          {
            path: 'service-managment',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <ServiceManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: 'booking-history',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <BookingHistory />
              </ProtectedRoute>
            ),
          },
          {
            path: 'systemLogs',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <SystemLogs />
              </ProtectedRoute>
            ),
          },
          {
            path: 'weatherDashboard',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <WeatherDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings',
            element: (
              <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
                <Settings />
              </ProtectedRoute>
            ),
          },
*/}

          // You can add more nested routes here
        ],
      },
    ]), [isAuthenticated, loading]);

  return <RouterProvider router={router} />;
};

export default App;