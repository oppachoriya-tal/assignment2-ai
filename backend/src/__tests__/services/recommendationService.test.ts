import { RecommendationService } from '@/services/recommendationService';
import { prisma } from '@/config/database';
import { AIService } from '@/services/aiService';
import { logger } from '@/utils/logger';

vi.mock('@/config/database', () => ({
  prisma: {
    book: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

vi.mock('@/services/aiService', () => ({
  AIService: {
    generateRecommendations: vi.fn(),
    findSimilarBooks: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const mockPrisma = prisma as vi.Mocked<typeof prisma>;
const mockAIService = AIService as vi.Mocked<typeof AIService>;
const mockLogger = logger as vi.Mocked<typeof logger>;

// Create typed mocks for Prisma methods
const mockBookFindMany = mockPrisma.book.findMany as vi.MockedFunction<typeof prisma.book.findMany>;
const mockBookFindUnique = mockPrisma.book.findUnique as vi.MockedFunction<typeof prisma.book.findUnique>;
const mockReviewFindMany = mockPrisma.review.findMany as vi.MockedFunction<typeof prisma.review.findMany>;
const mockReviewGroupBy = mockPrisma.review.groupBy as vi.MockedFunction<typeof prisma.review.groupBy>;
const mockReviewAggregate = mockPrisma.review.aggregate as vi.MockedFunction<typeof prisma.review.aggregate>;

describe('RecommendationService', () => {
  let recommendationService: RecommendationService;

  beforeEach(() => {
    vi.clearAllMocks();
    recommendationService = new RecommendationService();
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations using AI and collaborative filtering', async () => {
      const userId = 'user-123';
      const limit = 10;

      const mockAIRecommendations = {
        books: [
          { id: 'book-1', title: 'AI Book 1', author: 'Author 1' },
          { id: 'book-2', title: 'AI Book 2', author: 'Author 2' },
        ],
      };

      const mockCollaborativeRecommendations = [
        { id: 'book-3', title: 'Collaborative Book 1', author: 'Author 3' },
        { id: 'book-4', title: 'Collaborative Book 2', author: 'Author 4' },
      ];

      mockAIService.generateRecommendations.mockResolvedValue(mockAIRecommendations as any);
      
      // Mock collaborative filtering by mocking the private method indirectly
      vi.spyOn(recommendationService as any, 'getCollaborativeRecommendations')
        .mockResolvedValue(mockCollaborativeRecommendations);

      const result = await recommendationService.generateRecommendations(userId, limit);

      expect(mockAIService.generateRecommendations).toHaveBeenCalledWith({
        userId,
        limit: 6, // 60% of 10
      });

      expect(result).toHaveLength(4);
      expect(result[0]).toHaveProperty('id', 'book-1');
      expect(result[1]).toHaveProperty('id', 'book-2');
      expect(result[2]).toHaveProperty('id', 'book-3');
      expect(result[3]).toHaveProperty('id', 'book-4');
    });

    it('should fallback to trending books on error', async () => {
      const userId = 'user-123';
      const limit = 10;

      mockAIService.generateRecommendations.mockRejectedValue(new Error('AI service error'));
      
      // Mock trending books fallback
      const mockTrendingBooks = [
        { id: 'trending-1', title: 'Trending Book 1', author: 'Author 1' },
      ];

      vi.spyOn(recommendationService, 'getTrendingBooks')
        .mockResolvedValue(mockTrendingBooks as any);

      const result = await recommendationService.generateRecommendations(userId, limit);

      expect(mockLogger.error).toHaveBeenCalledWith('Recommendation generation failed:', expect.any(Error));
      expect(recommendationService.getTrendingBooks).toHaveBeenCalledWith(limit);
      expect(result).toEqual(mockTrendingBooks);
    });
  });

  describe('getSimilarBooks', () => {
    it('should get similar books using AI service', async () => {
      const bookId = 'book-123';
      const limit = 5;

      const mockSimilarBooks = {
        books: [
          { id: 'similar-1', title: 'Similar Book 1', author: 'Author 1' },
          { id: 'similar-2', title: 'Similar Book 2', author: 'Author 2' },
        ],
      };

      mockAIService.findSimilarBooks.mockResolvedValue(mockSimilarBooks as any);

      const result = await recommendationService.getSimilarBooks(bookId, limit);

      expect(mockAIService.findSimilarBooks).toHaveBeenCalledWith({ bookId, limit });
      expect(result).toEqual(mockSimilarBooks.books);
    });

    it('should fallback to content-based filtering on AI error', async () => {
      const bookId = 'book-123';
      const limit = 5;

      mockAIService.findSimilarBooks.mockRejectedValue(new Error('AI service error'));
      
      // Mock content-based fallback
      const mockContentBasedBooks = [
        { id: 'content-1', title: 'Content Book 1', author: 'Author 1' },
      ];

      vi.spyOn(recommendationService as any, 'getContentBasedSimilarBooks')
        .mockResolvedValue(mockContentBasedBooks);

      const result = await recommendationService.getSimilarBooks(bookId, limit);

      expect(mockLogger.error).toHaveBeenCalledWith('Similar books generation failed:', expect.any(Error));
      expect(result).toEqual(mockContentBasedBooks);
    });
  });

  describe('getTrendingBooks', () => {
    it('should return trending books based on recent reviews', async () => {
      const limit = 10;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const mockBooks = [
        {
          id: 'book-1',
          title: 'Trending Book 1',
          author: 'Author 1',
          coverImageUrl: 'cover1.jpg',
          genres: [{ genre: { name: 'Fiction' } }],
          reviews: [
            { rating: 4, createdAt: new Date() },
            { rating: 5, createdAt: new Date() },
          ],
        },
        {
          id: 'book-2',
          title: 'Trending Book 2',
          author: 'Author 2',
          coverImageUrl: 'cover2.jpg',
          genres: [{ genre: { name: 'Mystery' } }],
          reviews: [
            { rating: 3, createdAt: new Date() },
          ],
        },
      ];

      mockBookFindMany.mockResolvedValue(mockBooks as any);

      const result = await recommendationService.getTrendingBooks(limit);

      expect(mockBookFindMany).toHaveBeenCalledWith({
        where: {
          reviews: {
            some: {
              createdAt: { gte: expect.any(Date) },
            },
          },
        },
        take: limit,
        include: {
          genres: {
            include: { genre: true },
          },
          reviews: {
            select: { rating: true, createdAt: true },
          },
        },
        orderBy: {
          reviews: { _count: 'desc' },
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'book-1');
      expect(result[0]).toHaveProperty('averageRating', 4.5);
      expect(result[0]).toHaveProperty('totalReviews', 2);
      expect(result[0]).toHaveProperty('genres', ['Fiction']);
      expect(result[0]).toHaveProperty('reason', 'Trending based on recent reviews');
      expect(result[0]).toHaveProperty('confidence', 0.8);
    });

    it('should handle books with no reviews', async () => {
      const limit = 10;

      const mockBooks = [
        {
          id: 'book-1',
          title: 'Book with no reviews',
          author: 'Author 1',
          coverImageUrl: 'cover1.jpg',
          genres: [{ genre: { name: 'Fiction' } }],
          reviews: [],
        },
      ];

      mockBookFindMany.mockResolvedValue(mockBooks as any);

      const result = await recommendationService.getTrendingBooks(limit);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('averageRating', 0);
      expect(result[0]).toHaveProperty('totalReviews', 0);
    });

    it('should return empty array on error', async () => {
      const limit = 10;

      mockBookFindMany.mockRejectedValue(new Error('Database error'));

      const result = await recommendationService.getTrendingBooks(limit);

      expect(mockLogger.error).toHaveBeenCalledWith('Trending books generation failed:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('getGenreRecommendations', () => {
    it('should return books from specific genre', async () => {
      const genreId = 'genre-123';
      const limit = 10;

      const mockBooks = [
        {
          id: 'book-1',
          title: 'Genre Book 1',
          author: 'Author 1',
          coverImageUrl: 'cover1.jpg',
          genres: [{ genre: { name: 'Fiction' } }],
          reviews: [{ rating: 4, createdAt: new Date() }],
        },
      ];

      mockBookFindMany.mockResolvedValue(mockBooks as any);

      const result = await recommendationService.getGenreRecommendations(genreId, limit);

      expect(mockBookFindMany).toHaveBeenCalledWith({
        where: {
          genres: {
            some: { genreId },
          },
        },
        take: limit,
        include: {
          genres: {
            include: { genre: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: {
          reviews: { _count: 'desc' },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'book-1');
      expect(result[0]).toHaveProperty('reason', 'Popular in this genre');
    });

    it('should return empty array on error', async () => {
      const genreId = 'genre-123';
      const limit = 10;

      mockBookFindMany.mockRejectedValue(new Error('Database error'));

      const result = await recommendationService.getGenreRecommendations(genreId, limit);

      expect(mockLogger.error).toHaveBeenCalledWith('Genre recommendations failed:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });

  describe('getNewReleases', () => {
    it('should return recently published books', async () => {
      const limit = 10;
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const mockBooks = [
        {
          id: 'book-1',
          title: 'New Release 1',
          author: 'Author 1',
          coverImageUrl: 'cover1.jpg',
          publishedYear: 2024,
          genres: [{ genre: { name: 'Fiction' } }],
          reviews: [{ rating: 4 }],
        },
      ];

      mockBookFindMany.mockResolvedValue(mockBooks as any);

      const result = await recommendationService.getNewReleases(limit);

      expect(mockBookFindMany).toHaveBeenCalledWith({
        where: {
          publishedYear: {
            gte: oneYearAgo.getFullYear(),
          },
        },
        take: limit,
        include: {
          genres: {
            include: { genre: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: {
          publishedYear: 'desc',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'book-1');
      expect(result[0]).toHaveProperty('reason', 'Recently published');
    });

    it('should return empty array on error', async () => {
      const limit = 10;

      mockBookFindMany.mockRejectedValue(new Error('Database error'));

      const result = await recommendationService.getNewReleases(limit);

      expect(mockLogger.error).toHaveBeenCalledWith('New releases recommendations failed:', expect.any(Error));
      expect(result).toEqual([]);
    });
  });
});
