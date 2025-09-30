import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface CreateReviewData {
  userId: string;
  bookId: string;
  rating: number;
  reviewText: string;
}

export interface UpdateReviewData {
  rating?: number;
  reviewText?: string;
}

export class ReviewService {
  /**
   * Create a new review or update existing one
   */
  static async createReview(data: CreateReviewData): Promise<any> {
    try {
      // Check if user already reviewed this book
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: data.userId,
          bookId: data.bookId
        }
      });

      if (existingReview) {
        // Update existing review instead of throwing error
        const updatedReview = await prisma.review.update({
          where: { id: existingReview.id },
          data: {
            rating: data.rating,
            reviewText: data.reviewText,
            updatedAt: new Date()
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            book: {
              select: {
                id: true,
                title: true,
                author: true
              }
            }
          }
        });

        logger.info(`Updated existing review ${existingReview.id} for user ${data.userId}`);
        return updatedReview;
      }

      const review = await prisma.review.create({
        data: {
          userId: data.userId,
          bookId: data.bookId,
          rating: data.rating,
          reviewText: data.reviewText
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true
            }
          }
        }
      });

      return review;
    } catch (error) {
      logger.error('Error creating review:', error);
      throw error;
    }
  }

  /**
   * Update a review
   */
  static async updateReview(reviewId: string, userId: string, data: UpdateReviewData): Promise<any> {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      if (review.userId !== userId) {
        throw new Error('You can only update your own reviews');
      }

      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data,
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true
            }
          }
        }
      });

      return updatedReview;
    } catch (error) {
      logger.error('Error updating review:', error);
      throw error;
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      if (review.userId !== userId) {
        throw new Error('You can only delete your own reviews');
      }

      await prisma.review.delete({
        where: { id: reviewId }
      });
    } catch (error) {
      logger.error('Error deleting review:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a book
   */
  static async getBookReviews(bookId: string, page: number = 1, limit: number = 10): Promise<{
    reviews: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const reviews = await prisma.review.findMany({
        where: { bookId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      const totalCount = await prisma.review.count({
        where: { bookId }
      });

      return {
        reviews,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      logger.error('Error fetching book reviews:', error);
      throw error;
    }
  }

  /**
   * Get user's reviews
   */
  static async getUserReviews(userId: string, page: number = 1, limit: number = 10): Promise<{
    reviews: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const reviews = await prisma.review.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImageUrl: true
            }
          }
        }
      });

      const totalCount = await prisma.review.count({
        where: { userId }
      });

      return {
        reviews,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      logger.error('Error fetching user reviews:', error);
      throw error;
    }
  }

  /**
   * Get recent reviews across all books
   */
  static async getRecentReviews(limit: number = 10): Promise<any[]> {
    try {
      const reviews = await prisma.review.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImageUrl: true
            }
          }
        }
      });

      return reviews;
    } catch (error) {
      logger.error('Error fetching recent reviews:', error);
      throw error;
    }
  }

  /**
   * Get all reviews with filtering
   */
  static async getReviews(query: any): Promise<any> {
    try {
      const { page = 1, limit = 10, bookId, userId, minRating, maxRating } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: any = {};
      if (bookId) where.bookId = bookId;
      if (userId) where.userId = userId;
      if (minRating || maxRating) {
        where.rating = {};
        if (minRating) where.rating.gte = parseInt(minRating);
        if (maxRating) where.rating.lte = parseInt(maxRating);
      }

      const [reviews, totalCount] = await Promise.all([
        prisma.review.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            },
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverImageUrl: true
              }
            }
          }
        }),
        prisma.review.count({ where })
      ]);

      return {
        reviews,
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page)
      };
    } catch (error) {
      logger.error('Error fetching reviews:', error);
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  static async getReviewById(reviewId: string): Promise<any> {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImageUrl: true
            }
          }
        }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      return review;
    } catch (error) {
      logger.error('Error fetching review by ID:', error);
      throw error;
    }
  }

  /**
   * Vote review as helpful
   */
  static async voteReviewHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<void> {
    try {
      // Check if user already voted
      const existingVote = await prisma.reviewHelpful.findFirst({
        where: {
          userId,
          reviewId
        }
      });

      if (existingVote) {
        // Update existing vote
        await prisma.reviewHelpful.update({
          where: {
            id: existingVote.id
          },
          data: { isHelpful }
        });
      } else {
        // Create new vote
        await prisma.reviewHelpful.create({
          data: {
            userId,
            reviewId,
            isHelpful
          }
        });
      }
    } catch (error) {
      logger.error('Error voting review helpful:', error);
      throw error;
    }
  }
}