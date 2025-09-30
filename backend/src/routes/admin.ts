import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/simple-auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check admin role
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  return next();
};

/**
 * @route GET /api/admin/stats
 * @desc Get system statistics
 * @access Admin
 */
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [
      totalBooks,
      totalUsers,
      totalReviews,
      totalFavorites,
      totalGenres,
      recentBooks,
      recentUsers,
      recentReviews
    ] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.review.count(),
      prisma.userFavorite.count(),
      prisma.genre.count(),
      prisma.book.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, author: true, createdAt: true }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, createdAt: true }
      }),
      prisma.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          book: { select: { title: true } },
          user: { select: { email: true } }
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        totalBooks,
        totalUsers,
        totalReviews,
        totalFavorites,
        totalGenres,
        recentBooks,
        recentUsers,
        recentReviews
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * @route GET /api/admin/books
 * @desc Get all books with admin details
 * @access Admin
 */
router.get('/books', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? {
      OR: [
        { title: { contains: search as string, mode: 'insensitive' as any } },
        { author: { contains: search as string, mode: 'insensitive' as any } },
        { isbn: { contains: search as string, mode: 'insensitive' as any } }
      ]
    } : {};

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
          reviews: { select: { id: true, rating: true } },
          favorites: { select: { id: true } }
        }
      }),
      prisma.book.count({ where })
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

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch books'
    });
  }
});

/**
 * @route POST /api/admin/books
 * @desc Create new book
 * @access Admin
 */
router.post('/books', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, author, description, isbn, publishedYear, pageCount, language, publisher, price, coverImageUrl, genreIds } = req.body;

    // Validate required fields
    if (!title || !author || !isbn) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, and ISBN are required'
      });
    }

    // Check if book with same ISBN already exists
    const existingBook = await prisma.book.findUnique({
      where: { isbn }
    });

    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        isbn,
        publishedYear: publishedYear ? Number(publishedYear) : null,
        pageCount: pageCount ? Number(pageCount) : null,
        language,
        publisher,
        price: price ? Number(price) : null,
        coverImageUrl
      }
    });

    // Add genres if provided
    if (genreIds && genreIds.length > 0) {
      await prisma.bookGenre.createMany({
        data: genreIds.map((genreId: string) => ({
          bookId: book.id,
          genreId
        }))
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book
    });
  } catch (error) {
    logger.error('Error creating book:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create book'
    });
  }
});

/**
 * @route PUT /api/admin/books/:id
 * @desc Update book
 * @access Admin
 */
router.put('/books/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove genreIds from update data as it needs special handling
    const { genreIds, ...bookData } = updateData;

    const book = await prisma.book.update({
      where: { id },
      data: bookData
    });

    // Update genres if provided
    if (genreIds) {
      // Remove existing genre associations
      await prisma.bookGenre.deleteMany({
        where: { bookId: id }
      });

      // Add new genre associations
      if (genreIds.length > 0) {
        await prisma.bookGenre.createMany({
          data: genreIds.map((genreId: string) => ({
            bookId: id,
            genreId
          }))
        });
      }
    }

    return res.json({
      success: true,
      message: 'Book updated successfully',
      data: book
    });
  } catch (error) {
    logger.error('Error updating book:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update book'
    });
  }
});

/**
 * @route DELETE /api/admin/books/:id
 * @desc Delete book
 * @access Admin
 */
router.delete('/books/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete related records first
    await prisma.bookGenre.deleteMany({ where: { bookId: id } });
    await prisma.review.deleteMany({ where: { bookId: id } });
    await prisma.userFavorite.deleteMany({ where: { bookId: id } });

    // Delete the book
    await prisma.book.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting book:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete book'
    });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Admin
 */
router.get('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? {
      OR: [
        { email: { contains: search as string, mode: 'insensitive' as any } },
        { firstName: { contains: search as string, mode: 'insensitive' as any } },
        { lastName: { contains: search as string, mode: 'insensitive' as any } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
      prisma.user.count({ where })
    ]);

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

/**
 * @route PUT /api/admin/users/:id/role
 * @desc Update user role
 * @access Admin
 */
router.put('/users/:id/role', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be USER or ADMIN'
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    return res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Error updating user role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

/**
 * @route GET /api/admin/reviews
 * @desc Get all reviews with moderation options
 * @access Admin
 */
router.get('/reviews', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, flagged = false } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = flagged === 'true' ? { isFlagged: true } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          book: { select: { title: true, author: true } },
          user: { select: { email: true } }
        }
      }),
      prisma.review.count({ where })
    ]);

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

/**
 * @route PUT /api/admin/reviews/:id/moderate
 * @desc Moderate review (approve/flag)
 * @access Admin
 */
router.put('/reviews/:id/moderate', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'flag'

    if (!['approve', 'flag'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or flag'
      });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        isModerated: action === 'approve',
        isFlagged: action === 'flag'
      }
    });

    return res.json({
      success: true,
      message: `Review ${action}d successfully`,
      data: review
    });
  } catch (error) {
    logger.error('Error moderating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to moderate review'
    });
  }
});

/**
 * @route GET /api/admin/genres
 * @desc Get all genres
 * @access Admin
 */
router.get('/genres', authenticate, requireAdmin, async (req: Request, res: Response) => {
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

    return res.json({
      success: true,
      data: genres
    });
  } catch (error) {
    logger.error('Error fetching genres:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch genres'
    });
  }
});

/**
 * @route POST /api/admin/genres
 * @desc Create new genre
 * @access Admin
 */
router.post('/genres', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Genre name is required'
      });
    }

    const genre = await prisma.genre.create({
      data: { name, description }
    });

    return res.status(201).json({
      success: true,
      message: 'Genre created successfully',
      data: genre
    });
  } catch (error) {
    logger.error('Error creating genre:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create genre'
    });
  }
});

export default router;
