import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AIService } from './aiService';

export interface RecommendationEngine {
  generateRecommendations(userId: string, limit?: number): Promise<any[]>;
  getSimilarBooks(bookId: string, limit?: number): Promise<any[]>;
  getTrendingBooks(limit?: number): Promise<any[]>;
}

export class RecommendationService implements RecommendationEngine {
  /**
   * Generate personalized recommendations using multiple algorithms
   */
  async generateRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    try {
      // Try AI-powered recommendations first
      const aiRecommendations = await AIService.generateRecommendations({
        userId,
        limit: Math.ceil(limit * 0.6) // 60% from AI
      });

      // Fill remaining with collaborative filtering
      const collaborativeRecommendations = await this.getCollaborativeRecommendations(
        userId, 
        Math.ceil(limit * 0.4) // 40% from collaborative
      );

      // Combine and deduplicate
      const allRecommendations = [...aiRecommendations.books, ...collaborativeRecommendations];
      const uniqueRecommendations = this.deduplicateRecommendations(allRecommendations);

      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      logger.error('Recommendation generation failed:', error);
      // Fallback to trending books
      return await this.getTrendingBooks(limit);
    }
  }

  /**
   * Get similar books using content-based filtering
   */
  async getSimilarBooks(bookId: string, limit: number = 5): Promise<any[]> {
    try {
      const aiSimilar = await AIService.findSimilarBooks({ bookId, limit });
      return aiSimilar.books;
    } catch (error) {
      logger.error('Similar books generation failed:', error);
      return await this.getContentBasedSimilarBooks(bookId, limit);
    }
  }

  /**
   * Get trending books based on recent activity
   */
  async getTrendingBooks(limit: number = 10): Promise<any[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendingBooks = await prisma.book.findMany({
        where: {
          reviews: {
            some: {
              createdAt: { gte: thirtyDaysAgo }
            }
          }
        },
        take: limit,
        include: {
          genres: {
            include: { genre: true }
          },
          reviews: {
            select: { rating: true, createdAt: true }
          }
        },
        orderBy: {
          reviews: { _count: 'desc' }
        }
      });

      return trendingBooks.map(book => {
        const ratings = book.reviews.map(r => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          coverImageUrl: book.coverImageUrl,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: ratings.length,
          genres: book.genres.map(g => g.genre.name),
          trendingScore: this.calculateTrendingScore(book.reviews),
          reason: 'Trending based on recent reviews',
          confidence: 0.8
        };
      });
    } catch (error) {
      logger.error('Trending books generation failed:', error);
      return [];
    }
  }

  /**
   * Collaborative filtering based on user behavior
   */
  private async getCollaborativeRecommendations(userId: string, limit: number): Promise<any[]> {
    try {
      // Find users with similar reading patterns
      const userReviews = await prisma.review.findMany({
        where: { userId },
        select: { bookId: true, rating: true }
      });

      if (userReviews.length === 0) {
        return [];
      }

      // Find books rated highly by users who liked similar books
      const similarUsers = await prisma.review.groupBy({
        by: ['userId'],
        where: {
          AND: [
            { userId: { not: userId } },
            {
              bookId: { in: userReviews.map(r => r.bookId) }
            }
          ]
        },
        having: {
          userId: {
            _count: {
              gte: Math.min(3, userReviews.length)
            }
          }
        }
      });

      if (similarUsers.length === 0) {
        return [];
      }

      // Get highly rated books from similar users
      const recommendations = await prisma.review.findMany({
        where: {
          AND: [
            { userId: { in: similarUsers.map(u => u.userId) } },
            { rating: { gte: 4 } },
            { bookId: { notIn: userReviews.map(r => r.bookId) } }
          ]
        },
        include: {
          book: {
            include: {
              reviews: { select: { rating: true } }
            }
          }
        },
        take: limit * 2
      });

      // Score and rank recommendations
      const scoredRecommendations = recommendations.map(rec => {
        const ratings = rec.book.reviews.map(r => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          id: rec.book.id,
          title: rec.book.title,
          author: rec.book.author,
          coverImageUrl: rec.book.coverImageUrl,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: ratings.length,
          reason: 'Recommended by users with similar taste',
          confidence: 0.7,
          score: rec.rating * (averageRating / 5)
        };
      });

      return scoredRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Collaborative filtering failed:', error);
      return [];
    }
  }

  /**
   * Content-based filtering for similar books
   */
  private async getContentBasedSimilarBooks(bookId: string, limit: number): Promise<any[]> {
    try {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          genres: { include: { genre: true } }
        }
      });

      if (!book) {
        return [];
      }

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
        take: limit,
        include: {
          genres: { include: { genre: true } },
          reviews: { select: { rating: true } }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return similarBooks.map(book => {
        const ratings = book.reviews.map(r => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          coverImageUrl: book.coverImageUrl,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: ratings.length,
          genres: book.genres.map(g => g.genre.name),
          reason: 'Similar genre and themes',
          confidence: 0.6
        };
      });
    } catch (error) {
      logger.error('Content-based filtering failed:', error);
      return [];
    }
  }

  /**
   * Calculate trending score based on recent reviews
   */
  private calculateTrendingScore(reviews: any[]): number {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentReviews = reviews.filter(r => r.createdAt >= thirtyDaysAgo);
    const recentCount = recentReviews.length;
    const totalCount = reviews.length;
    
    // Weight recent activity more heavily
    return (recentCount * 2 + totalCount) / (totalCount + 1);
  }

  /**
   * Remove duplicate recommendations
   */
  private deduplicateRecommendations(recommendations: any[]): any[] {
    const seen = new Set();
    return recommendations.filter(rec => {
      if (seen.has(rec.id)) {
        return false;
      }
      seen.add(rec.id);
      return true;
    });
  }

  /**
   * Get genre-based recommendations
   */
  async getGenreRecommendations(genreId: string, limit: number = 10): Promise<any[]> {
    try {
      const books = await prisma.book.findMany({
        where: {
          genres: {
            some: { genreId }
          }
        },
        take: limit,
        include: {
          genres: { include: { genre: true } },
          reviews: { select: { rating: true } }
        },
        orderBy: {
          reviews: { _count: 'desc' }
        }
      });

      return books.map(book => {
        const ratings = book.reviews.map(r => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          coverImageUrl: book.coverImageUrl,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: ratings.length,
          genres: book.genres.map(g => g.genre.name),
          reason: 'Popular in this genre',
          confidence: 0.7
        };
      });
    } catch (error) {
      logger.error('Genre recommendations failed:', error);
      return [];
    }
  }

  /**
   * Get new releases recommendations
   */
  async getNewReleases(limit: number = 10): Promise<any[]> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const newBooks = await prisma.book.findMany({
        where: {
          publishedYear: {
            gte: oneYearAgo.getFullYear()
          }
        },
        take: limit,
        include: {
          genres: { include: { genre: true } },
          reviews: { select: { rating: true } }
        },
        orderBy: {
          publishedYear: 'desc'
        }
      });

      return newBooks.map(book => {
        const ratings = book.reviews.map(r => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          coverImageUrl: book.coverImageUrl,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: ratings.length,
          genres: book.genres.map(g => g.genre.name),
          publishedYear: book.publishedYear,
          reason: 'Recently published',
          confidence: 0.6
        };
      });
    } catch (error) {
      logger.error('New releases recommendations failed:', error);
      return [];
    }
  }
}
