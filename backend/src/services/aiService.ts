import { GeminiService } from './geminiService';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

export interface RecommendationRequest {
  userId: string;
  limit?: number;
  context?: string;
}

export interface RecommendationResponse {
  books: Array<{
    id: string;
    title: string;
    author: string;
    coverImageUrl?: string;
    averageRating: number;
    totalReviews: number;
    reason: string;
    confidence: number;
  }>;
  explanation: string;
}

export interface SimilarBooksRequest {
  bookId: string;
  limit?: number;
}

export interface ReviewAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  themes: string[];
  quality: number; // 0-1 score
  summary: string;
}

export class AIService {
  /**
   * Generate personalized book recommendations using Gemini
   */
  static async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      return await GeminiService.generateRecommendations(request);
    } catch (error) {
      logger.error('AI recommendation generation failed:', error);
      // Fallback to trending books
      return await this.getTrendingBooksRecommendations(request.limit || 10);
    }
  }

  /**
   * Find similar books using Gemini analysis
   */
  static async findSimilarBooks(request: SimilarBooksRequest): Promise<RecommendationResponse> {
    try {
      return await GeminiService.findSimilarBooks(request);
    } catch (error) {
      logger.error('Similar books generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze review sentiment and themes using Gemini
   */
  static async analyzeReview(reviewText: string): Promise<ReviewAnalysis> {
    try {
      return await GeminiService.analyzeReview(reviewText);
    } catch (error) {
      logger.error('Review analysis failed:', error);
      return {
        sentiment: 'neutral',
        themes: [],
        quality: 0.5,
        summary: 'Analysis unavailable'
      };
    }
  }

  /**
   * Generate book descriptions using Gemini
   */
  static async generateBookDescription(title: string, author: string, existingDescription?: string): Promise<string> {
    try {
      return await GeminiService.generateText(`Generate a compelling book description for "${title}" by ${author}. ${existingDescription ? `Current description: ${existingDescription}. Please improve it.` : 'Create a new description.'}`);
    } catch (error) {
      logger.error('Book description generation failed:', error);
      return existingDescription || 'Description unavailable';
    }
  }

  /**
   * Get popular books as fallback
   */
  private static async getPopularBooksRecommendations(limit: number): Promise<RecommendationResponse> {
    const books = await prisma.book.findMany({
      take: limit,
      include: {
        reviews: { select: { rating: true } }
      },
      orderBy: {
        reviews: { _count: 'desc' }
      }
    });

    return {
      books: books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverImageUrl: book.coverImageUrl || undefined,
        averageRating: book.reviews.length > 0 
          ? Math.round((book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length) * 10) / 10
          : 0,
        totalReviews: book.reviews.length,
        reason: 'Popular among readers',
        confidence: 0.7
      })),
      explanation: 'Popular books recommended for new users'
    };
  }

  /**
   * Get trending books as fallback
   */
  private static async getTrendingBooksRecommendations(limit: number): Promise<RecommendationResponse> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const books = await prisma.book.findMany({
      where: {
        reviews: {
          some: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }
      },
      take: limit,
      include: {
        reviews: { select: { rating: true } }
      },
      orderBy: {
        reviews: { _count: 'desc' }
      }
    });

    return {
      books: books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        coverImageUrl: book.coverImageUrl || undefined,
        averageRating: book.reviews.length > 0 
          ? Math.round((book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length) * 10) / 10
          : 0,
        totalReviews: book.reviews.length,
        reason: 'Trending recently',
        confidence: 0.8
      })),
      explanation: 'Trending books from the last 30 days'
    };
  }
}
