import { Hono } from 'hono';
import type { Env, AppVariables } from '../types/index';
import {
  CreateOrderSchema,
  PaginationSchema,
  successResponse,
  errorResponse,
} from '../types/index';
import { authMiddleware } from '../middleware/auth';
import { orderCreateRateLimit, generalRateLimit } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
  createNewOrder,
  cancelOrder,
  getUserOrders,
  getOrderById,
} from '../services/orderService';

const orders = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// All order routes require auth
orders.use('*', authMiddleware as never);

// GET /api/v1/orders — paginated list of caller's orders
orders.get(
  '/',
  generalRateLimit as never,
  validate(PaginationSchema, 'query'),
  async (c) => {
    const { page, limit, status } = c.get('validatedBody' as never) as {
      page: number;
      limit: number;
      status?: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
    };

    const userId = c.get('userId') as string;
    const { orders: orderList, total } = await getUserOrders(c.env.DB, userId, {
      status,
      page,
      limit,
    });

    return c.json(
      successResponse({ orders: orderList }, { page, limit, total }),
      200
    );
  }
);

// POST /api/v1/orders — create new order
orders.post(
  '/',
  orderCreateRateLimit as never,
  validate(CreateOrderSchema),
  async (c) => {
    const body = c.get('validatedBody' as never) as {
      symbol: string;
      side: 'BUY' | 'SELL';
      order_type: 'MARKET' | 'LIMIT';
      quantity: number;
      price?: number;
    };

    const userId = c.get('userId') as string;

    try {
      const order = await createNewOrder(c.env.DB, userId, body);
      return c.json(successResponse({ order }), 201);
    } catch {
      return c.json(errorResponse('INTERNAL', 'Failed to create order'), 500);
    }
  }
);

// GET /api/v1/orders/:id — get single order
orders.get('/:id', generalRateLimit as never, async (c) => {
  const orderId = c.req.param('id') as string;
  const userId = c.get('userId') as string;
  const userRole = c.get('userRole') as string;

  const order = await getOrderById(c.env.DB, orderId);

  if (!order) {
    return c.json(errorResponse('NOT_FOUND', 'Order not found'), 404);
  }

  if (userRole !== 'admin' && order.user_id !== userId) {
    return c.json(errorResponse('FORBIDDEN', 'Access denied'), 403);
  }

  return c.json(successResponse({ order }), 200);
});

// PATCH /api/v1/orders/:id/cancel
orders.patch('/:id/cancel', generalRateLimit as never, async (c) => {
  const orderId = c.req.param('id') as string;
  const userId = c.get('userId') as string;
  const userRole = c.get('userRole') as 'user' | 'admin';

  try {
    const order = await cancelOrder(c.env.DB, orderId, userId, userRole);
    return c.json(successResponse({ order }), 200);
  } catch (err) {
    const e = err as { statusCode?: number; message: string };
    if (e.statusCode === 404) return c.json(errorResponse('NOT_FOUND', e.message), 404);
    if (e.statusCode === 403) return c.json(errorResponse('FORBIDDEN', e.message), 403);
    if (e.statusCode === 422) return c.json(errorResponse('UNPROCESSABLE', e.message), 422);
    return c.json(errorResponse('INTERNAL', 'Failed to cancel order'), 500);
  }
});

export { orders };
