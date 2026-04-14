import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuthStore } from '@/store/auth';
import { Badge } from '@/components/ui/badge';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  headerRight?: ReactNode;
}

export function AppShell({ children, title, headerRight }: AppShellProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen bg-terminal-base">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-12 bg-terminal-base border-b border-terminal-subtle flex items-center px-4 md:px-6 gap-4">
          {/* Mobile logo */}
          <span className="md:hidden font-mono text-amber tracking-[0.2em] text-sm font-semibold">
            TRADEDESK
          </span>

          {/* Desktop breadcrumb */}
          {title && (
            <span className="hidden md:block font-sans text-sm text-text-secondary">
              {title}
            </span>
          )}

          <div className="ml-auto flex items-center gap-3">
            {headerRight}
            {/* Desktop user info */}
            <div className="hidden md:flex items-center gap-2">
              <span className="font-mono text-xs text-text-muted">{user?.email}</span>
              <Badge variant={user?.role === 'admin' ? 'admin' : 'user'}>
                {user?.role}
              </Badge>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-4 pb-20 md:px-8 md:py-6 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
