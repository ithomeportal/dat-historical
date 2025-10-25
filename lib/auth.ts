import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-me'
);

export interface User {
  email: string;
  name: string;
}

// In-memory store for verification codes (use Redis in production)
interface VerificationCode {
  code: string;
  email: string;
  expiresAt: number;
}

const verificationCodes = new Map<string, VerificationCode>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationCodes.entries()) {
    if (value.expiresAt < now) {
      verificationCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function generateVerificationCode(): string {
  // Generate 10-digit code
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function isValidEmail(email: string): boolean {
  const allowedDomain = process.env.ALLOWED_DOMAIN || 'unilinktransportation.com';
  return email.endsWith(`@${allowedDomain}`);
}

export function storeVerificationCode(email: string, code: string): void {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  verificationCodes.set(email, { code, email, expiresAt });
}

export function verifyCode(email: string, code: string): boolean {
  const stored = verificationCodes.get(email);

  if (!stored) {
    return false;
  }

  if (stored.expiresAt < Date.now()) {
    verificationCodes.delete(email);
    return false;
  }

  if (stored.code !== code) {
    return false;
  }

  // Code is valid, remove it
  verificationCodes.delete(email);
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
