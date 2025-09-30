import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

export interface RecommendationRequest {
  userId: string;
  limit?: number;
  context?: string;
}

export interface RecommendationResponse {
  books: any[];
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

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;
  private static model: any = null;

  /**
   * Initialize Gemini AI client
   */
  private static initializeGemini(): void {
    if (!config.geminiApiKey) {
      throw new Error('Gemini API key is not configured');
    }

    // Always create new instance to pick up environment changes
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.geminiModel });
  }

  /**
   * Generate text using Gemini AI
   */
  static async generateText(prompt: string): Promise<string> {
    try {
      this.initializeGemini();
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('Gemini text generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate JSON response using Gemini AI
   */
  static async generateJSON(
    prompt: string,
    schema?: any
  ): Promise<any> {
    try {
      this.initializeGemini();
      
      const jsonPrompt = schema 
        ? `${prompt}\n\nPlease respond with valid JSON matching this schema: ${JSON.stringify(schema)}`
        : `${prompt}\n\nPlease respond with valid JSON only.`;

      const result = await this.model.generateContent(jsonPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON found in response');
    } catch (error) {
      logger.error('Gemini JSON generation failed:', error);
      throw error;
    }
  }

  /**
   * Get user's reading data for recommendations
   */
  private static async getUserReadingData(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          reviews: {
            include: {
              book: {
                include: {
                  genres: {
                    include: {
                      genre: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          favorites: {
            include: {
              book: {
                include: {
                  genres: {
                    include: {
                      genre: true,
                    },
                  },
                },
              },
            },
            take: 10,
          },
        },
      });

      if (!user) return null;

      // Extract favorite genres from reviewed books
      const favoriteGenres = new Set<string>();
      user.reviews.forEach((review: any) => {
        review.book.genres.forEach((bg: any) => {
          favoriteGenres.add(bg.genre.name);
        });
      });

      const reviewedBooks = user.reviews.map((review: any) => ({
        title: review.book.title,
        author: review.book.author,
        genres: review.book.genres.map((bg: any) => bg.genre.name),
        rating: review.rating,
        reviewText: review.reviewText,
      }));

      return {
        userId: user.id,
        email: user.email,
        reviewCount: user.reviews.length,
        favoriteGenres: Array.from(favoriteGenres),
        reviewedBooks,
        averageRating: user.reviews.length > 0 
          ? user.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / user.reviews.length 
          : 0,
      };
    } catch (error) {
      logger.error('Failed to get user reading data:', error);
      return null;
    }
  }

  /**
   * Build recommendation context for Gemini
   */
  private static buildRecommendationContext(userData: any, context?: string): string {
    const recentBooks = userData.reviewedBooks.slice(0, 10);
    const bookList = recentBooks.map((book: any) => 
      `- "${book.title}" by ${book.author} (${book.genres.join(', ')}) - Rating: ${book.rating}/5`
    ).join('\n');

    return `You are a book recommendation expert. Based on the user's reading history and preferences, suggest ${userData.limit || 10} personalized book recommendations.

User Profile:
- Email: ${userData.email}
- Total books reviewed: ${userData.reviewCount}
- Favorite genres: ${userData.favoriteGenres.join(', ')}
- Average rating given: ${userData.averageRating.toFixed(1)}/5

Recent Reading History:
${bookList}

${context ? `Additional Context: ${context}` : ''}

Please provide book recommendations that:
1. Match their favorite genres and reading patterns
2. Consider their rating preferences (they tend to rate books ${userData.averageRating >= 4 ? 'highly' : userData.averageRating >= 3 ? 'moderately' : 'variably'})
3. Suggest diverse but relevant options
4. Include both popular and lesser-known books

Respond with a JSON object containing:
{
  "recommendations": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "reason": "Why this book matches their preferences",
      "genres": ["Genre1", "Genre2"],
      "estimatedRating": 4.5
    }
  ],
  "explanation": "Brief explanation of the recommendation strategy"
}`;
  }

  /**
   * Find matching books in database
   */
  private static async findMatchingBooks(recommendations: any, limit: number): Promise<any[]> {
    try {
      const bookTitles = recommendations.recommendations.map((rec: any) => rec.title);
      
      const books = await prisma.book.findMany({
        where: {
          OR: [
            { title: { in: bookTitles, mode: 'insensitive' } },
            { author: { in: recommendations.recommendations.map((rec: any) => rec.author), mode: 'insensitive' } },
          ],
        },
        include: {
          genres: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        take: limit * 2, // Get more to filter
      });

      // Match recommendations with database books
      const matchedBooks = recommendations.recommendations.map((rec: any) => {
        const book = books.find(b => 
          b.title.toLowerCase().includes(rec.title.toLowerCase()) ||
          b.author.toLowerCase().includes(rec.author.toLowerCase())
        );
        
        if (book) {
          const avgRating = book.reviews.length > 0 
            ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length 
            : 0;
          
          return {
            ...book,
            recommendationReason: rec.reason,
            estimatedRating: rec.estimatedRating,
            averageRating: avgRating,
          };
        }
        return null;
      }).filter(Boolean);

      return matchedBooks.slice(0, limit);
    } catch (error) {
      logger.error('Failed to find matching books:', error);
      return [];
    }
  }

  /**
   * Generate personalized book recommendations using Gemini
   */
  static async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const { userId, limit = 10, context } = request;

      // Get user's reading history and preferences
      const userData = await this.getUserReadingData(userId);
      
      if (!userData) {
        // Fallback to popular books for new users
        return await this.getPopularBooksRecommendations(limit);
      }

      // Add limit to userData for context building
      userData.limit = limit;

      // Prepare context for Gemini
      const geminiContext = this.buildRecommendationContext(userData, context);

      // Call Gemini for recommendations
      const recommendations = await GeminiService.generateJSON(geminiContext);

      // Find matching books in database
      const recommendedBooks = await this.findMatchingBooks(recommendations, limit);

      return {
        books: recommendedBooks,
        explanation: recommendations.explanation || `Based on your reading history of ${userData.reviewCount} books and preferences for ${userData.favoriteGenres.join(', ')}, here are personalized recommendations.`,
      };
    } catch (error) {
      logger.error('Gemini recommendation generation failed:', error);
      // Fallback to trending books
      return await this.getTrendingBooksRecommendations(5);
    }
  }

  /**
   * Find similar books using Gemini analysis
   */
  static async findSimilarBooks(request: SimilarBooksRequest): Promise<RecommendationResponse> {
    try {
      const { bookId, limit = 5 } = request;

      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          genres: true,
          reviews: {
            include: {
              user: true,
            },
            take: 10,
          },
        },
      });

      if (!book) {
        throw new Error('Book not found');
      }

      const reviews = book.reviews.map((review: any) => review.reviewText).join('\n');
      const genres = book.genres.map((bg: any) => bg.genre.name).join(', ');

      const prompt = `Find books similar to "${book.title}" by ${book.author}.

Book Details:
- Title: ${book.title}
- Author: ${book.author}
- Genres: ${genres}
- Description: ${book.description || 'No description available'}

Sample Reviews:
${reviews}

Please suggest ${limit} similar books that share:
1. Similar themes or genres
2. Comparable writing style or tone
3. Similar target audience
4. Related subject matter

Respond with JSON:
{
  "similarBooks": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "reason": "Why this book is similar",
      "similarityScore": 0.9
    }
  ],
  "explanation": "Brief explanation of similarity criteria"
}`;

      const recommendations = await this.generateJSON(prompt);
      const recommendedBooks = await this.findMatchingBooks(recommendations, limit);

      return {
        books: recommendedBooks,
        explanation: recommendations.explanation || `Books similar to "${book.title}" based on genre, themes, and style.`,
      };
    } catch (error) {
      logger.error('Gemini similar books generation failed:', error);
      return await this.getTrendingBooksRecommendations(5);
    }
  }

  /**
   * Analyze book review sentiment and themes
   */
  static async analyzeReview(reviewText: string): Promise<ReviewAnalysis> {
    try {
      const prompt = `Analyze this book review and provide insights:

Review: "${reviewText}"

Please analyze:
1. Sentiment (positive, negative, or neutral)
2. Main themes mentioned
3. Overall quality assessment (0-1 score)
4. Brief summary

Respond with JSON:
{
  "sentiment": "positive|negative|neutral",
  "themes": ["theme1", "theme2"],
  "quality": 0.8,
  "summary": "Brief summary of the review"
}`;

      const analysis = await this.generateJSON(prompt);
      
      return {
        sentiment: analysis.sentiment || 'neutral',
        themes: analysis.themes || [],
        quality: analysis.quality || 0.5,
        summary: analysis.summary || 'Review analysis completed',
      };
    } catch (error) {
      logger.error('Gemini review analysis failed:', error);
      return {
        sentiment: 'neutral',
        themes: [],
        quality: 0.5,
        summary: 'Analysis failed',
      };
    }
  }

  /**
   * Get popular books as fallback recommendations
   */
  private static async getPopularBooksRecommendations(limit: number): Promise<RecommendationResponse> {
    try {
      const books = await prisma.book.findMany({
        include: {
          genres: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: {
          reviews: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return {
        books: books.map(book => ({
          ...book,
          averageRating: book.reviews.length > 0 
            ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length 
            : 0,
          recommendationReason: 'Popular among readers',
        })),
        explanation: 'Popular books based on review count',
      };
    } catch (error) {
      logger.error('Failed to get popular books:', error);
      return { books: [], explanation: 'No recommendations available' };
    }
  }

  /**
   * Moderate content using Gemini AI
   */
  static async moderateContent(content: string, contentType: 'review' | 'comment'): Promise<{
    isAppropriate: boolean;
    confidence: number;
    reasons: string[];
    suggestedAction: 'approve' | 'reject' | 'edit';
  }> {
    try {
      this.initializeGemini();
      
      const prompt = `Analyze this ${contentType} for inappropriate content:

Content: "${content}"

Please check for:
1. Hate speech or discrimination
2. Spam or promotional content
3. Offensive language
4. Personal attacks
5. Inappropriate sexual content
6. Violence or threats

Respond with JSON:
{
  "isAppropriate": true/false,
  "confidence": 0.0-1.0,
  "reasons": ["reason1", "reason2"],
  "suggestedAction": "approve|reject|edit"
}`;

      const analysis = await this.generateJSON(prompt);
      
      return {
        isAppropriate: analysis.isAppropriate || false,
        confidence: analysis.confidence || 0.5,
        reasons: analysis.reasons || [],
        suggestedAction: analysis.suggestedAction || 'approve',
      };
    } catch (error) {
      logger.error('Gemini content moderation failed:', error);
      return {
        isAppropriate: true,
        confidence: 0.3,
        reasons: ['AI analysis failed'],
        suggestedAction: 'approve',
      };
    }
  }
  private static async getTrendingBooksRecommendations(limit: number): Promise<RecommendationResponse> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const books = await prisma.book.findMany({
        include: {
          genres: true,
          reviews: {
            where: {
              createdAt: {
                gte: thirtyDaysAgo,
              },
            },
            select: {
              rating: true,
            },
          },
        },
        orderBy: {
          reviews: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return {
        books: books.map(book => ({
          ...book,
          averageRating: book.reviews.length > 0 
            ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length 
            : 0,
          recommendationReason: 'Trending recently',
        })),
        explanation: 'Trending books based on recent reviews',
      };
    } catch (error) {
      logger.error('Failed to get trending books:', error);
      return { books: [], explanation: 'No recommendations available' };
    }
  }
}
