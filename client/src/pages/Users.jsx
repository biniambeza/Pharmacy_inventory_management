import { useEffect, useState } from 'react';
import api from '../api/client';

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
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card lg:col-span-2 overflow-x-auto">
        <h2 className="mb-4 text-2xl font-semibold">Users</h2>
        {error && <p className="mb-3 text-rose-600">{error}</p>}
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td className="capitalize">{u.role}</td>
                <td>{u.status}</td>
                <td>
                  <button className="text-sm text-slate-600" onClick={() => toggle(u)}>
                    {u.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="card space-y-2" onSubmit={create}>
        <h3 className="font-semibold">Create user</h3>
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="admin">Admin</option>
          <option value="pharmacist">Pharmacist</option>
          <option value="cashier">Cashier</option>
        </select>
        <button className="btn-primary">Register user</button>
      </form>
    </div>
  );
}
