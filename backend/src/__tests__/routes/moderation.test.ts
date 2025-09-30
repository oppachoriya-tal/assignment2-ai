import request from 'supertest';
import express from 'express';
import moderationRoutes from '../../routes/moderation';
import { ModerationService } from '../../services/moderationService';
import { authenticate, authorize } from '../../middleware/simple-auth';
import { validateParams } from '../../middleware/validation';
import { UserRole } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

// Mock ModerationService
vi.mock('../../services/moderationService');

// Mock middleware
vi.mock('../../middleware/simple-auth', () => ({
  authenticate: vi.fn((req: Request, res: Response, next: NextFunction) => {
    req.user = { id: 'moderator-123', username: 'moderator', email: 'moderator@example.com', role: 'MODERATOR' };
    next();
  }),
  authorize: vi.fn(() => (req: Request, res: Response, next: NextFunction) => {
    req.user = { id: 'moderator-123', username: 'moderator', email: 'moderator@example.com', role: 'MODERATOR' };
    next();
  }),
}));

vi.mock('../../middleware/validation', () => ({
  validateParams: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/moderation', moderationRoutes);

describe('Moderation Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/moderation/queue', () => {
    it('should get moderation queue', async () => {
      const mockResult = {
        data: [
          {
            id: 'content-123',
            type: 'review',
            content: 'Test review content',
            status: 'pending',
            createdAt: '2025-09-30T12:32:03.808Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      };

      (ModerationService.getModerationQueue as vi.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/moderation/queue')
        .query({ page: 1, limit: 20 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
      });
      expect(ModerationService.getModerationQueue).toHaveBeenCalledWith(1, 20);
    });

    it('should use default pagination values', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };

      (ModerationService.getModerationQueue as vi.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/moderation/queue');

      expect(res.status).toBe(200);
      expect(ModerationService.getModerationQueue).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('POST /api/v1/moderation/moderate-content', () => {
    it('should moderate content successfully', async () => {
      const mockModeration = {
        id: 'moderation-123',
        content: 'Test content',
        contentType: 'review',
        isApproved: true,
        confidence: 0.95,
        flags: [],
        createdAt: '2025-09-30T12:32:03.831Z',
      };

      (ModerationService.moderateContent as vi.Mock).mockResolvedValue(mockModeration);

      const res = await request(app)
        .post('/api/v1/moderation/moderate-content')
        .send({
          content: 'Test content',
          contentType: 'review',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: mockModeration,
      });
      expect(ModerationService.moderateContent).toHaveBeenCalledWith('Test content', 'review');
    });

    it('should return 400 for missing content', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/moderate-content')
        .send({
          contentType: 'review',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content and content type are required',
      });
    });

    it('should return 400 for missing contentType', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/moderate-content')
        .send({
          content: 'Test content',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content and content type are required',
      });
    });
  });

  describe('POST /api/v1/moderation/approve/:contentId', () => {
    it('should approve content successfully', async () => {
      (ModerationService.approveContent as vi.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/moderation/approve/content-123')
        .send({
          contentType: 'review',
          reason: 'Content is appropriate',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Content approved successfully',
      });
      expect(ModerationService.approveContent).toHaveBeenCalledWith(
        'content-123',
        'review',
        'moderator-123',
        'Content is appropriate'
      );
    });

    it('should return 400 for missing contentType', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/approve/content-123')
        .send({
          reason: 'Content is appropriate',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content type is required',
      });
    });
  });

  describe('POST /api/v1/moderation/reject/:contentId', () => {
    it('should reject content successfully', async () => {
      (ModerationService.rejectContent as vi.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/moderation/reject/content-123')
        .send({
          contentType: 'review',
          reason: 'Content violates guidelines',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Content rejected successfully',
      });
      expect(ModerationService.rejectContent).toHaveBeenCalledWith(
        'content-123',
        'review',
        'moderator-123',
        'Content violates guidelines'
      );
    });

    it('should return 400 for missing contentType', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/reject/content-123')
        .send({
          reason: 'Content violates guidelines',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content type and reason are required',
      });
    });

    it('should return 400 for missing reason', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/reject/content-123')
        .send({
          contentType: 'review',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content type and reason are required',
      });
    });
  });

  describe('POST /api/v1/moderation/edit/:contentId', () => {
    it('should edit content successfully', async () => {
      (ModerationService.editContent as vi.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/moderation/edit/content-123')
        .send({
          contentType: 'review',
          newContent: 'Edited content',
          reason: 'Content needed editing',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Content edited successfully',
      });
      expect(ModerationService.editContent).toHaveBeenCalledWith(
        'content-123',
        'review',
        'moderator-123',
        'Edited content',
        'Content needed editing'
      );
    });

    it('should return 400 for missing contentType', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/edit/content-123')
        .send({
          newContent: 'Edited content',
          reason: 'Content needed editing',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content type, new content, and reason are required',
      });
    });

    it('should return 400 for missing newContent', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/edit/content-123')
        .send({
          contentType: 'review',
          reason: 'Content needed editing',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content type, new content, and reason are required',
      });
    });

    it('should return 400 for missing reason', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/edit/content-123')
        .send({
          contentType: 'review',
          newContent: 'Edited content',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content type, new content, and reason are required',
      });
    });
  });

  describe('GET /api/v1/moderation/stats', () => {
    it('should get moderation statistics', async () => {
      const mockStats = {
        totalPending: 50,
        totalApproved: 1000,
        totalRejected: 100,
        totalEdited: 25,
        averageProcessingTime: 300, // seconds
      };

      (ModerationService.getModerationStats as vi.Mock).mockResolvedValue(mockStats);

      const res = await request(app)
        .get('/api/v1/moderation/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: mockStats,
      });
      expect(ModerationService.getModerationStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/v1/moderation/user-history/:userId', () => {
    it('should get user moderation history', async () => {
      const mockResult = {
        data: [
          {
            id: 'moderation-123',
            userId: 'user-123',
            contentType: 'review',
            action: 'rejected',
            reason: 'Inappropriate content',
            createdAt: '2025-09-30T12:32:03.857Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      };

      (ModerationService.getUserModerationHistory as vi.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/moderation/user-history/user-123')
        .query({ page: 1, limit: 20 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
      });
      expect(ModerationService.getUserModerationHistory).toHaveBeenCalledWith('user-123', 1, 20);
    });

    it('should use default pagination values', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };

      (ModerationService.getUserModerationHistory as vi.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get('/api/v1/moderation/user-history/user-123');

      expect(res.status).toBe(200);
      expect(ModerationService.getUserModerationHistory).toHaveBeenCalledWith('user-123', 1, 20);
    });
  });

  describe('POST /api/v1/moderation/bulk-moderate', () => {
    it('should bulk moderate content successfully', async () => {
      (ModerationService.bulkModerateContent as vi.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/moderation/bulk-moderate')
        .send({
          contentIds: ['content-1', 'content-2', 'content-3'],
          contentType: 'review',
          action: 'approve',
          reason: 'All content is appropriate',
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Bulk approve completed for 3 items',
      });
      expect(ModerationService.bulkModerateContent).toHaveBeenCalledWith(
        ['content-1', 'content-2', 'content-3'],
        'review',
        'approve',
        'moderator-123',
        'All content is appropriate'
      );
    });

    it('should return 400 for missing contentIds', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/bulk-moderate')
        .send({
          contentType: 'review',
          action: 'approve',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content IDs array, content type, and action are required',
      });
    });

    it('should return 400 for invalid contentIds array', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/bulk-moderate')
        .send({
          contentIds: 'not-an-array',
          contentType: 'review',
          action: 'approve',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content IDs array, content type, and action are required',
      });
    });

    it('should return 400 for missing contentType', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/bulk-moderate')
        .send({
          contentIds: ['content-1', 'content-2'],
          action: 'approve',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content IDs array, content type, and action are required',
      });
    });

    it('should return 400 for missing action', async () => {
      const res = await request(app)
        .post('/api/v1/moderation/bulk-moderate')
        .send({
          contentIds: ['content-1', 'content-2'],
          contentType: 'review',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Content IDs array, content type, and action are required',
      });
    });
  });
});
