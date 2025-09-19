import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

const ADMIN_COOKIE = 'radio_admin';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';
const ADMIN_USER = (process.env.ADMIN_USER || 'admin').trim();
const ADMIN_PASS = (process.env.ADMIN_PASS || 'change-me').trim();

// Validate admin credentials on startup
export function validateAdminCredentials() {
  if (ADMIN_USER === 'admin' && ADMIN_PASS === 'change-me') {
    console.warn('⚠️  WARNING: Using default admin credentials! Set ADMIN_USER and ADMIN_PASS environment variables.');
  }
  console.log(`✅ Admin system initialized for user: ${ADMIN_USER}`);
}

// Create secure session token
function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    user: username,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  });
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

// Verify session token
function verifySessionToken(token: string): { user: string; exp: number } | null {
  try {
    const { payload, signature } = JSON.parse(Buffer.from(token, 'base64').toString());
    const expectedSignature = createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64');
    
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    
    const data = JSON.parse(payload);
    if (Date.now() > data.exp) {
      return null; // Expired
    }
    
    return data;
  } catch {
    return null;
  }
}

// Validate credentials with timing-safe comparison
export function validateCredentials(username: string, password: string): boolean {
  // Trim inputs to avoid whitespace issues
  const trimmedUser = username.trim();
  const trimmedPass = password.trim();
  
  // Secure comparison
  const validUser = trimmedUser === ADMIN_USER;
  const validPass = trimmedPass === ADMIN_PASS;
  
  return validUser && validPass;
}

// Admin authentication middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ADMIN_COOKIE];
  
  if (!token) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  const session = verifySessionToken(token);
  if (!session) {
    res.clearCookie(ADMIN_COOKIE);
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  (req as any).admin = session;
  next();
}

// Login endpoint
export function loginAdmin(req: Request, res: Response) {
  const { username, password } = req.body;
  
  if (!validateCredentials(username, password)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  
  const token = createSessionToken(username);
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json({ ok: true });
}

// Logout endpoint
export function logoutAdmin(_req: Request, res: Response) {
  res.clearCookie(ADMIN_COOKIE);
  res.json({ ok: true });
}

// Check if user is already authenticated
export function checkAuth(req: Request, res: Response) {
  const token = req.cookies?.[ADMIN_COOKIE];
  
  if (!token) {
    return res.json({ authenticated: false });
  }
  
  const session = verifySessionToken(token);
  if (!session) {
    res.clearCookie(ADMIN_COOKIE);
    return res.json({ authenticated: false });
  }
  
  res.json({ authenticated: true, user: session.user });
}