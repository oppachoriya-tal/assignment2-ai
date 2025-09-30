import { Router, Request, Response } from 'express';
import { AICoverService } from '../services/aiCoverService';
import { GeminiService } from '../services/geminiService';
import { authenticate, authorize, optionalAuth } from '../middleware/simple-auth';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route GET /api/ai/cover/styles
 * @desc Get available cover generation styles
 * @access Public
 */
router.get('/cover/styles', async (req: Request, res: Response) => {
  try {
    const styles = AICoverService.getAvailableStyles();

    res.json({
      success: true,
      data: styles
    });
  } catch (error) {
    logger.error('Error fetching cover styles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cover styles'
    });
  }
});

/**
 * @route POST /api/ai/cover/generate
 * @desc Generate a book cover using AI
 * @access Public (with optional user context)
 */
router.post('/cover/generate', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { title, author, genre, description, style } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title and author are required'
      });
    }

    const coverRequest = {
      title,
      author,
      genre,
      description,
      style: style || 'realistic'
    };

    const cover = await AICoverService.generateBookCover(coverRequest);

    return res.json({
      success: true,
      data: cover
    });
  } catch (error) {
    logger.error('Error generating cover:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate book cover'
    });
  }
});

/**
 * @route POST /api/ai/cover/generate-options
 * @desc Generate multiple cover options for a book
 * @access Public (with optional user context)
 */
router.post('/cover/generate-options', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { title, author, genre, description } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title and author are required'
      });
    }

    const coverRequest = {
      title,
      author,
      genre,
      description
    };

    const covers = await AICoverService.generateCoverOptions(coverRequest);

    return res.json({
      success: true,
      data: covers
    });
  } catch (error) {
    logger.error('Error generating cover options:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate cover options'
    });
  }
});

/**
 * @route GET /api/ai/status
 * @desc Check AI service status
 * @access Public
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const geminiStatus = await AICoverService.checkGeminiStatus();
    const stats = AICoverService.getServiceStats();

    res.json({
      success: true,
      data: {
        geminiAvailable: geminiStatus,
        serviceStats: stats,
        status: geminiStatus ? 'operational' : 'limited'
      }
    });
  } catch (error) {
    logger.error('Error checking AI status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check AI service status'
    });
  }
});

/**
 * @route POST /api/ai/cover/apply/:bookId
 * @desc Generate and apply AI cover to a specific book
 * @access Public
 */
router.post('/cover/apply/:bookId', async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const { style = 'realistic' } = req.body;

    const cover = await AICoverService.generateAndApplyCover(bookId, style);
    
    if (cover) {
      res.status(200).json({ 
        success: true, 
        message: 'AI cover applied successfully',
        data: cover 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate and apply cover' 
      });
    }
  } catch (error) {
    logger.error('Error applying AI cover:', error);
    res.status(500).json({ success: false, message: 'Failed to apply AI cover' });
  }
});

/**
 * @route POST /api/ai/recommendations
 * @desc Get AI-powered book recommendations using Gemini
 * @access Public
 */
