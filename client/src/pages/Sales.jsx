import { useEffect, useState } from 'react';
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

  return (
    <div className="card overflow-x-auto">
      <h2 className="mb-4 text-2xl font-semibold">Sales</h2>
      {error && <p className="mb-3 text-rose-600">{error}</p>}
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2">Invoice</th>
            <th>Date</th>
            <th>Cashier</th>
            <th>Total</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s._id} className="border-t border-slate-100">
              <td className="py-2">{s.invoiceNumber}</td>
              <td>{new Date(s.createdAt).toLocaleString()}</td>
              <td>{s.cashierId?.name}</td>
              <td>${s.total.toFixed(2)}</td>
              <td className="capitalize">{s.status.replace('_', ' ')}</td>
              <td className="space-x-3">
                {s.status === 'completed' && (
                  <button className="text-brand-700" onClick={() => invoice(s._id)}>
                    Invoice
                  </button>
                )}
                {canApprove && s.status === 'pending_approval' && (
                  <button className="text-amber-700" onClick={() => approve(s._id)}>
                    Approve Rx
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
