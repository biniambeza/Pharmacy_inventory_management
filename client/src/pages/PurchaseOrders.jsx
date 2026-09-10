import { useEffect, useState } from 'react';
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Purchase orders</h2>
      {error && <p className="text-rose-600">{error}</p>}
      <form className="card space-y-3" onSubmit={create}>
        <h3 className="font-semibold">New order</h3>
        <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required>
          <option value="">Supplier</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        {form.items.map((item, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-3">
            <select
              className="input"
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
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              className="input"
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
              className="input"
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
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={addLine}>
            Add line
          </button>
          <button className="btn-primary">Create PO</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2">Date</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Items</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pos.map((po) => (
              <tr key={po._id} className="border-t border-slate-100">
                <td className="py-2">{new Date(po.orderDate).toLocaleDateString()}</td>
                <td>{po.supplierId?.name}</td>
                <td className="capitalize">{po.status}</td>
                <td>
                  {po.items.map((i) => `${i.medicineId?.name || ''} ${i.receivedQty}/${i.quantity}`).join(', ')}
                </td>
                <td>
                  {po.status !== 'received' && po.status !== 'cancelled' && (
                    <button className="text-brand-700" onClick={() => openReceive(po)}>
                      Receive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {receive && (
        <form className="card space-y-3" onSubmit={submitReceive}>
          <h3 className="font-semibold">Receive goods (creates batches)</h3>
          {receive.lines.map((l, idx) => (
            <div key={l.medicineId} className="grid gap-2 md:grid-cols-4">
              <div className="text-sm">
                {l.name} <span className="text-slate-400">remain {l.remaining}</span>
              </div>
              <input
                className="input"
                type="number"
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
          ))}
          <div className="flex gap-2">
            <button className="btn-primary">Confirm receipt</button>
            <button type="button" className="btn-secondary" onClick={() => setReceive(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
