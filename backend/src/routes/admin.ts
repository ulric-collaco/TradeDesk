import { Hono } from 'hono';
import type { Env, AppVariables } from '../types/index';
import {
  AdminStatusUpdateSchema,
  AdminOrderFilterSchema,
  successResponse,
  errorResponse,
} from '../types/index';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { generalRateLimit } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
  getAllOrdersAdmin,
  adminTransitionOrder,
} from '../services/orderService';
import { getAllUsers, deleteUserById } from '../db/client';

const admin = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// All admin routes require auth + admin role
admin.use('*', authMiddleware as never);
admin.use('*', requireRole('admin') as never);

// GET /api/v1/admin/orders
admin.get(
  '/orders',
  generalRateLimit as never,
  validate(AdminOrderFilterSchema, 'query'),
  async (c) => {
    const filters = c.get('validatedBody' as never) as {
      page: number;
      limit: number;
      status?: string;
      user_id?: string;
    };

    const { orders, total } = await getAllOrdersAdmin(c.env.DB, {
      ...filters,
      page: filters.page,
      limit: filters.limit,
    });

    return c.json(
      successResponse({ orders }, { page: filters.page, limit: filters.limit, total }),
      200
    );
  }
);

// PATCH /api/v1/admin/orders/:id/status
admin.patch(
  '/orders/:id/status',
  generalRateLimit as never,
  validate(AdminStatusUpdateSchema),
  async (c) => {
    const orderId = c.req.param('id') as string;
    const adminId = c.get('userId') as string;
    const { status, reason } = c.get('validatedBody' as never) as {
      status: 'EXECUTED' | 'CANCELLED' | 'REJECTED';
      reason?: string;
    };

    try {
      const order = await adminTransitionOrder(c.env.DB, orderId, String(adminId), status, reason);
      return c.json(successResponse({ order }), 200);
    } catch (err) {
      const e = err as { statusCode?: number; message: string };
      if (e.statusCode === 404) return c.json(errorResponse('NOT_FOUND', e.message), 404);
      if (e.statusCode === 422) return c.json(errorResponse('UNPROCESSABLE', e.message), 422);
      return c.json(errorResponse('INTERNAL', 'Failed to update order status'), 500);
    }
  }
);

// GET /api/v1/admin/users
admin.get('/users', generalRateLimit as never, async (c) => {
  const users = await getAllUsers(c.env.DB);
  return c.json(successResponse({ users }), 200);
});

// DELETE /api/v1/admin/users/:id
admin.delete('/users/:id', generalRateLimit as never, async (c) => {
  const targetId = c.req.param('id') as string;
  const adminId = c.get('userId') as string;

  if (targetId === adminId) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Cannot delete your own account'), 400);
  }

  const deleted = await deleteUserById(c.env.DB, targetId);
  if (!deleted) {
    return c.json(errorResponse('NOT_FOUND', 'User not found'), 404);
  }

  return c.json(successResponse({ message: 'User deleted' }), 200);
});

export { admin };
