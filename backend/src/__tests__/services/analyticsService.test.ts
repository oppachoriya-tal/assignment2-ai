import { AnalyticsService } from '../../services/analyticsService';
import { prisma } from '../../config/database';

// Mock the database
vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    book: {
      findUnique: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    review: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    userFollow: {
      count: vi.fn(),
    },
    userFavorite: {
      count: vi.fn(),
    },
    genre: {
      findMany: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockPrisma = prisma as vi.Mocked<typeof prisma>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserAnalytics', () => {
    it('should return user analytics successfully', async () => {
      const mockUser = {
        id: 'user-1',
        createdAt: new Date('2023-01-01'),
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            reviewText: 'Great book!',
            createdAt: new Date('2023-06-01'),
            book: {
              pageCount: 300,
              genres: [
                { genre: { name: 'Fiction' } }
              ]
            }
          },
          {
            id: 'review-2',
            rating: 4,
            reviewText: 'Good book',
            createdAt: new Date('2023-07-01'),
            book: {
              pageCount: 250,
              genres: [
                { genre: { name: 'Mystery' } }
              ]
            }
          }
        ],
        favorites: [
          { id: 'fav-1', bookId: 'book-1' }
        ],
        followers: [
          { id: 'follower-1' }
        ],
        following: [
          { id: 'following-1' }
        ]
      };

      (mockPrisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser as any);
      (mockPrisma.userFollow.count as vi.Mock).mockResolvedValue(1);
      (mockPrisma.userFavorite.count as vi.Mock).mockResolvedValue(1);
      (mockPrisma.review.count as vi.Mock).mockResolvedValue(2); // For booksReadThisYear

      const result = await AnalyticsService.getUserAnalytics('user-1');

      expect(result).toEqual({
        userId: 'user-1',
        totalReviews: 2,
        averageRatingGiven: 4.5,
        favoriteGenres: ['Fiction', 'Mystery'],
        readingStreak: 0,
        booksReadThisYear: 2,
        totalPagesRead: 550,
        averageReviewLength: 10,
        helpfulReviewsCount: 0,
        followersCount: 1,
        followingCount: 1,
        joinedDate: mockUser.createdAt,
        lastActivity: mockUser.createdAt
      });
    });

    it('should throw error when user not found', async () => {
      (mockPrisma.user.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(AnalyticsService.getUserAnalytics('nonexistent-user'))
        .rejects.toThrow('User not found');
    });

    it('should handle user with no reviews', async () => {
      const mockUser = {
        id: 'user-1',
        createdAt: new Date('2023-01-01'),
        reviews: [],
        favorites: [],
        followers: [],
        following: []
      };

      (mockPrisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser as any);
      (mockPrisma.userFollow.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.userFavorite.count as vi.Mock).mockResolvedValue(0);

      const result = await AnalyticsService.getUserAnalytics('user-1');

      expect(result.totalReviews).toBe(0);
      expect(result.averageRatingGiven).toBe(0);
      expect(result.totalPagesRead).toBe(0);
      expect(result.averageReviewLength).toBe(0);
    });
  });

  describe('getBookAnalytics', () => {
    it('should return book analytics successfully', async () => {
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            createdAt: new Date('2023-06-01'),
            helpfulCount: 10
          },
          {
            id: 'review-2',
            rating: 4,
            createdAt: new Date('2023-07-01'),
            helpfulCount: 5
          }
        ],
        genres: [
          { genre: { name: 'Fiction' } }
        ]
      };

      (mockPrisma.book.findUnique as vi.Mock).mockResolvedValue(mockBook as any);
      (mockPrisma.userFavorite.count as vi.Mock).mockResolvedValue(5);
      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue(mockBook.reviews); // For calculateReviewTrend

      const result = await AnalyticsService.getBookAnalytics('book-1');

      expect(result.bookId).toBe('book-1');
      expect(result.totalReviews).toBe(2);
      expect(result.averageRating).toBe(4.5);
      expect(result.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 1
      });
      expect(result.helpfulReviewsCount).toBe(NaN);
      expect(result.genrePerformance).toEqual(['Fiction']);
    });

    it('should throw error when book not found', async () => {
      (mockPrisma.book.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(AnalyticsService.getBookAnalytics('nonexistent-book'))
        .rejects.toThrow('Book not found');
    });

    it('should handle book with no reviews', async () => {
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        reviews: [],
        genres: []
      };

      (mockPrisma.book.findUnique as vi.Mock).mockResolvedValue(mockBook as any);
      (mockPrisma.userFavorite.count as vi.Mock).mockResolvedValue(0);

      const result = await AnalyticsService.getBookAnalytics('book-1');

      expect(result.totalReviews).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      });
      expect(result.helpfulReviewsCount).toBe(0);
    });
  });

  describe('getPlatformAnalytics', () => {
    it('should return platform analytics successfully', async () => {
      (mockPrisma.user.count as vi.Mock).mockResolvedValue(100);
      (mockPrisma.book.count as vi.Mock).mockResolvedValue(50);
      (mockPrisma.review.count as vi.Mock).mockResolvedValue(200);
      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue([
        { rating: 5, createdAt: new Date('2023-01-01') },
        { rating: 4, createdAt: new Date('2023-01-02') },
        { rating: 3, createdAt: new Date('2023-01-03') }
      ] as any);
      (mockPrisma.user.findMany as vi.Mock).mockResolvedValue([
        { createdAt: new Date('2023-01-01') },
        { createdAt: new Date('2023-01-02') }
      ] as any); // For getUserGrowthTrend

      const result = await AnalyticsService.getPlatformAnalytics();

      expect(result.totalUsers).toBe(100);
      expect(result.totalBooks).toBe(50);
      expect(result.totalReviews).toBe(200);
      expect(result.averageRating).toBe(0);
      expect(result.topGenres).toEqual([]);
      expect(result.topAuthors).toEqual([]);
      expect(result.topBooks).toEqual([]);
    });

    it('should handle platform with no data', async () => {
      (mockPrisma.user.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.book.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.review.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue([]);
      (mockPrisma.user.findMany as vi.Mock).mockResolvedValue([]); // For getUserGrowthTrend

      const result = await AnalyticsService.getPlatformAnalytics();

      expect(result.totalUsers).toBe(0);
      expect(result.totalBooks).toBe(0);
      expect(result.totalReviews).toBe(0);
      expect(result.averageRating).toBe(0);
    });
  });

  describe('getUserReadingHistory', () => {
    it('should return user reading history', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          createdAt: new Date('2023-06-01'),
          book: {
            title: 'Book 1',
            author: 'Author 1',
            pageCount: 300
          }
        },
        {
          id: 'review-2',
          rating: 4,
          createdAt: new Date('2023-07-01'),
          book: {
            title: 'Book 2',
            author: 'Author 2',
            pageCount: 250
          }
        }
      ];

      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue(mockReviews as any);

      const result = await AnalyticsService.getUserReadingHistory('user-1', 1, 10);

      expect(result).toHaveLength(2);
      expect(result[0].book.title).toBe('Book 1');
      expect(result[1].book.title).toBe('Book 2');
    });

    it('should handle user with no reading history', async () => {
      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue([]);

      const result = await AnalyticsService.getUserReadingHistory('user-1', 1, 10);

      expect(result).toHaveLength(0);
    });
  });

  describe('getGenreAnalytics', () => {
    it('should return genre analytics', async () => {
      const mockReviews = [
        {
          book: {
            genres: [
              { genre: { name: 'Fiction' } },
              { genre: { name: 'Mystery' } }
            ]
          }
        },
        {
          book: {
            genres: [
              { genre: { name: 'Fiction' } }
            ]
          }
        }
      ];

      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue(mockReviews as any);

      const result = await AnalyticsService.getGenreAnalytics();

      expect(result).toEqual([
        { genre: 'Fiction', totalBooks: 2, totalReviews: 2, averageRating: NaN },
        { genre: 'Mystery', totalBooks: 1, totalReviews: 1, averageRating: NaN }
      ]);
    });

    it('should handle no reviews', async () => {
      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue([]);

      const result = await AnalyticsService.getGenreAnalytics();

      expect(result).toEqual([]);
    });
  });

  describe('getAuthorAnalytics', () => {
    it('should return author analytics', async () => {
      const mockReviews = [
        {
          rating: 5,
          book: { author: 'Author 1' }
        },
        {
          rating: 4,
          book: { author: 'Author 1' }
        },
        {
          rating: 3,
          book: { author: 'Author 2' }
        }
      ];

      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue(mockReviews as any);

      const result = await AnalyticsService.getAuthorAnalytics();

      expect(result).toEqual([
        { author: 'Author 1', totalBooks: 2, averageRating: 4.5, totalReviews: 2 },
        { author: 'Author 2', totalBooks: 1, averageRating: 3, totalReviews: 1 }
      ]);
    });

    it('should handle no reviews', async () => {
      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue([]);

      const result = await AnalyticsService.getAuthorAnalytics();

      expect(result).toEqual([]);
    });
  });

  describe('getTrendingBooks', () => {
    it('should return trending books', async () => {
      const mockReviews = [
        {
          book: {
            id: 'book-1',
            title: 'Book 1',
            author: 'Author 1'
          },
          rating: 5,
          createdAt: new Date('2023-07-01')
        },
        {
          book: {
            id: 'book-2',
            title: 'Book 2',
            author: 'Author 2'
          },
          rating: 4,
          createdAt: new Date('2023-06-01')
        }
      ];

      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue(mockReviews as any);

      const result = await AnalyticsService.getTrendingBooks(7, 10);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Book 1');
      expect(result[1].title).toBe('Book 2');
    });

    it('should handle no trending books', async () => {
      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue([]);

      const result = await AnalyticsService.getTrendingBooks(7, 10);

      expect(result).toEqual([]);
    });
  });

  describe('getUserEngagementMetrics', () => {
    it('should return user engagement metrics', async () => {
      (mockPrisma.user.count as vi.Mock).mockResolvedValue(100);
      (mockPrisma.review.count as vi.Mock).mockResolvedValue(200);
      (mockPrisma.book.count as vi.Mock).mockResolvedValue(50);
      (mockPrisma.userFollow.count as vi.Mock).mockResolvedValue(50);

      const result = await AnalyticsService.getUserEngagementMetrics();

      expect(result.totalUsers).toBe(100);
      expect(result.totalReviews).toBe(200);
      expect(result.totalBooks).toBe(50);
      expect(result.totalFollows).toBe(50);
      expect(result.averageReviewsPerUser).toBe(2);
      expect(result.averageBooksPerUser).toBe(0.5);
      expect(result.averageFollowsPerUser).toBe(0.5);
    });

    it('should handle zero users', async () => {
      (mockPrisma.user.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.review.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.book.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.userFollow.count as vi.Mock).mockResolvedValue(0);

      const result = await AnalyticsService.getUserEngagementMetrics();

      expect(result.totalUsers).toBe(0);
      expect(result.averageReviewsPerUser).toBe(0);
      expect(result.averageBooksPerUser).toBe(0);
      expect(result.averageFollowsPerUser).toBe(0);
    });
  });
});