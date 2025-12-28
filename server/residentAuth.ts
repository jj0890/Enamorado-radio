import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { IStorage } from './storage';

const RESIDENT_COOKIE = 'radio_resident';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';

// Create secure session token for resident
function createSessionToken(residentId: number, username: string): string {
  const payload = JSON.stringify({
    residentId,
    username,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  });
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

// Verify session token
function verifySessionToken(token: string): { residentId: number; username: string; exp: number } | null {
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

// Resident authentication middleware
export function requireResident(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[RESIDENT_COOKIE];
  
  if (!token) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  const session = verifySessionToken(token);
  if (!session) {
    res.clearCookie(RESIDENT_COOKIE);
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  (req as any).resident = session;
  next();
}

// Login endpoint
export function loginResident(storage: IStorage) {
  return async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'missing credentials' });
    }
    
    // Find resident by username
    const resident = await storage.getResidentByUsername(username.trim());
    
    if (!resident) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    
    // Check if resident is active
    if (!resident.isActive) {
      return res.status(403).json({ error: 'account disabled' });
    }
    
    // Verify password (currently plaintext - TODO: hash in production)
    if (resident.password !== password.trim()) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    
    const token = createSessionToken(resident.id, resident.username);
    res.cookie(RESIDENT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ ok: true });
  };
}

// Logout endpoint
export function logoutResident(_req: Request, res: Response) {
  res.clearCookie(RESIDENT_COOKIE);
  res.json({ ok: true });
}

// Check if resident is already authenticated
export function checkResidentAuth(storage: IStorage) {
  return async (req: Request, res: Response) => {
    const token = req.cookies?.[RESIDENT_COOKIE];
    
    if (!token) {
      return res.json({ authenticated: false });
    }
    
    const session = verifySessionToken(token);
    if (!session) {
      res.clearCookie(RESIDENT_COOKIE);
      return res.json({ authenticated: false });
    }
    
    // Verify resident still exists and is active
    const resident = await storage.getResidentById(session.residentId);
    if (!resident || !resident.isActive) {
      res.clearCookie(RESIDENT_COOKIE);
      return res.json({ authenticated: false });
    }
    
    res.json({ 
      authenticated: true, 
      residentId: resident.id,
      username: resident.username,
      displayName: resident.displayName,
      showTitle: resident.showTitle
    });
  };
}
