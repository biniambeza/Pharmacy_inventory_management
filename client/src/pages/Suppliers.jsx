import { useEffect, useState } from 'react';
import {
  HiOutlineTruck,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineX,
} from 'react-icons/hi';
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
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h2 className="page-title flex items-center gap-2.5">
          <HiOutlineTruck className="h-7 w-7 text-brand-500" />
          Suppliers
        </h2>
        <p className="page-subtitle">{list.length} registered suppliers</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Supplier cards grid */}
        <div className="lg:col-span-2">
          {list.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {list.map((s) => (
                <div key={s._id} className="card group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white shadow-md shadow-sky-500/20">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{s.name}</h4>
                        {s.email && (
                          <p className="flex items-center gap-1 text-xs text-slate-400">
                            <HiOutlineMail className="h-3 w-3" />
                            {s.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-brand-50 hover:text-brand-600"
                      onClick={() => {
                        setEditing(s._id);
                        setForm({ name: s.name, contact: s.contact, address: s.address, email: s.email || '' });
                      }}
                    >
                      <HiOutlinePencil className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-slate-500">
                    <p className="flex items-center gap-2">
                      <HiOutlinePhone className="h-3.5 w-3.5 text-slate-400" />
                      {s.contact}
                    </p>
                    <p className="flex items-center gap-2">
                      <HiOutlineLocationMarker className="h-3.5 w-3.5 text-slate-400" />
                      {s.address}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card flex h-48 flex-col items-center justify-center">
              <HiOutlineTruck className="h-10 w-10 text-slate-200" />
              <p className="mt-2 text-sm text-slate-400">No suppliers yet</p>
            </div>
          )}
        </div>

        {/* Form */}
        <form className="card space-y-3 self-start" onSubmit={save}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              {editing ? <HiOutlinePencil className="h-4 w-4 text-brand-500" /> : <HiOutlinePlus className="h-4 w-4 text-brand-500" />}
              {editing ? 'Edit supplier' : 'Add supplier'}
            </h3>
            {editing && (
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => { setEditing(null); setForm(empty); }}
              >
                <HiOutlineX className="h-4 w-4" />
              </button>
            )}
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="Supplier name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Contact</label>
            <input className="input" placeholder="Phone number" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" placeholder="email@supplier.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <button className="btn-primary w-full">{editing ? 'Update' : 'Create'}</button>
        </form>
      </div>
    </div>
  );
}
