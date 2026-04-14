import type { Context, Next } from 'hono';
import type { Env, AppVariables, JWTPayload } from '../types/index';
import { errorResponse } from '../types/index';

// Simple JWT decode/verify without external library to stay Workers-compatible
async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT structure');

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify signature using Web Crypto API (available in Workers)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = Uint8Array.from(
    atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0)
  );

  const valid = await crypto.subtle.verify('HMAC', cryptoKey, signature, data);
  if (!valid) throw new Error('Invalid signature');

  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

  if (!payload.exp || Date.now() / 1000 > payload.exp) {
    throw new Error('Token expired');
  }

  return payload as JWTPayload;
}

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next
): Promise<Response> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(errorResponse('UNAUTHORIZED', 'Missing or invalid Authorization header'), 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    // Check KV blacklist
    const blacklisted = await c.env.KV.get(`blacklist:${payload.jti}`);
    if (blacklisted !== null) {
      return c.json(errorResponse('UNAUTHORIZED', 'Token has been revoked'), 401);
    }

    c.set('userId', payload.sub);
    c.set('userEmail', payload.email);
    c.set('userRole', payload.role);
    c.set('jti', payload.jti);

    await next();
    return c.res;
  } catch (err) {
    return c.json(errorResponse('UNAUTHORIZED', 'Invalid or expired token'), 401);
  }
}
