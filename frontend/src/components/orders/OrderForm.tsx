import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CreateOrderPayload } from '@/hooks/useOrders';

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateOrderPayload) => Promise<boolean>;
}

export function OrderForm({ open, onOpenChange, onSubmit }: OrderFormProps) {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('LIMIT');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLimit = orderType === 'LIMIT';

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      errs.quantity = 'Quantity must be a positive number';
    }
    if (isLimit && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      errs.price = 'Price required for LIMIT orders';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const payload: CreateOrderPayload = {
      symbol,
      side,
      order_type: orderType,
      quantity: Number(quantity),
      ...(isLimit ? { price: Number(price) } : {}),
    };

    const ok = await onSubmit(payload);
    setLoading(false);
    if (ok) {
      // Reset form
      setQuantity('');
      setPrice('');
      setErrors({});
      onOpenChange(false);
    }
  };

  const sheetSide = window.innerWidth >= 768 ? 'right' : 'bottom';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={sheetSide} className={sheetSide === 'bottom' ? 'h-[80vh]' : ''}>
        <SheetHeader>
          <SheetTitle>New Order</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Symbol */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger id="symbol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Side */}
          <div className="flex flex-col gap-2">
            <Label>Side</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['BUY', 'SELL'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={cn(
                    'h-9 rounded font-mono text-xs font-semibold border transition-colors cursor-pointer',
                    side === s && s === 'BUY'
                      ? 'bg-status-executed/20 border-status-executed text-status-executed'
                      : side === s && s === 'SELL'
                      ? 'bg-status-rejected/20 border-status-rejected text-status-rejected'
                      : 'bg-transparent border-terminal-border text-text-muted hover:text-text-primary'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Order Type */}
          <div className="flex flex-col gap-2">
            <Label>Order Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['MARKET', 'LIMIT'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={cn(
                    'h-9 rounded font-mono text-xs font-semibold border transition-colors cursor-pointer',
                    orderType === t
                      ? 'bg-amber/10 border-amber text-amber'
                      : 'bg-transparent border-terminal-border text-text-muted hover:text-text-primary'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {errors.quantity && <p className="text-xs text-status-rejected">{errors.quantity}</p>}
          </div>

          {/* Price — only for LIMIT, animated */}
          <div
            className={cn(
              'flex flex-col gap-2 overflow-hidden transition-all duration-200',
              isLimit ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <Label htmlFor="price">Price (USDT)</Label>
            <Input
              id="price"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={!isLimit}
            />
            {errors.price && <p className="text-xs text-status-rejected">{errors.price}</p>}
          </div>

          <Button variant="amber" type="submit" loading={loading} className="mt-2 w-full h-11">
            Place Order
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