router.post('/recommendations', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit = 3 } = req.body;

    if (!query) {
      res.status(400).json({
        success: false,
        message: 'Query is required'
      });
      return;
    }

    // Get all books from the database to provide context to Gemini
    const { prisma } = await import('../config/database');
    const books = await prisma.book.findMany({
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        reviews: {
          select: {
            rating: true,
            reviewText: true
          }
        }
      },
      take: 50 // Limit to avoid overwhelming Gemini
    });

    // Create a comprehensive prompt for Gemini
    const booksContext = books.map(book => {
      const genres = book.genres.map(bg => bg.genre.name).join(', ');
      const avgRating = book.reviews.length > 0 
        ? (book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length).toFixed(1)
        : 'No ratings';
      const reviewCount = book.reviews.length;
      
      return `- "${book.title}" by ${book.author} (${genres}) - Rating: ${avgRating}/5 (${reviewCount} reviews) - ${book.description || 'No description'}`;
    }).join('\n');

    const prompt = `You are a book recommendation expert. Based on the user's query and the available books in our database, recommend exactly ${limit} books.

User Query: "${query}"

Available Books in Database:
${booksContext}

Please analyze the user's query and recommend ${limit} books that best match their request. Consider:
1. Genre preferences mentioned
2. Reading style preferences (e.g., "fast-paced", "character-driven")
3. Rating requirements
4. Book length preferences
5. Author preferences
6. Any specific themes or topics mentioned

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Exact Book Title",
      "author": "Exact Author Name",
      "reason": "Why this book matches their request",
      "confidence": 0.9
    }
  ],
  "explanation": "Brief explanation of why these books were selected"
}`;

    // Try to get recommendations from Gemini, but fallback if it fails
    let matchedBooks: any[] = [];
    
    try {
      const geminiResponse = await GeminiService.generateJSON(prompt);

      // Match recommendations with actual books in database
      for (const rec of geminiResponse.recommendations) {
        const book = books.find(b => 
          b.title.toLowerCase().trim() === rec.title.toLowerCase().trim() &&
          b.author.toLowerCase().trim() === rec.author.toLowerCase().trim()
        );
        
        if (book) {
          const avgRating = book.reviews.length > 0 
            ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length 
            : 0;
          
          matchedBooks.push({
            id: book.id,
            title: book.title,
            author: book.author,
            description: book.description,
            publishedYear: book.publishedYear,
            pageCount: book.pageCount,
            language: book.language,
            publisher: book.publisher,
            isbn: book.isbn,
            coverImageUrl: book.coverImageUrl,
            genres: book.genres.map(bg => ({
              id: bg.genre.id,
              name: bg.genre.name,
              description: bg.genre.description
            })),
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: book.reviews.length,
            recommendationReason: rec.reason,
            confidence: rec.confidence || 0.8
          });
        }
      }
    } catch (error) {
      logger.warn('Gemini AI not available, using fallback recommendations:', error);
      // Continue with fallback logic below
    }

    // If we don't have enough matches, fill with diverse recommendations
    if (matchedBooks.length < limit) {
      // Shuffle books to get different recommendations each time
      const shuffledBooks = [...books].sort(() => Math.random() - 0.5);
      
      // Try to match query keywords with book content
      const queryKeywords = query.toLowerCase().split(' ').filter((word: string) => word.length > 2);
      const scoredBooks = shuffledBooks.map(book => {
        let score = 0;
        const bookText = `${book.title} ${book.author} ${book.description || ''}`.toLowerCase();
        
        // Score based on keyword matches
        queryKeywords.forEach((keyword: string) => {
          if (bookText.includes(keyword)) {
            score += 1;
          }
        });
        
        // Add some randomness
        score += Math.random() * 0.5;
        
        return { book, score };
      });
      
      // Sort by score and take the best ones
      const selectedBooks = scoredBooks
        .filter(item => !matchedBooks.some(mb => mb.id === item.book.id))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit - matchedBooks.length);

      for (const { book } of selectedBooks) {
        const avgRating = book.reviews.length > 0 
          ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length 
          : 0;
        
        matchedBooks.push({
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description,
          publishedYear: book.publishedYear,
          pageCount: book.pageCount,
          language: book.language,
          publisher: book.publisher,
          isbn: book.isbn,
          coverImageUrl: book.coverImageUrl,
          genres: book.genres.map(bg => ({
            id: bg.genre.id,
            name: bg.genre.name,
            description: bg.genre.description
          })),
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: book.reviews.length,
          recommendationReason: `Based on your query "${query}", this book matches your interests`,
          confidence: 0.7
        });
      }
    }

    res.json({
      success: true,
      data: {
        recommendations: matchedBooks.slice(0, limit),
        explanation: `Based on your query "${query}", here are ${matchedBooks.length} book recommendations.`,
        query: query,
        totalFound: matchedBooks.length
      }
    });

  } catch (error: any) {
    logger.error('Error generating AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route POST /api/ai/recommendations/personalized
 * @desc Get personalized AI-powered book recommendations based on user preferences
 * @access Private
 */
router.post('/recommendations/personalized', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit = 5 } = req.body;
    const userId = req.user!.id;

    // Get user's reading history and preferences
    const { prisma } = await import('../config/database');
    
    // Get user's reviews to understand their preferences
    const userReviews = await prisma.review.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            genres: {
              include: {
                genre: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get user's favorite books
    const userFavorites = await prisma.userFavorite.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            genres: {
              include: {
                genre: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Analyze user preferences
    const genrePreferences: { [key: string]: number } = {};
    const authorPreferences: { [key: string]: number } = {};
    const avgRating = userReviews.length > 0 
      ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length 
      : 3.5;

    // Count genre preferences from reviews and favorites
    [...userReviews, ...userFavorites].forEach(item => {
      const book = item.book;
      book.genres.forEach(bg => {
        const genreName = bg.genre.name;
        genrePreferences[genreName] = (genrePreferences[genreName] || 0) + 1;
      });
      authorPreferences[book.author] = (authorPreferences[book.author] || 0) + 1;
    });

    // Get all books excluding user's already reviewed/favorited books
    const excludedBookIds = [
      ...userReviews.map(r => r.bookId),
      ...userFavorites.map(f => f.bookId)
    ];

    const books = await prisma.book.findMany({
      where: {
        id: {
          notIn: excludedBookIds
        }
      },
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        reviews: {
          select: {
            rating: true,
            reviewText: true
          }
        }
      },
      take: 100 // Limit to avoid overwhelming Gemini
    });

    // Create user profile for Gemini
    const topGenres = Object.entries(genrePreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    const topAuthors = Object.entries(authorPreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([author]) => author);

    const userProfile = {
      totalReviews: userReviews.length,
      totalFavorites: userFavorites.length,
      averageRatingGiven: Math.round(avgRating * 10) / 10,
      preferredGenres: topGenres,
      preferredAuthors: topAuthors,
      recentBooks: userReviews.slice(0, 5).map(r => ({
        title: r.book.title,
        author: r.book.author,
        rating: r.rating,
        genres: r.book.genres.map(bg => bg.genre.name)
      }))
    };

    // Create books context
    const booksContext = books.map(book => {
      const genres = book.genres.map(bg => bg.genre.name).join(', ');
      const avgRating = book.reviews.length > 0 
        ? (book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length).toFixed(1)
        : 'No ratings';
      const reviewCount = book.reviews.length;
      
      return `- "${book.title}" by ${book.author} (${genres}) - Rating: ${avgRating}/5 (${reviewCount} reviews) - ${book.description || 'No description'}`;
    }).join('\n');

    const prompt = `You are a personalized book recommendation expert. Based on the user's reading history, preferences, and their current query, recommend exactly ${limit} books.

User Query: "${query || 'Recommend books based on my preferences'}"

User Profile:
- Total Reviews: ${userProfile.totalReviews}
- Total Favorites: ${userProfile.totalFavorites}
- Average Rating Given: ${userProfile.averageRatingGiven}/5
- Preferred Genres: ${userProfile.preferredGenres.join(', ')}
- Preferred Authors: ${userProfile.preferredAuthors.join(', ')}
- Recent Books Read:
${userProfile.recentBooks.map(book => `  * "${book.title}" by ${book.author} (${book.rating}/5) - ${book.genres.join(', ')}`).join('\n')}

Available Books in Database (excluding user's already read/favorited books):
${booksContext}

Please analyze the user's profile and recommend ${limit} books that:
1. Match their genre preferences
2. Are by authors they might like
3. Have ratings similar to what they typically give
4. Match their query if provided
5. Are different from what they've already read

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Exact Book Title",
      "author": "Exact Author Name",
      "reason": "Why this book matches their preferences and query",
      "confidence": 0.9,
      "matchFactors": ["genre preference", "author preference", "rating similarity"]
    }
  ],
  "explanation": "Brief explanation of why these books were selected based on their profile",
  "profileInsights": "What we learned about their reading preferences"
}`;

    // Get recommendations from Gemini
    const geminiResponse = await GeminiService.generateJSON(prompt);

    // Match recommendations with actual books in database
    const matchedBooks: any[] = [];
    for (const rec of geminiResponse.recommendations) {
      const book = books.find(b => 
        b.title.toLowerCase().trim() === rec.title.toLowerCase().trim() &&
        b.author.toLowerCase().trim() === rec.author.toLowerCase().trim()
      );
      
      if (book) {
        const avgRating = book.reviews.length > 0 
          ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length 
          : 0;
        
        matchedBooks.push({
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description,
          publishedYear: book.publishedYear,
          pageCount: book.pageCount,
          language: book.language,
          publisher: book.publisher,
          isbn: book.isbn,
          coverImageUrl: book.coverImageUrl,
          genres: book.genres.map(bg => ({
            id: bg.genre.id,
            name: bg.genre.name,
            description: bg.genre.description
          })),
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: book.reviews.length,
          recommendationReason: rec.reason,
          confidence: rec.confidence || 0.8,
          matchFactors: rec.matchFactors || []
        });
      }
    }

    // If we don't have enough matches, fill with books that match user preferences
    if (matchedBooks.length < limit) {
      const preferenceBooks = books
        .filter(book => {
          const bookGenres = book.genres.map(bg => bg.genre.name);
          return bookGenres.some(genre => topGenres.includes(genre)) ||
                 topAuthors.includes(book.author);
        })
        .filter(book => !matchedBooks.some(mb => mb.id === book.id))
        .sort((a, b) => {
          // Sort by genre preference match first, then by rating
          const aGenreMatch = a.genres.some(bg => topGenres.includes(bg.genre.name));
          const bGenreMatch = b.genres.some(bg => topGenres.includes(bg.genre.name));
          if (aGenreMatch && !bGenreMatch) return -1;
          if (!aGenreMatch && bGenreMatch) return 1;
          return b.reviews.length - a.reviews.length;
        })
        .slice(0, limit - matchedBooks.length);

      for (const book of preferenceBooks) {
        const avgRating = book.reviews.length > 0 
          ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length 
          : 0;
        
        matchedBooks.push({
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description,
          publishedYear: book.publishedYear,
          pageCount: book.pageCount,
          language: book.language,
          publisher: book.publisher,
          isbn: book.isbn,
          coverImageUrl: book.coverImageUrl,
          genres: book.genres.map(bg => ({
            id: bg.genre.id,
            name: bg.genre.name,
            description: bg.genre.description
          })),
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: book.reviews.length,
          recommendationReason: 'Matches your reading preferences',
          confidence: 0.7,
          matchFactors: ['genre preference', 'author preference']
        });
      }
    }

    res.json({
      success: true,
      data: {
        recommendations: matchedBooks.slice(0, limit),
        explanation: geminiResponse.explanation || `Based on your reading profile, here are ${matchedBooks.length} personalized recommendations.`,
        profileInsights: geminiResponse.profileInsights || `You prefer ${topGenres.join(', ')} genres and typically rate books ${avgRating.toFixed(1)}/5.`,
        userProfile: {
          totalReviews: userProfile.totalReviews,
          totalFavorites: userProfile.totalFavorites,
          averageRatingGiven: userProfile.averageRatingGiven,
          preferredGenres: topGenres,
          preferredAuthors: topAuthors
        },
        query: query || 'Personalized recommendations',
        totalFound: matchedBooks.length
      }
    });

  } catch (error: any) {
    logger.error('Error generating personalized AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate personalized AI recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route GET /api/ai/stats
 * @desc Get AI service statistics (Admin only)
 * @access Private (Admin)
 */
router.get('/stats', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const stats = {
      totalCovers: 0,
      availableStyles: AICoverService.getAvailableStyles().length,
      cacheSize: 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching AI stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI statistics'
    });
  }
});

export default router;
