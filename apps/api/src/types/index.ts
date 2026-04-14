import { z } from 'zod';

// ─── Database Models ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  created_at: number;
}

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
}

export interface OrderAuditLog {
  id: string;
  order_id: string;
  changed_by: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  timestamp: number;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
  jti: string;
  iat: number;
  exp: number;
}

// ─── Cloudflare Env ───────────────────────────────────────────────────────────

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
}

// ─── Hono Context Variables ───────────────────────────────────────────────────

export interface AppVariables {
  userId: string;
  userEmail: string;
  userRole: 'user' | 'admin';
  jti: string;
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateOrderSchema = z
  .object({
    symbol: z
      .string()
      .regex(/^[A-Z]+\/[A-Z]+$/, 'Symbol format must be like BTC/USDT'),
    side: z.enum(['BUY', 'SELL']),
    order_type: z.enum(['MARKET', 'LIMIT']),
    quantity: z.number().positive('Quantity must be positive'),
    price: z.number().positive('Price must be positive').optional(),
  })
  .refine(
    (data) => (data.order_type === 'MARKET' ? !data.price : !!data.price),
    {
      message: 'LIMIT orders require price; MARKET orders must omit price',
      path: ['price'],
    }
  );

export const AdminStatusUpdateSchema = z.object({
  status: z.enum(['EXECUTED', 'CANCELLED', 'REJECTED']),
  reason: z.string().max(500).optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(['PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED'])
    .optional(),
});

export const AdminOrderFilterSchema = PaginationSchema.extend({
  user_id: z.string().optional(),
});

// ─── Response Helpers ─────────────────────────────────────────────────────────

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'UNPROCESSABLE'
  | 'INTERNAL';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function successResponse<T>(data: T, meta?: ApiSuccess<T>['meta']): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
}

// ─── State Machine ────────────────────────────────────────────────────────────

export const VALID_ADMIN_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['EXECUTED', 'CANCELLED', 'REJECTED'],
};

export function isValidTransition(from: string, to: string): boolean {
  return VALID_ADMIN_TRANSITIONS[from]?.includes(to) ?? false;
}
