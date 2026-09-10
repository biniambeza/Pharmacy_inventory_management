import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/pos', label: 'POS', roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/inventory', label: 'Inventory', roles: ['admin', 'pharmacist'] },
  { to: '/suppliers', label: 'Suppliers', roles: ['admin', 'pharmacist'] },
  { to: '/purchase-orders', label: 'Purchase orders', roles: ['admin', 'pharmacist'] },
  { to: '/sales', label: 'Sales', roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/reports', label: 'Reports', roles: ['admin', 'pharmacist'] },
  { to: '/users', label: 'Users', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-brand-900 p-4 text-white lg:flex">
        <div className="mb-8 px-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">MediTrack</p>
          <h1 className="text-xl font-semibold">Pharmacy IMS</h1>
        </div>
        <nav className="flex-1 space-y-1">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm ${
                    isActive ? 'bg-white/15 font-semibold' : 'text-emerald-50/80 hover:bg-white/10'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
        </nav>
        <div className="rounded-xl bg-white/10 p-3 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="capitalize text-emerald-100/80">{user.role}</p>
          <button
            className="mt-3 text-xs text-emerald-100 underline"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <span className="font-semibold text-brand-800">MediTrack</span>
          <span className="text-xs capitalize text-slate-500">{user.role}</span>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                    isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
        </nav>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
