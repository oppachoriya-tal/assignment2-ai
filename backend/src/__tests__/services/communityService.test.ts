import { CommunityService } from '@/services/communityService';

// Mock dependencies
vi.mock('@/config/database', () => ({
  prisma: {
    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    review: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    userFollow: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn()
    },
    userFavorite: {
      findMany: vi.fn()
    },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    activityFeed: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}));
vi.mock('@/utils/logger');
vi.mock('@/services/aiService', () => ({
  AIService: {
    analyzeReview: vi.fn()
  }
}));

describe('CommunityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addComment', () => {
    it('should add comment to review', async () => {
      const commentData = {
        content: 'Great review!',
        userId: 'user-123',
        reviewId: 'review-456'
      };

      const mockComment = {
        id: 'comment-789',
        content: 'Great review!',
        userId: 'user-123',
        reviewId: 'review-456',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg'
        }
      };

      const { prisma } = require('@/config/database');
      const { AIService } = require('@/services/aiService');
      
      prisma.comment.create.mockResolvedValue(mockComment);
      prisma.review.findUnique.mockResolvedValue({ 
        id: 'review-456', 
        reviewText: 'Some review text',
        userId: 'user-789'
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      prisma.notification.create.mockResolvedValue({});
      AIService.analyzeReview.mockResolvedValue({
        sentiment: 'positive',
        quality: 0.8,
        themes: ['adventure'],
        summary: 'Great review'
      });

      const result = await CommunityService.addComment(commentData);

      expect(result).toEqual(mockComment);
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          reviewId: commentData.reviewId,
          userId: commentData.userId,
          content: commentData.content,
          isFlagged: false,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        }
      });
    });

    it('should throw error if review not found', async () => {
      const commentData = {
        content: 'Great review!',
        userId: 'user-123',
        reviewId: 'non-existent'
      };

      const { prisma } = require('@/config/database');
      prisma.review.findUnique.mockResolvedValue(null);

      await expect(CommunityService.addComment(commentData)).rejects.toThrow('Review not found');
    });
  });

  describe('getReviewComments', () => {
    it('should get comments for review', async () => {
      const reviewId = 'review-456';
      const mockComments = [
        {
          id: 'comment-1',
          content: 'Great review!',
          userId: 'user-123',
          reviewId: 'review-456',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
            avatarUrl: 'https://example.com/avatar.jpg'
          }
        }
      ];

      const mockResponse = {
        data: mockComments,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      const { prisma } = require('@/config/database');
      prisma.comment.findMany.mockResolvedValue(mockComments);
      prisma.comment.count.mockResolvedValue(1);

      const result = await CommunityService.getReviewComments(reviewId);

      expect(result).toEqual(mockResponse);
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { 
          reviewId,
          isModerated: false
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        }
      });
    });
  });

  describe('followUser', () => {
    it('should follow user', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';

      const { prisma } = require('@/config/database');
      prisma.userFollow.create.mockResolvedValue({});
      prisma.userFollow.findUnique.mockResolvedValue(null);
      prisma.notification.create.mockResolvedValue({});

      await CommunityService.followUser(followerId, followingId);

      expect(prisma.userFollow.create).toHaveBeenCalledWith({
        data: {
          followerId,
          followingId
        }
      });
    });

    it('should throw error if trying to follow yourself', async () => {
      const followerId = 'user-123';
      const followingId = 'user-123';

      await expect(CommunityService.followUser(followerId, followingId)).rejects.toThrow('Cannot follow yourself');
    });

    it('should throw error if already following', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';

      const { prisma } = require('@/config/database');
      prisma.userFollow.findUnique.mockResolvedValue({ id: 'existing-follow' });

      await expect(CommunityService.followUser(followerId, followingId)).rejects.toThrow('Already following this user');
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow user', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';

      const { prisma } = require('@/config/database');
      prisma.userFollow.findUnique.mockResolvedValue({ id: 'follow-789' });
      prisma.userFollow.delete.mockResolvedValue({ id: 'follow-789' });

      await CommunityService.unfollowUser(followerId, followingId);

      expect(prisma.userFollow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      });
    });

    it('should throw error if not following user', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';

      const { prisma } = require('@/config/database');
      prisma.userFollow.findUnique.mockResolvedValue(null);

      await expect(CommunityService.unfollowUser(followerId, followingId)).rejects.toThrow('Not following this user');
    });
  });

  describe('getActivityFeed', () => {
    it('should get user activity feed', async () => {
      const userId = 'user-123';
      
      const mockFollowing = [{ followingId: 'user-456' }];
      const mockReviews = [
        {
          id: 'review-1',
          userId: 'user-456',
          bookId: 'book-1',
          rating: 5,
          reviewText: 'Great book!',
          createdAt: new Date(),
          user: {
            id: 'user-456',
            firstName: 'Jane',
            lastName: 'Doe',
            avatarUrl: 'https://example.com/avatar.jpg'
          },
          book: {
            id: 'book-1',
            title: 'Test Book',
            author: 'Test Author',
            coverImageUrl: 'https://example.com/cover.jpg'
          }
        }
      ];
      const mockComments: any[] = [];
      const mockFavorites: any[] = [];

      const { prisma } = require('@/config/database');
      prisma.userFollow.findMany.mockResolvedValue(mockFollowing);
      prisma.review.findMany.mockResolvedValue(mockReviews);
      prisma.comment.findMany.mockResolvedValue(mockComments);
      prisma.userFavorite.findMany.mockResolvedValue(mockFavorites);

      const result = await CommunityService.getActivityFeed(userId, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(1);
      expect(result.data[0].type).toBe('review');
    });
  });

});
