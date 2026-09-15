import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineLightningBolt,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: HiOutlineCube,
    title: 'Smart Inventory',
    desc: 'FEFO stock rotation, batch tracking, and automatic reorder alerts.',
  },
  {
    icon: HiOutlineChartBar,
    title: 'Real-time Analytics',
    desc: 'Revenue dashboards, best-seller reports, and expiry monitoring.',
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'Fast POS',
    desc: 'Streamlined point-of-sale with prescription workflow and invoicing.',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Role-based Access',
    desc: 'Admin, pharmacist, and cashier roles with granular permissions.',
  },
];

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // If still checking auth, show nothing (ProtectedRoute handles the spinner)
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(email, password);
      navigate(u.role === 'cashier' ? '/pos' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-5">
      {/* Left panel — decorative (3 cols) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-12 lg:col-span-3 lg:flex">
        {/* Decorative blurs */}
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

        {/* Top: brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">BEN Pharma</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-300/80">
                ERP Management System
              </p>
            </div>
          </div>
        </div>

        {/* Middle: hero text + features */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
              Manage your
              <br />
              pharmacy with
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
                confidence.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
              A complete inventory, sales, and reporting platform built for
              modern pharmacies. Stay organized, stay compliant.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.08] backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
              >
                <f.icon className="mb-2.5 h-6 w-6 text-blue-400" />
                <h3 className="text-sm font-semibold text-white/90">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: footer */}
        <p className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} BEN Pharmacy Management. Professional ERP solutions.
        </p>
      </div>

      {/* Right panel — form (2 cols) */}
      <div className="flex items-center justify-center bg-[#f6f8fb] p-6 lg:col-span-2">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/25 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">BEN Pharma</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-600">
                ERP Management
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to access your pharmacy dashboard.
          </p>

          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/60 animate-slide-up">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  className="input py-3 pl-10"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@pharmacy.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  className="input py-3 pl-10 pr-11"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <HiOutlineEye className="h-[18px] w-[18px]" />
                  )}
                </button>
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

          {/* Quick-fill demo cards */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quick sign-in with demo account
            </p>
            <div className="grid gap-2">
              {[
                { label: 'Admin', email: 'admin@pharmacy.com', color: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700' },
                { label: 'Pharmacist', email: 'pharmacist@pharmacy.com', color: 'from-sky-500 to-blue-600', badge: 'bg-sky-100 text-sky-700' },
                { label: 'Cashier', email: 'cashier@pharmacy.com', color: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-700' },
                { label: 'Supplier', email: 'supplier@pharmacy.com', color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700' },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => fillDemo(d.email)}
                  className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 text-left ring-1 ring-slate-200/80 transition-all hover:shadow-md hover:ring-slate-300 active:scale-[0.98]"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${d.color} text-xs font-bold text-white shadow-sm`}>
                    {d.label.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{d.email}</p>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${d.badge}`}>
                    {d.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-center text-[11px] text-slate-400">
              Password: <span className="font-medium text-slate-500">Password123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
