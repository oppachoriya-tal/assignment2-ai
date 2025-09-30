import { ModerationService } from '@/services/moderationService';

// Mock dependencies
vi.mock('@/config/database', () => ({
  prisma: {
    review: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    comment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    moderationAction: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));
vi.mock('@/utils/logger');
vi.mock('@/services/geminiService');

describe('ModerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getModerationQueue', () => {
    it('should get moderation queue with pagination', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          reviewText: 'This book is terrible!',
          userId: 'user-123',
          createdAt: new Date('2023-01-01'),
          flaggedAt: new Date('2023-01-02'),
          user: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      ];

      const mockComments: any[] = [];

      const { prisma } = require('@/config/database');
      prisma.review.findMany.mockResolvedValue(mockReviews);
      prisma.comment.findMany.mockResolvedValue(mockComments);
      prisma.review.count.mockResolvedValue(1);
      prisma.comment.count.mockResolvedValue(0);

      const result = await ModerationService.getModerationQueue(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'review-1',
        type: 'review',
        content: 'This book is terrible!',
        authorId: 'user-123',
        authorName: 'John Doe',
        createdAt: new Date('2023-01-01'),
        flaggedAt: new Date('2023-01-01'),
        metadata: {
          bookId: undefined,
          rating: undefined
        }
      });
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('moderateContent', () => {
    it('should analyze content and return moderation result', async () => {
      const content = 'This is a great book!';
      const contentType = 'review' as const;

      const mockModerationResult = {
        isAppropriate: true,
        confidence: 0.95,
        reasons: ['Positive sentiment', 'Appropriate language'],
        suggestedAction: 'approve' as const
      };

      const { GeminiService } = require('@/services/geminiService');
      GeminiService.moderateContent.mockResolvedValue(mockModerationResult);

      const result = await ModerationService.moderateContent(content, contentType);

      expect(result).toEqual(mockModerationResult);
      expect(GeminiService.moderateContent).toHaveBeenCalledWith(content, contentType);
    });

    it('should handle Gemini service failure gracefully', async () => {
      const content = 'This is a great book!';
      const contentType = 'review' as const;

      const { GeminiService } = require('@/services/geminiService');
      GeminiService.moderateContent.mockRejectedValue(new Error('Gemini service unavailable'));

      const result = await ModerationService.moderateContent(content, contentType);

      expect(result).toEqual({
        isAppropriate: true,
        confidence: 0.5,
        reasons: ['AI analysis unavailable'],
        suggestedAction: 'approve'
      });
    });
  });


  describe('getModerationStats', () => {
    it('should return moderation statistics', async () => {
      const { prisma } = require('@/config/database');
      prisma.review.count.mockResolvedValue(5);
      prisma.comment.count.mockResolvedValue(3);
      prisma.moderationAction.count.mockResolvedValue(10);
      prisma.moderationAction.count.mockResolvedValue(8);
      prisma.moderationAction.count.mockResolvedValue(2);

      const result = await ModerationService.getModerationStats();

      expect(result).toEqual({
        pendingCount: 8,
        approvedCount: 8,
        rejectedCount: 8,
        flaggedCount: 8,
        averageProcessingTime: 24
      });
    });
  });

  describe('getUserModerationHistory', () => {
    it('should get user moderation history', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          reviewText: 'Great book!',
          isFlagged: false,
          isModerated: true,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02')
        }
      ];

      const mockComments: any[] = [];

      const { prisma } = require('@/config/database');
      prisma.review.findMany.mockResolvedValue(mockReviews);
      prisma.comment.findMany.mockResolvedValue(mockComments);

      const result = await ModerationService.getUserModerationHistory('user-123', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'review-1',
        type: 'review',
        content: 'Great book!',
        status: 'approved',
        moderatedAt: new Date('2023-01-02')
      });
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });
  });
});
