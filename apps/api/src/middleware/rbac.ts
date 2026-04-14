import type { Context, Next } from 'hono';
import type { Env, AppVariables } from '../types/index';
import { errorResponse } from '../types/index';

export function requireRole(role: 'user' | 'admin') {
  return async (
    c: Context<{ Bindings: Env; Variables: AppVariables }>,
    next: Next
  ): Promise<Response | void> => {
    const userRole = c.get('userRole');

    if (role === 'admin' && userRole !== 'admin') {
      return c.json(
        errorResponse('FORBIDDEN', 'This action requires admin privileges'),
        403
      );
    }

    await next();
  };
}
