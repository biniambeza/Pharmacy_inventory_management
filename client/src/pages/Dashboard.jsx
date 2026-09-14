import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  HiOutlineCurrencyDollar,
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlineShoppingCart,
  HiOutlineClipboardList,
  HiOutlineStar,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineTruck,
} from 'react-icons/hi';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

/* ── KPI Metric Card (5 in row) ── */
const MetricCard = ({ icon: Icon, iconBg, iconColor, label, value, trend, trendUp }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card hover:shadow-card-hover transition-all">
    <div className="flex items-center gap-3">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ${iconColor} shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-slate-400 leading-none">{label}</p>
        <p className="mt-1.5 text-xl font-extrabold text-slate-900 tracking-tight truncate">{value}</p>
      </div>
    </div>
    <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-50 text-[11px] font-medium text-slate-400">
      <span className={trendUp ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
        {trendUp ? '↑' : '↓'} {trend}
      </span>
      <span>vs last month</span>
    </div>
  </div>
);

/* ── Custom Tooltip for Line Chart ── */
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-xl ring-1 ring-slate-900/5">
      <p className="font-bold text-slate-700">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: p.color }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}:
            </span>
            <span className="font-bold text-slate-900">
              ${Number(p.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Time ago helper ── */
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartPeriod, setChartPeriod] = useState('30D'); // '7D', '30D', 'quarter'

  // Fetch real data on mount and whenever chartPeriod changes
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      api.get('/reports/dashboard', { params: { period: chartPeriod } }),
      api.get('/reports/alerts'),
    ])
      .then(([dashRes, alertsRes]) => {
        if (!mounted) return;
        setData(dashRes.data.data);
        setAlerts(alertsRes.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [chartPeriod]);

  // Handle resolving alerts from the task checklist
  const handleResolveAlert = async (alertId) => {
    try {
      await api.put(`/reports/alerts/${alertId}/resolve`);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch {
      // ignore
    }
  };

  // Compile real tasks from active alerts + pending approvals
  const teamTasks = useMemo(() => {
    const list = [];

    if (data?.pendingRx > 0) {
      list.push({
        id: 'pending-rx',
        title: `Verify & approve ${data.pendingRx} pending prescription sale(s)`,
        dept: 'Prescriptions',
        date: 'Today',
        priority: 'High',
        done: false,
        avatar: 'RX',
        action: () => navigate('/sales'),
      });
    }

    if (data?.openPOsCount > 0) {
      list.push({
        id: 'pending-po',
        title: `Receive incoming Purchase Orders (${data.openPOsCount} active)`,
        dept: 'Procurement',
        date: 'Today',
        priority: 'Medium',
        done: false,
        avatar: 'PO',
        action: () => navigate('/purchase-orders'),
      });
    }

    alerts.slice(0, 5).forEach((a) => {
      list.push({
        id: a._id,
        isAlert: true,
        title: a.message,
        dept: a.type === 'low_stock' ? 'Inventory' : a.type === 'expired' ? 'Quality' : 'Safety',
        date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        priority: a.type === 'expired' ? 'High' : 'Medium',
        done: a.resolved || false,
        avatar: a.type === 'low_stock' ? 'LS' : a.type === 'expired' ? 'EX' : 'AL',
        action: () => handleResolveAlert(a._id),
      });
    });

    return list;
  }, [alerts, data]);

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-5 py-4 text-sm text-rose-700 ring-1 ring-rose-100">
        <HiOutlineExclamation className="h-5 w-5 shrink-0" />
        {error}
      </div>
    );
  }

  // Format currency
  const money = (n) =>
    Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  // Safe fallback arrays from real backend data
  const lineChartData = data?.chartData || [];
  const workflowData = data?.workflowStatus || [];
  const workflowTotal = data?.totalWorkflow || 0;
  const inventoryData = data?.inventoryOverview || [];
  const totalInvCount = data?.totalInvCount || 0;
  const batchesData = data?.batchesOverview || [];
  const batchesTotal = data?.totalBatches || 0;
  const topSuppliersList = data?.topSuppliers || [];
  const recentActivitiesList = data?.recentActivities || [];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* ── Welcome Bar ── */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Pharmacist'}!
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Here's what's happening in your pharmacy today.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/pos')}
            className="btn btn-primary text-xs font-semibold py-2 px-3.5"
          >
            <HiOutlineShoppingCart className="h-4 w-4" />
            <span>New Sale (POS)</span>
          </button>
          <button
            onClick={() => navigate('/purchase-orders')}
            className="btn btn-secondary text-xs font-semibold py-2 px-3.5"
          >
            <HiOutlineClipboardList className="h-4 w-4 text-slate-500" />
            <span>Order Supplies</span>
          </button>
        </div>
      </div>

      {/* ── Top Row: 5 KPI Metric Cards ── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          icon={HiOutlineCurrencyDollar}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Total Revenue"
          value={money(data?.monthRevenue || data?.todayRevenue || 0)}
          trend={`${data?.revenueGrowthPct || 0}%`}
          trendUp={(data?.revenueGrowthPct || 0) >= 0}
        />
        <MetricCard
          icon={HiOutlineShoppingCart}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Total Expenses"
          value={money(data?.monthExpenses || 0)}
          trend="Real PO Spend"
          trendUp={true}
        />
        <MetricCard
          icon={HiOutlineDocumentText}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Net Profit"
          value={money(data?.netProfit || 0)}
          trend={data?.netProfit >= 0 ? 'Margin Positive' : 'Deficit'}
          trendUp={data?.netProfit >= 0}
        />
        <MetricCard
          icon={HiOutlineClipboardList}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Pending Prescriptions"
          value={data?.pendingRx || 0}
          trend={data?.pendingRx > 0 ? 'Needs Review' : 'Up to date'}
          trendUp={data?.pendingRx === 0}
        />
        <MetricCard
          icon={HiOutlineCube}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          label="Stock Items / Units"
          value={`${(data?.stockUnits || 0).toLocaleString()} units`}
          trend={`${data?.totalMedicines || 0} medicines`}
          trendUp={true}
        />
      </div>

      {/* ── Middle Row 1: Line Chart (Revenue vs Expenses) + Workflow Status Donut ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Revenue vs Expenses Dual Line Chart */}
        <div className="card lg:col-span-7 xl:col-span-8 flex flex-col justify-between">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue vs Expenses</h3>
              <div className="mt-1 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Expenses
                </span>
              </div>
            </div>

            {/* Dropdown filter */}
            <div className="relative">
              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white py-1 px-2.5 text-xs font-semibold text-slate-700 shadow-card-sm outline-none hover:border-slate-300 transition-colors"
              >
                <option value="30D">Last 30 Days</option>
                <option value="7D">Last 7 Days</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>

          <div className="h-64 w-full">
            {lineChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No transaction data in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#2563eb', strokeWidth: 1.5, stroke: '#fff' }}
                    activeDot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#fff' }}
                    activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Workflow Status Donut Chart */}
        <div className="card lg:col-span-5 xl:col-span-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Workflow Status</h3>
            <span className="rounded-lg border border-slate-200 bg-white py-1 px-2.5 text-[11px] font-semibold text-slate-600">
              Live Workflows
            </span>
          </div>

          <div className="my-auto flex items-center justify-between gap-2 py-2">
            {/* Donut Chart with Center Text */}
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workflowData.length > 0 ? workflowData : [{ name: 'None', value: 1, color: '#f1f5f9' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {workflowData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
                <span className="text-xl font-extrabold text-slate-900">{workflowTotal}</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-2 text-xs flex-1 min-w-0 pr-1">
              {workflowData.map((w) => (
                <div key={w.name} className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: w.color }} />
                    <span className="truncate text-slate-600 text-[11px] font-medium">{w.name}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 shrink-0">
                    {w.value} <span className="font-normal text-slate-400">({w.percent})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Row 2: 3 Cards (Inventory Overview, Pending Procurement, Batches Overview) ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Card 1: Inventory Overview Donut */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Inventory Overview</h3>
            <span className="rounded-lg border border-slate-200 bg-white py-1 px-2 text-[11px] font-semibold text-slate-500">
              Live Stock
            </span>
          </div>

          <div className="my-auto flex items-center justify-between gap-2 py-3">
            <div className="relative h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData.length > 0 ? inventoryData : [{ name: 'None', value: 1, color: '#f1f5f9' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-inv-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] font-semibold uppercase text-slate-400">Total Meds</span>
                <span className="text-sm font-extrabold text-slate-900">{totalInvCount}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs flex-1 min-w-0 pr-1">
              {inventoryData.map((inv) => (
                <div key={inv.name} className="flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: inv.color }} />
                    <span className="truncate text-slate-600 font-medium">{inv.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 shrink-0">
                    {inv.value} <span className="font-normal text-slate-400">({inv.percent})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Pending Procurement Highlight Box */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Pending Procurement</h3>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200/60">
              Active Orders
            </span>
          </div>

          <div className="my-auto flex flex-col items-center text-center py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25 mb-2">
              <HiOutlineShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-2xl font-black text-slate-900">{data?.openPOsCount || 0}</p>
            <p className="text-xs font-semibold text-slate-500">Purchase Orders to receive</p>
            <p className="mt-1 text-xs font-bold text-slate-700">
              Total Value: ${Number(data?.openPOsValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <Link
            to="/purchase-orders"
            className="w-full text-center rounded-xl bg-blue-50 py-2 text-xs font-bold text-blue-600 border border-blue-200/80 hover:bg-blue-600 hover:text-white transition-all shadow-card-sm"
          >
            View All POs
          </Link>
        </div>

        {/* Card 3: Batches Overview Donut */}
        <div className="card flex flex-col justify-between md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Batches Overview</h3>
            <span className="rounded-lg border border-slate-200 bg-white py-1 px-2 text-[11px] font-semibold text-slate-500">
              Quality & Expiry
            </span>
          </div>

          <div className="my-auto flex items-center justify-between gap-2 py-3">
            <div className="relative h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={batchesData.length > 0 ? batchesData : [{ name: 'None', value: 1, color: '#f1f5f9' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {batchesData.map((entry, index) => (
                      <Cell key={`cell-batch-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] font-semibold uppercase text-slate-400">Total Batches</span>
                <span className="text-sm font-extrabold text-slate-900">{batchesTotal}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs flex-1 min-w-0 pr-1">
              {batchesData.map((b) => (
                <div key={b.name} className="flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                    <span className="truncate text-slate-600 font-medium">{b.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 shrink-0">
                    {b.value} <span className="font-normal text-slate-400">({b.percent})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lower Row: Team Tasks + Recent Activities ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Real Team Tasks / Alerts */}
        <div className="card lg:col-span-7">
          <div className="mb-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pharmacy Tasks & Alerts</h3>
              <p className="text-[11px] text-slate-400">Active operational items requiring attention</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {teamTasks.length} pending
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {teamTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                ✨ No pending alerts or review tasks. Everything is running smoothly!
              </div>
            ) : (
              teamTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-xs transition-colors hover:bg-slate-50/70 rounded-lg px-1.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={t.action}
                      title={t.isAlert ? 'Click to resolve' : 'Click to view'}
                      className="h-4 w-4 rounded-full border border-slate-300 hover:border-blue-500 flex items-center justify-center transition-colors shrink-0"
                    >
                      {t.done && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                    </button>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100">
                      {t.avatar}
                    </div>
                    <span
                      onClick={t.action}
                      className="font-semibold truncate text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block text-[11px] text-slate-400">{t.dept}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{t.date}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        t.priority === 'High'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                          : t.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Real Recent Activities Feed */}
        <div className="card lg:col-span-5">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Activities</h3>
            <Link to="/sales" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivitiesList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activities recorded yet
              </div>
            ) : (
              recentActivitiesList.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 border ${
                      act.type === 'sale'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                        : act.type === 'po'
                        ? 'bg-blue-50 text-blue-600 border-blue-200/60'
                        : 'bg-purple-50 text-purple-600 border-purple-200/60'
                    }`}
                  >
                    {act.type === 'sale' ? (
                      <HiOutlineCheckCircle className="h-4 w-4" />
                    ) : act.type === 'po' ? (
                      <HiOutlineShoppingCart className="h-4 w-4" />
                    ) : (
                      <HiOutlineUser className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 leading-tight truncate">{act.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{act.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    {timeAgo(act.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: Real Top Suppliers Table ── */}
      <div className="card overflow-x-auto">
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Suppliers</h3>
            <p className="text-[11px] text-slate-400">Procurement partners and spending volume</p>
          </div>
          <Link
            to="/suppliers"
            className="rounded-lg border border-slate-200 bg-white py-1 px-2.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 transition-colors"
          >
            Manage Suppliers →
          </Link>
        </div>

        <table className="table-modern">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Category / Type</th>
              <th>Total Spend</th>
              <th>Orders</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {topSuppliersList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                  No suppliers registered yet
                </td>
              </tr>
            ) : (
              topSuppliersList.map((sup, idx) => (
                <tr key={idx}>
                  <td className="font-semibold text-slate-900">{sup.name}</td>
                  <td>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {sup.category}
                    </span>
                  </td>
                  <td className="font-bold text-slate-800">{sup.spend}</td>
                  <td className="font-medium text-slate-600">{sup.orders}</td>
                  <td>
                    <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
                      <span>{sup.rating}</span>
                      <HiOutlineStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


