import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Order } from '@/hooks/useOrders';

interface AdminOrdersTableProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: string) => Promise<boolean>;
  onRefresh: () => void;
}

const NEXT_STATES: Record<string, string[]> = {
  PENDING: ['EXECUTED', 'CANCELLED', 'REJECTED'],
};

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  return price.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

export function AdminOrdersTable({ orders, onUpdateStatus, onRefresh }: AdminOrdersTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const ok = await onUpdateStatus(orderId, newStatus);
    setUpdating(null);
    if (ok) onRefresh();
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted font-mono text-sm">
        NO ORDERS FOUND
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-terminal-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-terminal-border bg-terminal-elevated">
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">User</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Symbol</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Side</th>
            <th className="text-right px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Qty</th>
            <th className="text-right px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Price</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Status</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Date</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Transition</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const nextStates = NEXT_STATES[order.status] ?? [];
            return (
              <tr key={order.id} className="border-b border-terminal-subtle hover:bg-terminal-elevated/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-text-muted truncate max-w-[140px]">
                  {(order as Order & { user_email?: string }).user_email ?? '—'}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-text-primary font-semibold">{order.symbol}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-xs font-semibold ${order.side === 'BUY' ? 'text-status-executed' : 'text-status-rejected'}`}>
                    {order.side}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-right">{order.quantity}</td>
                <td className="px-4 py-3 font-mono text-sm text-text-secondary text-right">{formatPrice(order.price)}</td>
                <td className="px-4 py-3"><Badge variant={order.status}>{order.status}</Badge></td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{formatDate(order.created_at)}</td>
                <td className="px-4 py-3">
                  {nextStates.length > 0 ? (
                    <Select
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                      disabled={updating === order.id}
                    >
                      <SelectTrigger className="w-[130px] h-7 text-xs">
                        <SelectValue placeholder={updating === order.id ? 'Saving...' : 'Set status'} />
                      </SelectTrigger>
                      <SelectContent>
                        {nextStates.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-text-muted font-mono">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
