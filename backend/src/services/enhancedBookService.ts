import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { GeminiService } from './geminiService';

const prisma = new PrismaClient();

export interface BookFilters {
  genres?: string[];
  minRating?: number;
  maxRating?: number;
  authors?: string[];
  yearFrom?: number;
  yearTo?: number;
  search?: string;
  sortBy?: 'rating' | 'title' | 'year' | 'popularity' | 'recent';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface BookListResponse {
  books: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: BookFilters;
  genres: string[];
  recommendations?: any[];
}

export class EnhancedBookService {
  /**
   * Get books with advanced filtering, pagination, and sorting
   */
  static async getBooksWithFilters(
    filters: BookFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<BookListResponse> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.BookWhereInput = {};

      // Genre filter
      if (filters.genres && filters.genres.length > 0) {
        where.genres = {
          some: {
            genre: {
              name: {
                in: filters.genres
              }
            }
          }
        };
      }

      // Author filter
      if (filters.authors && filters.authors.length > 0) {
        where.author = {
          in: filters.authors
        };
      }

      // Year filter
      if (filters.yearFrom !== undefined || filters.yearTo !== undefined) {
        where.publishedYear = {};
        if (filters.yearFrom !== undefined) {
          where.publishedYear.gte = filters.yearFrom;
        }
        if (filters.yearTo !== undefined) {
          where.publishedYear.lte = filters.yearTo;
        }
      }

      // Search filter
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { author: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Build orderBy clause
      let orderBy: Prisma.BookOrderByWithRelationInput = {};
      
      switch (filters.sortBy) {
        case 'title':
          orderBy = { title: filters.sortOrder || 'asc' };
          break;
        case 'year':
          orderBy = { publishedYear: filters.sortOrder || 'desc' };
          break;
        case 'recent':
          orderBy = { createdAt: filters.sortOrder || 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      // Get total count
      const total = await prisma.book.count({ where });

      // Get books with pagination
      const books = await prisma.book.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          genres: {
            include: {
              genre: true
            }
          },
          reviews: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { email: true }
              }
            }
          },
          _count: {
            select: {
              reviews: true,
              favorites: true
            }
          }
        }
      });

      // Get all available genres for filter options
      const genres = await prisma.genre.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
      });

      // Calculate average ratings and apply rating filters
      let processedBooks = books.map(book => {
        const averageRating = book.reviews.length > 0 
          ? book.reviews.reduce((sum, review) => sum + review.rating, 0) / book.reviews.length
          : 0;

        return {
          ...book,
          genres: book.genres.map(bg => bg.genre.name),
          reviewCount: book._count.reviews,
          favoriteCount: book._count.favorites,
          averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal
        };
      });

      // Apply rating filters if specified
      if (filters.minRating !== undefined || filters.maxRating !== undefined) {
        processedBooks = processedBooks.filter(book => {
          if (filters.minRating !== undefined && book.averageRating < filters.minRating) {
            return false;
          }
          if (filters.maxRating !== undefined && book.averageRating > filters.maxRating) {
            return false;
          }
          return true;
        });
      }

      // Apply sorting for rating and popularity
      if (filters.sortBy === 'rating') {
        processedBooks.sort((a, b) => {
          const order = filters.sortOrder === 'asc' ? 1 : -1;
          return (a.averageRating - b.averageRating) * order;
        });
      } else if (filters.sortBy === 'popularity') {
        processedBooks.sort((a, b) => {
          const order = filters.sortOrder === 'asc' ? 1 : -1;
          return (a.reviewCount - b.reviewCount) * order;
        });
      }

      const totalPages = Math.ceil(total / limit);

      const response: BookListResponse = {
        books: processedBooks,
        pagination: {
          page,
          limit,
          total: processedBooks.length,
          totalPages: Math.ceil(processedBooks.length / limit),
          hasNext: page < Math.ceil(processedBooks.length / limit),
          hasPrev: page > 1
        },
        filters,
        genres: genres.map(g => g.name)
      };

      logger.info(`Retrieved ${books.length} books (page ${page}/${totalPages})`);
      return response;

    } catch (error) {
      logger.error('Error getting books with filters:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered recommendations based on user preferences and current filters
   */
  static async getAIRecommendations(
    userId?: string,
    currentFilters?: BookFilters,
    limit: number = 10
  ): Promise<any[]> {
    try {
      // Get user's reading history if userId provided
      let userContext = '';
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            reviews: {
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
            },
            favorites: {
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
              take: 5
            }
          }
        });

        if (user) {
          const favoriteGenres = new Set<string>();
          const reviewedBooks = user.reviews.map(review => ({
            title: review.book.title,
            author: review.book.author,
            rating: review.rating,
            genres: review.book.genres.map(bg => bg.genre.name)
          }));

          user.reviews.forEach(review => {
            review.book.genres.forEach(bg => {
              favoriteGenres.add(bg.genre.name);
            });
          });

          userContext = `
User Profile:
- Email: ${user.email}
- Total Reviews: ${user.reviews.length}
- Favorite Genres: ${Array.from(favoriteGenres).join(', ')}
- Recent Reviews: ${reviewedBooks.map(r => `${r.title} (${r.rating}/5)`).join(', ')}
- Average Rating Given: ${user.reviews.length > 0 ? (user.reviews.reduce((sum, r) => sum + r.rating, 0) / user.reviews.length).toFixed(1) : 'N/A'}
`;
        }
      }

      // Build context for current filters
      let filterContext = '';
      if (currentFilters) {
        const filterParts = [];
        if (currentFilters.genres?.length) {
          filterParts.push(`Genres: ${currentFilters.genres.join(', ')}`);
        }
        if (currentFilters.minRating) {
          filterParts.push(`Minimum Rating: ${currentFilters.minRating}`);
        }
        if (currentFilters.authors?.length) {
          filterParts.push(`Authors: ${currentFilters.authors.join(', ')}`);
        }
        if (currentFilters.yearFrom || currentFilters.yearTo) {
          filterParts.push(`Year Range: ${currentFilters.yearFrom || 'Any'} - ${currentFilters.yearTo || 'Any'}`);
        }
        if (currentFilters.search) {
          filterParts.push(`Search Term: ${currentFilters.search}`);
        }
        
        if (filterParts.length > 0) {
          filterContext = `\nCurrent Search Filters:\n${filterParts.join('\n')}`;
        }
      }

      // Get some sample books for context
      const sampleBooks = await prisma.book.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          genres: {
            include: {
              genre: true
            }
          }
        }
      });

      const booksContext = sampleBooks.map(book => 
        `${book.title} by ${book.author} - Genres: ${book.genres.map(bg => bg.genre.name).join(', ')}`
      ).join('\n');

      const prompt = `Based on the following information, recommend ${limit} books that would be perfect for this user:

${userContext}${filterContext}

Available Books Sample:
${booksContext}

Please recommend books that:
1. Match the user's favorite genres and reading patterns
2. Consider the current search filters if provided
3. Include a mix of highly-rated classics and contemporary works
4. Provide variety in authors and publication years
5. Consider the user's rating patterns (if they tend to rate higher/lower)

Return your recommendations as a JSON array with this format:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "reason": "Why this book is recommended for this user",
    "matchScore": 0.95,
    "genres": ["Genre1", "Genre2"]
  }
]`;

      const recommendations = await GeminiService.generateJSON(prompt);
      
      // Validate and enhance recommendations with actual book data
      const enhancedRecommendations = [];
      for (const rec of recommendations) {
        if (rec.title && rec.author) {
          const book = await prisma.book.findFirst({
            where: {
              title: { contains: rec.title, mode: 'insensitive' },
              author: { contains: rec.author, mode: 'insensitive' }
            },
            include: {
              genres: {
                include: {
                  genre: true
                }
              },
              _count: {
                select: {
                  reviews: true,
                  favorites: true
                }
              }
            }
          });

          if (book) {
            enhancedRecommendations.push({
              ...book,
              genres: book.genres.map(bg => bg.genre.name),
              recommendationReason: rec.reason || 'AI recommended based on your preferences',
              matchScore: rec.matchScore || 0.8,
              reviewCount: book._count.reviews,
              favoriteCount: book._count.favorites,
              averageRating: 0 // Will be calculated from reviews if needed
            });
          }
        }
      }

      logger.info(`Generated ${enhancedRecommendations.length} AI recommendations for user ${userId || 'anonymous'}`);
      return enhancedRecommendations.slice(0, limit);

    } catch (error) {
      logger.error('Error generating AI recommendations:', error);
      // Fallback to popular books
      return this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Fallback recommendations when AI fails
   */
  private static async getFallbackRecommendations(limit: number): Promise<any[]> {
    const books = await prisma.book.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        _count: {
          select: {
            reviews: true,
            favorites: true
          }
        }
      }
    });

    return books.map(book => ({
      ...book,
      genres: book.genres.map(bg => bg.genre.name),
      recommendationReason: 'Popular highly-rated book',
      matchScore: 0.7,
      reviewCount: book._count.reviews,
      favoriteCount: book._count.favorites,
      averageRating: 0 // Will be calculated from reviews if needed
    }));
  }

  /**
   * Get book statistics for dashboard
   */
  static async getBookStatistics(): Promise<any> {
    try {
      const [
        totalBooks,
        totalGenres,
        topGenres,
        recentBooks,
        topRatedBooks
      ] = await Promise.all([
        prisma.book.count(),
        prisma.genre.count(),
        prisma.genre.findMany({
          include: {
            _count: {
              select: { books: true }
            }
          },
          orderBy: {
            books: {
              _count: 'desc'
            }
          },
          take: 5
        }),
        prisma.book.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            genres: {
              include: {
                genre: true
              }
            }
          }
        }),
        prisma.book.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            genres: {
              include: {
                genre: true
              }
            }
          }
        })
      ]);

      return {
        totalBooks,
        totalGenres,
        topGenres: topGenres.map(g => ({
          name: g.name,
          bookCount: g._count.books
        })),
        recentBooks: recentBooks.map(book => ({
          ...book,
          genres: book.genres.map(bg => bg.genre.name)
        })),
        topRatedBooks: topRatedBooks.map(book => ({
          ...book,
          genres: book.genres.map(bg => bg.genre.name)
        }))
      };
    } catch (error) {
      logger.error('Error getting book statistics:', error);
      throw error;
    }
  }

  /**
   * Get similar books based on genres and ratings
   */
  static async getSimilarBooks(bookId: string, limit: number = 10): Promise<any[]> {
    try {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          genres: {
            include: {
              genre: true
            }
          }
        }
      });

      if (!book) {
        throw new Error('Book not found');
      }

      const bookGenres = book.genres.map(bg => bg.genre.name);

      const similarBooks = await prisma.book.findMany({
        where: {
          AND: [
            { id: { not: bookId } },
            {
              genres: {
                some: {
                  genre: {
                    name: { in: bookGenres }
                  }
                }
              }
            }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          genres: {
            include: {
              genre: true
            }
          },
          _count: {
            select: {
              reviews: true,
              favorites: true
            }
          }
        }
      });

      return similarBooks.map(book => ({
        ...book,
        genres: book.genres.map(bg => bg.genre.name),
        reviewCount: book._count.reviews,
        favoriteCount: book._count.favorites,
        averageRating: 0 // Will be calculated from reviews if needed
      }));

    } catch (error) {
      logger.error('Error getting similar books:', error);
      throw error;
    }
  }
}