import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderTable } from '@/components/orders/OrderTable';
import { OrderForm } from '@/components/orders/OrderForm';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/hooks/useOrders';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = ['ALL', 'PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { orders, loading, fetchOrders, createOrder, cancelOrder } = useOrders();

  const load = useCallback(() => {
    fetchOrders(activeFilter !== 'ALL' ? { status: activeFilter } : undefined);
  }, [activeFilter, fetchOrders]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    const ok = await cancelOrder(id);
    setCancelling(null);
    if (ok) load();
  };

  const handleCreate = async (payload: Parameters<typeof createOrder>[0]) => {
    const ok = await createOrder(payload);
    if (ok) load();
    return ok;
  };

  return (
    <AppShell
      title="Orders"
      headerRight={
        <Button
          id="new-order-desktop"
          variant="amber"
          size="sm"
          className="hidden md:flex"
          onClick={() => setSheetOpen(true)}
        >
          + New Order
        </Button>
      }
    >
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'shrink-0 px-3 py-1 rounded-sm font-mono text-xs border transition-colors cursor-pointer',
              activeFilter === f
                ? 'border-amber text-amber bg-amber/10'
                : 'border-terminal-border text-text-muted hover:text-text-secondary hover:border-terminal-border'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] rounded bg-terminal-panel border border-terminal-border animate-pulse" />
          ))}
        </div>
      )}

      {/* Mobile card list */}
      {!loading && (
        <>
          <div className="md:hidden flex flex-col gap-3">
            {orders.length === 0 && (
              <div className="text-center py-16 text-text-muted font-mono text-sm">
                NO ORDERS
              </div>
            )}
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancel={handleCancel}
                cancelling={cancelling}
              />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <OrderTable
              orders={orders}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button
        id="new-order-fab"
        onClick={() => setSheetOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full bg-amber text-terminal-base flex items-center justify-center shadow-lg cursor-pointer hover:bg-amber/90 transition-colors"
        aria-label="New Order"
      >
        <Plus className="h-5 w-5" />
      </button>

      <OrderForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmit={handleCreate}
      />
    </AppShell>
  );
}
