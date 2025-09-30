import { AIService } from '@/services/aiService';
import { GeminiService } from '@/services/geminiService';

// Mock dependencies
vi.mock('@/services/geminiService');
vi.mock('@/config/database', () => ({
  prisma: {
    book: {
      findMany: vi.fn()
    }
  }
}));
vi.mock('@/utils/logger');

const mockGeminiService = GeminiService as vi.Mocked<typeof GeminiService>;

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations using OllamaService', async () => {
      const request = {
        userId: 'user-123',
        limit: 5,
        context: 'science fiction'
      };

      const mockResponse = {
        books: [
          {
            id: 'book-1',
            title: 'Dune',
            author: 'Frank Herbert',
            coverImageUrl: 'https://example.com/dune.jpg',
            averageRating: 4.5,
            totalReviews: 100,
            reason: 'Based on your reading history',
            confidence: 0.9
          }
        ],
        explanation: 'AI-generated recommendations'
      };

      mockGeminiService.generateRecommendations.mockResolvedValue(mockResponse);

      const result = await AIService.generateRecommendations(request);

      expect(result).toEqual(mockResponse);
      expect(mockGeminiService.generateRecommendations).toHaveBeenCalledWith(request);
    });

    it('should fallback to trending books when GeminiService fails', async () => {
      const request = {
        userId: 'user-123',
        limit: 3
      };

      const mockBooks = [
        {
          id: 'book-1',
          title: 'Book 1',
          author: 'Author 1',
          coverImageUrl: null,
          reviews: [{ rating: 4 }, { rating: 5 }]
        },
        {
          id: 'book-2',
          title: 'Book 2',
          author: 'Author 2',
          coverImageUrl: 'https://example.com/book2.jpg',
          reviews: [{ rating: 3 }]
        }
      ];

      const { prisma } = require('@/config/database');
      prisma.book.findMany.mockResolvedValue(mockBooks);

      mockGeminiService.generateRecommendations.mockRejectedValue(new Error('Gemini service unavailable'));

      const result = await AIService.generateRecommendations(request);

      expect(result.books).toHaveLength(2);
      expect(result.books[0]).toEqual({
        id: 'book-1',
        title: 'Book 1',
        author: 'Author 1',
        coverImageUrl: undefined,
        averageRating: 4.5,
        totalReviews: 2,
        reason: 'Trending recently',
        confidence: 0.8
      });
      expect(result.explanation).toBe('Trending books from the last 30 days');
    });
  });

  describe('findSimilarBooks', () => {
    it('should find similar books using GeminiService', async () => {
      const request = {
        bookId: 'book-123',
        limit: 5
      };

      const mockResponse = {
        books: [
          {
            id: 'book-2',
            title: 'Similar Book',
            author: 'Author',
            coverImageUrl: 'https://example.com/similar.jpg',
            averageRating: 4.0,
            totalReviews: 50,
            reason: 'Similar themes and style',
            confidence: 0.8
          }
        ],
        explanation: 'Books with similar themes'
      };

      mockGeminiService.findSimilarBooks.mockResolvedValue(mockResponse);

      const result = await AIService.findSimilarBooks(request);

      expect(result).toEqual(mockResponse);
      expect(mockGeminiService.findSimilarBooks).toHaveBeenCalledWith(request);
    });

    it('should throw error when GeminiService fails', async () => {
      const request = {
        bookId: 'book-123',
        limit: 5
      };

      mockGeminiService.findSimilarBooks.mockRejectedValue(new Error('Gemini service error'));

      await expect(AIService.findSimilarBooks(request)).rejects.toThrow('Gemini service error');
    });
  });

  describe('analyzeReview', () => {
    it('should analyze review using GeminiService', async () => {
      const reviewText = 'This book was amazing! Great plot and characters.';

      const mockAnalysis = {
        sentiment: 'positive' as const,
        themes: ['plot', 'characters'],
        quality: 0.9,
        summary: 'Highly positive review praising plot and characters'
      };

      mockGeminiService.analyzeReview.mockResolvedValue(mockAnalysis);

      const result = await AIService.analyzeReview(reviewText);

      expect(result).toEqual(mockAnalysis);
      expect(mockGeminiService.analyzeReview).toHaveBeenCalledWith(reviewText);
    });

    it('should return fallback analysis when GeminiService fails', async () => {
      const reviewText = 'This book was amazing!';

      mockGeminiService.analyzeReview.mockRejectedValue(new Error('Gemini service error'));

      const result = await AIService.analyzeReview(reviewText);

      expect(result).toEqual({
        sentiment: 'neutral',
        themes: [],
        quality: 0.5,
        summary: 'Analysis unavailable'
      });
    });
  });

  describe('generateBookDescription', () => {
    it('should generate description using GeminiService', async () => {
      const title = 'Test Book';
      const author = 'Test Author';
      const existingDescription = 'Old description';

      const mockDescription = 'AI-generated book description';

      mockGeminiService.generateText.mockResolvedValue(mockDescription);

      const result = await AIService.generateBookDescription(title, author, existingDescription);

      expect(result).toBe(mockDescription);
      expect(mockGeminiService.generateText).toHaveBeenCalledWith(`Generate a compelling book description for "${title}" by ${author}. Current description: ${existingDescription}. Please improve it.`);
    });

    it('should return existing description when GeminiService fails', async () => {
      const title = 'Test Book';
      const author = 'Test Author';
      const existingDescription = 'Existing description';

      mockGeminiService.generateText.mockRejectedValue(new Error('Gemini service error'));

      const result = await AIService.generateBookDescription(title, author, existingDescription);

      expect(result).toBe(existingDescription);
    });

    it('should return fallback message when GeminiService fails and no existing description', async () => {
      const title = 'Test Book';
      const author = 'Test Author';

      mockGeminiService.generateText.mockRejectedValue(new Error('Gemini service error'));

      const result = await AIService.generateBookDescription(title, author);

      expect(result).toBe('Description unavailable');
    });
  });
});
