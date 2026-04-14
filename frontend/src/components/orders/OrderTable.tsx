import type { Order } from '@/hooks/useOrders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OrderTableProps {
  orders: Order[];
  onCancel?: (id: string) => void;
  cancelling?: string | null;
  showUserEmail?: boolean;
}

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function OrderTable({ orders, onCancel, cancelling, showUserEmail }: OrderTableProps) {
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
            {showUserEmail && (
              <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">User</th>
            )}
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Symbol</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Side</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Type</th>
            <th className="text-right px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Qty</th>
            <th className="text-right px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Price</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Status</th>
            <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Date</th>
            {onCancel && (
              <th className="text-left px-4 py-3 font-sans text-xs text-text-muted uppercase tracking-widest">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr
              key={order.id}
              className={`border-b border-terminal-subtle hover:bg-terminal-elevated/50 transition-colors animate-in fade-in`}
              style={{ animationDelay: `${i * 20}ms` }}
            >
              {showUserEmail && (
                <td className="px-4 py-3 font-mono text-xs text-text-muted truncate max-w-[160px]">
                  {(order as Order & { user_email?: string }).user_email ?? '—'}
                </td>
              )}
              <td className="px-4 py-3 font-mono text-sm text-text-primary font-semibold">{order.symbol}</td>
              <td className="px-4 py-3">
                <span className={`font-mono text-xs font-semibold ${order.side === 'BUY' ? 'text-status-executed' : 'text-status-rejected'}`}>
                  {order.side}
                </span>
              </td>
              <td className="px-4 py-3 font-sans text-xs text-text-secondary">{order.order_type}</td>
              <td className="px-4 py-3 font-mono text-sm text-text-primary text-right">{order.quantity}</td>
              <td className="px-4 py-3 font-mono text-sm text-text-secondary text-right">{formatPrice(order.price)}</td>
              <td className="px-4 py-3">
                <Badge variant={order.status}>{order.status}</Badge>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-text-muted whitespace-nowrap">{formatDate(order.created_at)}</td>
              {onCancel && (
                <td className="px-4 py-3">
                  {order.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={cancelling === order.id}
                      onClick={() => onCancel(order.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
