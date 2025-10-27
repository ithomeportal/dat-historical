import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import pool from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-me'
);

export interface User {
  email: string;
  name: string;
}

export function generateVerificationCode(): string {
  // Generate 10-digit code
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function isValidEmail(email: string): boolean {
  const allowedDomain = process.env.ALLOWED_DOMAIN || 'unilinktransportation.com';
  return email.endsWith(`@${allowedDomain}`);
}

export async function storeVerificationCode(email: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Insert or update verification code for this email
  await pool.query(
    `INSERT INTO verification_codes (email, code, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (email)
     DO UPDATE SET code = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
    [email, code, expiresAt]
  );
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  // Get the verification code from database
  const result = await pool.query(
    'SELECT code, expires_at FROM verification_codes WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const stored = result.rows[0];

  // Check if expired
  if (new Date(stored.expires_at) < new Date()) {
    // Delete expired code
    await pool.query('DELETE FROM verification_codes WHERE email = $1', [email]);
    return false;
  }

  // Check if code matches
  if (stored.code !== code) {
    return false;
  }

  // Code is valid, remove it from database
  await pool.query('DELETE FROM verification_codes WHERE email = $1', [email]);
  return true;
}

export async function createSession(user: User) {
  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload;

    // Validate payload has required fields
    if (typeof payload.email === 'string' && typeof payload.name === 'string') {
      return { email: payload.email, name: payload.name };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
