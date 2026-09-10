import { useEffect, useState } from 'react';
import api from '../api/client';

const empty = { name: '', contact: '', address: '', email: '' };

export default function Suppliers() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/suppliers').then((r) => setList(r.data.data));
  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/suppliers/${editing}`, form);
      else await api.post('/suppliers', form);
      setForm(empty);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card lg:col-span-2 overflow-x-auto">
        <h2 className="mb-4 text-2xl font-semibold">Suppliers</h2>
        {error && <p className="mb-3 text-rose-600">{error}</p>}
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2">Name</th>
              <th>Contact</th>
              <th>Address</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s._id} className="border-t border-slate-100">
                <td className="py-2">{s.name}</td>
                <td>{s.contact}</td>
                <td>{s.address}</td>
                <td>
                  <button
                    className="text-brand-700"
                    onClick={() => {
                      setEditing(s._id);
                      setForm({ name: s.name, contact: s.contact, address: s.address, email: s.email || '' });
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="card space-y-2" onSubmit={save}>
        <h3 className="font-semibold">{editing ? 'Edit supplier' : 'Add supplier'}</h3>
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
        <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="btn-primary">{editing ? 'Update' : 'Create'}</button>
      </form>
    </div>
  );
}
