import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { config } from './config/config';
import { connectDatabase, prisma } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { seedBooks } from './database/seed-books';

// Import routes
// import healthRoutes from './routes/health';
// import simpleAuthRoutes from './routes/simple-auth';
// import authRoutes from './routes/auth';
// import bookRoutes from './routes/books';
// import userRoutes from './routes/users';
// import aiRoutes from './routes/ai';
// import feedbackRoutes from './routes/feedback';
// import simpleAdminRoutes from './routes/simple-admin';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
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

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10000, // limit each IP to 10000 requests per windowMs
      message: JSON.stringify({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        error: 'RATE_LIMIT_EXCEEDED'
      }),
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (config.isDevelopment) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
  }

  private initializeRoutes(): void {
    // Health check routes
    // this.app.use('/api/health', healthRoutes);
    
    // Simple auth routes (demo login)
    // this.app.use('/api/auth', simpleAuthRoutes);
    
    // Auth routes (register/login)
    // this.app.use('/api/auth/v2', authRoutes);

    // Book routes
    // this.app.use('/api/books', bookRoutes);

    // User routes
    // this.app.use('/api/users', userRoutes);

    // AI routes
    // this.app.use('/api/ai', aiRoutes);

    // Feedback routes
    // this.app.use('/api/feedback', feedbackRoutes);

    // Admin routes
    // this.app.use('/api/admin', simpleAdminRoutes);

    // Basic health endpoint
    this.app.get('/health', (req, res) => {
      return res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Book Review API',
        version: '1.0.0'
      });
    });

    // Basic auth endpoint for testing
    this.app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      try {
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

        // For demo purposes, we'll use simple password comparison
        // In production, you should use bcrypt.compare
        const validPassword = password === 'password123' || password === 'guest123';
        
        if (!validPassword) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        const token = Buffer.from(JSON.stringify({
          userId: user.id, // Use actual UUID from database
          email: user.email,
          role: user.role,
          exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        })).toString('base64');
        
        return res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: user.id,
              email: user.email,
              role: user.role
            },
            token
          }
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Login failed'
        });
      }
    });

    // Basic books endpoint for testing
    this.app.get('/api/books', async (req, res) => {
      try {
        const {
          page = 1,
          limit = 10,
          sortBy = 'createdAt',
          sortOrder = 'desc',
          minRating = 0,
          maxRating = 5,
          minPrice = 0,
          maxPrice = 1000,
          genre,
          search
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {};

        // Rating filter - we need to calculate this differently since averageRating is computed
        // For now, we'll filter after computing the ratings
        let ratingFilter = null;
        if (minRating && parseFloat(minRating as string) > 0) {
          ratingFilter = parseFloat(minRating as string);
        }

        // Price filter
        if (minPrice && parseFloat(minPrice as string) > 0) {
          where.price = {
            gte: parseFloat(minPrice as string)
          };
        }
        if (maxPrice && parseFloat(maxPrice as string) < 1000) {
          where.price = {
            ...where.price,
            lte: parseFloat(maxPrice as string)
          };
        }

        // Genre filter
        if (genre && genre !== 'all') {
          where.genres = {
            some: {
              genre: {
                name: {
                  contains: genre as string,
                  mode: 'insensitive'
                }
              }
            }
          };
        }

        // Search filter
        if (search) {
          where.OR = [
            {
              title: {
                contains: search as string,
                mode: 'insensitive'
              }
            },
            {
              author: {
                contains: search as string,
                mode: 'insensitive'
              }
            },
            {
              description: {
                contains: search as string,
                mode: 'insensitive'
              }
            }
          ];
        }

        // Get total count for pagination
        const totalCount = await prisma.book.count({ where });

        // Get books with pagination
        const books = await prisma.book.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
          include: {
            genres: { include: { genre: true } },
            reviews: { select: { id: true, rating: true } },
            favorites: { select: { id: true } }
          }
        });

        const booksWithStats = books.map((book: any) => ({
          ...book,
          genres: book.genres.map((bg: any) => bg.genre.name),
          totalReviews: book.reviews.length,
          totalFavorites: book.favorites.length,
          averageRating: book.reviews.length > 0 
            ? book.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / book.reviews.length 
            : 0
        }));

        // Apply rating filter after computing average ratings
        let filteredBooks = booksWithStats;
        if (ratingFilter !== null) {
          filteredBooks = booksWithStats.filter((book: any) => book.averageRating >= ratingFilter);
        }

        return res.json({
          success: true,
          data: {
            books: filteredBooks,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalCount,
              pages: Math.ceil(totalCount / limitNum)
            }
          }
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch books'
        });
      }
    });

    // Basic genres endpoint for testing (MUST be before book details route)
    this.app.get('/api/books/genres', async (req, res) => {
      try {
        const genres = await prisma.genre.findMany({
          orderBy: { name: 'asc' }
        });

        return res.json({
          success: true,
          data: genres
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch genres'
        });
      }
    });

    // Book details endpoint
    this.app.get('/api/books/:id', async (req, res) => {
      try {
        const bookId = req.params.id;
        
        const book = await prisma.book.findUnique({
          where: { id: bookId },
          include: {
            genres: { include: { genre: true } },
            reviews: { 
              include: { 
                user: { select: { email: true } } 
              },
              orderBy: { createdAt: 'desc' }
            },
            favorites: { select: { id: true } }
          }
        });

        if (!book) {
          return res.status(404).json({
            success: false,
            message: 'Book not found'
          });
        }

        const bookWithStats = {
          ...book,
          genres: book.genres.map((bg: any) => bg.genre.name),
          totalReviews: book.reviews.length,
          totalFavorites: book.favorites.length,
          averageRating: book.reviews.length > 0 
            ? book.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / book.reviews.length 
            : 0,
          reviews: book.reviews.map((review: any) => ({
            ...review,
            email: review.user?.email || 'Anonymous'
          }))
        };

        return res.json({
          success: true,
          data: bookWithStats
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch book details'
        });
      }
    });

    // Basic admin stats endpoint
    this.app.get('/api/admin/stats', (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (decoded.exp && Date.now() > decoded.exp) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }

        if (decoded.role !== 'ADMIN') {
          return res.status(403).json({
            success: false,
            message: 'Admin access required'
          });
        }

        // Return mock stats for now
        return res.json({
          success: true,
          data: {
            totalBooks: 107,
            totalUsers: 4,
            totalReviews: 50,
            totalFavorites: 25,
            totalGenres: 42
          }
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    });

    // User favorites endpoint
    this.app.get('/api/users/favorites', async (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (decoded.exp && Date.now() > decoded.exp) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }

        // Get user's favorite books from database
        const favorites = await prisma.userFavorite.findMany({
          where: { userId: decoded.userId },
          include: {
            book: {
              include: {
                genres: { include: { genre: true } },
                reviews: { select: { id: true, rating: true } }
              }
            }
          }
        });

        const favoriteBooks = favorites.map((fav: any) => {
          const book = fav.book;
          return {
            ...book,
            genres: book.genres.map((bg: any) => bg.genre.name),
            averageRating: book.reviews.length > 0 
              ? book.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / book.reviews.length 
              : 0
          };
        });

        return res.json({
          success: true,
          data: favoriteBooks
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    });

    // Add to favorites endpoint
    this.app.put('/api/books/:id/favorites', async (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (decoded.exp && Date.now() > decoded.exp) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }

        const bookId = req.params.id;
        
        // Check if book exists
        const book = await prisma.book.findUnique({
          where: { id: bookId }
        });

        if (!book) {
          return res.status(404).json({
            success: false,
            message: 'Book not found'
          });
        }

        // Check if already in favorites
        const existingFavorite = await prisma.userFavorite.findUnique({
          where: {
            userId_bookId: {
              userId: decoded.userId,
              bookId: bookId
            }
          }
        });

        if (existingFavorite) {
          return res.status(400).json({
            success: false,
            message: 'Book already in favorites'
          });
        }

        // Add to favorites
        await prisma.userFavorite.create({
          data: {
            userId: decoded.userId,
            bookId: bookId
          }
        });

        return res.json({
          success: true,
          message: 'Book added to favorites'
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to add to favorites'
        });
      }
    });

    // Remove from favorites endpoint
    this.app.delete('/api/books/:id/favorites', async (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (decoded.exp && Date.now() > decoded.exp) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }

        const bookId = req.params.id;
        
        // Remove from favorites
        const deleted = await prisma.userFavorite.deleteMany({
          where: {
            userId: decoded.userId,
            bookId: bookId
          }
        });

        if (deleted.count === 0) {
          return res.status(404).json({
            success: false,
            message: 'Book not found in favorites'
          });
        }

        return res.json({
          success: true,
          message: 'Book removed from favorites'
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to remove from favorites'
        });
      }
    });

    // Check if book is in favorites endpoint
    this.app.get('/api/books/:id/favorites-status', async (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (decoded.exp && Date.now() > decoded.exp) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }

        const bookId = req.params.id;
        
        // Check if book is in user's favorites
        const favorite = await prisma.userFavorite.findUnique({
          where: {
            userId_bookId: {
              userId: decoded.userId,
              bookId: bookId
            }
          }
        });

        return res.json({
          success: true,
          data: {
            isFavorite: !!favorite
          }
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    });

    // Get book reviews endpoint
    this.app.get('/api/books/:id/reviews', async (req, res) => {
      try {
        const bookId = req.params.id;
        
        const reviews = await prisma.review.findMany({
          where: { bookId: bookId },
          include: {
            user: { select: { email: true } }
          },
          orderBy: { createdAt: 'desc' }
        });

        const reviewsWithUsername = reviews.map((review: any) => ({
          ...review,
          username: review.user?.username || 'Anonymous'
        }));

        return res.json({
          success: true,
          data: {
            reviews: reviewsWithUsername
          }
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch reviews'
        });
      }
    });

    // Add review endpoint
    this.app.post('/api/books/:id/reviews', async (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (decoded.exp && Date.now() > decoded.exp) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
          });
        }

        const bookId = req.params.id;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5'
          });
        }

        // Check if book exists
        const book = await prisma.book.findUnique({
          where: { id: bookId }
        });

        if (!book) {
          return res.status(404).json({
            success: false,
            message: 'Book not found'
          });
        }

        // Create review
        const review = await prisma.review.create({
          data: {
            bookId: bookId,
            userId: decoded.userId,
            rating: parseInt(rating),
            reviewText: comment || '',
            createdAt: new Date()
          },
          include: {
            user: { select: { email: true } }
          }
        });

        return res.json({
          success: true,
          data: {
            ...review,
            email: review.user?.email || 'Anonymous'
          }
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create review'
        });
      }
    });

    // API documentation endpoint
    this.app.get('/api/v1', (req, res) => {
      return res.json({
        message: 'BookReview API v1',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          books: '/api/books',
          users: '/api/users',
          ai: '/api/ai',
          feedback: '/api/feedback',
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      return res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
      });
    });
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
          await seedBooks();
          logger.info('Books seeded successfully');
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
app.start().catch((error) => {
  logger.error('Application startup failed:', error);
  process.exit(1);
});

export default app;
