import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/simple-auth';
import { prisma } from '../config/database';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * Public health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Book Review API',
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Service unavailable'
    });
  }
});

/**
 * Database health check (Admin only)
 */
router.get('/database', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get basic database stats
    const userCount = await prisma.user.count();
    const bookCount = await prisma.book.count();
    const reviewCount = await prisma.review.count();
    
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        stats: {
          users: userCount,
          books: bookCount,
          reviews: reviewCount
        }
      }
    });
  } catch (error) {
    logger.error('Database health check error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Redis health check (Admin only)
 */
router.get('/redis', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    // Test Redis connection
    const redis = getRedisClient();
    await redis.ping();
    
    // Get Redis info
    const info = await redis.info('memory');
    const keyCount = await redis.dbSize();
    
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      redis: {
        connected: true,
        keyCount: keyCount,
        memoryInfo: info
      }
    });
  } catch (error) {
    logger.error('Redis health check error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Redis connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * AI Service health check (Admin only)
 */
router.get('/ai', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return res.status(503).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        ai: {
          connected: false,
          service: 'Google Gemini',
          error: 'API key not configured'
        }
      });
    }

    // Test Gemini API connection
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const result = await model.generateContent('test');
    
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      ai: {
        connected: true,
        service: 'Google Gemini',
        model: 'gemini-1.5-pro',
        apiKeyConfigured: true
      }
    });
  } catch (error) {
    logger.error('AI health check failed:', error);
    return res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      ai: {
        connected: false,
        service: 'Google Gemini',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * System status (Admin only)
 */
router.get('/system', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
    
    return res.json({
      status: 'OK',
      system: systemInfo
    });
  } catch (error) {
    logger.error('System health check error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'System check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Full health check (Admin only)
 */
router.get('/full', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const healthChecks: any = {
      timestamp: new Date().toISOString(),
      services: {}
    };
    
    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.services.database = { status: 'OK', connected: true };
    } catch (error) {
      healthChecks.services.database = { 
        status: 'ERROR', 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
    
    // Check Redis
    try {
      const redis = getRedisClient();
      await redis.ping();
      healthChecks.services.redis = { status: 'OK', connected: true };
    } catch (error) {
      healthChecks.services.redis = { 
        status: 'ERROR', 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
    
    // Check AI Service (Gemini)
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      
      if (!geminiApiKey) {
        healthChecks.services.ai = { 
          status: 'ERROR', 
          connected: false, 
          error: 'API key not configured' 
        };
      } else {
        // Test Gemini API connection
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        
        await model.generateContent('test');
        healthChecks.services.ai = { 
          status: 'OK', 
          connected: true, 
          service: 'Google Gemini',
          model: 'gemini-1.5-pro'
        };
      }
    } catch (error) {
      healthChecks.services.ai = { 
        status: 'ERROR', 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
    
    // Determine overall status
    const allServicesHealthy = Object.values(healthChecks.services).every(
      (service: any) => service.status === 'OK'
    );
    
    return res.status(allServicesHealthy ? 200 : 503).json({
      status: allServicesHealthy ? 'OK' : 'DEGRADED',
      ...healthChecks
    });
  } catch (error) {
    logger.error('Full health check error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
