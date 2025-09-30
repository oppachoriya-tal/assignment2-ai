import { UserService } from '../../services/userService';
import { prisma } from '../../config/database';

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should get user profile with statistics', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        avatarUrl: 'avatar.jpg',
        bio: 'Test bio',
        createdAt: new Date('2023-01-01'),
        lastLogin: new Date('2023-01-01'),
        reviews: [
          { rating: 5, id: 'review-1' },
          { rating: 4, id: 'review-2' }
        ],
        favorites: [
          { id: 'fav-1' },
          { id: 'fav-2' }
        ]
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUserProfile(userId);

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        avatarUrl: 'avatar.jpg',
        bio: 'Test bio',
        createdAt: expect.any(Date),
        lastLogin: expect.any(Date),
        stats: {
          totalReviews: 2,
          totalFavorites: 2,
          averageRating: 4.5,
          helpfulVotes: 0
        }
      });
    });

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-user';

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(UserService.getUserProfile(userId)).rejects.toThrow('User not found');
    });
  });

  describe('getUserReviews', () => {
    it('should get user reviews with pagination', async () => {
      const userId = 'user-1';
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          reviewText: 'Great book!',
          createdAt: new Date(),
          book: {
            id: 'book-1',
            title: 'Test Book',
            author: 'Test Author',
            coverImageUrl: 'cover.jpg'
          }
        }
      ];

      (prisma.review.findMany as vi.Mock).mockResolvedValue(mockReviews);
      (prisma.review.count as vi.Mock).mockResolvedValue(1);

      const result = await UserService.getUserReviews(userId, 1, 10);

      expect(result).toEqual({
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            reviewText: 'Great book!',
            createdAt: expect.any(Date),
            book: {
              id: 'book-1',
              title: 'Test Book',
              author: 'Test Author',
              coverImageUrl: 'cover.jpg'
            },
            helpfulVotes: 0
          }
        ],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      });
    });
  });

  describe('getUserFavorites', () => {
    it('should get user favorites with pagination', async () => {
      const userId = 'user-1';
      const mockFavorites = [
        {
          createdAt: new Date(),
          book: {
            id: 'book-1',
            title: 'Test Book',
            author: 'Test Author',
            coverImageUrl: 'cover.jpg',
            reviews: [{ rating: 5 }],
            genres: [{ genre: { name: 'Fiction' } }]
          }
        }
      ];

      (prisma.userFavorite.findMany as vi.Mock).mockResolvedValue(mockFavorites);
      (prisma.userFavorite.count as vi.Mock).mockResolvedValue(1);

      const result = await UserService.getUserFavorites(userId, 1, 10);

      expect(result).toEqual({
        favorites: [
          {
            id: 'book-1',
            title: 'Test Book',
            author: 'Test Author',
            coverImageUrl: 'cover.jpg',
            averageRating: 5,
            totalReviews: 1,
            genres: ['Fiction'],
            reviews: [{ rating: 5 }],
            addedToFavorites: expect.any(Date)
          }
        ],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      });
    });
  });

  describe('getUserReadingStats', () => {
    it('should get user reading statistics', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: 'user-1',
        reviews: [
          {
            rating: 5,
            createdAt: new Date('2023-01-01'),
            book: {
              genres: [
                { genre: { name: 'Fiction' } },
                { genre: { name: 'Mystery' } }
              ]
            }
          },
          {
            rating: 4,
            createdAt: new Date('2023-06-01'),
            book: {
              genres: [
                { genre: { name: 'Fiction' } }
              ]
            }
          }
        ]
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUserReadingStats(userId);

      expect(result).toEqual({
        totalBooksRead: 2,
        totalPagesRead: 0,
        averageRating: 4.5,
        favoriteGenres: ['Fiction', 'Mystery'],
        readingGoal: 0,
        booksReadThisYear: expect.any(Number)
      });
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const query = 'john';
      const mockUsers = [
        {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          avatarUrl: 'avatar.jpg',
          createdAt: new Date(),
          _count: {
            reviews: 5,
            favorites: 3
          }
        }
      ];

      (prisma.user.findMany as vi.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as vi.Mock).mockResolvedValue(1);

      const result = await UserService.searchUsers(query, 1, 10);

      expect(result).toEqual({
        users: [
          {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            avatarUrl: 'avatar.jpg',
            createdAt: expect.any(Date),
            totalReviews: 5,
            totalFavorites: 3
          }
        ],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      });
    });
  });
});