import type { Order } from '@/hooks/useOrders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OrderCardProps {
  order: Order;
  onCancel?: (id: string) => void;
  cancelling?: string | null;
}

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function OrderCard({ order, onCancel, cancelling }: OrderCardProps) {
  const sideColor = order.side === 'BUY' ? 'text-status-executed' : 'text-status-rejected';

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded p-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="font-mono text-sm font-semibold text-text-primary">{order.symbol}</span>
        <Badge variant={order.status}>{order.status}</Badge>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`font-mono text-xs font-semibold ${sideColor}`}>{order.side}</span>
        <span className="text-text-muted text-xs">·</span>
        <span className="font-sans text-xs text-text-secondary">{order.order_type}</span>
        <span className="text-text-muted text-xs">·</span>
        <span className="font-mono text-xs text-text-primary">{order.quantity}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {order.price !== null && (
            <span className="font-mono text-xs text-text-secondary">
              @ {formatPrice(order.price)} USDT
            </span>
          )}
          {order.price === null && (
            <span className="font-mono text-xs text-text-muted">Market price</span>
          )}
        </div>

        {order.status === 'PENDING' && onCancel && (
          <Button
            size="sm"
            variant="outline"
            loading={cancelling === order.id}
            onClick={() => onCancel(order.id)}
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="mt-2 text-xs font-mono text-text-muted">{formatDate(order.created_at)}</div>
    </div>
  );
}
