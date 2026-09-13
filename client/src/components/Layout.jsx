import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: HiOutlineHome, roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/pos', label: 'Point of Sale', icon: HiOutlineShoppingCart, roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/inventory', label: 'Inventory', icon: HiOutlineCube, roles: ['admin', 'pharmacist'] },
  { to: '/suppliers', label: 'Suppliers', icon: HiOutlineTruck, roles: ['admin', 'pharmacist'] },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: HiOutlineClipboardList, roles: ['admin', 'pharmacist'] },
  { to: '/sales', label: 'Sales History', icon: HiOutlineCurrencyDollar, roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/reports', label: 'Reports', icon: HiOutlineChartBar, roles: ['admin', 'pharmacist'] },
  { to: '/users', label: 'User Mgmt', icon: HiOutlineUsers, roles: ['admin'] },
];

const roleBadgeColor = {
  admin: 'bg-violet-500/20 text-violet-200',
  pharmacist: 'bg-sky-500/20 text-sky-200',
  cashier: 'bg-amber-500/20 text-amber-200',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredLinks = links.filter((l) => l.roles.includes(user.role));

  const navContent = (
    <>
      {/* Brand */}
      <div className="mb-8 px-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-brand-600 shadow-lg shadow-brand-500/30">
            <span className="text-base font-bold text-white">M</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">MediTrack</h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-300/70">Pharmacy IMS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">Menu</p>
        {filteredLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm shadow-white/5 backdrop-blur-sm'
                  : 'text-white/60 hover:bg-white/8 hover:text-white/90'
              }`
            }
          >
            <l.icon className="h-[18px] w-[18px] shrink-0" />
            {l.label}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="mx-2 rounded-xl bg-white/8 p-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <span className={`mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${roleBadgeColor[user.role]}`}>
              {user.role}
            </span>
          </div>
        </div>
        <button
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <HiOutlineLogout className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-brand-900 via-brand-950 to-slate-900 p-4 lg:flex">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <aside
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-gradient-to-b from-brand-900 via-brand-950 to-slate-900 p-4 shadow-2xl animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-3 top-3 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
          >
            <HiOutlineMenu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-brand-600">
              <span className="text-xs font-bold text-white">M</span>
            </div>
            <span className="font-bold text-brand-800">MediTrack</span>
          </div>
          <span className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase ${
            user.role === 'admin' ? 'bg-violet-100 text-violet-700' :
            user.role === 'pharmacist' ? 'bg-sky-100 text-sky-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {user.role}
          </span>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
