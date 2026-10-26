import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';

function Layout({ notification, setNotification }) {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Dashboard Overview';
      case '/products':
        return 'Products Management';
      case '/categories':
        return 'Categories Management';
      case '/inventory':
        return 'Inventory & Stock Movements';
      case '/orders':
        return 'Orders Processing';
      default:
        return 'StockFlow';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route
              path="/"
              element={<DashboardPage setNotification={setNotification} />}
            />
            <Route
              path="/products"
              element={<ProductsPage setNotification={setNotification} />}
            />
            <Route
              path="/categories"
              element={<CategoriesPage setNotification={setNotification} />}
            />
            <Route
              path="/inventory"
              element={<InventoryPage setNotification={setNotification} />}
            />
            <Route
              path="/orders"
              element={<OrdersPage setNotification={setNotification} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}

export default function App() {
  const [notification, setNotification] = useState(null);

  const showNotification = (notif) => {
    setNotification(notif);
    if (notif?.duration !== false) {
      setTimeout(() => {
        setNotification((current) => (current === notif ? null : current));
      }, 4000);
    }
  };

  return (
    <BrowserRouter>
      <Layout notification={notification} setNotification={showNotification} />
    </BrowserRouter>
  );
}
