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
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlinePlusCircle,
  HiOutlineChevronDown,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Overview', icon: HiOutlineHome, roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/pos', label: 'Point of Sale', icon: HiOutlineShoppingCart, roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/inventory', label: 'Inventory', icon: HiOutlineCube, roles: ['admin', 'pharmacist'] },
  { to: '/purchase-orders', label: 'Procurement', icon: HiOutlineClipboardList, roles: ['admin', 'pharmacist'] },
  { to: '/suppliers', label: 'Suppliers', icon: HiOutlineTruck, roles: ['admin', 'pharmacist'] },
  { to: '/sales', label: 'Sales History', icon: HiOutlineCurrencyDollar, roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/reports', label: 'Reports', icon: HiOutlineChartBar, roles: ['admin', 'pharmacist'] },
  { to: '/users', label: 'Users & Roles', icon: HiOutlineUsers, roles: ['admin'] },
];

const roleLabel = {
  admin: 'Admin',
  pharmacist: 'Pharmacist',
  cashier: 'Cashier',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const filteredLinks = links.filter((l) => l.roles.includes(user.role));

  // Format today's date range (e.g., "May 1 - May 31, 2024" or current month)
  const today = new Date();
  const monthName = today.toLocaleDateString('en-US', { month: 'short' });
  const year = today.getFullYear();
  const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
  const dateRangeStr = `${monthName} 1 – ${monthName} ${lastDay}, ${year}`;

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      {/* Top Part: Brand + Links */}
      <div>
        {/* Brand */}
        <div className="mb-6 px-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">BEN Pharma</h1>
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 border border-blue-200/60">ERP</span>
              </div>
              <p className="text-[10px] font-medium text-slate-400">Inventory & Operations</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-1">
          {filteredLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <l.icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{l.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Part: Quick Actions Box + User Info */}
      <div className="space-y-3 pt-4">
        {/* Quick Actions Card */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 shadow-card-sm">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Quick Actions
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => { navigate('/pos'); setMobileOpen(false); }}
              className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs font-medium text-slate-700 border border-slate-200/80 shadow-card-sm hover:border-blue-300 hover:text-blue-600 transition-colors text-left"
            >
              <HiOutlineShoppingCart className="h-3.5 w-3.5 text-blue-500" />
              <span>Create Sale (POS)</span>
            </button>
            <button
              onClick={() => { navigate('/inventory'); setMobileOpen(false); }}
              className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs font-medium text-slate-700 border border-slate-200/80 shadow-card-sm hover:border-blue-300 hover:text-blue-600 transition-colors text-left"
            >
              <HiOutlinePlusCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>Add Medicine</span>
            </button>
            <button
              onClick={() => { navigate('/purchase-orders'); setMobileOpen(false); }}
              className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs font-medium text-slate-700 border border-slate-200/80 shadow-card-sm hover:border-blue-300 hover:text-blue-600 transition-colors text-left"
            >
              <HiOutlineClipboardList className="h-3.5 w-3.5 text-purple-500" />
              <span>New Purchase Order</span>
            </button>
          </div>
        </div>

        {/* User profile compact footer */}
        <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-card-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-xs text-blue-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{roleLabel[user.role] || user.role}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <HiOutlineLogout className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-100 bg-white p-4 lg:flex">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <aside
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white p-4 shadow-2xl animate-slide-in-left border-r border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setMobileOpen(false)}
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-8">
          {/* Left: mobile menu button */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <HiOutlineMenu className="h-5 w-5" />
            </button>
            {/* Search Input */}
            <div className="relative hidden md:block">
              <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search inventory, sales, orders..."
                className="w-64 rounded-xl border border-slate-200/80 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs outline-none transition-all placeholder:text-slate-400 focus:w-80 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {/* Right: Date picker pill + Notification Bell + Profile */}
          <div className="flex items-center gap-3">
            {/* Date Range Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-card-sm hover:border-slate-300 transition-colors">
              <span>{dateRangeStr}</span>
              <HiOutlineCalendar className="h-4 w-4 text-slate-400" />
            </div>

            {/* Notification bell with badge */}
            <button
              onClick={() => navigate('/')}
              className="relative rounded-xl border border-slate-200/80 bg-white p-2 text-slate-500 shadow-card-sm hover:bg-slate-50 hover:text-slate-700 transition-colors"
              title="Notifications"
            >
              <HiOutlineBell className="h-4.5 w-4.5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                3
              </span>
            </button>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-1.5 pr-2.5 shadow-card-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{roleLabel[user.role] || user.role}</p>
                </div>
                <HiOutlineChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl animate-scale-in z-30">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-bold text-slate-800">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <HiOutlineLogout className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main page content container */}
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

