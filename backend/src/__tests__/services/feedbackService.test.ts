import { FeedbackService } from '@/services/feedbackService';

// Mock Prisma
vi.mock('@/config/database', () => ({
  prisma: {
    feedback: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { prisma } from '@/config/database';
const mockPrisma = prisma as vi.Mocked<typeof prisma>;
const mockFeedbackCreate = mockPrisma.feedback.create as vi.MockedFunction<typeof prisma.feedback.create>;
const mockFeedbackFindUnique = mockPrisma.feedback.findUnique as vi.MockedFunction<typeof prisma.feedback.findUnique>;
const mockFeedbackFindMany = mockPrisma.feedback.findMany as vi.MockedFunction<typeof prisma.feedback.findMany>;
const mockFeedbackCount = mockPrisma.feedback.count as vi.MockedFunction<typeof prisma.feedback.count>;
const mockFeedbackUpdate = mockPrisma.feedback.update as vi.MockedFunction<typeof prisma.feedback.update>;
const mockFeedbackGroupBy = mockPrisma.feedback.groupBy as vi.MockedFunction<typeof prisma.feedback.groupBy>;
const mockFeedbackAggregate = mockPrisma.feedback.aggregate as vi.MockedFunction<typeof prisma.feedback.aggregate>;

describe('FeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFeedback', () => {
    it('should create feedback successfully', async () => {
      const feedbackData = {
        type: 'BUG_REPORT' as const,
        subject: 'Test Bug',
        message: 'This is a test bug report',
        rating: 3,
        metadata: { page: '/books' },
        userAgent: 'Mozilla/5.0',
        userEmail: 'test@example.com',
      };

      const mockCreatedFeedback = {
        id: 'feedback-123',
        ...feedbackData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
        adminResponse: null,
        adminResponseAt: null,
      };

      mockFeedbackCreate.mockResolvedValue(mockCreatedFeedback as any);

      const result = await FeedbackService.createFeedback(feedbackData);

      expect(mockFeedbackCreate).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          type: 'BUG_REPORT',
          subject: 'Test Bug',
          message: 'This is a test bug report',
          rating: 3,
          metadata: { page: '/books' },
          userAgent: 'Mozilla/5.0',
          userEmail: 'test@example.com',
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      expect(result).toHaveProperty('id', 'feedback-123');
      expect(result).toHaveProperty('type', 'BUG_REPORT');
      expect(result).toHaveProperty('subject', 'Test Bug');
      expect(result).toHaveProperty('message', 'This is a test bug report');
      expect(result).toHaveProperty('status', 'PENDING');
    });

    it('should handle creation error', async () => {
      const feedbackData = {
        type: 'FEATURE_REQUEST' as const,
        subject: 'Test Feature',
        message: 'This is a test feature request',
      };

      mockFeedbackCreate.mockRejectedValue(new Error('Database error'));

      await expect(FeedbackService.createFeedback(feedbackData)).rejects.toThrow('Database error');
    });
  });

  describe('getFeedbackById', () => {
    it('should return feedback by id', async () => {
      const feedbackId = 'feedback-123';
      const mockFeedback = {
        id: feedbackId,
        type: 'BUG_REPORT',
        subject: 'Test Bug',
        message: 'This is a test bug report',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        rating: 3,
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        },
        adminResponse: null,
        adminResponseAt: null,
      };

      mockFeedbackFindUnique.mockResolvedValue(mockFeedback as any);

      const result = await FeedbackService.getFeedbackById(feedbackId);

      expect(mockFeedbackFindUnique).toHaveBeenCalledWith({
        where: { id: feedbackId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      expect(result).toHaveProperty('id', feedbackId);
      expect(result).toHaveProperty('type', 'BUG_REPORT');
      expect(result).toHaveProperty('subject', 'Test Bug');
      expect(result).toHaveProperty('status', 'PENDING');
    });

    it('should return null for non-existent feedback', async () => {
      const feedbackId = 'non-existent';
      
      mockFeedbackFindUnique.mockResolvedValue(null);

      const result = await FeedbackService.getFeedbackById(feedbackId);

      expect(result).toBeNull();
    });
  });

  describe('getFeedback', () => {
    it('should return paginated feedback', async () => {
      const filters = {
        type: 'BUG_REPORT' as const,
        status: 'PENDING' as const,
        page: 1,
        limit: 10,
      };

      const mockFeedbacks = [
        {
          id: 'feedback-1',
          type: 'BUG_REPORT',
          subject: 'Bug 1',
          message: 'Message 1',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'feedback-2',
          type: 'BUG_REPORT',
          subject: 'Bug 2',
          message: 'Message 2',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFeedbackFindMany.mockResolvedValue(mockFeedbacks as any);
      mockFeedbackCount.mockResolvedValue(2);

      const result = await FeedbackService.getFeedback(filters);

      expect(mockFeedbackFindMany).toHaveBeenCalledWith({
        where: {
          type: 'BUG_REPORT',
          status: 'PENDING',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('totalCount', 2);
      expect(result).toHaveProperty('totalPages', 1);
      expect(result).toHaveProperty('currentPage', 1);
    });
  });

  describe('updateFeedbackStatus', () => {
    it('should update feedback status', async () => {
      const feedbackId = 'feedback-123';
      const status = 'RESOLVED';
      const adminResponse = 'This has been fixed';

      const mockUpdatedFeedback = {
        id: feedbackId,
        status: 'RESOLVED',
        adminResponse,
        adminResponseAt: new Date(),
        updatedAt: new Date(),
      };

      mockFeedbackUpdate.mockResolvedValue(mockUpdatedFeedback as any);

      const result = await FeedbackService.updateFeedbackStatus(feedbackId, status, adminResponse);

      expect(mockFeedbackUpdate).toHaveBeenCalledWith({
        where: { id: feedbackId },
        data: {
          status: 'RESOLVED',
          adminResponse,
          adminResponseAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      expect(result).toEqual(mockUpdatedFeedback);
    });
  });

  describe('getFeedbackStats', () => {
    it('should return feedback statistics', async () => {
      const mockStats = {
        total: 100,
        pending: 20,
        inProgress: 15,
        resolved: 50,
        closed: 15,
        byType: {
          BUG_REPORT: 40,
          FEATURE_REQUEST: 30,
          GENERAL_FEEDBACK: 20,
          COVER_GENERATION: 5,
          UI_IMPROVEMENT: 5,
        },
        averageRating: 4.2,
      };

      // Mock multiple count calls
      mockFeedbackCount
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20)  // pending
        .mockResolvedValueOnce(15)  // in_progress
        .mockResolvedValueOnce(50)  // resolved
        .mockResolvedValueOnce(15)  // closed
        .mockResolvedValueOnce(40)  // bug_report
        .mockResolvedValueOnce(30)  // feature_request
        .mockResolvedValueOnce(20)  // general_feedback
        .mockResolvedValueOnce(5)   // cover_generation
        .mockResolvedValueOnce(5);  // ui_improvement

      // Mock groupBy call
      mockFeedbackGroupBy.mockResolvedValue([
        { type: 'BUG_REPORT', status: 'PENDING', _count: { id: 20 } },
        { type: 'FEATURE_REQUEST', status: 'PENDING', _count: { id: 15 } },
      ] as any);

      // Mock aggregate call
      mockFeedbackAggregate.mockResolvedValue({ _avg: { rating: 4.2 } } as any);

      mockFeedbackFindMany.mockResolvedValue([
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
        { rating: 4 },
        { rating: 5 },
      ] as any);

      const result = await FeedbackService.getFeedbackStats();

      expect(result).toHaveProperty('totalFeedback');
      expect(result).toHaveProperty('averageRating');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('recentCount');
    });
  });

  describe('getUserFeedback', () => {
    it('should return user feedback', async () => {
      const userId = 'user-123';
      const page = 1;
      const limit = 10;

      const mockUserFeedback = [
        {
          id: 'feedback-1',
          type: 'BUG_REPORT',
          subject: 'User Bug',
          message: 'User reported bug',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Clear previous mock calls
      mockFeedbackCount.mockClear();
      mockFeedbackFindMany.mockResolvedValue(mockUserFeedback as any);
      mockFeedbackCount.mockResolvedValueOnce(1);

      const result = await FeedbackService.getUserFeedback(userId, page, limit);

      expect(mockFeedbackFindMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('totalPages');
      expect(result).toHaveProperty('currentPage', 1);
    });
  });
});
