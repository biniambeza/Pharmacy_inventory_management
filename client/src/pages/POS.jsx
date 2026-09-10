import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const TAX = 0.08;

export default function POS() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [rx, setRx] = useState({ patientName: '', doctorName: '', notes: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      api.get('/medicines', { params: { q } }).then((r) => setResults(r.data.data.filter((m) => m.isActive !== false)));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const add = (med) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.medicineId === med._id);
      if (existing) return prev.map((i) => (i.medicineId === med._id ? { ...i, qty: i.qty + 1 } : i));
      return [
        ...prev,
        {
          medicineId: med._id,
          name: med.name,
          price: med.price,
          stock: med.stock,
          qty: 1,
          requiresPrescription: med.requiresPrescription,
        },
      ];
    });
    setQ('');
    setResults([]);
  };

  const needsRx = cart.some((i) => i.requiresPrescription);
  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const disc = Math.min(Number(discount) || 0, subtotal);
  const tax = (subtotal - disc) * TAX;
  const total = subtotal - disc + tax;

  const checkout = async () => {
    setError('');
    setMessage('');
    if (!cart.length) return;
    if (needsRx && (!rx.patientName || !rx.doctorName)) {
      setError('Patient and doctor names are required for prescription items.');
      return;
    }
    try {
      const { data } = await api.post('/sales', {
        items: cart.map((i) => ({ medicineId: i.medicineId, qty: i.qty })),
        discount: disc,
        paymentMethod,
        prescription: needsRx ? rx : undefined,
      });
      setLastSale(data.data);
      setCart([]);
      setDiscount(0);
      setRx({ patientName: '', doctorName: '', notes: '' });
      if (data.data.status === 'pending_approval') {
        setMessage(`Sale ${data.data.invoiceNumber} is waiting for pharmacist approval. Stock is not deducted yet.`);
      } else {
        setMessage(`Sale ${data.data.invoiceNumber} completed. Total $${data.data.total.toFixed(2)}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    }
  };

  const downloadInvoice = async (id) => {
    const res = await api.get(`/sales/${id}/invoice`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    window.open(url, '_blank');
  };

  const hint = useMemo(() => {
    if (user.role === 'cashier' && needsRx) return 'Prescription items require pharmacist/admin approval after checkout.';
    return 'Stock is allocated FEFO (earliest expiry first) at checkout.';
  }, [user.role, needsRx]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <h2 className="text-2xl font-semibold">Point of sale</h2>
        <div className="card relative">
          <label className="label">Search medicines</label>
          <input className="input text-lg" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or generic…" />
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-64 w-[calc(100%-2.5rem)] overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {results.map((m) => (
                <li key={m._id}>
                  <button
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                    onClick={() => add(m)}
                    disabled={m.stock < 1}
                  >
                    <span>
                      <span className="font-medium">{m.name}</span>
                      <span className="ml-2 text-xs text-slate-400">{m.genericName}</span>
                      {m.requiresPrescription && (
                        <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700">Rx</span>
                      )}
                    </span>
                    <span className="text-sm text-slate-500">
                      ${m.price.toFixed(2)} · stock {m.stock}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Line</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cart.map((i) => (
                <tr key={i.medicineId} className="border-t border-slate-100">
                  <td className="py-2">
                    {i.name} {i.requiresPrescription && <span className="text-violet-600">Rx</span>}
                  </td>
                  <td>
                    <input
                      className="input w-20"
                      type="number"
                      min="1"
                      max={i.stock}
                      value={i.qty}
                      onChange={(e) =>
                        setCart((prev) =>
                          prev.map((x) => (x.medicineId === i.medicineId ? { ...x, qty: Number(e.target.value) } : x))
                        )
                      }
                    />
                  </td>
                  <td>${i.price.toFixed(2)}</td>
                  <td>${(i.price * i.qty).toFixed(2)}</td>
                  <td>
                    <button className="text-rose-600" onClick={() => setCart((prev) => prev.filter((x) => x.medicineId !== i.medicineId))}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    Cart is empty — search and tap a medicine
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card space-y-3 lg:col-span-2">
        <h3 className="font-semibold">Checkout</h3>
        <p className="text-xs text-slate-500">{hint}</p>
        {needsRx && (
          <div className="space-y-2 rounded-xl bg-violet-50 p-3">
            <p className="text-sm font-medium text-violet-800">Prescription</p>
            <input className="input" placeholder="Patient name" value={rx.patientName} onChange={(e) => setRx({ ...rx, patientName: e.target.value })} />
            <input className="input" placeholder="Doctor name" value={rx.doctorName} onChange={(e) => setRx({ ...rx, doctorName: e.target.value })} />
            <input className="input" placeholder="Notes (optional)" value={rx.notes} onChange={(e) => setRx({ ...rx, notes: e.target.value })} />
          </div>
        )}
        <label className="label">Discount ($)</label>
        <input className="input" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        <label className="label">Payment</label>
        <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="mobile">Mobile</option>
        </select>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>${disc.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {message && <p className="text-sm text-brand-700">{message}</p>}
        <button className="btn-primary w-full py-3 text-base" disabled={!cart.length} onClick={checkout}>
          Complete sale
        </button>
        {lastSale && lastSale.status === 'completed' && (
          <button className="btn-secondary w-full" onClick={() => downloadInvoice(lastSale._id)}>
            Open invoice PDF
          </button>
        )}
      </div>
    </div>
  );
}
