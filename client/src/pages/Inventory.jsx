import { useEffect, useMemo, useState } from 'react';
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Inventory</h2>
          <p className="text-sm text-slate-500">{medicines.length} medicines · {low} at reorder</p>
        </div>
        <input className="input max-w-xs" placeholder="Search name / generic / maker" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Medicine</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Rx</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m._id} className="border-t border-slate-100">
                  <td className="py-2">
                    <button className="text-left font-medium text-brand-700" onClick={() => openDetail(m._id)}>
                      {m.name}
                    </button>
                    <div className="text-xs text-slate-400">{m.genericName}</div>
                  </td>
                  <td>{m.category}</td>
                  <td>${m.price.toFixed(2)}</td>
                  <td className={m.stock <= m.reorderLevel ? 'font-semibold text-amber-600' : ''}>{m.stock}</td>
                  <td>{m.requiresPrescription ? 'Yes' : 'No'}</td>
                  <td className="text-right">
                    <button
                      className="text-xs text-slate-500 underline"
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
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <form className="card space-y-2" onSubmit={submitMed}>
            <h3 className="font-semibold">{editing ? 'Edit medicine' : 'Add medicine'}</h3>
            {['name', 'genericName', 'category', 'manufacturer', 'unit'].map((k) => (
              <div key={k}>
                <label className="label">{k}</label>
                <input className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
              </div>
            ))}
            <label className="label">Price</label>
            <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <label className="label">Reorder level</label>
            <input className="input" type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requiresPrescription}
                onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })}
              />
              Requires prescription
            </label>
            <div className="flex gap-2">
              <button className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              {editing && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyMed);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <form className="card space-y-2" onSubmit={submitBatch}>
            <h3 className="font-semibold">Add batch</h3>
            <select
              className="input"
              value={batchForm.medicineId}
              onChange={(e) => setBatchForm({ ...batchForm, medicineId: e.target.value })}
              required
            >
              <option value="">Select medicine</option>
              {medicines.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input className="input" placeholder="Batch number" value={batchForm.batchNumber} onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })} required />
            <input className="input" type="number" placeholder="Quantity" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} required />
            <input className="input" type="date" value={batchForm.expiryDate} onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })} required />
            <input className="input" type="number" step="0.01" placeholder="Purchase price" value={batchForm.purchasePrice} onChange={(e) => setBatchForm({ ...batchForm, purchasePrice: e.target.value })} required />
            <button className="btn-primary">Create batch</button>
          </form>
        </div>
      </div>

      {selected && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Batches · {selected.name} (FEFO order)</h3>
            <button className="text-sm text-slate-500" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Batch</th>
                <th>Qty</th>
                <th>Expiry</th>
                <th>Cost</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              {(selected.batches || []).map((b) => (
                <tr key={b._id} className="border-t border-slate-100">
                  <td className="py-2">{b.batchNumber}</td>
                  <td>{b.quantity}</td>
                  <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                  <td>${b.purchasePrice.toFixed(2)}</td>
                  <td>{b.supplierId?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
