import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface UserAnalytics {
  userId: string;
  totalReviews: number;
  averageRatingGiven: number;
  favoriteGenres: string[];
  readingStreak: number;
  booksReadThisYear: number;
  totalPagesRead: number;
  averageReviewLength: number;
  helpfulReviewsCount: number;
  followersCount: number;
  followingCount: number;
  joinedDate: Date;
  lastActivity: Date;
}

export interface BookAnalytics {
  bookId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  reviewTrend: Array<{ date: string; count: number }>;
  helpfulReviewsCount: number;
  genrePerformance: string[];
  similarBooks: string[];
  readerDemographics: {
    ageGroups: { [key: string]: number };
    locations: { [key: string]: number };
  };
  engagementMetrics: {
    views: number;
    favorites: number;
    shares: number;
  };
}

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalBooks: number;
  totalReviews: number;
  averageRating: number;
  growthMetrics: {
    userGrowth: Array<{ date: string; count: number }>;
    reviewGrowth: Array<{ date: string; count: number }>;
    bookGrowth: Array<{ date: string; count: number }>;
  };
  topGenres: Array<{ genre: string; count: number }>;
  topAuthors: Array<{ author: string; count: number }>;
  topBooks: Array<{ book: string; rating: number; reviews: number }>;
  userEngagement: {
    averageReviewsPerUser: number;
    averageBooksPerUser: number;
    retentionRate: number;
  };
}

export class AnalyticsService {
  /**
   * Get user analytics
   */
  static async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          reviews: {
            include: {
              book: {
                include: {
                  genres: { include: { genre: true } }
                }
              }
            }
          },
          favorites: true,
          followers: true,
          following: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate metrics
      const totalReviews = user.reviews.length;
      const averageRatingGiven = totalReviews > 0 
        ? user.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0;

      const favoriteGenres = this.calculateFavoriteGenres(user.reviews);
      const readingStreak = await this.calculateReadingStreak(userId);
      const booksReadThisYear = await this.getBooksReadThisYear(userId);
      const totalPagesRead = user.reviews.reduce((sum, r) => sum + (r.book.pageCount || 0), 0);
      const averageReviewLength = totalReviews > 0 
        ? user.reviews.reduce((sum, r) => sum + r.reviewText.length, 0) / totalReviews 
        : 0;

      const helpfulReviewsCount = user.reviews.reduce((sum, r) => sum + r.isHelpfulCount, 0);

