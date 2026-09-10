import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@pharmacy.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(email, password);
      navigate(u.role === 'cashier' ? '/pos' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-900 via-slate-900 to-slate-800 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-600">MediTrack</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pharmacy sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Inventory, POS, and reporting for your pharmacy.</p>
        {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <label className="label mt-6">Email</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="label mt-4">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn-primary mt-6 w-full py-2.5" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-4 text-xs text-slate-400">
          Seeded accounts: admin@pharmacy.com, pharmacist@pharmacy.com, cashier@pharmacy.com — password Password123!
        </p>
      </form>
    </div>
  );
}
