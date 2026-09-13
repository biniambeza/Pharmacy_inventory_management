import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineCube,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineExclamation,
} from 'react-icons/hi';
import api from '../api/client';

const emptyMed = {
  name: '',
  genericName: '',
  category: '',
  manufacturer: '',
  unit: 'tablet',
  price: '',
  reorderLevel: 10,
  requiresPrescription: false,
};

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(emptyMed);
  const [editing, setEditing] = useState(null);
  const [batchForm, setBatchForm] = useState({
    medicineId: '',
    batchNumber: '',
    quantity: '',
    expiryDate: '',
    purchasePrice: '',
  });
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = () =>
    api.get('/medicines', { params: { q } }).then((r) => setMedicines(r.data.data));

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, [q]);

  const submitMed = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, price: Number(form.price), reorderLevel: Number(form.reorderLevel) };
    try {
      if (editing) await api.put(`/medicines/${editing}`, payload);
      else await api.post('/medicines', payload);
      setForm(emptyMed);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const submitBatch = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/batches', {
        ...batchForm,
        quantity: Number(batchForm.quantity),
        purchasePrice: Number(batchForm.purchasePrice),
      });
      setBatchForm({ medicineId: '', batchNumber: '', quantity: '', expiryDate: '', purchasePrice: '' });
      await load();
      if (selected) {
        const r = await api.get(`/medicines/${selected._id}`);
        setSelected(r.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Batch failed');
    }
  };

  const openDetail = async (id) => {
    const r = await api.get(`/medicines/${id}`);
    setSelected(r.data.data);
  };

  const low = useMemo(() => medicines.filter((m) => m.stock <= m.reorderLevel).length, [medicines]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="page-header mb-0">
          <h2 className="page-title flex items-center gap-2.5">
            <HiOutlineCube className="h-7 w-7 text-brand-500" />
            Inventory
          </h2>
          <p className="page-subtitle">
            {medicines.length} medicines · <span className={low > 0 ? 'text-amber-600 font-semibold' : ''}>{low} at reorder</span>
          </p>
        </div>
        <div className="relative">
          <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input max-w-xs pl-10"
            placeholder="Search name, generic, maker…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          <HiOutlineExclamation className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Table */}
        <div className="card xl:col-span-2 overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Rx</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m._id}>
                  <td>
                    <button className="text-left group" onClick={() => openDetail(m._id)}>
                      <span className="font-medium text-brand-700 group-hover:text-brand-800 transition-colors">{m.name}</span>
                      <span className="block text-xs text-slate-400">{m.genericName}</span>
                    </button>
                  </td>
                  <td><span className="badge-slate">{m.category}</span></td>
                  <td className="font-medium">${m.price.toFixed(2)}</td>
                  <td>
                    <span className={m.stock <= m.reorderLevel ? 'badge-amber' : 'badge-green'}>
                      {m.stock}
                    </span>
                  </td>
                  <td>
                    {m.requiresPrescription ? (
                      <span className="badge-violet">Rx</span>
                    ) : (
                      <span className="text-xs text-slate-400">OTC</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="View batches"
                        onClick={() => openDetail(m._id)}
                      >
                        <HiOutlineEye className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        title="Edit"
                        onClick={() => {
                          setEditing(m._id);
                          setForm({
                            name: m.name,
                            genericName: m.genericName,
                            category: m.category,
                            manufacturer: m.manufacturer,
                            unit: m.unit,
                            price: m.price,
                            reorderLevel: m.reorderLevel,
                            requiresPrescription: m.requiresPrescription,
                            isActive: m.isActive,
                          });
                        }}
                      >
                        <HiOutlinePencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {medicines.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No medicines found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Forms sidebar */}
        <div className="space-y-4">
          <form className="card space-y-3" onSubmit={submitMed}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                {editing ? <HiOutlinePencil className="h-4 w-4 text-brand-500" /> : <HiOutlinePlus className="h-4 w-4 text-brand-500" />}
                {editing ? 'Edit medicine' : 'Add medicine'}
              </h3>
              {editing && (
                <button
                  type="button"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  onClick={() => { setEditing(null); setForm(emptyMed); }}
                >
                  <HiOutlineX className="h-4 w-4" />
                </button>
              )}
            </div>
            {['name', 'genericName', 'category', 'manufacturer', 'unit'].map((k) => (
              <div key={k}>
                <label className="label">{k.replace(/([A-Z])/g, ' $1').trim()}</label>
                <input className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Price</label>
                <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label className="label">Reorder level</label>
                <input className="input" type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={form.requiresPrescription}
                  onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })}
                />
                <div className="h-5 w-9 rounded-full bg-slate-200 transition-colors peer-checked:bg-brand-500" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
              Requires prescription
            </label>
            <div className="flex gap-2 pt-1">
              <button className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
              {editing && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setEditing(null); setForm(emptyMed); }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <form className="card space-y-3" onSubmit={submitBatch}>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <HiOutlinePlus className="h-4 w-4 text-sky-500" />
              Add batch
            </h3>
            <select
              className="input"
              value={batchForm.medicineId}
              onChange={(e) => setBatchForm({ ...batchForm, medicineId: e.target.value })}
              required
            >
              <option value="">Select medicine</option>
              {medicines.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
            <input className="input" placeholder="Batch number" value={batchForm.batchNumber} onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" placeholder="Quantity" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} required />
              <input className="input" type="number" step="0.01" placeholder="Purchase price" value={batchForm.purchasePrice} onChange={(e) => setBatchForm({ ...batchForm, purchasePrice: e.target.value })} required />
            </div>
            <div>
              <label className="label">Expiry date</label>
              <input className="input" type="date" value={batchForm.expiryDate} onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })} required />
            </div>
            <button className="btn-primary w-full">Create batch</button>
          </form>
        </div>
      </div>

      {/* Batch detail modal */}
      {selected && (
        <div className="card animate-scale-in">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Batches — {selected.name}</h3>
              <p className="text-xs text-slate-400">First-Expiry-First-Out (FEFO) order</p>
            </div>
            <button
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              onClick={() => setSelected(null)}
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Expiry</th>
                  <th>Cost</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {(selected.batches || []).map((b) => {
                  const isExpired = new Date(b.expiryDate) < new Date();
                  return (
                    <tr key={b._id}>
                      <td className="font-medium">{b.batchNumber}</td>
                      <td>{b.quantity}</td>
                      <td>
                        <span className={isExpired ? 'badge-rose' : 'badge-green'}>
                          {new Date(b.expiryDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td>${b.purchasePrice.toFixed(2)}</td>
                      <td>{b.supplierId?.name || '—'}</td>
                    </tr>
                  );
                })}
                {(!selected.batches || selected.batches.length === 0) && (
                  <tr><td colSpan="5" className="py-6 text-center text-slate-400">No batches</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
