import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AIService } from './aiService';

export interface Comment {
  id: string;
  content: string;
  userId: string;
  reviewId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface ActivityFeedItem {
  id: string;
  type: 'review' | 'comment' | 'follow' | 'favorite';
  userId: string;
  targetId?: string;
  targetType?: 'book' | 'review' | 'user';
  data: any;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface NotificationData {
  id: string;
  type: 'REVIEW_COMMENT' | 'FOLLOW' | 'BOOK_RECOMMENDATION' | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
}

export class CommunityService {
  /**
   * Add comment to review
   */
  static async addComment(data: {
    reviewId: string;
    userId: string;
    content: string;
  }): Promise<Comment> {
    try {
      // Check if review exists
      const review = await prisma.review.findUnique({
        where: { id: data.reviewId }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Analyze comment for inappropriate content
      const analysis = await AIService.analyzeReview(data.content);
      
      const comment = await prisma.comment.create({
        data: {
          reviewId: data.reviewId,
          userId: data.userId,
          content: data.content,
          isFlagged: analysis.sentiment === 'negative' && analysis.quality < 0.3,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Create notification for review author
      await this.createNotification({
        userId: review.userId,
        type: 'REVIEW_COMMENT',
        title: 'New Comment on Your Review',
        message: `Someone commented on your review of "${review.reviewText.substring(0, 50)}..."`,
        metadata: {
          commentId: comment.id,
          reviewId: data.reviewId,
          commenterId: data.userId,
        },
      });

      logger.info(`Comment added to review ${data.reviewId} by user ${data.userId}`);
      return comment as Comment;
    } catch (error) {
      logger.error('Failed to add comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for a review
   */
  static async getReviewComments(reviewId: string, page: number = 1, limit: number = 10): Promise<{
    data: Comment[];
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

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            reviewId,
            isModerated: false, // Only show approved comments
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        }),
        prisma.comment.count({
          where: {
            reviewId,
            isModerated: false,
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: comments as Comment[],
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
      logger.error('Failed to get review comments:', error);
      throw error;
    }
  }

  /**
   * Follow a user
   */
  static async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
      }

      // Check if already following
      const existingFollow = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existingFollow) {
        throw new Error('Already following this user');
      }

      // Create follow relationship
      await prisma.userFollow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // Create notification
      await this.createNotification({
        userId: followingId,
        type: 'FOLLOW',
        title: 'New Follower',
        message: 'Someone started following you',
        metadata: {
          followerId,
        },
      });

      logger.info(`User ${followerId} followed user ${followingId}`);
    } catch (error) {
      logger.error('Failed to follow user:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      const follow = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (!follow) {
        throw new Error('Not following this user');
      }

      await prisma.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      logger.info(`User ${followerId} unfollowed user ${followingId}`);
    } catch (error) {
      logger.error('Failed to unfollow user:', error);
      throw error;
    }
  }

  /**
   * Get user's activity feed
   */
  static async getActivityFeed(userId: string, page: number = 1, limit: number = 20): Promise<{
    data: ActivityFeedItem[];
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

      // Get users that the current user follows
      const following = await prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followingIds = following.map(f => f.followingId);

      // Get recent activities from followed users
      const [reviews, comments, favorites] = await Promise.all([
        prisma.review.findMany({
          where: {
            userId: { in: followingIds },
          },
          skip,
          take: Math.ceil(limit * 0.6), // 60% reviews
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverImageUrl: true,
              },
            },
          },
        }),
        prisma.comment.findMany({
          where: {
            userId: { in: followingIds },
          },
          skip: Math.floor(skip * 0.3),
          take: Math.ceil(limit * 0.3), // 30% comments
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            review: {
              select: {
                id: true,
                reviewText: true,
                book: {
                  select: {
                    id: true,
                    title: true,
                    author: true,
                  },
                },
              },
            },
          },
        }),
        prisma.userFavorite.findMany({
          where: {
            userId: { in: followingIds },
          },
          skip: Math.floor(skip * 0.1),
          take: Math.ceil(limit * 0.1), // 10% favorites
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverImageUrl: true,
              },
            },
          },
        }),
      ]);

