// Role-based access control system
import { Request, Response, NextFunction } from 'express';

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
 */
export function requireRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthenticatedUser | undefined;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    const userRoleLevel = roleHierarchy[user.role] ?? -1;
    const requiredRoleLevel = roleHierarchy[minRole];
    
    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: minRole,
        current: user.role,
        message: `This action requires ${minRole} role or higher`
      });
    }
    
    next();
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
