import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface CreateFeedbackData {
  userId?: string;
  type: 'BUG_REPORT' | 'FEATURE_REQUEST' | 'GENERAL_FEEDBACK' | 'COVER_GENERATION' | 'UI_IMPROVEMENT';
  subject: string;
  message: string;
  rating?: number; // 1-5 stars for general feedback
  metadata?: any; // Additional data like book ID, page URL, etc.
  userAgent?: string;
  userEmail?: string;
}

export interface FeedbackResponse {
  id: string;
  type: string;
  subject: string;
  message: string;
  rating?: number;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  adminResponse?: string;
  adminResponseAt?: Date;
}

export class FeedbackService {
  /**
   * Create new feedback
   */
  static async createFeedback(data: CreateFeedbackData): Promise<FeedbackResponse> {
    try {
      const feedback = await prisma.feedback.create({
        data: {
          userId: data.userId,
          type: data.type,
          subject: data.subject,
          message: data.message,
          rating: data.rating,
          metadata: data.metadata || {},
          userAgent: data.userAgent,
          userEmail: data.userEmail,
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      logger.info('New feedback created:', { id: feedback.id, type: data.type });

      return {
        id: feedback.id,
        type: feedback.type,
        subject: feedback.subject,
        message: feedback.message,
        rating: feedback.rating || undefined,
        status: feedback.status as any,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
        user: feedback.user ? {
          id: feedback.user.id,
          username: `${feedback.user.firstName} ${feedback.user.lastName}`,
          email: feedback.user.email
        } : undefined
      };
    } catch (error) {
      logger.error('Error creating feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback by ID
   */
  static async getFeedbackById(id: string): Promise<FeedbackResponse | null> {
    try {
      const feedback = await prisma.feedback.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!feedback) {
        return null;
      }

      return {
        id: feedback.id,
        type: feedback.type,
        subject: feedback.subject,
        message: feedback.message,
        rating: feedback.rating || undefined,
        status: feedback.status as any,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
        user: feedback.user ? {
          id: feedback.user.id,
          username: `${feedback.user.firstName} ${feedback.user.lastName}`,
          email: feedback.user.email
        } : undefined,
        adminResponse: feedback.adminResponse || undefined,
        adminResponseAt: feedback.adminResponseAt || undefined
      };
    } catch (error) {
      logger.error('Error fetching feedback:', error);
      throw error;
    }
  }

  /**
   * Get all feedback with pagination and filtering
   */
  static async getFeedback(filters: {
    type?: string;
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    feedback: FeedbackResponse[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const {
        type,
        status,
        userId,
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;
      const where: any = {};

      if (type) where.type = type;
      if (status) where.status = status;
      if (userId) where.userId = userId;

      const feedback = await prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      const totalCount = await prisma.feedback.count({ where });

      const feedbackResponses: FeedbackResponse[] = feedback.map(f => ({
        id: f.id,
        type: f.type,
        subject: f.subject,
        message: f.message,
        rating: f.rating || undefined,
        status: f.status as any,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        user: f.user ? {
          id: f.user.id,
          username: `${f.user.firstName} ${f.user.lastName}`,
          email: f.user.email
        } : undefined,
        adminResponse: f.adminResponse || undefined,
        adminResponseAt: f.adminResponseAt || undefined
      }));

      return {
        feedback: feedbackResponses,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      logger.error('Error fetching feedback:', error);
      throw error;
    }
  }

  /**
   * Update feedback status (Admin only)
   */
  static async updateFeedbackStatus(
    id: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
    adminResponse?: string
  ): Promise<FeedbackResponse> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (adminResponse) {
        updateData.adminResponse = adminResponse;
        updateData.adminResponseAt = new Date();
      }

      const feedback = await prisma.feedback.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      logger.info('Feedback status updated:', { id, status });

      return {
        id: feedback.id,
        type: feedback.type,
        subject: feedback.subject,
        message: feedback.message,
        rating: feedback.rating || undefined,
        status: feedback.status as any,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
        user: feedback.user ? {
          id: feedback.user.id,
          username: `${feedback.user.firstName} ${feedback.user.lastName}`,
          email: feedback.user.email
        } : undefined,
        adminResponse: feedback.adminResponse || undefined,
        adminResponseAt: feedback.adminResponseAt || undefined
      };
    } catch (error) {
      logger.error('Error updating feedback status:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   */
  static async getFeedbackStats(): Promise<any> {
    try {
      const stats = await prisma.feedback.groupBy({
        by: ['type', 'status'],
        _count: {
          id: true
        }
      });

      const totalCount = await prisma.feedback.count();
      const avgRating = await prisma.feedback.aggregate({
        _avg: {
          rating: true
        },
        where: {
          rating: { not: null }
        }
      });

      return {
        totalFeedback: totalCount,
        averageRating: avgRating._avg.rating || 0,
        byType: stats.reduce((acc: any, stat) => {
          if (!acc[stat.type]) acc[stat.type] = {};
          acc[stat.type][stat.status] = stat._count.id;
          return acc;
        }, {}),
        recentCount: await prisma.feedback.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      };
    } catch (error) {
      logger.error('Error fetching feedback stats:', error);
      throw error;
    }
  }

  /**
   * Get user's feedback
   */
  static async getUserFeedback(userId: string, page: number = 1, limit: number = 10): Promise<{
    feedback: FeedbackResponse[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const feedback = await prisma.feedback.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      const totalCount = await prisma.feedback.count({
        where: { userId }
      });

      const feedbackResponses: FeedbackResponse[] = feedback.map(f => ({
        id: f.id,
        type: f.type,
        subject: f.subject,
        message: f.message,
        rating: f.rating || undefined,
        status: f.status as any,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        user: f.user ? {
          id: f.user.id,
          username: `${f.user.firstName} ${f.user.lastName}`,
          email: f.user.email
        } : undefined,
        adminResponse: f.adminResponse || undefined,
        adminResponseAt: f.adminResponseAt || undefined
      }));

      return {
        feedback: feedbackResponses,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      logger.error('Error fetching user feedback:', error);
      throw error;
    }
  }
}
