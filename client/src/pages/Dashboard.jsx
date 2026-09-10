import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const Stat = ({ label, value, hint }) => (
  <div className="card">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/reports/dashboard'), api.get('/reports/alerts')])
      .then(([d, a]) => {
        setData(d.data.data);
        setAlerts(a.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <p className="text-rose-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading dashboard…</p>;

  const money = (n) =>
    Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Welcome back, {user.name.split(' ')[0]}</h2>
        <p className="text-sm text-slate-500">Live pharmacy operations snapshot</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Today's revenue" value={money(data.todayRevenue)} hint={`${data.todaySalesCount} completed sales`} />
        <Stat label="Stock value" value={money(data.stockValue)} hint={`${data.stockUnits} sellable units`} />
        <Stat label="Low stock" value={data.lowStockCount} hint="At or below reorder level" />
        <Stat label="Expiring soon" value={data.expiringCount} hint={`${data.expiredCount} already expired`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold">Revenue last 7 days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend.map((t) => ({ day: t._id.slice(5), revenue: t.revenue }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#059669" fill="#d1fae5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-3 font-semibold">Alerts</h3>
          {data.pendingRx > 0 && (
            <Link to="/sales" className="mb-3 block rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {data.pendingRx} prescription sale(s) awaiting approval
            </Link>
          )}
          <ul className="max-h-64 space-y-2 overflow-auto text-sm">
            {alerts.length === 0 && <li className="text-slate-400">No open alerts</li>}
            {alerts.slice(0, 8).map((a) => (
              <li key={a._id} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="mr-2 rounded bg-white px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                  {a.type.replace('_', ' ')}
                </span>
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {user.role !== 'cashier' && (
        <div className="card">
          <h3 className="mb-3 font-semibold">Low-stock medicines</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th>Reorder level</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((m) => (
                  <tr key={m._id} className="border-t border-slate-100">
                    <td className="py-2">{m.name}</td>
                    <td>{m.reorderLevel}</td>
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
