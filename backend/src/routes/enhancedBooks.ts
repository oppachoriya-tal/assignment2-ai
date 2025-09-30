import { Router, Request, Response } from 'express';
import { EnhancedBookService } from '../services/enhancedBookService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/books/advanced
 * Get books with advanced filtering, pagination, and AI recommendations
 */
router.get('/advanced', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      genres,
      minRating,
      maxRating,
      authors,
      yearFrom,
      yearTo,
      search,
      sortBy = 'rating',
      sortOrder = 'desc',
      includeRecommendations = 'false'
    } = req.query;

    // Parse filters
    const filters = {
      genres: genres ? (Array.isArray(genres) ? genres as string[] : [genres as string]) : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      maxRating: maxRating ? parseFloat(maxRating as string) : undefined,
      authors: authors ? (Array.isArray(authors) ? authors as string[] : [authors as string]) : undefined,
      yearFrom: yearFrom ? parseInt(yearFrom as string) : undefined,
      yearTo: yearTo ? parseInt(yearTo as string) : undefined,
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    // Parse pagination
    const pagination = {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 100) // Max 100 per page
    };

    // Get books with filters
    const result = await EnhancedBookService.getBooksWithFilters(filters, pagination);

    // Add AI recommendations if requested
    if (includeRecommendations === 'true') {
      const userId = req.user?.id;
      result.recommendations = await EnhancedBookService.getAIRecommendations(
        userId,
        filters,
        10
      );
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('Error in advanced books endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/books/recommendations
 * Get AI-powered book recommendations
 */
router.get('/recommendations', authenticate, async (req: Request, res: Response) => {
  try {
    const { limit = '10', filters } = req.body;

    const parsedFilters = filters ? JSON.parse(filters) : undefined;
    const recommendations = await EnhancedBookService.getAIRecommendations(
      req.user?.id,
      parsedFilters,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length
      }
    });

  } catch (error: any) {
    logger.error('Error in recommendations endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/books/similar/:bookId
 * Get books similar to a specific book
 */
router.get('/similar/:bookId', async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const { limit = '10' } = req.query;

    const similarBooks = await EnhancedBookService.getSimilarBooks(
      bookId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        similarBooks,
        count: similarBooks.length
      }
    });

  } catch (error: any) {
    logger.error('Error in similar books endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find similar books',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/books/statistics
 * Get book statistics for dashboard
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await EnhancedBookService.getBookStatistics();

    res.json({
      success: true,
      data: statistics
    });

  } catch (error: any) {
    logger.error('Error in statistics endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/books/genres
 * Get all available genres with book counts
 */
router.get('/genres', async (req: Request, res: Response) => {
  try {
    const { prisma } = await import('@/config/database');
    
    const genres = await prisma.genre.findMany({
      include: {
        _count: {
          select: { books: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: genres.map(genre => ({
        id: genre.id,
        name: genre.name,
        bookCount: genre._count.books
      }))
    });

  } catch (error: any) {
    logger.error('Error in genres endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch genres',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/books/authors
 * Get all authors with book counts
 */
router.get('/authors', async (req: Request, res: Response) => {
  try {
    const { prisma } = await import('@/config/database');
    
    const authors = await prisma.book.groupBy({
      by: ['author'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 50
    });

    res.json({
      success: true,
      data: authors.map(author => ({
        name: author.author,
        bookCount: author._count.id
      }))
    });

  } catch (error: any) {
    logger.error('Error in authors endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch authors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/books/search-suggestions
 * Get search suggestions based on query
 */
router.get('/search-suggestions', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || (q as string).length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          books: [],
          authors: [],
          genres: []
        }
      });
    }

    const { prisma } = await import('@/config/database');
    const query = q as string;

    const [books, authors, genres] = await Promise.all([
      prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { author: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          author: true
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.book.findMany({
        where: {
          author: { contains: query, mode: 'insensitive' }
        },
        select: {
          author: true
        },
        distinct: ['author'],
        take: 5
      }),
      prisma.genre.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' }
        },
        select: {
          name: true
        },
        take: 5
      })
    ]);

    return res.json({
      success: true,
      data: {
        suggestions: [
          ...books.map(book => `${book.title} by ${book.author}`),
          ...authors.map(author => author.author),
          ...genres.map(genre => genre.name)
        ],
        books: books.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author
        })),
        authors: authors.map(author => author.author),
        genres: genres.map(genre => genre.name)
      }
    });

  } catch (error: any) {
    logger.error('Error in search suggestions endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch search suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
