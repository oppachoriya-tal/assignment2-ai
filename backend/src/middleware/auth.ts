import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';
import { AuthService } from '../services/authService';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Authentication middleware
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Check if token is blacklisted
      const isBlacklisted = await AuthService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        res.status(401).json({
          success: false,
          message: 'Token has been revoked',
        });
        return;
      }

      const payload = JWTService.verifyAccessToken(token);
      
      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        }
      });

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
        return;
      }

      // Add user to request object
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const payload = JWTService.verifyAccessToken(token);
        
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          }
        });

        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        }
      } catch (error) {
        // Token is invalid, but we continue without authentication
        logger.warn('Invalid token in optional auth:', error);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
};

/**
 * Authorization middleware for specific roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Check if user owns the resource
 */
export const checkOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Check if user is admin (admins can access everything)
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (resourceUserId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You can only access your own resources',
      });
      return;
    }

    next();
  };
};
