import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, PieChart, Pie,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import {
  HiOutlineChartBar,
  HiOutlineDocumentDownload,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineStar,
} from 'react-icons/hi';
import api from '../api/client';

const CHART_COLORS = ['#2563eb', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-medium text-slate-300">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="mt-0.5 font-semibold text-white">
          {p.name}: {typeof p.value === 'number' ? `$${p.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : p.value}
        </p>
      ))}
    </div>
  );
};

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

  const bestSellerPie = best.slice(0, 6).map((b, i) => ({
    name: b.name.length > 15 ? b.name.slice(0, 15) + '…' : b.name,
    value: b.revenue,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h2 className="page-title flex items-center gap-2.5">
            <HiOutlineChartBar className="h-7 w-7 text-brand-500" />
            Reports & Analytics
          </h2>
          <p className="page-subtitle">Analyze performance and track pharmacy operations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Range pills */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            {['daily', 'weekly', 'monthly'].map((r) => (
              <button
                key={r}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold capitalize transition-all duration-200 ${
                  range === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          {/* Export buttons */}
          <button className="btn-secondary text-xs" onClick={() => openExport('csv')}>
            <HiOutlineDocumentDownload className="h-4 w-4" />
            CSV
          </button>
          <button className="btn-secondary text-xs" onClick={() => openExport('pdf')}>
            <HiOutlineDocumentDownload className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {summary && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">${summary.totals.revenue.toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-400">Completed {range} sales</p>
            </div>
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed Sales</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{summary.totals.count}</p>
              <p className="mt-1 text-xs text-slate-400">Transactions processed</p>
            </div>
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. per Sale</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                ${summary.totals.count > 0 ? (summary.totals.revenue / summary.totals.count).toFixed(2) : '0.00'}
              </p>
              <p className="mt-1 text-xs text-slate-400">Average transaction value</p>
            </div>
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expiry Alerts</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {expiry.expired.length + expiry.nearExpiry.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">{expiry.expired.length} expired · {expiry.nearExpiry.length} near</p>
            </div>
          </div>

          {/* Charts row: Revenue bar chart + Revenue trend line */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="mb-5">
                <h3 className="font-semibold text-slate-900">Revenue by Day</h3>
                <p className="text-xs text-slate-400">Daily sales performance ({range})</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.data.map((d) => ({ day: d._id.slice(5), revenue: d.revenue, count: d.count }))}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2d9270" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="mb-5">
                <h3 className="font-semibold text-slate-900">Sales Trend</h3>
                <p className="text-xs text-slate-400">Transaction count per day</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.data.map((d) => ({ day: d._id.slice(5), count: d.count, revenue: d.revenue }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="count" name="Sales count" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Row: Best sellers list + Revenue pie */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiOutlineStar className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Best Sellers</h3>
            </div>
            <span className="badge-slate">{range}</span>
          </div>
          <div className="space-y-2">
            {best.map((b, i) => (
              <div
                key={b.medicineId}
                className="flex items-center justify-between rounded-xl px-3.5 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white`} style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{b.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">${b.revenue.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-400">{b.qty} units sold</p>
                </div>
              </div>
            ))}
            {best.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No sales in this range</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-5">
            <h3 className="font-semibold text-slate-900">Revenue Distribution</h3>
            <p className="text-xs text-slate-400">Revenue share by top medicines</p>
          </div>
          {bestSellerPie.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bestSellerPie}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {bestSellerPie.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">No data</div>
          )}
        </div>
      </div>

      {/* Expiry section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <HiOutlineExclamationCircle className="h-4 w-4 text-rose-500" />
            <h3 className="font-semibold text-slate-900">Expired Batches</h3>
            {expiry.expired.length > 0 && <span className="badge-rose">{expiry.expired.length}</span>}
          </div>
          <div className="space-y-2">
            {expiry.expired.map((b) => (
              <div key={b._id} className="flex items-center justify-between rounded-xl bg-rose-50/50 px-3.5 py-2.5 text-sm ring-1 ring-rose-100">
                <div>
                  <p className="font-medium text-slate-800">{b.medicineId?.name}</p>
                  <p className="text-xs text-slate-500">Batch {b.batchNumber} · {b.quantity} units</p>
                </div>
                <span className="badge-rose">{new Date(b.expiryDate).toLocaleDateString()}</span>
              </div>
            ))}
            {expiry.expired.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">✨ No expired batches</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <HiOutlineClock className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-slate-900">Near Expiry</h3>
            {expiry.nearExpiry.length > 0 && <span className="badge-amber">{expiry.nearExpiry.length}</span>}
          </div>
          <div className="space-y-2">
            {expiry.nearExpiry.map((b) => (
              <div key={b._id} className="flex items-center justify-between rounded-xl bg-amber-50/50 px-3.5 py-2.5 text-sm ring-1 ring-amber-100">
                <div>
                  <p className="font-medium text-slate-800">{b.medicineId?.name}</p>
                  <p className="text-xs text-slate-500">Batch {b.batchNumber} · {b.quantity} units</p>
                </div>
                <span className="badge-amber">{new Date(b.expiryDate).toLocaleDateString()}</span>
              </div>
            ))}
            {expiry.nearExpiry.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">✨ No near-expiry batches</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
