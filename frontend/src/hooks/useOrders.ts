import { useState, useCallback } from 'react';
import api from '@/api/client';
import { toast } from '@/hooks/useToast';

export interface Order {
  id: string;
  user_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  price: number | null;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  created_at: number;
  updated_at: number;
  user_email?: string;
}

export interface CreateOrderPayload {
  symbol: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response: { data: { error: { message: string } } } }).response;
    return res?.data?.error?.message ?? 'An error occurred';
  }
  return 'Network error. Check your connection.';
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(
    async (params?: { status?: string; page?: number; limit?: number }) => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/v1/orders', { params });
        setOrders(data.data.orders);
        setTotal(data.meta?.total ?? 0);
      } catch (err) {
        toast({ variant: 'destructive', title: 'Failed to load orders', description: getErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createOrder = useCallback(async (payload: CreateOrderPayload): Promise<boolean> => {
    try {
      await api.post('/api/v1/orders', payload);
      toast({
        variant: 'success',
        title: 'Order placed',
        description: `${payload.symbol} ${payload.side} ${payload.quantity}`,
      });
      return true;
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response: { status: number } }).response.status;
        if (status === 429) {
          toast({ variant: 'warning', title: 'Too many requests. Please wait.' });
        } else {
          toast({ variant: 'destructive', title: 'Order failed', description: getErrorMessage(err) });
        }
      }
      return false;
    }
  }, []);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      await api.patch(`/api/v1/orders/${orderId}/cancel`);
      toast({ variant: 'default', title: 'Order cancelled.' });
      return true;
    } catch (err) {
      toast({ variant: 'destructive', title: 'Cancel failed', description: getErrorMessage(err) });
      return false;
    }
  }, []);

  return { orders, total, loading, fetchOrders, createOrder, cancelOrder };
}

export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAllOrders = useCallback(
    async (params?: { status?: string; user_id?: string; page?: number; limit?: number }) => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/v1/admin/orders', { params });
        setOrders(data.data.orders);
        setTotal(data.meta?.total ?? 0);
      } catch (err) {
        toast({ variant: 'destructive', title: 'Failed to load orders', description: getErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string, reason?: string): Promise<boolean> => {
      try {
        await api.patch(`/api/v1/admin/orders/${orderId}/status`, { status, reason });
        toast({ variant: 'success', title: `Order marked ${status}` });
        return true;
      } catch (err) {
        toast({ variant: 'destructive', title: 'Update failed', description: getErrorMessage(err) });
        return false;
      }
    },
    []
  );

  return { orders, total, loading, fetchAllOrders, updateOrderStatus };
}
