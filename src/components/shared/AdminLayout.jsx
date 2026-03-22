// src/components/shared/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { LayoutDashboard, ClipboardList, LogOut, Menu, Users, MonitorSmartphone } from 'lucide-react';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} end className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
      ${isActive
        ? 'bg-neu-500 text-white shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
      }`
    }>
      <Icon size={17} /><span>{label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() { await logout(); navigate('/login'); }

  const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 flex flex-col transition-transform duration-200
        bg-slate-900 border-r border-slate-700/60
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <img src="/neu-logo.png" alt="NEU" className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-600" />
            <div>
              <p className="font-display font-semibold text-white text-sm leading-tight">NEU Library</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide leading-tight">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-2 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</p>
          <NavItem to="/admin"        icon={LayoutDashboard}   label="Dashboard" />
          <NavItem to="/admin/visits" icon={ClipboardList}     label="Visit Logs" />
          <NavItem to="/admin/users"  icon={Users}             label="Users" />
          <NavItem to="/admin/kiosk"  icon={MonitorSmartphone} label="Kiosk View" />
        </nav>

        {/* Profile footer */}
        <div className="border-t border-slate-700/60 p-3 space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
              {profile?.photoURL
                ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full bg-neu-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate leading-tight">{profile?.displayName}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors">
            <LogOut size={16} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Inside library background — opacity only */}
        <div className="absolute inset-0 z-0" style={{
          backgroundImage: `url('/neu-library-inside.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }} />
        <div className="absolute inset-0 z-0 bg-slate-900/88" />

        {/* Mobile header */}
        <header className="relative z-10 lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/60">
          <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white"><Menu size={20} /></button>
          <div className="flex items-center gap-2">
            <img src="/neu-logo.png" alt="NEU" className="w-6 h-6 rounded-full object-cover" />
            <span className="font-display text-white font-semibold text-sm">NEU Library</span>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
