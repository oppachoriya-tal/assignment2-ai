import request from 'supertest';
import express from 'express';
import userRoutes from '../../routes/users';
import { UserService } from '../../services/userService';
import { BookService } from '../../services/bookService';
import { ReviewService } from '../../services/reviewService';
import { authenticate } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

// Mock the services
vi.mock('../../services/userService');
vi.mock('../../services/bookService');
vi.mock('../../services/reviewService');
vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: 'user-1', username: 'testuser', email: 'test@example.com', role: 'USER' };
    next();
  }),
}));
vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const mockUserService = UserService as vi.Mocked<typeof UserService>;
const mockBookService = BookService as vi.Mocked<typeof BookService>;
const mockReviewService = ReviewService as vi.Mocked<typeof ReviewService>;
const mockAuthenticate = authenticate as vi.MockedFunction<typeof authenticate>;

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {

    it('should get user profile successfully', async () => {
      const mockDate = new Date().toISOString();
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        bio: 'Test bio',
        createdAt: mockDate,
        lastLogin: mockDate
      };

      const mockReviews = {
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            reviewText: 'Great book!',
            createdAt: mockDate,
            book: {
              id: 'book-1',
              title: 'Test Book',
              author: 'Test Author',
              coverImageUrl: null
            }
          }
        ],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      };

      const mockFavorites = [
        {
          id: 'book-1',
          title: 'Test Book',
          author: 'Test Author',
          coverImageUrl: null,
          averageRating: 4.5,
          totalReviews: 10,
          addedToFavorites: mockDate
        }
      ];

      // Mock prisma.user.findUnique
      const { prisma } = require('../../config/database');
      prisma.user.findUnique.mockResolvedValue(mockUser);
      mockReviewService.getUserReviews.mockResolvedValue(mockReviews);
      mockBookService.getUserFavorites.mockResolvedValue(mockFavorites);

      const response = await request(app)
        .get('/api/users/profile')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockUser,
          reviews: mockReviews.reviews,
          totalReviews: mockReviews.totalCount,
          favorites: mockFavorites.slice(0, 10),
          totalFavorites: mockFavorites.length
        }
      });
      expect(mockReviewService.getUserReviews).toHaveBeenCalledWith('user-1', 1, 10);
      expect(mockBookService.getUserFavorites).toHaveBeenCalledWith('user-1');
    });

    it('should handle error when user not found', async () => {
      const { prisma } = require('../../config/database');
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/profile')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'User not found'
      });
    });

    it('should handle error when fetching profile data', async () => {
      const { prisma } = require('../../config/database');
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/profile')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch user profile'
      });
    });
  });

  describe('GET /api/users/test', () => {
    it('should return success response', async () => {
      const response = await request(app)
        .get('/api/users/test')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Users route is working',
        userServiceAvailable: true
      });
    });
  });

  describe('GET /api/users/favorites', () => {

    it('should get user favorites successfully', async () => {
      const mockFavorites = [
        { id: 'book-1', title: 'Test Book 1' },
        { id: 'book-2', title: 'Test Book 2' }
      ];

      mockBookService.getUserFavorites.mockResolvedValue(mockFavorites);

      const response = await request(app)
        .get('/api/users/favorites')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockFavorites
      });
      expect(mockBookService.getUserFavorites).toHaveBeenCalledWith('user-1');
    });

    it('should handle error when fetching favorites', async () => {
      mockBookService.getUserFavorites.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/favorites')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch favorites'
      });
    });
  });

  describe('GET /api/users/wishlist', () => {

    it('should get user wishlist successfully', async () => {
      const mockWishlist = [
        { id: 'book-3', title: 'Wishlist Book 1' },
        { id: 'book-4', title: 'Wishlist Book 2' }
      ];

      mockUserService.getUserWishlist.mockResolvedValue(mockWishlist);

      const response = await request(app)
        .get('/api/users/wishlist')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockWishlist
      });
      expect(mockUserService.getUserWishlist).toHaveBeenCalledWith('user-1');
    });

    it('should handle error when fetching wishlist', async () => {
      mockUserService.getUserWishlist.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/wishlist')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch wishlist'
      });
    });
  });

  describe('GET /api/users/:id/favorites', () => {

    it('should get user favorites by id successfully', async () => {
      const userId = 'user-2';
      const mockFavorites = [
        { id: 'book-5', title: 'User 2 Book 1' }
      ];

      mockBookService.getUserFavorites.mockResolvedValue(mockFavorites);

      const response = await request(app)
        .get(`/api/users/${userId}/favorites`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockFavorites
      });
      expect(mockBookService.getUserFavorites).toHaveBeenCalledWith(userId);
    });

    it('should handle error when fetching user favorites by id', async () => {
      const userId = 'user-2';
      mockBookService.getUserFavorites.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .get(`/api/users/${userId}/favorites`)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch user favorites'
      });
    });
  });

  describe('GET /api/users/similar-interests', () => {

    it('should get users with similar interests successfully', async () => {
      const mockUsers = [
        { id: 'user-2', firstName: 'John', lastName: 'Doe' },
        { id: 'user-3', firstName: 'Jane', lastName: 'Smith' }
      ];

      mockUserService.getUsersWithSimilarInterests.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users/similar-interests')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUsers
      });
      expect(mockUserService.getUsersWithSimilarInterests).toHaveBeenCalledWith('user-1');
    });

    it('should handle error when fetching users with similar interests', async () => {
      mockUserService.getUsersWithSimilarInterests.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/similar-interests')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch users with similar interests'
      });
    });
  });

  describe('GET /api/users/book/:bookId/interested', () => {

    it('should get users interested in a book successfully', async () => {
      const bookId = 'book-1';
      const mockUsers = [
        { id: 'user-2', firstName: 'Alice', lastName: 'Johnson' },
        { id: 'user-3', firstName: 'Bob', lastName: 'Wilson' }
      ];

      mockUserService.getUsersInterestedInBook.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get(`/api/users/book/${bookId}/interested`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUsers
      });
      expect(mockUserService.getUsersInterestedInBook).toHaveBeenCalledWith(bookId, 'user-1');
    });

    it('should handle error when fetching users interested in book', async () => {
      const bookId = 'book-1';
      mockUserService.getUsersInterestedInBook.mockRejectedValue(new Error('Book not found'));

      const response = await request(app)
        .get(`/api/users/book/${bookId}/interested`)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch interested users'
      });
    });
  });
});
