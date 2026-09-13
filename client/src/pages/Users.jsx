import { useEffect, useState } from 'react';
import {
  HiOutlineUsers,
  HiOutlineUserAdd,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineExclamation,
} from 'react-icons/hi';
import api from '../api/client';

const roleBadge = {
  admin: 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/10',
  pharmacist: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/10',
  cashier: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10',
};

const roleAvatar = {
  admin: 'from-violet-500 to-purple-600',
  pharmacist: 'from-sky-500 to-blue-600',
  cashier: 'from-amber-500 to-orange-500',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [error, setError] = useState('');

  const load = () => api.get('/auth/users').then((r) => setUsers(r.data.data));
  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      setForm({ name: '', email: '', password: '', role: 'cashier' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  };

  const toggle = async (u) => {
    await api.put(`/auth/users/${u.id}`, { status: u.status === 'active' ? 'inactive' : 'active' });
    await load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h2 className="page-title flex items-center gap-2.5">
          <HiOutlineUsers className="h-7 w-7 text-brand-500" />
          User Management
        </h2>
        <p className="page-subtitle">{users.length} team members</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          <HiOutlineExclamation className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User list as cards */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {users.map((u) => (
              <div key={u.id} className="card group">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${roleAvatar[u.role] || 'from-slate-400 to-slate-500'} text-sm font-bold text-white shadow-md`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate">{u.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadge[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10'
                      }`}>
                        {u.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className={`mt-3 w-full rounded-lg py-2 text-xs font-semibold transition-all ${
                    u.status === 'active'
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 ring-1 ring-rose-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-1 ring-emerald-100'
                  }`}
                  onClick={() => toggle(u)}
                >
                  {u.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Create form */}
        <form className="card space-y-3 self-start" onSubmit={create}>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <HiOutlineUserAdd className="h-4 w-4 text-brand-500" />
            Create user
          </h3>
          <div>
            <label className="label">Full name</label>
            <input className="input" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" type="email" placeholder="user@pharmacy.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" type="password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
          </div>
          <div>
            <label className="label">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {['admin', 'pharmacist', 'cashier'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`rounded-xl py-2.5 text-xs font-semibold capitalize transition-all ${
                    form.role === r
                      ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500'
                      : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100'
                  }`}
                  onClick={() => setForm({ ...form, role: r })}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full">
            <HiOutlineUserAdd className="h-4 w-4" />
            Register user
          </button>
        </form>
      </div>
    </div>
  );
}
