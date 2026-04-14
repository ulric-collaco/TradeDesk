import type { D1Database } from '@cloudflare/workers-types';
import {
  createOrder,
  getOrderById,
  updateOrderStatus,
  createAuditLogEntry,
  getOrdersByUserId,
  getAllOrders,
} from '../db/client';
import type { OrderQueryFilters } from '../db/client';
import type { Order } from '../types/index';
import { isValidTransition } from '../types/index';

export async function createNewOrder(
  db: D1Database,
  userId: string,
  data: {
    symbol: string;
    side: 'BUY' | 'SELL';
    order_type: 'MARKET' | 'LIMIT';
    quantity: number;
    price?: number;
  }
): Promise<Order> {
  const order = await createOrder(db, { user_id: userId, ...data });

  await createAuditLogEntry(db, {
    order_id: order.id,
    changed_by: userId,
    from_status: null,
    to_status: 'PENDING',
  });

  return order;
}

export async function cancelOrder(
  db: D1Database,
  orderId: string,
  userId: string,
  userRole: 'user' | 'admin'
): Promise<Order> {
  const order = await getOrderById(db, orderId);

  if (!order) {
    const err = Object.assign(new Error('Order not found'), { statusCode: 404 });
    throw err;
  }

  // Users can only cancel their own orders; admins can cancel any
  if (userRole !== 'admin' && order.user_id !== userId) {
    const err = Object.assign(new Error('Access denied'), { statusCode: 403 });
    throw err;
  }

  if (order.status !== 'PENDING') {
    const err = Object.assign(new Error('Only PENDING orders can be cancelled'), { statusCode: 422 });
    throw err;
  }

  const updated = await updateOrderStatus(db, orderId, 'CANCELLED');
  if (!updated) throw new Error('Failed to update order');

  await createAuditLogEntry(db, {
    order_id: orderId,
    changed_by: userId,
    from_status: 'PENDING',
    to_status: 'CANCELLED',
  });

  return updated;
}

export async function adminTransitionOrder(
  db: D1Database,
  orderId: string,
  adminId: string,
  toStatus: string,
  reason?: string
): Promise<Order> {
  const order = await getOrderById(db, orderId);

  if (!order) {
    const err = Object.assign(new Error('Order not found'), { statusCode: 404 });
    throw err;
  }

  if (!isValidTransition(order.status, toStatus)) {
    const err = Object.assign(
      new Error(`Cannot transition from ${order.status} to ${toStatus}`),
      { statusCode: 422 }
    );
    throw err;
  }

  const updated = await updateOrderStatus(db, orderId, toStatus);
  if (!updated) throw new Error('Failed to update order');

  await createAuditLogEntry(db, {
    order_id: orderId,
    changed_by: adminId,
    from_status: order.status,
    to_status: toStatus,
    reason,
  });

  return updated;
}

export async function getUserOrders(
  db: D1Database,
  userId: string,
  filters: { status?: string; page: number; limit: number }
): Promise<{ orders: Order[]; total: number }> {
  return getOrdersByUserId(db, userId, filters);
}

export async function getAllOrdersAdmin(
  db: D1Database,
  filters: OrderQueryFilters
): Promise<{ orders: (Order & { user_email: string })[]; total: number }> {
  return getAllOrders(db, filters);
}

export { getOrderById };
