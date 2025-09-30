import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { logger } from './utils/logger';
import { config } from './config/config';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { setupSwagger } from './swagger/swagger';
import { seedBooks } from './database/seed-books';
import { prisma } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import bookRoutes from './routes/books';
import enhancedBookRoutes from './routes/enhancedBooks';
import reviewRoutes from './routes/reviews';
import genreRoutes from './routes/genres';
import recommendationRoutes from './routes/recommendations';
import communityRoutes from './routes/community';
import moderationRoutes from './routes/moderation';
import healthRoutes from './routes/health';
import simpleAuthRoutes from './routes/simple-auth';
import aiRoutes from './routes/ai';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    // Permissive CORS for demo: allow all origins and headers, no credentials
    this.app.use(cors({ origin: '*', credentials: false }));
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', '*');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      return next();
    });

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    this.app.use(morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
      });
    });
  }

  private initializeRoutes(): void {
    // Setup Swagger documentation
    // setupSwagger(this.app);

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/books', bookRoutes);
    this.app.use('/api/v1/books', enhancedBookRoutes);
    this.app.use('/api/v1/reviews', reviewRoutes);
    this.app.use('/api/v1/genres', genreRoutes);
    this.app.use('/api/v1/recommendations', recommendationRoutes);
    // this.app.use('/api/v1/community', communityRoutes);
    // this.app.use('/api/v1/moderation', moderationRoutes);
    this.app.use('/api/health', healthRoutes);
    this.app.use('/api/auth', simpleAuthRoutes);
    this.app.use('/api/ai', aiRoutes);

    // API documentation endpoint
    this.app.get('/api/v1', (req, res) => {
      res.json({
        message: 'BookReview API v1',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          books: '/api/v1/books',
          enhancedBooks: '/api/v1/books/advanced',
          reviews: '/api/v1/reviews',
          genres: '/api/v1/genres',
          recommendations: '/api/v1/recommendations',
          ai: '/api/ai',
          community: '/api/v1/community',
          moderation: '/api/v1/moderation',
          health: '/api/health',
          swagger: '/api-docs'
        },
        features: {
          authentication: 'JWT-based authentication without email verification',
          aiRecommendations: 'AI-powered personalized book recommendations',
          community: 'User interactions, discussions, and social features',
          moderation: 'Admin panel for content and user management',
          enhancedBooks: 'Advanced book filtering and AI-powered features',
          swaggerDocs: 'Interactive API documentation'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      logger.info('Database connected successfully');

      // Connect to Redis
      await connectRedis();
      logger.info('Redis connected successfully');

      // Seed books if database is empty
      try {
        const bookCount = await prisma.book.count();
        if (bookCount === 0) {
          logger.info('Database is empty, seeding books...');
          await seedBooks();
          logger.info('Books seeded successfully');
        } else {
          logger.info(`Database already has ${bookCount} books`);
        }
      } catch (error) {
        logger.warn('Database tables not found, skipping book seeding. Run migrations first.');
        logger.warn('Error:', error instanceof Error ? error.message : 'Unknown error');
      }

      // Start server
      this.app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`API Documentation: http://localhost:${config.port}/api/v1`);
      });
      return;
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create and start the application
const app = new App();
app.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
