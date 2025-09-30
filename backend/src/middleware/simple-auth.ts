import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

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

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Decode the base64 token
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired
      if (decoded.exp && Date.now() > decoded.exp) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Find user in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Add user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      return next();
    } catch (error) {
      logger.error('Token decode error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (decoded.exp && Date.now() > decoded.exp) {
          return next(); // Token expired, continue without auth
        }

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            role: true
          }
        });

        if (user) {
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

    return next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    return next();
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