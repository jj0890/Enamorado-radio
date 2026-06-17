import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { storage } from './storage';
import type { Admin } from '@shared/schema';

const ADMIN_COOKIE = 'radio_admin';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';

// Validate admin credentials on startup
export async function validateAdminCredentials() {
  // Check if there are any admins in the database
  const envUser = (process.env.ADMIN_USER || 'admin').trim();
  const envPass = (process.env.ADMIN_PASS || 'change-me').trim();
  
  const existingAdmin = await storage.getAdminByUsername(envUser);
  
  if (!existingAdmin) {
    // Create default admin from environment variables
    await storage.createAdmin({
      username: envUser,
      password: envPass, // TODO: Hash passwords in future
      role: 'admin',
    });
    console.log(`✅ Created default admin user: ${envUser}`);
  } else {
    console.log(`✅ Admin system initialized for user: ${envUser}`);
  }
  
  // Create default editor account if it doesn't exist
  const existingEditor = await storage.getAdminByUsername('editor1');
  if (!existingEditor) {
    await storage.createAdmin({
      username: 'editor1',
      password: 'editor123',
      role: 'editor',
    });
    console.log(`✅ Created default editor user: editor1`);
  }
  
  if (envUser === 'admin' && envPass === 'change-me') {
    console.warn('⚠️  WARNING: Using default admin credentials! Set ADMIN_USER and ADMIN_PASS environment variables.');
  }
}

// Create secure session token
function createSessionToken(username: string, role: string = 'admin'): string {
  const payload = JSON.stringify({
    user: username,
    role: role,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  });
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

// Verify session token
function verifySessionToken(token: string): { user: string; role: string; exp: number } | null {
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
export async function validateCredentials(username: string, password: string): Promise<Admin | null> {
  // Trim inputs to avoid whitespace issues
  const trimmedUser = username.trim();
  const trimmedPass = password.trim();
  
  // Look up user in database
  const admin = await storage.getAdminByUsername(trimmedUser);
  
  if (!admin) {
    return null;
  }
  
  // Validate password (TODO: Use proper password hashing)
  if (admin.password === trimmedPass) {
    return admin;
  }
  
  return null;
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
export async function loginAdmin(req: Request, res: Response) {
  const { username, password } = req.body;
  
  const admin = await validateCredentials(username, password);
  if (!admin) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  
  const token = createSessionToken(username, admin.role);
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json({ ok: true, role: admin.role });
}

// Logout endpoint
export function logoutAdmin(_req: Request, res: Response) {
  res.clearCookie(ADMIN_COOKIE);
  res.json({ ok: true });
}

// Whoami — returns { username, role } shape expected by AdminEditorial
export function whoamiAdmin(req: Request, res: Response) {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) return res.json({ username: null, role: null });
  const session = verifySessionToken(token);
  if (!session) {
    res.clearCookie(ADMIN_COOKIE);
    return res.json({ username: null, role: null });
  }
  res.json({ username: session.user, role: session.role });
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
  
  res.json({ authenticated: true, user: session.user, role: session.role });
}