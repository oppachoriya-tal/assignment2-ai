import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const router = Router();

// Simple in-memory user store for demo purposes
const demoUsers = [
  { id: 'admin-1', email: 'admin@bookreview.com', password: 'admin123', role: 'admin' },
  { id: 'user-1', email: 'user@bookreview.com', password: 'user123', role: 'user' },
  { id: 'guest-1', email: 'guest@bookreview.com', password: 'guest123', role: 'guest' }
];

/**
 * Simple login endpoint for demo purposes
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }
    
    // Generate simple token (in real app, use JWT)
    logger.info(`Creating token for user ID: ${user.id}`);
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');
    
    logger.info(`User ${email} logged in with role ${user.role}`);
    
    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token: token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Verify token endpoint
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired
      if (decoded.exp && Date.now() > decoded.exp) {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      
      // Find user
      const user = demoUsers.find(u => u.id === decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get user info endpoint
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header required'
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired
      if (decoded.exp && Date.now() > decoded.exp) {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      
      // Find user
      const user = demoUsers.find(u => u.id === decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Get user info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
