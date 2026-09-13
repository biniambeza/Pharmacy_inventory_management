import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineShoppingCart,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineExclamation,
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineDeviceMobile,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const TAX = 0.08;

const paymentIcons = {
  cash: HiOutlineCash,
  card: HiOutlineCreditCard,
  mobile: HiOutlineDeviceMobile,
};

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
        setMessage(`Sale ${data.data.invoiceNumber} is waiting for pharmacist approval.`);
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
    <div className="animate-fade-in">
      <div className="page-header">
        <h2 className="page-title flex items-center gap-2.5">
          <HiOutlineShoppingCart className="h-7 w-7 text-brand-500" />
          Point of Sale
        </h2>
        <p className="page-subtitle">Search, add to cart, and complete sales.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Left: Search + Cart */}
        <div className="space-y-4 lg:col-span-3">
          {/* Search */}
          <div className="card relative">
            <label className="label">Search medicines</label>
            <div className="relative">
              <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="input py-3 pl-11 text-base"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type medicine name or generic…"
              />
            </div>
            {results.length > 0 && (
              <ul className="absolute left-6 right-6 z-10 mt-2 max-h-72 overflow-auto rounded-xl border border-slate-200/80 bg-white shadow-xl">
                {results.map((m) => (
                  <li key={m._id}>
                    <button
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-slate-50 disabled:opacity-40"
                      onClick={() => add(m)}
                      disabled={m.stock < 1}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{m.name}</span>
                        <span className="text-xs text-slate-400">{m.genericName}</span>
                        {m.requiresPrescription && <span className="badge-violet">Rx</span>}
                      </span>
                      <span className="text-sm">
                        <span className="font-semibold text-slate-900">${m.price.toFixed(2)}</span>
                        <span className="ml-2 text-xs text-slate-400">stock {m.stock}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cart table */}
          <div className="card overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Line total</th>
                  <th className="text-right">Remove</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((i) => (
                  <tr key={i.medicineId}>
                    <td>
                      <span className="font-medium text-slate-800">{i.name}</span>
                      {i.requiresPrescription && <span className="ml-1.5 badge-violet">Rx</span>}
                    </td>
                    <td>
                      <input
                        className="input w-20 text-center"
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
                    <td className="text-slate-600">${i.price.toFixed(2)}</td>
                    <td className="font-semibold">${(i.price * i.qty).toFixed(2)}</td>
                    <td className="text-right">
                      <button
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        onClick={() => setCart((prev) => prev.filter((x) => x.medicineId !== i.medicineId))}
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <HiOutlineShoppingCart className="mx-auto h-10 w-10 text-slate-200" />
                      <p className="mt-2 text-sm text-slate-400">Cart is empty — search and add medicines</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Checkout */}
        <div className="card space-y-4 lg:col-span-2 lg:sticky lg:top-8 lg:self-start">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <HiOutlineCash className="h-4 w-4 text-brand-500" />
            Checkout
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">{hint}</p>

          {/* Prescription fields */}
          {needsRx && (
            <div className="space-y-2.5 rounded-xl bg-violet-50/80 p-4 ring-1 ring-violet-100">
              <p className="text-sm font-semibold text-violet-800 flex items-center gap-1.5">
                <HiOutlineDocumentText className="h-4 w-4" />
                Prescription Required
              </p>
              <input className="input bg-white" placeholder="Patient name" value={rx.patientName} onChange={(e) => setRx({ ...rx, patientName: e.target.value })} />
              <input className="input bg-white" placeholder="Doctor name" value={rx.doctorName} onChange={(e) => setRx({ ...rx, doctorName: e.target.value })} />
              <input className="input bg-white" placeholder="Notes (optional)" value={rx.notes} onChange={(e) => setRx({ ...rx, notes: e.target.value })} />
            </div>
          )}

          <div>
            <label className="label">Discount ($)</label>
            <input className="input" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>

          {/* Payment method */}
          <div>
            <label className="label">Payment method</label>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'card', 'mobile'].map((m) => {
                const Icon = paymentIcons[m];
                return (
                  <button
                    key={m}
                    type="button"
                    className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-semibold capitalize transition-all ${
                      paymentMethod === m
                        ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500'
                        : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100'
                    }`}
                    onClick={() => setPaymentMethod(m)}
                  >
                    <Icon className="h-5 w-5" />
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {disc > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-${disc.toFixed(2)}</span></div>}
            <div className="flex justify-between text-slate-500"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
              <HiOutlineExclamation className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {message && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 ring-1 ring-emerald-100">
              <HiOutlineCheckCircle className="h-4 w-4 shrink-0" />
              {message}
            </div>
          )}

          <button className="btn-primary w-full py-3.5 text-base" disabled={!cart.length} onClick={checkout}>
            Complete sale — ${total.toFixed(2)}
          </button>
          {lastSale && lastSale.status === 'completed' && (
            <button className="btn-secondary w-full" onClick={() => downloadInvoice(lastSale._id)}>
              <HiOutlineDocumentText className="h-4 w-4" />
              Open invoice PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