      return {
        userId: user.id,
        totalReviews,
        averageRatingGiven: Math.round(averageRatingGiven * 10) / 10,
        favoriteGenres,
        readingStreak,
        booksReadThisYear,
        totalPagesRead,
        averageReviewLength: Math.round(averageReviewLength),
        helpfulReviewsCount,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        joinedDate: user.createdAt,
        lastActivity: user.lastLogin || user.createdAt,
      };
    } catch (error) {
      logger.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  /**
   * Get book analytics
   */
  static async getBookAnalytics(bookId: string): Promise<BookAnalytics> {
    try {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          reviews: {
            include: {
              user: true
            }
          },
          genres: {
            include: { genre: true }
          },
          favorites: true,
        }
      });

      if (!book) {
        throw new Error('Book not found');
      }

      const reviews = book.reviews;
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0;

      const ratingDistribution = this.calculateRatingDistribution(reviews);
      const reviewTrend = await this.calculateReviewTrend(bookId);
      const helpfulReviewsCount = reviews.reduce((sum, r) => sum + r.isHelpfulCount, 0);
      const genrePerformance = book.genres.map(g => g.genre.name);
      const similarBooks = await this.getSimilarBooks(bookId);

      return {
        bookId: book.id,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        reviewTrend,
        helpfulReviewsCount,
        genrePerformance,
        similarBooks,
        readerDemographics: {
          ageGroups: {}, // Would need user age data
          locations: {}, // Would need user location data
        },
        engagementMetrics: {
          views: 0, // Would need view tracking
          favorites: (book as any).favorites?.length || 0,
          shares: 0, // Would need share tracking
        },
      };
    } catch (error) {
      logger.error('Failed to get book analytics:', error);
      throw error;
    }
  }

  /**
   * Get platform analytics
   */
  static async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalUsers,
        activeUsers,
        totalBooks,
        totalReviews,
        averageRatingResult,
        userGrowth,
        reviewGrowth,
        bookGrowth,
        topGenres,
        topAuthors,
        topBooks,
      ] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({
          where: {
            reviews: {
              some: {
                createdAt: { gte: thirtyDaysAgo }
              }
            }
          }
        }),
        prisma.book.count(),
        prisma.review.count(),
        prisma.review.aggregate({ _avg: { rating: true } }),
        this.getUserGrowthTrend(),
        this.getReviewGrowthTrend(),
        this.getBookGrowthTrend(),
        this.getTopGenres(),
        this.getTopAuthors(),
        this.getTopBooks(),
      ]);

      const averageRating = averageRatingResult._avg.rating ? Math.round(averageRatingResult._avg.rating * 10) / 10 : 0;

      return {
        totalUsers,
        activeUsers,
        totalBooks,
        totalReviews,
        averageRating,
        growthMetrics: {
          userGrowth,
          reviewGrowth,
          bookGrowth,
        },
        topGenres,
        topAuthors,
        topBooks,
        userEngagement: {
          averageReviewsPerUser: totalUsers > 0 ? Math.round((totalReviews / totalUsers) * 10) / 10 : 0,
          averageBooksPerUser: totalUsers > 0 ? Math.round((totalBooks / totalUsers) * 10) / 10 : 0,
          retentionRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get platform analytics:', error);
      throw error;
    }
  }

  /**
   * Get reading insights for user
   */
  static async getReadingInsights(userId: string): Promise<{
    readingGoals: {
      booksThisYear: number;
      pagesThisYear: number;
      reviewsThisYear: number;
    };
    readingPatterns: {
      favoriteTimeOfDay: string;
      favoriteDayOfWeek: string;
      averageReadingTime: number;
    };
    genreEvolution: Array<{ genre: string; count: number; trend: 'up' | 'down' | 'stable' }>;
    recommendations: string[];
  }> {
    try {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);

      const [reviewsThisYear, allReviews] = await Promise.all([
        prisma.review.findMany({
          where: {
            userId,
            createdAt: { gte: yearStart }
          },
          include: {
            book: {
              include: {
                genres: { include: { genre: true } }
              }
            }
          }
        }),
        prisma.review.findMany({
          where: { userId },
          include: {
            book: {
              include: {
                genres: { include: { genre: true } }
              }
            }
          }
        })
      ]);

      const booksThisYear = reviewsThisYear.length;
      const pagesThisYear = reviewsThisYear.reduce((sum, r) => sum + (r.book.pageCount || 0), 0);
      const reviewsThisYearCount = reviewsThisYear.length;

      const genreEvolution = this.calculateGenreEvolution(allReviews);

      return {
        readingGoals: {
          booksThisYear,
          pagesThisYear,
          reviewsThisYear: reviewsThisYearCount,
        },
        readingPatterns: {
          favoriteTimeOfDay: 'Evening', // Would need timestamp analysis
          favoriteDayOfWeek: 'Weekend', // Would need day analysis
          averageReadingTime: 0, // Would need reading session data
        },
        genreEvolution,
        recommendations: [], // Would integrate with recommendation service
      };
    } catch (error) {
      logger.error('Failed to get reading insights:', error);
      throw error;
    }
  }

  /**
   * Calculate favorite genres from reviews
   */
  private static calculateFavoriteGenres(reviews: any[]): string[] {
    const genreCount: { [key: string]: number } = {};
    
    reviews.forEach(review => {
      review.book.genres.forEach((bg: any) => {
        const genreName = bg.genre.name;
        genreCount[genreName] = (genreCount[genreName] || 0) + 1;
      });
    });

    return Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);
  }

  /**
   * Calculate reading streak
   */
  private static async calculateReadingStreak(userId: string): Promise<number> {
    try {
      const reviews = await prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });

      if (reviews.length === 0) return 0;

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const review of reviews) {
        const reviewDate = new Date(review.createdAt);
        reviewDate.setHours(0, 0, 0, 0);

        if (reviewDate.getTime() === currentDate.getTime()) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (reviewDate.getTime() === currentDate.getTime() - 24 * 60 * 60 * 1000) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      logger.error('Failed to calculate reading streak:', error);
      return 0;
    }
  }

  /**
   * Get books read this year
   */
  private static async getBooksReadThisYear(userId: string): Promise<number> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    return await prisma.review.count({
      where: {
        userId,
        createdAt: { gte: yearStart }
      }
    });
  }

  /**
   * Calculate rating distribution
   */
  private static calculateRatingDistribution(reviews: any[]): { [key: number]: number } {
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Calculate review trend
   */
  private static async calculateReviewTrend(bookId: string): Promise<Array<{ date: string; count: number }>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const reviews = await prisma.review.findMany({
      where: {
        bookId,
        createdAt: { gte: sixMonthsAgo }
      },
      select: { createdAt: true }
    });

    const trend: { [key: string]: number } = {};
    
    reviews.forEach(review => {
      const date = review.createdAt.toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });

    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get similar books
   */
  private static async getSimilarBooks(bookId: string): Promise<string[]> {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        genres: true
      }
    });

    if (!book) return [];

    const genreIds = book.genres.map(g => g.genreId);

    const similarBooks = await prisma.book.findMany({
      where: {
        AND: [
          { id: { not: bookId } },
          {
            genres: {
              some: {
                genreId: { in: genreIds }
              }
            }
          }
        ]
      },
      take: 5,
      select: { id: true }
    });

    return similarBooks.map(b => b.id);
  }

  /**
   * Get user growth trend
   */
  private static async getUserGrowthTrend(): Promise<Array<{ date: string; count: number }>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      select: { createdAt: true }
    });

    const trend: { [key: string]: number } = {};
    
    users.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });

    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get review growth trend
   */
  private static async getReviewGrowthTrend(): Promise<Array<{ date: string; count: number }>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const reviews = await prisma.review.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      select: { createdAt: true }
    });

    const trend: { [key: string]: number } = {};
    
    reviews.forEach(review => {
      const date = review.createdAt.toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });

    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get book growth trend
   */
  private static async getBookGrowthTrend(): Promise<Array<{ date: string; count: number }>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const books = await prisma.book.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      select: { createdAt: true }
    });

    const trend: { [key: string]: number } = {};
    
    books.forEach(book => {
      const date = book.createdAt.toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });

    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get top genres
   */
  private static async getTopGenres(): Promise<Array<{ genre: string; count: number }>> {
    const genres = await prisma.genre.findMany({
      include: {
        _count: {
          select: { books: true }
        }
      },
      orderBy: {
        books: { _count: 'desc' }
      },
      take: 10
    });

    return genres.map(genre => ({
      genre: genre.name,
      count: genre._count.books
    }));
  }

  /**
   * Get top authors
   */
  private static async getTopAuthors(): Promise<Array<{ author: string; count: number }>> {
    const authors = await prisma.book.groupBy({
      by: ['author'],
      _count: { author: true },
      orderBy: { _count: { author: 'desc' } },
      take: 10
    });

    return authors.map(author => ({
      author: author.author,
      count: author._count.author
    }));
  }

  /**
   * Get top books
   */
  private static async getTopBooks(): Promise<Array<{ book: string; rating: number; reviews: number }>> {
    const books = await prisma.book.findMany({
      include: {
        reviews: {
          select: { rating: true }
        }
      },
      orderBy: {
        reviews: { _count: 'desc' }
      },
      take: 10
    });

    return books.map(book => {
      const ratings = book.reviews.map(r => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        book: book.title,
        rating: Math.round(averageRating * 10) / 10,
        reviews: ratings.length
      };
    });
  }

  /**
   * Calculate genre evolution
   */
  private static calculateGenreEvolution(reviews: any[]): Array<{ genre: string; count: number; trend: 'up' | 'down' | 'stable' }> {
    const genreCount: { [key: string]: number } = {};
    
    reviews.forEach(review => {
      review.book.genres.forEach((bg: any) => {
        const genreName = bg.genre.name;
        genreCount[genreName] = (genreCount[genreName] || 0) + 1;
      });
    });

    return Object.entries(genreCount)
      .map(([genre, count]) => ({
        genre,
        count,
        trend: 'stable' as const // Would need historical data for trend analysis
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Get user reading history
   */
  static async getUserReadingHistory(userId: string, page: number = 1, limit: number = 10) {
    try {
      const reviews = await prisma.review.findMany({
        where: { userId },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImageUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      return reviews.map(review => ({
        reviewId: review.id,
        book: (review as any).book,
        rating: review.rating,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }));
    } catch (error) {
      logger.error('Failed to get user reading history:', error);
      throw error;
    }
  }

  /**
   * Get genre analytics
   */
  static async getGenreAnalytics() {
    try {
      const reviews = await prisma.review.findMany({
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
        }
      });

      const genreStats: { [key: string]: { count: number; avgRating: number; totalReviews: number } } = {};

      reviews.forEach(review => {
        (review as any).book.genres.forEach((bookGenre: any) => {
          const genreName = bookGenre.genre.name;
          if (!genreStats[genreName]) {
            genreStats[genreName] = { count: 0, avgRating: 0, totalReviews: 0 };
          }
          genreStats[genreName].count += 1;
          genreStats[genreName].totalReviews += 1;
          genreStats[genreName].avgRating += review.rating;
        });
      });

      return Object.entries(genreStats).map(([genre, stats]) => ({
        genre,
        totalBooks: stats.count,
        totalReviews: stats.totalReviews,
        averageRating: stats.totalReviews > 0 ? Math.round((stats.avgRating / stats.totalReviews) * 10) / 10 : 0
      })).sort((a, b) => b.totalReviews - a.totalReviews);
    } catch (error) {
      logger.error('Failed to get genre analytics:', error);
      throw error;
    }
  }

  /**
   * Get author analytics
   */
  static async getAuthorAnalytics() {
    try {
      const reviews = await prisma.review.findMany({
        include: {
          book: {
            select: {
              author: true
            }
          }
        }
      });

      const authorStats: { [key: string]: { count: number; avgRating: number; totalReviews: number } } = {};

      reviews.forEach(review => {
        const author = (review as any).book.author;
        if (!authorStats[author]) {
          authorStats[author] = { count: 0, avgRating: 0, totalReviews: 0 };
        }
        authorStats[author].count += 1;
        authorStats[author].totalReviews += 1;
        authorStats[author].avgRating += review.rating;
      });

      return Object.entries(authorStats).map(([author, stats]) => ({
        author,
        totalBooks: stats.count,
        totalReviews: stats.totalReviews,
        averageRating: stats.totalReviews > 0 ? Math.round((stats.avgRating / stats.totalReviews) * 10) / 10 : 0
      })).sort((a, b) => b.totalReviews - a.totalReviews);
    } catch (error) {
      logger.error('Failed to get author analytics:', error);
      throw error;
    }
  }

  /**
   * Get trending books
   */
  static async getTrendingBooks(days: number = 7, limit: number = 10) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const reviews = await prisma.review.findMany({
        where: {
          createdAt: {
            gte: cutoffDate
          }
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImageUrl: true
            }
          }
        }
      });

      const bookStats: { [key: string]: { book: any; reviewCount: number; avgRating: number } } = {};

      reviews.forEach(review => {
        const bookId = (review as any).book.id;
        if (!bookStats[bookId]) {
          bookStats[bookId] = { book: (review as any).book, reviewCount: 0, avgRating: 0 };
        }
        bookStats[bookId].reviewCount += 1;
        bookStats[bookId].avgRating += review.rating;
      });

      return Object.values(bookStats)
        .map(stats => ({
          ...stats.book,
          reviewCount: stats.reviewCount,
          averageRating: stats.reviewCount > 0 ? Math.round((stats.avgRating / stats.reviewCount) * 10) / 10 : 0
        }))
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get trending books:', error);
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   */
  static async getUserEngagementMetrics() {
    try {
      const totalUsers = await prisma.user.count();
      const totalReviews = await prisma.review.count();
      const totalBooks = await prisma.book.count();
      const totalFollows = await prisma.userFollow.count();

      return {
        totalUsers,
        totalReviews,
        totalBooks,
        totalFollows,
        averageReviewsPerUser: totalUsers > 0 ? Math.round((totalReviews / totalUsers) * 10) / 10 : 0,
        averageBooksPerUser: totalUsers > 0 ? Math.round((totalBooks / totalUsers) * 10) / 10 : 0,
        averageFollowsPerUser: totalUsers > 0 ? Math.round((totalFollows / totalUsers) * 10) / 10 : 0
      };
    } catch (error) {
      logger.error('Failed to get user engagement metrics:', error);
      throw error;
    }
  }
}
