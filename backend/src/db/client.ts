import type { D1Database } from '@cloudflare/workers-types';
import type { User, Order, OrderAuditLog } from '../types/index';

// ─── User Queries ────────────────────────────────────────────────────────────

export async function findUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT id, email, password, role, created_at FROM users WHERE email = ?')
    .bind(email)
    .first<User>();
  return result ?? null;
}

export async function findUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT id, email, password, role, created_at FROM users WHERE id = ?')
    .bind(id)
    .first<User>();
  return result ?? null;
}

export async function createUser(
  db: D1Database,
  email: string,
  hashedPassword: string,
  role: 'user' | 'admin' = 'user'
): Promise<User> {
  const result = await db
    .prepare(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?) RETURNING id, email, password, role, created_at'
    )
    .bind(email, hashedPassword, role)
    .first<User>();
  if (!result) throw new Error('Failed to create user');
  return result;
}

export async function getAllUsers(db: D1Database): Promise<Omit<User, 'password'>[]> {
  const result = await db
    .prepare('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC')
    .all<Omit<User, 'password'>>();
  return result.results;
}

export async function deleteUserById(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(id)
    .run();
  return result.success;
}

// ─── Order Queries ────────────────────────────────────────────────────────────

export interface OrderQueryFilters {
  status?: string;
  user_id?: string;
  page: number;
  limit: number;
}

export async function getOrdersByUserId(
  db: D1Database,
  userId: string,
  filters: { status?: string; page: number; limit: number }
): Promise<{ orders: Order[]; total: number }> {
  const offset = (filters.page - 1) * filters.limit;
  let query = 'SELECT * FROM orders WHERE user_id = ?';
  const params: (string | number)[] = [userId];

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const countResult = await db
    .prepare(countQuery)
    .bind(...params)
    .first<{ count: number }>();

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(filters.limit, offset);

  const result = await db.prepare(query).bind(...params).all<Order>();

  return {
    orders: result.results,
    total: countResult?.count ?? 0,
  };
}

export async function getAllOrders(
  db: D1Database,
  filters: OrderQueryFilters
): Promise<{ orders: (Order & { user_email: string })[]; total: number }> {
  const offset = (filters.page - 1) * filters.limit;
  let query = `
    SELECT o.*, u.email as user_email 
    FROM orders o 
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters.status) {
    query += ' AND o.status = ?';
    params.push(filters.status);
  }
  if (filters.user_id) {
    query += ' AND o.user_id = ?';
    params.push(filters.user_id);
  }

  const countQuery = query.replace(
    'SELECT o.*, u.email as user_email',
    'SELECT COUNT(*) as count'
  );
  const countResult = await db
    .prepare(countQuery)
    .bind(...params)
    .first<{ count: number }>();

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(filters.limit, offset);

  const result = await db
    .prepare(query)
    .bind(...params)
    .all<Order & { user_email: string }>();

  return {
    orders: result.results,
    total: countResult?.count ?? 0,
  };
}

export async function getOrderById(db: D1Database, id: string): Promise<Order | null> {
  const result = await db
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(id)
    .first<Order>();
  return result ?? null;
}

export async function createOrder(
  db: D1Database,
  data: {
    user_id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    order_type: 'MARKET' | 'LIMIT';
    quantity: number;
    price?: number;
  }
): Promise<Order> {
  const result = await db
    .prepare(
      `INSERT INTO orders (user_id, symbol, side, order_type, quantity, price)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    )
    .bind(data.user_id, data.symbol, data.side, data.order_type, data.quantity, data.price ?? null)
    .first<Order>();
  if (!result) throw new Error('Failed to create order');
  return result;
}

export async function updateOrderStatus(
  db: D1Database,
  orderId: string,
  status: string
): Promise<Order | null> {
  const result = await db
    .prepare(
      `UPDATE orders SET status = ?, updated_at = unixepoch() WHERE id = ? RETURNING *`
    )
    .bind(status, orderId)
    .first<Order>();
  return result ?? null;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function createAuditLogEntry(
  db: D1Database,
  data: {
    order_id: string;
    changed_by: string;
    from_status: string | null;
    to_status: string;
    reason?: string;
  }
): Promise<OrderAuditLog> {
  const result = await db
    .prepare(
      `INSERT INTO order_audit_log (order_id, changed_by, from_status, to_status, reason)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`
    )
    .bind(
      data.order_id,
      data.changed_by,
      data.from_status,
      data.to_status,
      data.reason ?? null
    )
    .first<OrderAuditLog>();
  if (!result) throw new Error('Failed to create audit log');
  return result;
}
