import { useEffect, useState } from 'react';
import {
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
} from 'react-icons/hi';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');

  const load = () => api.get('/sales').then((r) => setSales(r.data.data));
  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const approve = async (id) => {
    try {
      await api.post(`/sales/${id}/approve`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Approve failed');
    }
  };

  const invoice = async (id) => {
    const res = await api.get(`/sales/${id}/invoice`, { responseType: 'blob' });
    window.open(URL.createObjectURL(res.data), '_blank');
  };

  const canApprove = user.role === 'admin' || user.role === 'pharmacist';

  const statusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge-green">Completed</span>;
      case 'pending_approval':
        return <span className="badge-amber">Pending</span>;
      case 'cancelled':
        return <span className="badge-rose">Cancelled</span>;
      default:
        return <span className="badge-slate">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h2 className="page-title flex items-center gap-2.5">
          <HiOutlineCurrencyDollar className="h-7 w-7 text-brand-500" />
          Sales History
        </h2>
        <p className="page-subtitle">{sales.length} total transactions</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          <HiOutlineExclamation className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Cashier</th>
              <th>Total</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s._id}>
                <td className="font-medium text-slate-800">{s.invoiceNumber}</td>
                <td className="text-slate-600">
                  <div>{new Date(s.createdAt).toLocaleDateString()}</div>
                  <div className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleTimeString()}</div>
                </td>
                <td>{s.cashierId?.name}</td>
                <td className="font-semibold">${s.total.toFixed(2)}</td>
                <td>{statusBadge(s.status)}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {s.status === 'completed' && (
                      <button
                        className="btn-ghost text-xs"
                        onClick={() => invoice(s._id)}
                      >
                        <HiOutlineDocumentText className="h-4 w-4" />
                        Invoice
                      </button>
                    )}
                    {canApprove && s.status === 'pending_approval' && (
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 transition-all hover:bg-amber-100 hover:ring-amber-300"
                        onClick={() => approve(s._id)}
                      >
                        <HiOutlineCheckCircle className="h-4 w-4" />
                        Approve Rx
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">No sales yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
