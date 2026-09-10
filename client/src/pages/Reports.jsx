import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/client';

export default function Reports() {
  const [range, setRange] = useState('monthly');
  const [summary, setSummary] = useState(null);
  const [best, setBest] = useState([]);
  const [expiry, setExpiry] = useState({ expired: [], nearExpiry: [] });
  const [error, setError] = useState('');

  const load = (r) => {
    setError('');
    Promise.all([
      api.get('/reports/sales', { params: { range: r } }),
      api.get('/reports/best-sellers', { params: { range: r } }),
      api.get('/reports/expiry'),
    ])
      .then(([s, b, e]) => {
        setSummary(s.data);
        setBest(b.data.data);
        setExpiry(e.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reports'));
  };

  useEffect(() => {
    load(range);
  }, [range]);

  const openExport = async (type) => {
    const path = type === 'csv' ? '/reports/sales/export.csv' : '/reports/sales/export.pdf';
    const res = await api.get(path, { params: { range }, responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'csv' ? `sales-${range}.csv` : `sales-${range}.pdf`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Reports</h2>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map((r) => (
            <button key={r} className={range === r ? 'btn-primary capitalize' : 'btn-secondary capitalize'} onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
          <button className="btn-secondary" onClick={() => openExport('csv')}>
            CSV
          </button>
          <button className="btn-secondary" onClick={() => openExport('pdf')}>
            PDF
          </button>
        </div>
      </div>
      {error && <p className="text-rose-600">{error}</p>}
      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card">
              <p className="text-xs uppercase text-slate-500">Revenue</p>
              <p className="text-2xl font-semibold">${summary.totals.revenue.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-xs uppercase text-slate-500">Completed sales</p>
              <p className="text-2xl font-semibold">{summary.totals.count}</p>
            </div>
          </div>
          <div className="card h-72">
            <h3 className="mb-3 font-semibold">Sales by day</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.data.map((d) => ({ day: d._id.slice(5), revenue: d.revenue }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold">Best sellers</h3>
          <ul className="space-y-2 text-sm">
            {best.map((b) => (
              <li key={b.medicineId} className="flex justify-between border-b border-slate-100 pb-2">
                <span>{b.name}</span>
                <span className="text-slate-500">
                  {b.qty} sold · ${b.revenue.toFixed(2)}
                </span>
              </li>
            ))}
            {best.length === 0 && <li className="text-slate-400">No sales in this range</li>}
          </ul>
        </div>
        <div className="card">
          <h3 className="mb-3 font-semibold">Expired / near expiry</h3>
          <p className="mb-2 text-xs uppercase text-rose-600">Expired</p>
          <ul className="mb-4 space-y-1 text-sm">
            {expiry.expired.map((b) => (
              <li key={b._id}>
                {b.medicineId?.name} · {b.batchNumber} · qty {b.quantity} · {new Date(b.expiryDate).toLocaleDateString()}
              </li>
            ))}
            {expiry.expired.length === 0 && <li className="text-slate-400">None</li>}
          </ul>
          <p className="mb-2 text-xs uppercase text-amber-600">Near expiry</p>
          <ul className="space-y-1 text-sm">
            {expiry.nearExpiry.map((b) => (
              <li key={b._id}>
                {b.medicineId?.name} · {b.batchNumber} · qty {b.quantity} · {new Date(b.expiryDate).toLocaleDateString()}
              </li>
            ))}
            {expiry.nearExpiry.length === 0 && <li className="text-slate-400">None</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
