import request from 'supertest';
import express from 'express';
import communityRoutes from '../../routes/community';
import { CommunityService } from '../../services/communityService';
import { authenticate, authorize } from '../../middleware/simple-auth';
import { validateParams } from '../../middleware/validation';
import { Request, Response, NextFunction } from 'express';

// Mock CommunityService
vi.mock('../../services/communityService');

// Mock middleware
vi.mock('../../middleware/simple-auth', () => ({
  authenticate: vi.fn((req: Request, res: Response, next: NextFunction) => {
    req.user = { id: 'user-123', username: 'testuser', email: 'test@example.com', role: 'USER' };
    next();
  }),
  authorize: vi.fn((req: Request, res: Response, next: NextFunction) => {
    req.user = { id: 'user-123', username: 'testuser', email: 'test@example.com', role: 'ADMIN' };
    next();
  }),
}));

vi.mock('../../middleware/validation', () => ({
  validateParams: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/community', communityRoutes);

describe('Community Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/community/comments', () => {
    it('should add comment successfully', async () => {
      const mockComment = {
        id: 'comment-123',
        content: 'Great review!',
        userId: 'user-123',
        reviewId: 'review-123',
        createdAt: '2025-09-30T12:32:03.633Z',
      };

      (CommunityService.addComment as vi.Mock).mockResolvedValue(mockComment);

      const res = await request(app)
        .post('/api/v1/community/comments')
        .send({
          reviewId: 'review-123',
          content: 'Great review!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        success: true,
        message: 'Comment added successfully',
        data: mockComment,
      });
      expect(CommunityService.addComment).toHaveBeenCalledWith({
        reviewId: 'review-123',
        userId: 'user-123',
        content: 'Great review!',
      });
    });

    it('should return 400 for missing reviewId', async () => {
      const res = await request(app)
        .post('/api/v1/community/comments')
        .send({
          content: 'Great review!',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Review ID and content are required',
      });
    });

    it('should return 400 for missing content', async () => {
      const res = await request(app)
        .post('/api/v1/community/comments')
        .send({
          reviewId: 'review-123',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Review ID and content are required',
      });
    });

    it('should handle service errors', async () => {
      (CommunityService.addComment as vi.Mock).mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .post('/api/v1/community/comments')
        .send({
          reviewId: 'review-123',
          content: 'Great review!',
        });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/v1/community/comments/:reviewId', () => {
    it('should get comments for review', async () => {
      const mockResult = {
        data: [
          {
            id: 'comment-123',
            content: 'Great review!',
            userId: 'user-123',
            reviewId: 'review-123',
            createdAt: '2025-09-30T12:32:03.679Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      (CommunityService.getReviewComments as vi.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/community/comments/review-123')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
      });
      expect(CommunityService.getReviewComments).toHaveBeenCalledWith('review-123', 1, 10);
    });

    it('should use default pagination values', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };

      (CommunityService.getReviewComments as vi.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/community/comments/review-123');

      expect(res.status).toBe(200);
      expect(CommunityService.getReviewComments).toHaveBeenCalledWith('review-123', 1, 10);
    });
  });

  describe('POST /api/v1/community/follow/:userId', () => {
    it('should follow user successfully', async () => {
      (CommunityService.followUser as vi.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/community/follow/user-456');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'User followed successfully',
      });
      expect(CommunityService.followUser).toHaveBeenCalledWith('user-123', 'user-456');
    });

    it('should handle service errors', async () => {
      (CommunityService.followUser as vi.Mock).mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .post('/api/v1/community/follow/user-456');

      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/v1/community/follow/:userId', () => {
    it('should unfollow user successfully', async () => {
      (CommunityService.unfollowUser as vi.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/v1/community/follow/user-456');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'User unfollowed successfully',
      });
      expect(CommunityService.unfollowUser).toHaveBeenCalledWith('user-123', 'user-456');
    });
  });

  describe('GET /api/v1/community/activity-feed', () => {
    it('should get activity feed', async () => {
      const mockResult = {
        data: [
          {
            id: 'activity-123',
            type: 'review',
            userId: 'user-456',
            createdAt: '2025-09-30T12:32:03.697Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      };

      (CommunityService.getActivityFeed as vi.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/community/activity-feed')
        .query({ page: 1, limit: 20 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
      });
      expect(CommunityService.getActivityFeed).toHaveBeenCalledWith('user-123', 1, 20);
    });

    it('should use default pagination values', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };

      (CommunityService.getActivityFeed as vi.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/community/activity-feed');

      expect(res.status).toBe(200);
      expect(CommunityService.getActivityFeed).toHaveBeenCalledWith('user-123', 1, 20);
    });
  });

  describe('GET /api/v1/community/notifications', () => {
    it('should get user notifications', async () => {
      const mockResult = {
        data: [
          {
            id: 'notification-123',
            type: 'follow',
            message: 'User followed you',
            isRead: false,
            createdAt: '2025-09-30T12:32:03.703Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      };

      (CommunityService.getUserNotifications as vi.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/community/notifications')
        .query({ page: 1, limit: 20 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
      });
      expect(CommunityService.getUserNotifications).toHaveBeenCalledWith('user-123', 1, 20);
    });
  });

  describe('PUT /api/v1/community/notifications/:notificationId/read', () => {
    it('should mark notification as read', async () => {
      (CommunityService.markNotificationAsRead as vi.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .put('/api/v1/community/notifications/notification-123/read');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Notification marked as read',
      });
      expect(CommunityService.markNotificationAsRead).toHaveBeenCalledWith('notification-123', 'user-123');
    });
  });

  describe('PUT /api/v1/community/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      (CommunityService.markAllNotificationsAsRead as vi.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .put('/api/v1/community/notifications/read-all');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'All notifications marked as read',
      });
      expect(CommunityService.markAllNotificationsAsRead).toHaveBeenCalledWith('user-123');
    });
  });

  describe('POST /api/v1/community/report-content', () => {
    it('should report content successfully', async () => {
      (CommunityService.reportContent as vi.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/community/report-content')
        .send({
          contentType: 'review',
          contentId: 'review-123',
          reason: 'spam',
          description: 'This is spam content',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Content reported successfully',
      });
      expect(CommunityService.reportContent).toHaveBeenCalledWith({
        reporterId: 'user-123',
        contentType: 'review',
        contentId: 'review-123',
        reason: 'spam',
        description: 'This is spam content',
      });
    });

    it('should return 400 for missing contentType', async () => {
      const res = await request(app)
        .post('/api/v1/community/report-content')
        .send({
          contentId: 'review-123',
          reason: 'spam',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content type, content ID, and reason are required',
      });
    });

    it('should return 400 for missing contentId', async () => {
      const res = await request(app)
        .post('/api/v1/community/report-content')
        .send({
          contentType: 'review',
          reason: 'spam',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content type, content ID, and reason are required',
      });
    });

    it('should return 400 for missing reason', async () => {
      const res = await request(app)
        .post('/api/v1/community/report-content')
        .send({
          contentType: 'review',
          contentId: 'review-123',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content type, content ID, and reason are required',
      });
    });
  });

  describe('GET /api/v1/community/stats', () => {
    it('should get community statistics', async () => {
      const mockStats = {
        totalUsers: 1000,
        totalReviews: 5000,
        totalComments: 10000,
        totalFollows: 2000,
      };

      (CommunityService.getCommunityStats as vi.Mock).mockResolvedValue(mockStats);

      const res = await request(app)
        .get('/api/v1/community/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: mockStats,
      });
      expect(CommunityService.getCommunityStats).toHaveBeenCalledTimes(1);
    });
  });
});
