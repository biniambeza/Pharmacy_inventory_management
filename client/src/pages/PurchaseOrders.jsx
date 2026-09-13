import { useEffect, useState } from 'react';
import {
  HiOutlineClipboardList,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineDownload,
} from 'react-icons/hi';
import api from '../api/client';

export default function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ supplierId: '', notes: '', items: [{ medicineId: '', quantity: 10, unitCost: 1 }] });
  const [receive, setReceive] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api.get('/purchase-orders'), api.get('/suppliers'), api.get('/medicines')]).then(([p, s, m]) => {
      setPos(p.data.data);
      setSuppliers(s.data.data);
      setMedicines(m.data.data);
    });

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const addLine = () => setForm({ ...form, items: [...form.items, { medicineId: '', quantity: 10, unitCost: 1 }] });
  const removeLine = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/purchase-orders', {
        ...form,
        items: form.items.map((i) => ({ ...i, quantity: Number(i.quantity), unitCost: Number(i.unitCost) })),
      });
      setForm({ supplierId: '', notes: '', items: [{ medicineId: '', quantity: 10, unitCost: 1 }] });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  };

  const submitReceive = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/purchase-orders/${receive._id}/receive`, {
        items: receive.lines.map((l) => ({
          medicineId: l.medicineId,
          receivedQty: Number(l.receivedQty),
          batchNumber: l.batchNumber,
          expiryDate: l.expiryDate,
        })),
      });
      setReceive(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Receive failed');
    }
  };

  const openReceive = (po) => {
    setReceive({
      _id: po._id,
      lines: po.items
        .filter((i) => i.receivedQty < i.quantity)
        .map((i) => ({
          medicineId: i.medicineId._id || i.medicineId,
          name: i.medicineId.name,
          remaining: i.quantity - i.receivedQty,
          receivedQty: i.quantity - i.receivedQty,
          batchNumber: `PO-${po._id.slice(-4)}-${Date.now().toString().slice(-4)}`,
          expiryDate: '',
        })),
    });
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'received': return <span className="badge-green">Received</span>;
      case 'partial': return <span className="badge-blue">Partial</span>;
      case 'ordered': return <span className="badge-amber">Ordered</span>;
      case 'cancelled': return <span className="badge-rose">Cancelled</span>;
      default: return <span className="badge-slate">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h2 className="page-title flex items-center gap-2.5">
          <HiOutlineClipboardList className="h-7 w-7 text-brand-500" />
          Purchase Orders
        </h2>
        <p className="page-subtitle">Create and receive supplier orders.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          <HiOutlineExclamation className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Create form */}
      <form className="card space-y-4" onSubmit={create}>
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <HiOutlinePlus className="h-4 w-4 text-brand-500" />
          New purchase order
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Supplier</label>
            <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" placeholder="Order notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="label">Order items</p>
          {form.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                className="input flex-1"
                value={item.medicineId}
                onChange={(e) => {
                  const items = [...form.items];
                  items[idx].medicineId = e.target.value;
                  setForm({ ...form, items });
                }}
                required
              >
                <option value="">Medicine</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
              <input
                className="input w-24"
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => {
                  const items = [...form.items];
                  items[idx].quantity = e.target.value;
                  setForm({ ...form, items });
                }}
              />
              <input
                className="input w-28"
                type="number"
                step="0.01"
                placeholder="Unit cost"
                value={item.unitCost}
                onChange={(e) => {
                  const items = [...form.items];
                  items[idx].unitCost = e.target.value;
                  setForm({ ...form, items });
                }}
              />
              {form.items.length > 1 && (
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  onClick={() => removeLine(idx)}
                >
                  <HiOutlineX className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={addLine}>
            <HiOutlinePlus className="h-4 w-4" />
            Add line
          </button>
          <button className="btn-primary">Create PO</button>
        </div>
      </form>

      {/* PO list */}
      <div className="card overflow-x-auto">
        <h3 className="mb-4 font-semibold text-slate-900">Order History</h3>
        <table className="table-modern">
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Items</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {pos.map((po) => (
              <tr key={po._id}>
                <td className="text-slate-600">{new Date(po.orderDate).toLocaleDateString()}</td>
                <td className="font-medium text-slate-800">{po.supplierId?.name}</td>
                <td>{statusBadge(po.status)}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {po.items.map((i, idx) => (
                      <span key={idx} className="badge-slate">
                        {i.medicineId?.name || ''} {i.receivedQty}/{i.quantity}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-right">
                  {po.status !== 'received' && po.status !== 'cancelled' && (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition-all hover:bg-brand-100 hover:ring-brand-300"
                      onClick={() => openReceive(po)}
                    >
                      <HiOutlineDownload className="h-4 w-4" />
                      Receive
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {pos.length === 0 && (
              <tr><td colSpan="5" className="py-8 text-center text-slate-400">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Receive modal */}
      {receive && (
        <form className="card animate-scale-in space-y-4" onSubmit={submitReceive}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <HiOutlineDownload className="h-4 w-4 text-brand-500" />
              Receive Goods
            </h3>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setReceive(null)}
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500">Fill in batch details for each item. Batches will be created automatically.</p>
          {receive.lines.map((l, idx) => (
            <div key={l.medicineId} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="mb-2 text-sm font-medium text-slate-800">
                {l.name} <span className="text-xs text-slate-400">(remaining: {l.remaining})</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  className="input"
                  type="number"
                  placeholder="Received qty"
                  value={l.receivedQty}
                  onChange={(e) => {
                    const lines = [...receive.lines];
                    lines[idx].receivedQty = e.target.value;
                    setReceive({ ...receive, lines });
                  }}
                />
                <input
                  className="input"
                  placeholder="Batch #"
                  value={l.batchNumber}
                  onChange={(e) => {
                    const lines = [...receive.lines];
                    lines[idx].batchNumber = e.target.value;
                    setReceive({ ...receive, lines });
                  }}
                  required
                />
                <input
                  className="input"
                  type="date"
                  value={l.expiryDate}
                  onChange={(e) => {
                    const lines = [...receive.lines];
                    lines[idx].expiryDate = e.target.value;
                    setReceive({ ...receive, lines });
                  }}
                  required
                />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button className="btn-primary">
              <HiOutlineCheck className="h-4 w-4" />
              Confirm receipt
            </button>
            <button type="button" className="btn-secondary" onClick={() => setReceive(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
