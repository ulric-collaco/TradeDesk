import { Hono } from 'hono';
import type { Env, AppVariables } from '../types/index';
import { RegisterSchema, LoginSchema, successResponse, errorResponse } from '../types/index';
import { authRateLimit } from '../middleware/rateLimit';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerUser, loginUser, logoutUser } from '../services/authService';

const auth = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// POST /api/v1/auth/register
auth.post(
  '/register',
  authRateLimit as never,
  validate(RegisterSchema),
  async (c) => {
    const { email, password } = c.get('validatedBody' as never) as { email: string; password: string };

    try {
      const result = await registerUser(
        c.env.DB,
        email,
        password,
        c.env.JWT_SECRET,
        c.env.JWT_EXPIRY
      );
      return c.json(successResponse(result), 201);
    } catch (err) {
      const e = err as { statusCode?: number; message: string };
      if (e.statusCode === 409) {
        return c.json(errorResponse('CONFLICT', e.message), 409);
      }
      return c.json(errorResponse('INTERNAL', 'Registration failed'), 500);
    }
  }
);

// POST /api/v1/auth/login
auth.post(
  '/login',
  authRateLimit as never,
  validate(LoginSchema),
  async (c) => {
    const { email, password } = c.get('validatedBody' as never) as { email: string; password: string };

    try {
      const result = await loginUser(
        c.env.DB,
        email,
        password,
        c.env.JWT_SECRET,
        c.env.JWT_EXPIRY
      );
      return c.json(successResponse(result), 200);
    } catch (err) {
      const e = err as { statusCode?: number; message: string };
      if (e.statusCode === 401) {
        return c.json(errorResponse('UNAUTHORIZED', 'Invalid credentials'), 401);
      }
      return c.json(errorResponse('INTERNAL', 'Login failed'), 500);
    }
  }
);

// POST /api/v1/auth/logout
auth.post('/logout', authMiddleware as never, async (c) => {
  const jti = c.get('jti');

  // Decode exp from token header (already verified by middleware)
  const authHeader = c.req.header('Authorization') ?? '';
  const token = authHeader.slice(7);
  const payloadPart = token.split('.')[1];
  const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));

  await logoutUser(c.env.KV, jti, payload.exp as number);
  return c.json(successResponse({ message: 'Logged out successfully' }), 200);
});

export { auth };
