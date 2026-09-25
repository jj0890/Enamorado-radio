import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import { db } from './db';
import { users, userProfiles, insertUserSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';

const USER_COOKIE = 'radio_user';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';

// ─── Password helpers ─────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, 'hex');
  const derivedHash = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, derivedHash);
}

// ─── Session helpers ──────────────────────────────────────────────────────────

function createToken(userId: number, role: string): string {
  const payload = JSON.stringify({ id: userId, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const sig = createHmac('sha256', SESSION_SECRET).update(payload).digest('base64');
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64');
}

function verifyToken(token: string): { id: number; role: string } | null {
  try {
    const { payload, sig } = JSON.parse(Buffer.from(token, 'base64').toString());
    const expected = createHmac('sha256', SESSION_SECRET).update(payload).digest('base64');
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(payload);
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[USER_COOKIE];
  if (!token) return res.status(401).json({ error: 'not authenticated' });
  const session = verifyToken(token);
  if (!session) {
    res.clearCookie(USER_COOKIE);
    return res.status(401).json({ error: 'session expired' });
  }
  (req as any).userId = session.id;
  (req as any).userRole = session.role;
  next();
}

export function optionalUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[USER_COOKIE];
  if (token) {
    const session = verifyToken(token);
    if (session) {
      (req as any).userId = session.id;
      (req as any).userRole = session.role;
    }
  }
  next();
}

export function requireModerator(req: Request, res: Response, next: NextFunction) {
  requireUser(req, res, () => {
    if ((req as any).userRole !== 'moderator') {
      return res.status(403).json({ error: 'moderator only' });
    }
    next();
  });
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function signupHandler(req: Request, res: Response) {
  const parsed = insertUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'invalid input' });
  }
  const { email, password, handle, displayName } = parsed.data;

  const existing = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  if (existing.length) return res.status(409).json({ error: 'email already registered' });

  const handleTaken = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.handle, handle.toLowerCase()))
    .limit(1);
  if (handleTaken.length) return res.status(409).json({ error: 'handle already taken' });

  const [user] = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    handle: handle.toLowerCase(),
    displayName,
    role: 'member',
  }).returning();

  await db.insert(userProfiles).values({ userId: user.id });

  const token = createToken(user.id, user.role);
  res.cookie(USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ ok: true, user: { id: user.id, handle: user.handle, displayName: user.displayName, role: user.role } });
}

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const [user] = await db.select().from(users).where(eq(users.email, (email as string).toLowerCase())).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = createToken(user.id, user.role);
  res.cookie(USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ ok: true, user: { id: user.id, handle: user.handle, displayName: user.displayName, role: user.role } });
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie(USER_COOKIE);
  res.json({ ok: true });
}

export async function meHandler(req: Request, res: Response) {
  const token = req.cookies?.[USER_COOKIE];
  if (!token) return res.json({ user: null });
  const session = verifyToken(token);
  if (!session) return res.json({ user: null });

  const [user] = await db.select({
    id: users.id, handle: users.handle, displayName: users.displayName,
    email: users.email, role: users.role, createdAt: users.createdAt,
  }).from(users).where(eq(users.id, session.id)).limit(1);

  if (!user) return res.json({ user: null });
  res.json({ user });
}
