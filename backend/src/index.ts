import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, AppVariables } from './types/index';
import { errorResponse } from './types/index';
import { auth } from './routes/auth';
import { orders } from './routes/orders';
import { admin } from './routes/admin';
import { openApiSpec, generateSwaggerHTML } from './openapi';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return null;
      const allowed = [
        'http://localhost:5173',
        'http://localhost:5175',
        'https://tradedesk.vercel.app',
      ];
      // Allow all Vercel preview deployments
      if (origin.endsWith('.vercel.app')) return origin;
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Retry-After'],
    maxAge: 86400,
    credentials: true,
  })
);

// ─── API Docs (Swagger UI) ────────────────────────────────────────────────────
app.get('/api/docs', (c) => {
  return c.html(generateSwaggerHTML(openApiSpec));
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route('/api/v1/auth', auth);
app.route('/api/v1/orders', orders);
app.route('/api/v1/admin', admin);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json(errorResponse('NOT_FOUND', `Route ${c.req.method} ${c.req.path} not found`), 404);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[TradeDesk] Unhandled error:', err);
  return c.json(
    errorResponse('INTERNAL', 'An unexpected error occurred'),
    500
  );
});

export default app;
