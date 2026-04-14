import type { Context, Next } from 'hono';
import type { ZodSchema, ZodError } from 'zod';
import type { Env, AppVariables } from '../types/index';
import { errorResponse } from '../types/index';

export function validate<T>(schema: ZodSchema<T>, source: 'json' | 'query' = 'json') {
  return async (
    c: Context<{ Bindings: Env; Variables: AppVariables }>,
    next: Next
  ): Promise<Response | void> => {
    try {
      let data: unknown;
      if (source === 'json') {
        data = await c.req.json();
      } else {
        data = c.req.query();
      }

      const result = schema.safeParse(data);
      if (!result.success) {
        const zodError = result.error as ZodError;
        const details = zodError.errors.reduce<Record<string, string>>((acc, e) => {
          const key = e.path.join('.') || 'root';
          acc[key] = e.message;
          return acc;
        }, {});

        return c.json(
          errorResponse('VALIDATION_ERROR', 'Request validation failed', details),
          400
        );
      }

      // Store parsed/coerced data for handler use
      c.set('validatedBody' as never, result.data);
      await next();
    } catch {
      return c.json(
        errorResponse('VALIDATION_ERROR', 'Invalid request body — expected JSON'),
        400
      );
    }
  };
}
