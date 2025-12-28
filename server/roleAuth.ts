// Role-based access control system
import { Request, Response, NextFunction } from 'express';
import { requireAdmin } from './adminAuth';

// Role hierarchy definition
export const roleHierarchy = {
  viewer: 0,      // Read-only admin access
  contributor: 1, // Can create drafts they own
  editor: 2,      // Can review/approve, manage Albums
  admin: 3        // Full system access
} as const;

export type UserRole = keyof typeof roleHierarchy;

export interface AuthenticatedUser {
  id: number;
  username: string;
  role: UserRole;
}

/**
 * Middleware to require minimum role level
 * Usage: app.get('/admin/albums', requireRole('editor'), handler)
 * 
 * Checks user role from session token and validates against required role level.
 */
export function requireRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    // First, check admin authentication using the same system as requireAdmin
    requireAdmin(req, res, () => {
      // If we reach here, admin is authenticated
      const admin = (req as any).admin;
      
      if (!admin) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'You must be logged in to access this resource'
        });
      }
      
      // Get user role from session (now stored in session token)
      const userRole: UserRole = (admin.role || 'admin') as UserRole;
      const userRoleLevel = roleHierarchy[userRole];
      const requiredRoleLevel = roleHierarchy[minRole];
      
      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: minRole,
          current: userRole,
          message: `This action requires ${minRole} role or higher`
        });
      }
      
      // Store user info for later use in handlers
      (req as any).user = {
        username: admin.user,
        role: userRole
      };
      
      next();
    });
  };
}

/**
 * Check if user can edit specific content
 */
export function canEditContent(user: AuthenticatedUser, content: { createdBy?: number }): boolean {
  // Admins and editors can edit anything
  if (user.role === 'admin' || user.role === 'editor') return true;
  
  // Contributors can only edit their own content
  if (user.role === 'contributor' && content.createdBy === user.id) return true;
  
  return false;
}

/**
 * Check if user can publish content
 */
export function canPublish(user: AuthenticatedUser): boolean {
  return user.role === 'editor' || user.role === 'admin';
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(user: AuthenticatedUser): boolean {
  return user.role === 'admin';
}

/**
 * Check if user can vote on album suggestions
 */
export function canVoteOnAlbums(user: AuthenticatedUser): boolean {
  return user.role === 'editor' || user.role === 'admin';
}
