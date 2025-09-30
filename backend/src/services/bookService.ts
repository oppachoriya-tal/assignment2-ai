import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface BookFilters {
  genre?: string;
  minRating?: number;
  maxRating?: number;
  minPrice?: number | string;
  maxPrice?: number | string;
  search?: string;
  sortBy?: 'title' | 'rating' | 'publishedYear' | 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BookWithStats {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn: string;
  publishedYear: number;
  price?: number;
  coverImageUrl?: string;
  averageRating: number;
  totalReviews: number;
  totalFavorites: number;
  genres: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class BookService {
  /**
   * Get books with pagination, filtering, and sorting
   */
  static async getBooks(filters: BookFilters = {}): Promise<{
    books: BookWithStats[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const {
        genre,
        minRating = 0,
        maxRating = 5,
        minPrice: rawMinPrice,
        maxPrice: rawMaxPrice,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = filters;

      // Handle string "undefined" values and convert to numbers
      const minPrice = rawMinPrice === undefined || rawMinPrice === '' ? undefined : Number(rawMinPrice);
      const maxPrice = rawMaxPrice === undefined || rawMaxPrice === '' ? undefined : Number(rawMaxPrice);

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      if ((minPrice !== undefined && !isNaN(minPrice)) || (maxPrice !== undefined && !isNaN(maxPrice))) {
        where.price = {};
        if (minPrice !== undefined && !isNaN(minPrice)) where.price.gte = minPrice;
        if (maxPrice !== undefined && !isNaN(maxPrice)) where.price.lte = maxPrice;
      }

      // Get books with aggregated stats
      const books = await prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          reviews: {
            select: {
              rating: true
            }
          },
          favorites: {
            select: {
              id: true
            }
          },
          genres: {
            include: {
              genre: true
            }
          }
        }
      });

      // Calculate stats for each book
      const booksWithStats: BookWithStats[] = books.map(book => {
        const ratings = book.reviews.map(review => review.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description || '',
          isbn: book.isbn || '',
          publishedYear: book.publishedYear || 0,
          price: book.price || undefined,
          coverImageUrl: book.coverImageUrl || undefined,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalReviews: book.reviews.length,
          totalFavorites: book.favorites.length,
          genres: book.genres.map(bg => bg.genre.name),
          createdAt: book.createdAt,
          updatedAt: book.updatedAt
        };
      });

      // Filter by rating range and genre
      let filteredBooks = booksWithStats.filter(book => 
        book.averageRating >= minRating && book.averageRating <= maxRating
      );

      // Filter by genre if specified
      if (genre) {
        filteredBooks = filteredBooks.filter(book => 
          book.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
        );
      }

      // Get total count
      const totalCount = await prisma.book.count({ where });

      return {
        books: filteredBooks,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      logger.error('Error fetching books:', error);
      throw error;
    }
  }

  /**
   * Get book by ID with detailed information
   */
  static async getBookById(id: string): Promise<any> {
    try {
      const book = await prisma.book.findUnique({
        where: { id },
        include: {
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          favorites: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!book) {
        throw new Error('Book not found');
      }

      // Calculate average rating
      const ratings = book.reviews.map(review => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        ...book,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: book.reviews.length,
        totalFavorites: book.favorites.length
      };
    } catch (error) {
      logger.error('Error fetching book by ID:', error);
      throw error;
    }
  }

  /**
   * Get book genres
   */
  static async getGenres(): Promise<string[]> {
    try {
      const genres = await prisma.genre.findMany({
        select: {
          name: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return genres.map(genre => genre.name);
    } catch (error) {
      logger.error('Error fetching genres:', error);
      throw error;
    }
  }

  /**
   * Create a new book
   */
  static async createBook(bookData: any): Promise<any> {
    try {
      const book = await prisma.book.create({
        data: bookData,
        include: {
          genres: {
            include: {
              genre: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          favorites: {
            select: {
              id: true
            }
          }
        }
      });

      return book;
    } catch (error) {
      logger.error('Error creating book:', error);
      throw error;
    }
  }

  /**
   * Get book by ISBN
   */
  static async getBookByIsbn(isbn: string): Promise<any> {
    try {
      const book = await prisma.book.findUnique({
        where: { isbn },
        include: {
          genres: {
            include: {
              genre: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          favorites: {
            select: {
              id: true
            }
          }
        }
      });

      return book;
    } catch (error) {
      logger.error('Error fetching book by ISBN:', error);
      throw error;
    }
  }

  /**
   * Add genres to a book
   */
  static async addBookGenres(bookId: string, genreIds: string[]): Promise<void> {
    try {
      await prisma.bookGenre.createMany({
        data: genreIds.map(genreId => ({
          bookId,
          genreId
        }))
      });
    } catch (error) {
      logger.error('Error adding book genres:', error);
      throw error;
    }
  }

  /**
   * Add book to favorites
   */
  static async addToFavorites(userId: string, bookId: string): Promise<void> {
    try {
      // Check if book is already in favorites
      const existingFavorite = await prisma.userFavorite.findUnique({
        where: {
          userId_bookId: {
            userId,
            bookId
          }
        }
      });

      if (existingFavorite) {
        throw new Error('Book is already in favorites');
      }

      await prisma.userFavorite.create({
        data: {
          userId,
          bookId
        }
      });
    } catch (error) {
      logger.error('Error adding to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove book from favorites
   */
  static async removeFromFavorites(userId: string, bookId: string): Promise<void> {
    try {
      await prisma.userFavorite.deleteMany({
        where: {
          userId,
          bookId
        }
      });
    } catch (error) {
      logger.error('Error removing from favorites:', error);
      throw error;
    }
  }

  /**
   * Check if book is in user's favorites
   */
  static async isInFavorites(userId: string, bookId: string): Promise<boolean> {
    try {
      const favorite = await prisma.userFavorite.findFirst({
        where: {
          userId,
          bookId
        }
      });

      return !!favorite;
    } catch (error) {
      logger.error('Error checking favorites:', error);
      throw error;
    }
  }

  /**
   * Get user's favorites
   */
  static async getUserFavorites(userId: string): Promise<any[]> {
    try {
      const favorites = await prisma.userFavorite.findMany({
        where: { userId },
        include: {
          book: {
            include: {
              reviews: {
                select: {
                  rating: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return favorites.map(item => {
        const ratings = item.book.reviews.map(review => review.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          ...item.book,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: item.book.reviews.length,
          addedToFavorites: item.createdAt
        };
      });
    } catch (error) {
      logger.error('Error fetching user favorites:', error);
      throw error;
    }
  }
}