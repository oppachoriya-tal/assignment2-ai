import { ReviewService } from '../../services/reviewService';
import { prisma } from '../../config/database';

describe('ReviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    it('should create a new review successfully', async () => {
      const reviewData = {
        userId: 'user-1',
        bookId: 'book-1',
        rating: 5,
        reviewText: 'Great book!'
      };

      const mockReview = {
        id: 'review-1',
        ...reviewData,
        createdAt: new Date(),
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        book: {
          id: 'book-1',
          title: 'Test Book',
          author: 'Test Author'
        }
      };

      (prisma.review.findFirst as vi.Mock).mockResolvedValue(null);
      (prisma.review.create as vi.Mock).mockResolvedValue(mockReview);

      const result = await ReviewService.createReview(reviewData);

      expect(result).toEqual(mockReview);
      expect(prisma.review.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          bookId: 'book-1'
        }
      });
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: reviewData,
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
    });

    it('should update existing review if user already reviewed this book', async () => {
      const reviewData = {
        userId: 'user-1',
        bookId: 'book-1',
        rating: 5,
        reviewText: 'Great book!'
      };

      const existingReview = {
        id: 'existing-review',
        userId: 'user-1',
        bookId: 'book-1'
      };

      const updatedReview = {
        id: 'existing-review',
        userId: 'user-1',
        bookId: 'book-1',
        rating: 5,
        reviewText: 'Great book!',
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        book: { id: 'book-1', title: 'Test Book', author: 'Test Author' }
      };

      (prisma.review.findFirst as vi.Mock).mockResolvedValue(existingReview);
      (prisma.review.update as vi.Mock).mockResolvedValue(updatedReview);

      const result = await ReviewService.createReview(reviewData);

      expect(result).toEqual(updatedReview);
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'existing-review' },
        data: {
          rating: 5,
          reviewText: 'Great book!',
          updatedAt: expect.any(Date)
        },
        include: expect.any(Object)
      });
    });
  });

  describe('updateReview', () => {
    it('should update review successfully', async () => {
      const reviewId = 'review-1';
      const userId = 'user-1';
      const updateData = {
        rating: 4,
        reviewText: 'Updated review text'
      };

      const mockReview = {
        id: reviewId,
        userId,
        bookId: 'book-1',
        rating: 4,
        reviewText: 'Updated review text',
        user: {
          id: 'user-1',
          username: 'johndoe',
          email: 'john@example.com'
        },
        book: {
          id: 'book-1',
          title: 'Test Book',
          author: 'Test Author'
        }
      };

      (prisma.review.findUnique as vi.Mock).mockResolvedValue({
        id: reviewId,
        userId
      });
      (prisma.review.update as vi.Mock).mockResolvedValue(mockReview);

      const result = await ReviewService.updateReview(reviewId, userId, updateData);

      expect(result).toEqual(mockReview);
      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId }
      });
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: updateData,
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
    });

    it('should throw error if review not found', async () => {
      const reviewId = 'nonexistent-review';
      const userId = 'user-1';
      const updateData = { rating: 4 };

      (prisma.review.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(ReviewService.updateReview(reviewId, userId, updateData)).rejects.toThrow(
        'Review not found'
      );
    });

    it('should throw error if user tries to update someone else\'s review', async () => {
      const reviewId = 'review-1';
      const userId = 'user-2';
      const updateData = { rating: 4 };

      (prisma.review.findUnique as vi.Mock).mockResolvedValue({
        id: reviewId,
        userId: 'user-1'
      });

      await expect(ReviewService.updateReview(reviewId, userId, updateData)).rejects.toThrow(
        'You can only update your own reviews'
      );
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      const reviewId = 'review-1';
      const userId = 'user-1';

      (prisma.review.findUnique as vi.Mock).mockResolvedValue({
        id: reviewId,
        userId
      });
      (prisma.review.delete as vi.Mock).mockResolvedValue({});

      await ReviewService.deleteReview(reviewId, userId);

      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId }
      });
      expect(prisma.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId }
      });
    });

    it('should throw error if review not found', async () => {
      const reviewId = 'nonexistent-review';
      const userId = 'user-1';

      (prisma.review.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(ReviewService.deleteReview(reviewId, userId)).rejects.toThrow(
        'Review not found'
      );
    });

    it('should throw error if user tries to delete someone else\'s review', async () => {
      const reviewId = 'review-1';
      const userId = 'user-2';

      (prisma.review.findUnique as vi.Mock).mockResolvedValue({
        id: reviewId,
        userId: 'user-1'
      });

      await expect(ReviewService.deleteReview(reviewId, userId)).rejects.toThrow(
        'You can only delete your own reviews'
      );
    });
  });

  describe('getBookReviews', () => {
    it('should get reviews for a book with pagination', async () => {
      const bookId = 'book-1';
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          reviewText: 'Great book!',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            username: 'johndoe',
            email: 'john@example.com'
          }
        }
      ];

      (prisma.review.findMany as vi.Mock).mockResolvedValue(mockReviews);
      (prisma.review.count as vi.Mock).mockResolvedValue(1);

      const result = await ReviewService.getBookReviews(bookId, 1, 10);

      expect(result).toEqual({
        reviews: mockReviews,
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      });
    });
  });

  describe('getUserReviews', () => {
    it('should get user reviews with pagination', async () => {
      const userId = 'user-1';
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          reviewText: 'Great book!',
          createdAt: new Date(),
          book: {
            id: 'book-1',
            title: 'Test Book',
            author: 'Test Author',
            coverImageUrl: 'https://example.com/cover.jpg'
          }
        }
      ];

      (prisma.review.findMany as vi.Mock).mockResolvedValue(mockReviews);
      (prisma.review.count as vi.Mock).mockResolvedValue(1);

      const result = await ReviewService.getUserReviews(userId, 1, 10);

      expect(result).toEqual({
        reviews: mockReviews,
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      });
    });
  });

  describe('getRecentReviews', () => {
    it('should get recent reviews across all books', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          reviewText: 'Great book!',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            username: 'johndoe',
            email: 'john@example.com'
          },
          book: {
            id: 'book-1',
            title: 'Test Book',
            author: 'Test Author',
            coverImageUrl: 'https://example.com/cover.jpg'
          }
        }
      ];

      (prisma.review.findMany as vi.Mock).mockResolvedValue(mockReviews);

      const result = await ReviewService.getRecentReviews(10);

      expect(result).toEqual(mockReviews);
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        take: 10,
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
    });

    it('should handle database errors when getting recent reviews', async () => {
      (prisma.review.findMany as vi.Mock).mockRejectedValue(new Error('Database error'));

      await expect(ReviewService.getRecentReviews(10)).rejects.toThrow('Database error');
    });
  });

  describe('getReviews', () => {
    it('should get all reviews with pagination', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          reviewText: 'Great book!',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            username: 'johndoe',
            email: 'john@example.com'
          },
          book: {
            id: 'book-1',
            title: 'Test Book',
            author: 'Test Author'
          }
        }
      ];

      (prisma.review.findMany as vi.Mock).mockResolvedValue(mockReviews);
      (prisma.review.count as vi.Mock).mockResolvedValue(1);

      const result = await ReviewService.getReviews(1);

      expect(result).toEqual({
        reviews: mockReviews,
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      });
    });

    it('should handle database errors when getting reviews', async () => {
      (prisma.review.findMany as vi.Mock).mockRejectedValue(new Error('Database error'));

      await expect(ReviewService.getReviews(1)).rejects.toThrow('Database error');
    });
  });

  describe('getReviewById', () => {
    it('should get review by id successfully', async () => {
      const reviewId = 'review-1';
      const mockReview = {
        id: reviewId,
        rating: 5,
        reviewText: 'Great book!',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          username: 'johndoe',
          email: 'john@example.com'
        },
        book: {
          id: 'book-1',
          title: 'Test Book',
          author: 'Test Author'
        }
      };

      (prisma.review.findUnique as vi.Mock).mockResolvedValue(mockReview);

      const result = await ReviewService.getReviewById(reviewId);

      expect(result).toEqual(mockReview);
      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
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
    });

    it('should throw error if review not found', async () => {
      const reviewId = 'nonexistent-review';

      (prisma.review.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(ReviewService.getReviewById(reviewId)).rejects.toThrow('Review not found');
    });

    it('should handle database errors when getting review by id', async () => {
      const reviewId = 'review-1';

      (prisma.review.findUnique as vi.Mock).mockRejectedValue(new Error('Database error'));

      await expect(ReviewService.getReviewById(reviewId)).rejects.toThrow('Database error');
    });
  });

  describe('error handling', () => {
    it('should handle database errors during review creation', async () => {
      const reviewData = {
        userId: 'user-1',
        bookId: 'book-1',
        rating: 5,
        reviewText: 'Great book!'
      };

      (prisma.review.findFirst as vi.Mock).mockResolvedValue(null);
      (prisma.review.create as vi.Mock).mockRejectedValue(new Error('Database error'));

      await expect(ReviewService.createReview(reviewData)).rejects.toThrow('Database error');
    });

    it('should handle database errors during review update', async () => {
      const reviewId = 'review-1';
      const userId = 'user-1';
      const updateData = { rating: 4 };

      (prisma.review.findUnique as vi.Mock).mockResolvedValue({
        id: reviewId,
        userId
      });
      (prisma.review.update as vi.Mock).mockRejectedValue(new Error('Database error'));

      await expect(ReviewService.updateReview(reviewId, userId, updateData)).rejects.toThrow('Database error');
    });

    it('should handle database errors during review deletion', async () => {
      const reviewId = 'review-1';
      const userId = 'user-1';

      (prisma.review.findUnique as vi.Mock).mockResolvedValue({
        id: reviewId,
        userId
      });
      (prisma.review.delete as vi.Mock).mockRejectedValue(new Error('Database error'));

      await expect(ReviewService.deleteReview(reviewId, userId)).rejects.toThrow('Database error');
    });
  });
});