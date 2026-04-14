import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutList, ShieldCheck, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Orders', icon: LayoutList, adminOnly: false },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
];

export function BottomNav() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-terminal-panel border-t border-terminal-border h-[60px] flex items-center">
      <div className="flex items-center justify-around w-full px-2">
        {navItems.map(({ to, label, icon: Icon, adminOnly }) => {
          if (adminOnly && user?.role !== 'admin') return null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-4 py-1 text-xs font-sans transition-colors cursor-pointer',
                  isActive ? 'text-amber' : 'text-text-muted hover:text-text-secondary'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-4 py-1 text-xs font-sans text-text-muted hover:text-status-rejected transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </nav>
  );
}
