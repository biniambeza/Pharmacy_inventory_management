import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy-load secondary pages to reduce initial bundle size
const Inventory = lazy(() => import('./pages/Inventory'));
const POS = lazy(() => import('./pages/POS'));
const Reports = lazy(() => import('./pages/Reports'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const Sales = lazy(() => import('./pages/Sales'));
const Users = lazy(() => import('./pages/Users'));

const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <svg className="h-7 w-7 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-slate-400">Loading…</p>
    </div>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<Suspense fallback={<PageLoader />}><POS /></Suspense>} />
        <Route
          path="inventory"
          element={
            <ProtectedRoute roles={['admin', 'pharmacist', 'cashier']}>
              <Suspense fallback={<PageLoader />}><Inventory /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="suppliers"
          element={
            <ProtectedRoute roles={['admin', 'pharmacist']}>
              <Suspense fallback={<PageLoader />}><Suppliers /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="purchase-orders"
          element={
            <ProtectedRoute roles={['admin', 'pharmacist']}>
              <Suspense fallback={<PageLoader />}><PurchaseOrders /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="sales" element={<Suspense fallback={<PageLoader />}><Sales /></Suspense>} />
        <Route
          path="reports"
          element={
            <ProtectedRoute roles={['admin']}>
              <Suspense fallback={<PageLoader />}><Reports /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <Suspense fallback={<PageLoader />}><Users /></Suspense>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
