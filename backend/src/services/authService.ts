import bcrypt from 'bcryptjs';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import {
  findUserByEmail,
  createUser,
  findUserById,
} from '../db/client';
import type { User, JWTPayload } from '../types/index';

const BCRYPT_ROUNDS = 12;

// ─── JWT Helpers ──────────────────────────────────────────────────────────────

function base64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signJWT(payload: Omit<JWTPayload, 'iat'>, secret: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const fullPayload = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const body = base64url(JSON.stringify(fullPayload));
  const encoder = new TextEncoder();

  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(`${header}.${body}`)
  );

  const signature = base64url(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  return `${header}.${body}.${signature}`;
}

function generateJTI(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export async function registerUser(
  db: D1Database,
  email: string,
  password: string,
  jwtSecret: string,
  jwtExpiry: string
): Promise<{ token: string; user: Omit<User, 'password'> }> {
  const existing = await findUserByEmail(db, email);
  if (existing) {
    const err = Object.assign(new Error('Email already registered'), { statusCode: 409 });
    throw err;
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await createUser(db, email, hashed);
  const expirySeconds = parseInt(jwtExpiry, 10);

  const payload: Omit<JWTPayload, 'iat'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    jti: generateJTI(),
    exp: Math.floor(Date.now() / 1000) + expirySeconds,
  };

  const token = await signJWT(payload, jwtSecret);

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, created_at: user.created_at },
  };
}

export async function loginUser(
  db: D1Database,
  email: string,
  password: string,
  jwtSecret: string,
  jwtExpiry: string
): Promise<{ token: string; user: Omit<User, 'password'> }> {
  // Always run bcrypt compare to prevent timing attacks
  const user = await findUserByEmail(db, email);
  const dummyHash = '$2a$12$invaliddummyhashfortimingnormalization000000000000000';
  const isMatch = await bcrypt.compare(password, user?.password ?? dummyHash);

  if (!user || !isMatch) {
    const err = Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    throw err;
  }

  const expirySeconds = parseInt(jwtExpiry, 10);

  const payload: Omit<JWTPayload, 'iat'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    jti: generateJTI(),
    exp: Math.floor(Date.now() / 1000) + expirySeconds,
  };

  const token = await signJWT(payload, jwtSecret);

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, created_at: user.created_at },
  };
}

export async function logoutUser(
  kv: KVNamespace,
  jti: string,
  exp: number
): Promise<void> {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await kv.put(`blacklist:${jti}`, '1', { expirationTtl: ttl });
  }
}

export { findUserById };
