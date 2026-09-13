import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from 'react-icons/hi';
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — decorative */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-emerald-900 p-12 lg:flex">
        {/* Decorative circles */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute right-12 bottom-32 h-48 w-48 rounded-full bg-teal-400/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-brand-500 shadow-xl shadow-brand-500/30">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MediTrack</h1>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-emerald-300/60">Pharmacy IMS</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Inventory management<br />
            <span className="text-emerald-300">made effortless.</span>
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-white/60">
            Track stock levels, manage prescriptions, process sales, and generate reports — all from one unified dashboard.
          </p>
          <div className="flex gap-6">
            {[
              { n: '99.9%', l: 'Uptime' },
              { n: 'FEFO', l: 'Stock rotation' },
              { n: 'Real-time', l: 'Analytics' },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-lg font-bold text-white">{s.n}</p>
                <p className="text-xs text-white/40">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">© 2024 MediTrack. Professional pharmacy solutions.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-brand-600 shadow-lg shadow-brand-500/30">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">MediTrack</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-brand-600">Pharmacy IMS</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to your pharmacy account to continue.</p>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-10"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@pharmacy.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-10"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button className="btn-primary w-full py-3 text-sm" disabled={busy}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <HiOutlineArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 rounded-xl bg-slate-100/80 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Demo accounts</p>
            <div className="space-y-1.5 text-xs text-slate-500">
              <p><span className="font-medium text-slate-700">Admin:</span> admin@pharmacy.com</p>
              <p><span className="font-medium text-slate-700">Pharmacist:</span> pharmacist@pharmacy.com</p>
              <p><span className="font-medium text-slate-700">Cashier:</span> cashier@pharmacy.com</p>
              <p className="text-slate-400">Password: Password123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
