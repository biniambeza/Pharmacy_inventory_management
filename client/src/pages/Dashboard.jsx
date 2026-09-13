import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import {
  HiOutlineCurrencyDollar,
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlineClock,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineBell,
  HiOutlineShoppingCart,
  HiOutlineChartPie,
} from 'react-icons/hi';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const CHART_COLORS = ['#2d9270', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
const PIE_COLORS = ['#2d9270', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

const StatCard = ({ icon: Icon, label, value, hint, color, trend }) => (
  <div className="card group animate-slide-up">
    <div className="flex items-start justify-between">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      {trend && (
        <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}>
          {trend > 0 ? <HiOutlineTrendingUp className="h-3 w-3" /> : <HiOutlineTrendingDown className="h-3 w-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="mt-4 text-[13px] font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-medium text-slate-300">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="mt-0.5 font-semibold text-white">
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue')
            ? `$${p.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/reports/alerts'),
      api.get('/reports/best-sellers', { params: { range: 'monthly' } }),
    ])
      .then(([d, a, b]) => {
        setData(d.data.data);
        setAlerts(a.data.data);
        setBestSellers(b.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-5 py-4 text-sm text-rose-700 ring-1 ring-rose-100">
        <HiOutlineExclamation className="h-5 w-5 shrink-0" />
        {error}
      </div>
    );

  if (!data)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );

  const money = (n) =>
    Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  // Build category data from lowStock for pie chart
  const categoryMap = {};
  (data.lowStock || []).forEach((m) => {
    const cat = m.category || 'Uncategorized';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Build best sellers chart data
  const bestSellerChart = bestSellers.slice(0, 6).map((b) => ({
    name: b.name.length > 12 ? b.name.slice(0, 12) + '…' : b.name,
    qty: b.qty,
    revenue: b.revenue,
  }));

  // Build stock health data for pie chart
  const stockHealth = [
    { name: 'Healthy', value: Math.max(0, (data.stockUnits || 0) - (data.lowStockCount || 0) - (data.expiringCount || 0) - (data.expiredCount || 0)) },
    { name: 'Low stock', value: data.lowStockCount || 0 },
    { name: 'Expiring', value: data.expiringCount || 0 },
    { name: 'Expired', value: data.expiredCount || 0 },
  ].filter((d) => d.value > 0);

  const HEALTH_COLORS = ['#2d9270', '#f59e0b', '#f97316', '#ef4444'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h2 className="page-title">
          Welcome back, {user.name.split(' ')[0]} 👋
        </h2>
        <p className="page-subtitle">Here's what's happening in your pharmacy today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={HiOutlineCurrencyDollar}
          label="Today's revenue"
          value={money(data.todayRevenue)}
          hint={`${data.todaySalesCount} completed sale${data.todaySalesCount !== 1 ? 's' : ''}`}
          color="from-emerald-500 to-brand-600"
        />
        <StatCard
          icon={HiOutlineCube}
          label="Total stock value"
          value={money(data.stockValue)}
          hint={`${(data.stockUnits || 0).toLocaleString()} sellable units`}
          color="from-sky-500 to-blue-600"
        />
        <StatCard
          icon={HiOutlineExclamation}
          label="Low stock items"
          value={data.lowStockCount}
          hint="At or below reorder level"
          color="from-amber-500 to-orange-500"
        />
        <StatCard
          icon={HiOutlineClock}
          label="Expiring soon"
          value={data.expiringCount}
          hint={`${data.expiredCount} already expired`}
          color="from-rose-500 to-red-600"
        />
      </div>

      {/* Row: Revenue chart + Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <div className="card lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
              <p className="text-xs text-slate-400">Last 7 days performance</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <HiOutlineTrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend.map((t) => ({ day: t._id.slice(5), revenue: t.revenue }))}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d9270" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2d9270" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#2d9270" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ r: 4, fill: '#2d9270', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#2d9270', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts panel */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiOutlineBell className="h-4.5 w-4.5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Active Alerts</h3>
            </div>
            {alerts.length > 0 && (
              <span className="badge-amber">{alerts.length}</span>
            )}
          </div>
          {data.pendingRx > 0 && (
            <Link
              to="/sales"
              className="mb-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 px-3.5 py-2.5 text-sm font-medium text-amber-800 ring-1 ring-amber-200/50 transition-all hover:shadow-md hover:ring-amber-300"
            >
              <HiOutlineShoppingCart className="h-4 w-4 shrink-0" />
              {data.pendingRx} prescription sale{data.pendingRx !== 1 ? 's' : ''} awaiting approval
            </Link>
          )}
          <ul className="max-h-64 space-y-2 overflow-auto">
            {alerts.length === 0 && (
              <li className="flex h-20 items-center justify-center text-sm text-slate-400">
                ✨ No open alerts
              </li>
            )}
            {alerts.slice(0, 8).map((a) => (
              <li key={a._id} className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm transition-colors hover:bg-slate-100">
                <span className={`mr-2 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  a.type === 'low_stock' ? 'bg-amber-100 text-amber-700' :
                  a.type === 'expired' ? 'bg-rose-100 text-rose-700' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {a.type.replace('_', ' ')}
                </span>
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Row: Best Sellers bar chart + Stock Health pie */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best Sellers */}
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Top Sellers This Month</h3>
              <p className="text-xs text-slate-400">Medicines sold by quantity</p>
            </div>
            <Link to="/reports" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          {bestSellerChart.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellerChart} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="qty" name="Qty sold" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {bestSellerChart.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">No sales data available</div>
          )}
        </div>

        {/* Stock Health Pie */}
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Stock Health Overview</h3>
              <p className="text-xs text-slate-400">Inventory condition breakdown</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
              <HiOutlineChartPie className="h-4 w-4 text-sky-600" />
            </div>
          </div>
          {stockHealth.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockHealth}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {stockHealth.map((_, i) => (
                      <Cell key={i} fill={HEALTH_COLORS[i % HEALTH_COLORS.length]} />
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
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">No stock data</div>
          )}
        </div>
      </div>

      {/* Low-stock table */}
      {user.role !== 'cashier' && data.lowStock.length > 0 && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Low-Stock Medicines</h3>
              <p className="text-xs text-slate-400">{data.lowStock.length} items need reordering</p>
            </div>
            <Link to="/inventory" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Manage inventory →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.slice(0, 10).map((m) => (
                  <tr key={m._id}>
                    <td className="font-medium text-slate-800">{m.name}</td>
                    <td>{m.reorderLevel} units</td>
                    <td>
                      <span className="badge-amber">Low stock</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