      // Combine and sort activities
      const activities: ActivityFeedItem[] = [
        ...reviews.map(review => ({
          id: `review-${review.id}`,
          type: 'review' as const,
          userId: review.userId,
          targetId: review.bookId,
          targetType: 'book' as const,
          data: {
            book: review.book,
            rating: review.rating,
            reviewText: review.reviewText,
          },
          createdAt: review.createdAt,
          user: review.user,
        })),
        ...comments.map(comment => ({
          id: `comment-${comment.id}`,
          type: 'comment' as const,
          userId: comment.userId,
          targetId: comment.reviewId,
          targetType: 'review' as const,
          data: {
            review: comment.review,
            content: comment.content,
          },
          createdAt: comment.createdAt,
          user: comment.user,
        })),
        ...favorites.map(favorite => ({
          id: `favorite-${favorite.id}`,
          type: 'favorite' as const,
          userId: favorite.userId,
          targetId: favorite.bookId,
          targetType: 'book' as const,
          data: {
            book: favorite.book,
          },
          createdAt: favorite.createdAt,
          user: favorite.user,
        })),
      ] as ActivityFeedItem[];

      // Sort by creation date
      activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = activities.length;
      const totalPages = Math.ceil(total / limit);

      return {
        data: activities.slice(0, limit),
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
      logger.error('Failed to get activity feed:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20): Promise<{
    data: NotificationData[];
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

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({
          where: { userId },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: notifications.map(notif => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          isRead: notif.isRead,
          metadata: notif.metadata,
          createdAt: notif.createdAt,
        })),
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
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
        },
      });

      logger.info(`Notification ${notificationId} marked as read for user ${userId}`);
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      logger.info(`All notifications marked as read for user ${userId}`);
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Create notification
   */
  private static async createNotification(data: {
    userId: string;
    type: 'REVIEW_COMMENT' | 'FOLLOW' | 'BOOK_RECOMMENDATION' | 'SYSTEM_ANNOUNCEMENT';
    title: string;
    message: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata,
        },
      });
    } catch (error) {
      logger.error('Failed to create notification:', error);
      // Don't throw error for notification failures
    }
  }

  /**
   * Report inappropriate content
   */
  static async reportContent(data: {
    reporterId: string;
    contentType: 'review' | 'comment';
    contentId: string;
    reason: string;
    description?: string;
  }): Promise<void> {
    try {
      // Create report record (you might want to add a reports table)
      logger.info(`Content reported: ${data.contentType} ${data.contentId} by user ${data.reporterId}`);
      
      // Flag the content for moderation
      if (data.contentType === 'review') {
        await prisma.review.update({
          where: { id: data.contentId },
          data: { isFlagged: true },
        });
      } else if (data.contentType === 'comment') {
        await prisma.comment.update({
          where: { id: data.contentId },
          data: { isFlagged: true },
        });
      }

      // Notify moderators
      const moderators = await prisma.user.findMany({
        where: {
          role: { in: ['MODERATOR', 'ADMIN'] },
        },
        select: { id: true },
      });

      for (const moderator of moderators) {
        await this.createNotification({
          userId: moderator.id,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'Content Reported',
          message: `A ${data.contentType} has been reported and flagged for review`,
          metadata: {
            contentType: data.contentType,
            contentId: data.contentId,
            reporterId: data.reporterId,
            reason: data.reason,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to report content:', error);
      throw error;
    }
  }

  /**
   * Get community statistics
   */
  static async getCommunityStats(): Promise<{
    totalUsers: number;
    totalReviews: number;
    totalBooks: number;
    totalComments: number;
    activeUsers: number;
    averageRating: number;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalUsers,
        totalReviews,
        totalBooks,
        totalComments,
        activeUsers,
        averageRatingResult,
      ] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.review.count(),
        prisma.book.count(),
        prisma.comment.count(),
        prisma.user.count({
          where: {
            reviews: {
              some: {
                createdAt: { gte: thirtyDaysAgo },
              },
            },
          },
        }),
        prisma.review.aggregate({
          _avg: { rating: true },
        }),
      ]);

      return {
        totalUsers,
        totalReviews,
        totalBooks,
        totalComments,
        activeUsers,
        averageRating: averageRatingResult._avg.rating ? Math.round(averageRatingResult._avg.rating * 10) / 10 : 0,
      };
    } catch (error) {
      logger.error('Failed to get community stats:', error);
      throw error;
    }
  }
}
