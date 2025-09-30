import { Router, Request, Response } from 'express';
import { BookService } from '../services/bookService';
import { ReviewService } from '../services/reviewService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/books
 * @desc Get books with pagination, filtering, and sorting
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      genre: req.query.genre as string,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      maxRating: req.query.maxRating ? parseFloat(req.query.maxRating as string) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as 'title' | 'rating' | 'publishedYear' | 'createdAt' | 'price',
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await BookService.getBooks(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books'
    });
  }
});

/**
 * @route GET /api/books/genres
 * @desc Get all book genres
 * @access Public
 */
router.get('/genres', async (req: Request, res: Response) => {
  try {
    const genres = await BookService.getGenres();

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

/**
 * @route GET /api/books/:id
 * @desc Get book by ID with reviews
 * @access Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const book = await BookService.getBookById(req.params.id);

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    logger.error('Error fetching book:', error);
    if ((error as Error).message === 'Book not found') {
      res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book'
      });
    }
  }
});

/**
 * @route GET /api/books/:id/reviews
 * @desc Get reviews for a book
 * @access Public
 */
router.get('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await ReviewService.getBookReviews(req.params.id, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching book reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

/**
 * @route POST /api/books/:id/reviews
 * @desc Create a review for a book
 * @access Private
 */
router.post('/:id/reviews', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, reviewText } = req.body;

    if (!rating || !reviewText) {
      res.status(400).json({
        success: false,
        message: 'Rating and review text are required'
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
      return;
    }

    const review = await ReviewService.createReview({
      userId: req.user!.id,
      bookId: req.params.id,
      rating,
      reviewText
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    logger.error('Error creating review:', error);
    if ((error as Error).message === 'You have already reviewed this book') {
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create review'
      });
    }
  }
});

/**
 * @route PUT /api/books/:id/favorites
 * @desc Add book to favorites
 * @access Private
 */
router.put('/:id/favorites', authenticate, async (req: Request, res: Response) => {
  try {
    await BookService.addToFavorites(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Book added to favorites'
    });
  } catch (error) {
    logger.error('Error adding to favorites:', error);
    
    // Handle specific error types
    if ((error as Error).message && (error as Error).message.includes('already in favorites')) {
      res.status(400).json({
        success: false,
        message: 'Book is already in your favorites'
      });
    } else if ((error as Error).message && (error as Error).message.includes('Book not found')) {
      res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    } else if ((error as any).code === 'P2003') {
      res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to add to favorites'
      });
    }
  }
});

/**
 * @route DELETE /api/books/:id/favorites
 * @desc Remove book from favorites
 * @access Private
 */
router.delete('/:id/favorites', authenticate, async (req: Request, res: Response) => {
  try {
    await BookService.removeFromFavorites(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Book removed from favorites'
    });
  } catch (error) {
    logger.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites'
    });
  }
});

/**
 * @route GET /api/books/:id/favorites-status
 * @desc Check if book is in user's favorites
 * @access Private
 */
router.get('/:id/favorites-status', authenticate, async (req: Request, res: Response) => {
  try {
    const isInFavorites = await BookService.isInFavorites(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: { isInFavorites }
    });
  } catch (error) {
    logger.error('Error checking favorites status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorites status'
    });
  }
});

/**
 * @route GET /api/books/recent/reviews
 * @desc Get recent reviews across all books
 * @access Public
 */
router.get('/recent/reviews', async (req: Request, res: Response) => {
  try {
    console.log('Route called: /recent/reviews');
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    console.log('Limit:', limit);
    const reviews = await ReviewService.getRecentReviews(limit);
    console.log('Reviews:', reviews);

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.log('Error in route:', error);
    logger.error('Error fetching recent reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent reviews'
    });
  }
});

/**
 * @route POST /api/v1/books
 * @desc Create a new book
 * @access Public (for demo purposes)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, author, description, isbn, publishedYear, pageCount, language, publisher, price, coverImageUrl, genreIds } = req.body;

    // Validate required fields
    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title and author are required'
      });
    }

    // Check if book with same ISBN already exists (if ISBN provided)
    if (isbn) {
      const existingBook = await BookService.getBookByIsbn(isbn);
      if (existingBook) {
        return res.status(400).json({
          success: false,
          message: 'Book with this ISBN already exists'
        });
      }
    }

    const bookData = {
      title,
      author,
      description,
      isbn: isbn || '',
      publishedYear: publishedYear ? Number(publishedYear) : null,
      pageCount: pageCount ? Number(pageCount) : null,
      language,
      publisher,
      price: price ? Number(price) : null,
      coverImageUrl
    };

    const book = await BookService.createBook(bookData);

    // Add genres if provided
    if (genreIds && genreIds.length > 0) {
      await BookService.addBookGenres(book.id, genreIds);
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

export default router;