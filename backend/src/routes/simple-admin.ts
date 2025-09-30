import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// Simple admin middleware
const requireAdmin = (req: Request, res: Response, next: Function) => {
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

    req.user = { id: decoded.userId, email: '', role: decoded.role };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Get admin stats
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const [totalBooks, totalUsers, totalReviews, totalFavorites, totalGenres] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.review.count(),
      prisma.userFavorite.count(),
      prisma.genre.count()
    ]);

    res.json({
      success: true,
      data: {
        totalBooks,
        totalUsers,
        totalReviews,
        totalFavorites,
        totalGenres
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get admin books
router.get('/books', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
          reviews: { select: { id: true, rating: true } },
          favorites: { select: { id: true } }
        }
      }),
      prisma.book.count()
    ]);

    const booksWithStats = books.map((book: any) => ({
      ...book,
      genres: book.genres.map((bg: any) => bg.genre.name),
      totalReviews: book.reviews.length,
      totalFavorites: book.favorites.length,
      averageRating: book.reviews.length > 0 
        ? book.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / book.reviews.length 
        : 0
    }));

    res.json({
      success: true,
      data: {
        books: booksWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books'
    });
  }
});

// Get admin users
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reviews: true,
              favorites: true
            }
          }
        }
      }),
      prisma.user.count()
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get admin reviews
router.get('/reviews', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          book: { select: { title: true, author: true } },
          user: { select: { email: true } }
        }
      }),
      prisma.review.count()
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Get admin genres
router.get('/genres', requireAdmin, async (req: Request, res: Response) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            books: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: genres
    });
  } catch (error) {
    logger.error('Error fetching genres:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch genres'
    });
  }
});

export default router;
