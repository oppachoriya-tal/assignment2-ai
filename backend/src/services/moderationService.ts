import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { GeminiService } from './geminiService';
import { UserRole } from '@prisma/client';

export interface ModerationQueueItem {
  id: string;
  type: 'review' | 'comment';
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  flaggedAt: Date;
  reason?: string;
  metadata?: any;
}

export interface ModerationAction {
  id: string;
  moderatorId: string;
  action: 'approve' | 'reject' | 'edit';
  reason: string;
  createdAt: Date;
}

export interface ModerationStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  flaggedCount: number;
  averageProcessingTime: number;
}

export class ModerationService {
  /**
   * Get moderation queue
   */
  static async getModerationQueue(page: number = 1, limit: number = 20): Promise<{
    data: ModerationQueueItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      // Get flagged reviews
      const flaggedReviews = await prisma.review.findMany({
        where: { isFlagged: true },
        skip: Math.floor(skip / 2),
        take: Math.ceil(limit / 2),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Get flagged comments
      const flaggedComments = await prisma.comment.findMany({
        where: { isFlagged: true },
        skip: Math.floor(skip / 2),
        take: Math.ceil(limit / 2),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Combine and sort
      const queueItems: ModerationQueueItem[] = [
        ...flaggedReviews.map(review => ({
          id: review.id,
          type: 'review' as const,
          content: review.reviewText,
          authorId: review.userId,
          authorName: `${review.user.firstName} ${review.user.lastName}`,
          createdAt: review.createdAt,
          flaggedAt: review.createdAt, // Assuming flagged when created
          metadata: {
            bookId: review.bookId,
            rating: review.rating,
          },
        })),
        ...flaggedComments.map(comment => ({
          id: comment.id,
          type: 'comment' as const,
          content: comment.content,
          authorId: comment.userId,
          authorName: `${comment.user.firstName} ${comment.user.lastName}`,
          createdAt: comment.createdAt,
          flaggedAt: comment.createdAt,
          metadata: {
            reviewId: comment.reviewId,
          },
        })),
      ];

      queueItems.sort((a, b) => b.flaggedAt.getTime() - a.flaggedAt.getTime());

      const total = queueItems.length;
      const totalPages = Math.ceil(total / limit);

      return {
        data: queueItems.slice(0, limit),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Failed to get moderation queue:', error);
      throw error;
    }
  }

  /**
   * Moderate content using Ollama analysis
   */
  static async moderateContent(content: string, contentType: 'review' | 'comment'): Promise<{
    isAppropriate: boolean;
    confidence: number;
    reasons: string[];
    suggestedAction: 'approve' | 'reject' | 'edit';
  }> {
    try {
      return await GeminiService.moderateContent(content, contentType);
    } catch (error) {
      logger.error('Gemini moderation failed:', error);
      // Fallback to basic moderation
      return {
        isAppropriate: content.length >= 10 && content.length <= 2000,
        confidence: 0.5,
        reasons: ['AI analysis unavailable'],
        suggestedAction: 'approve',
      };
    }
  }

  /**
   * Approve content
   */
  static async approveContent(
    contentId: string,
    contentType: 'review' | 'comment',
    moderatorId: string,
    reason?: string
  ): Promise<void> {
    try {
      if (contentType === 'review') {
        await prisma.review.update({
          where: { id: contentId },
          data: {
            isFlagged: false,
            isModerated: true,
          },
        });
      } else if (contentType === 'comment') {
        await prisma.comment.update({
          where: { id: contentId },
          data: {
            isFlagged: false,
            isModerated: true,
          },
        });
      }

      logger.info(`Content ${contentId} (${contentType}) approved by moderator ${moderatorId}`);
    } catch (error) {
      logger.error('Failed to approve content:', error);
      throw error;
    }
  }

  /**
   * Reject content
   */
  static async rejectContent(
    contentId: string,
    contentType: 'review' | 'comment',
    moderatorId: string,
    reason: string
  ): Promise<void> {
    try {
      if (contentType === 'review') {
        await prisma.review.update({
          where: { id: contentId },
          data: {
            isFlagged: false,
            isModerated: true,
          },
        });
      } else if (contentType === 'comment') {
        await prisma.comment.update({
          where: { id: contentId },
          data: {
            isFlagged: false,
            isModerated: true,
          },
        });
      }

      logger.info(`Content ${contentId} (${contentType}) rejected by moderator ${moderatorId}: ${reason}`);
    } catch (error) {
      logger.error('Failed to reject content:', error);
      throw error;
    }
  }

  /**
   * Edit content
   */
  static async editContent(
    contentId: string,
    contentType: 'review' | 'comment',
    moderatorId: string,
    newContent: string,
    reason: string
  ): Promise<void> {
    try {
      if (contentType === 'review') {
        await prisma.review.update({
          where: { id: contentId },
          data: {
            reviewText: newContent,
            isFlagged: false,
            isModerated: true,
            updatedAt: new Date(),
          },
        });
      } else if (contentType === 'comment') {
        await prisma.comment.update({
          where: { id: contentId },
          data: {
            content: newContent,
            isFlagged: false,
            isModerated: true,
            updatedAt: new Date(),
          },
        });
      }

      logger.info(`Content ${contentId} (${contentType}) edited by moderator ${moderatorId}: ${reason}`);
    } catch (error) {
      logger.error('Failed to edit content:', error);
      throw error;
    }
  }

  /**
   * Get moderation statistics
   */
  static async getModerationStats(): Promise<ModerationStats> {
    try {
      const [
        pendingReviews,
        pendingComments,
        approvedReviews,
        approvedComments,
        rejectedReviews,
        rejectedComments,
        flaggedReviews,
        flaggedComments,
      ] = await Promise.all([
        prisma.review.count({ where: { isFlagged: true, isModerated: false } }),
        prisma.comment.count({ where: { isFlagged: true, isModerated: false } }),
        prisma.review.count({ where: { isModerated: true, isFlagged: false } }),
        prisma.comment.count({ where: { isModerated: true, isFlagged: false } }),
        prisma.review.count({ where: { isModerated: true, isFlagged: true } }),
        prisma.comment.count({ where: { isModerated: true, isFlagged: true } }),
        prisma.review.count({ where: { isFlagged: true } }),
        prisma.comment.count({ where: { isFlagged: true } }),
      ]);

      const pendingCount = pendingReviews + pendingComments;
      const approvedCount = approvedReviews + approvedComments;
      const rejectedCount = rejectedReviews + rejectedComments;
      const flaggedCount = flaggedReviews + flaggedComments;

      // Calculate average processing time (simplified)
      const averageProcessingTime = 24; // hours

      return {
        pendingCount,
        approvedCount,
        rejectedCount,
        flaggedCount,
        averageProcessingTime,
      };
    } catch (error) {
      logger.error('Failed to get moderation stats:', error);
      throw error;
    }
  }

  /**
   * Get user moderation history
   */
  static async getUserModerationHistory(userId: string, page: number = 1, limit: number = 20): Promise<{
    data: Array<{
      id: string;
      type: 'review' | 'comment';
      content: string;
      status: 'approved' | 'rejected' | 'flagged';
      moderatedAt: Date;
      moderator?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, comments] = await Promise.all([
        prisma.review.findMany({
          where: { userId },
          skip: Math.floor(skip / 2),
          take: Math.ceil(limit / 2),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            reviewText: true,
            isFlagged: true,
            isModerated: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.comment.findMany({
          where: { userId },
          skip: Math.floor(skip / 2),
          take: Math.ceil(limit / 2),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            isFlagged: true,
            isModerated: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      const history = [
        ...reviews.map(review => ({
          id: review.id,
          type: 'review' as const,
          content: review.reviewText,
          status: review.isFlagged ? 'flagged' : review.isModerated ? 'approved' : 'approved' as const,
          moderatedAt: review.updatedAt,
        })),
        ...comments.map(comment => ({
          id: comment.id,
          type: 'comment' as const,
          content: comment.content,
          status: comment.isFlagged ? 'flagged' : comment.isModerated ? 'approved' : 'approved' as const,
          moderatedAt: comment.updatedAt,
        })),
      ];

      history.sort((a, b) => b.moderatedAt.getTime() - a.moderatedAt.getTime());

      const total = history.length;
      const totalPages = Math.ceil(total / limit);

      return {
        data: history.slice(0, limit) as any,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Failed to get user moderation history:', error);
      throw error;
    }
  }

  /**
   * Bulk moderate content
   */
  static async bulkModerateContent(
    contentIds: string[],
    contentType: 'review' | 'comment',
    action: 'approve' | 'reject',
    moderatorId: string,
    reason?: string
  ): Promise<void> {
    try {
      const updateData = {
        isFlagged: false,
        isModerated: true,
      };

      if (contentType === 'review') {
        await prisma.review.updateMany({
          where: { id: { in: contentIds } },
          data: updateData,
        });
      } else if (contentType === 'comment') {
        await prisma.comment.updateMany({
          where: { id: { in: contentIds } },
          data: updateData,
        });
      }

      logger.info(`Bulk ${action} for ${contentIds.length} ${contentType}s by moderator ${moderatorId}`);
    } catch (error) {
      logger.error('Failed to bulk moderate content:', error);
      throw error;
    }
  }

  /**
   * Auto-moderate new content
   */
  static async autoModerateContent(content: string, contentType: 'review' | 'comment'): Promise<boolean> {
    try {
      const moderation = await this.moderateContent(content, contentType);
      
      if (!moderation.isAppropriate && moderation.confidence > 0.8) {
        // Auto-flag high confidence inappropriate content
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Auto-moderation failed:', error);
      return false;
    }
  }
}
