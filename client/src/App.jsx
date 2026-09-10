import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Sales from './pages/Sales';
import Users from './pages/Users';

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
        <Route path="pos" element={<POS />} />
        <Route
          path="inventory"
          element={
            <ProtectedRoute roles={['admin', 'pharmacist']}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="suppliers"
          element={
            <ProtectedRoute roles={['admin', 'pharmacist']}>
              <Suppliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="purchase-orders"
          element={
            <ProtectedRoute roles={['admin', 'pharmacist']}>
              <PurchaseOrders />
            </ProtectedRoute>
          }
        />
        <Route path="sales" element={<Sales />} />
        <Route
          path="reports"
          element={
            <ProtectedRoute roles={['admin', 'pharmacist']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
