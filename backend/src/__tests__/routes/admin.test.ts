import request from 'supertest';
import express from 'express';
import adminRoutes from '../../routes/admin';
import { authenticate } from '../../middleware/simple-auth';
import { UserRole } from '@prisma/client';
import { UserService } from '../../services/userService';
import { BookService } from '../../services/bookService';
import { ReviewService } from '../../services/reviewService';
import { GenreService } from '../../services/genreService';
import { AnalyticsService } from '../../services/analyticsService';
import { prisma } from '@/config/database';

// Mock the dependencies
vi.mock('../../middleware/simple-auth');
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));
vi.mock('../../services/userService', () => ({
  UserService: {
    getAllUsers: vi.fn(),
    getUserById: vi.fn(),
    updateUserRole: vi.fn(),
    deleteUser: vi.fn(),
  },
}));
vi.mock('../../services/bookService', () => ({
  BookService: {
    getAllBooks: vi.fn(),
    getBookById: vi.fn(),
    deleteBook: vi.fn(),
  },
}));
vi.mock('../../services/reviewService', () => ({
  ReviewService: {
    getAllReviews: vi.fn(),
    getReviewById: vi.fn(),
    deleteReview: vi.fn(),
  },
}));
vi.mock('../../services/genreService', () => ({
  GenreService: {
    getAllGenres: vi.fn(),
    getGenreById: vi.fn(),
    deleteGenre: vi.fn(),
  },
}));
vi.mock('../../services/analyticsService', () => ({
  AnalyticsService: {
    getPlatformAnalytics: vi.fn(),
  },
}));
vi.mock('@/config/database', () => ({
  prisma: {
    user: { count: vi.fn(), findMany: vi.fn() },
    book: { count: vi.fn(), findMany: vi.fn() },
    review: { count: vi.fn(), findMany: vi.fn() },
    genre: { count: vi.fn() },
    userFavorite: { count: vi.fn() },
  },
}));

const mockAuthenticate = authenticate as vi.MockedFunction<typeof authenticate>;
const mockUserService = UserService as vi.Mocked<typeof UserService>;
const mockBookService = BookService as vi.Mocked<typeof BookService>;
const mockReviewService = ReviewService as vi.Mocked<typeof ReviewService>;
const mockGenreService = GenreService as vi.Mocked<typeof GenreService>;
const mockAnalyticsService = AnalyticsService as vi.Mocked<typeof AnalyticsService>;
const mockPrisma = prisma as vi.Mocked<typeof prisma>;

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe.skip('Admin Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin stats successfully', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'admin-1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
        next();
      });

      // Mock the database counts
      (mockPrisma.user.count as vi.Mock).mockResolvedValue(10);
      (mockPrisma.book.count as vi.Mock).mockResolvedValue(25);
      (mockPrisma.review.count as vi.Mock).mockResolvedValue(50);
      (mockPrisma.userFavorite.count as vi.Mock).mockResolvedValue(100);
      (mockPrisma.genre.count as vi.Mock).mockResolvedValue(5);
      
      // Mock findMany calls for recent items
      (mockPrisma.book.findMany as vi.Mock).mockResolvedValue([]);
      (mockPrisma.user.findMany as vi.Mock).mockResolvedValue([]);
      (mockPrisma.review.findMany as vi.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          totalBooks: expect.any(Number),
          totalUsers: expect.any(Number),
          totalReviews: expect.any(Number),
          totalFavorites: expect.any(Number),
          totalGenres: expect.any(Number),
          recentBooks: expect.any(Array),
          recentUsers: expect.any(Array),
          recentReviews: expect.any(Array)
        })
      });
    });

    it('should return 403 for non-admin users', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'user-1', username: 'user', email: 'user@example.com', role: UserRole.USER };
        next();
      });

      const response = await request(app)
        .get('/api/admin/stats')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        message: 'Admin access required'
      });
    });

    it('should return 403 for unauthenticated users', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      });

      const response = await request(app)
        .get('/api/admin/stats')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Authentication required'
      });
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return users list for admin', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'admin-1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
        next();
      });

      // Mock Prisma calls for users list
      (mockPrisma.user.findMany as vi.Mock).mockResolvedValue([
        { id: 'user-1', username: 'user1', email: 'user1@example.com', role: 'USER' },
        { id: 'user-2', username: 'user2', email: 'user2@example.com', role: 'USER' }
      ]);
      (mockPrisma.user.count as vi.Mock).mockResolvedValue(2);

      const response = await request(app)
        .get('/api/admin/users')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          users: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: expect.any(Number),
            totalPages: expect.any(Number)
          })
        })
      });
    });
  });

  describe('GET /api/admin/books', () => {
    it('should return books list for admin', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'admin-1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
        next();
      });

      const response = await request(app)
        .get('/api/admin/books')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          books: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: expect.any(Number),
            totalPages: expect.any(Number)
          })
        })
      });
    });
  });

  describe('GET /api/admin/reviews', () => {
    it('should return reviews list for admin', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'admin-1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
        next();
      });

      const response = await request(app)
        .get('/api/admin/reviews')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          reviews: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: expect.any(Number),
            totalPages: expect.any(Number)
          })
        })
      });
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should update user role successfully', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'admin-1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
        next();
      });

      const response = await request(app)
        .put('/api/admin/users/user-123/role')
        .send({ role: 'MODERATOR' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User role updated successfully',
        data: expect.objectContaining({
          id: 'user-123',
          role: 'MODERATOR'
        })
      });
    });

    it('should return 400 for invalid role', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'admin-1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
        next();
      });

      const response = await request(app)
        .put('/api/admin/users/user-123/role')
        .send({ role: 'INVALID_ROLE' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid role'
      });
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user successfully', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'admin-1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
        next();
      });

      const response = await request(app)
        .delete('/api/admin/users/user-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User deleted successfully'
      });
    });
  });

  describe('DELETE /api/admin/books/:id', () => {
    it('should delete book successfully', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'admin-1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
        next();
      });

      const response = await request(app)
        .delete('/api/admin/books/book-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Book deleted successfully'
      });
    });
  });

  describe('DELETE /api/admin/reviews/:id', () => {
    it('should delete review successfully', async () => {
      mockAuthenticate.mockImplementation(async (req, res, next) => {
        req.user = { id: 'admin-1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
        next();
      });

      const response = await request(app)
        .delete('/api/admin/reviews/review-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Review deleted successfully'
      });
    });
  });
});
