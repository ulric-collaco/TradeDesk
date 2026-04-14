import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutList, ShieldCheck, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Orders', icon: LayoutList, adminOnly: false },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 bg-terminal-panel border-r border-terminal-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-terminal-border">
        <span className="font-mono text-amber tracking-[0.2em] text-sm font-semibold">
          TRADEDESK
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5">
        {navItems.map(({ to, label, icon: Icon, adminOnly }) => {
          if (adminOnly && user?.role !== 'admin') return null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-sans transition-colors cursor-pointer',
                  isActive
                    ? 'border-l-2 border-amber text-amber bg-amber/5 pl-[10px]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-terminal-elevated border-l-2 border-transparent pl-[10px]'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-terminal-border">
        <div className="text-xs font-mono text-text-muted truncate mb-2">{user?.email}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-status-rejected transition-colors cursor-pointer w-full"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
