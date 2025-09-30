import request from 'supertest';
import { app } from '../index';
import { prisma } from "../config/database"';
import { ReviewService } from '../services/reviewService';

describe('Review Service', () => {
  let testBook: any;
  let testUser: any;
  let accessToken: string;
  let testReview: any;

  beforeAll(async () => {
    // Clean up test data
    await prisma.reviewHelpful.deleteMany();
    await prisma.review.deleteMany();
    await prisma.bookGenre.deleteMany();
    await prisma.book.deleteMany();
    await prisma.genre.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test@'
        }
      }
    });

    // Create test user
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    testUser = userResponse.body.data.user;

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    accessToken = loginResponse.body.data.tokens.accessToken;

    // Create test book
    testBook = await prisma.book.create({
      data: {
        title: 'Test Book',
        author: 'Test Author',
        description: 'A test book for testing',
        isbn: '1234567890',
        publishedYear: 2023,
        price: 29.99
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.reviewHelpful.deleteMany();
    await prisma.review.deleteMany();
    await prisma.bookGenre.deleteMany();
    await prisma.book.deleteMany();
    await prisma.genre.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test@'
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/reviews', () => {
    it('should create a review successfully', async () => {
      const reviewData = {
        bookId: testBook.id,
        rating: 5,
        reviewText: 'This is an excellent book! Highly recommended.'
      };

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(reviewData.rating);
      expect(response.body.data.reviewText).toBe(reviewData.reviewText);
      expect(response.body.data.userId).toBe(testUser.id);
      expect(response.body.data.bookId).toBe(testBook.id);

      testReview = response.body.data;
    });

    it('should reject review with invalid rating', async () => {
      const reviewData = {
        bookId: testBook.id,
        rating: 6, // Invalid rating
        reviewText: 'This is a test review.'
      };

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should reject review with short text', async () => {
      const reviewData = {
        bookId: testBook.id,
        rating: 4,
        reviewText: 'Short' // Too short
      };

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Review text must be at least 10 characters long');
    });

    it('should reject duplicate review for same book', async () => {
      const reviewData = {
        bookId: testBook.id,
        rating: 3,
        reviewText: 'This is another review for the same book.'
      };

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You have already reviewed this book');
    });

    it('should reject review without authentication', async () => {
      const reviewData = {
        bookId: testBook.id,
        rating: 4,
        reviewText: 'This is a test review.'
      };

      const response = await request(app)
        .post('/api/v1/reviews')
        .send(reviewData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should reject review with missing fields', async () => {
      const reviewData = {
        bookId: testBook.id,
        rating: 4
        // Missing reviewText
      };

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Book ID, rating, and review text are required');
    });
  });

  describe('GET /api/v1/reviews', () => {
    it('should get reviews with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/reviews')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeDefined();
      expect(response.body.data.totalCount).toBeDefined();
      expect(response.body.data.totalPages).toBeDefined();
      expect(response.body.data.currentPage).toBe(1);
    });

    it('should filter reviews by book ID', async () => {
      const response = await request(app)
        .get('/api/v1/reviews')
        .query({ bookId: testBook.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews.length).toBeGreaterThan(0);
      expect(response.body.data.reviews[0].bookId).toBe(testBook.id);
    });

    it('should filter reviews by user ID', async () => {
      const response = await request(app)
        .get('/api/v1/reviews')
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews.length).toBeGreaterThan(0);
      expect(response.body.data.reviews[0].userId).toBe(testUser.id);
    });

    it('should filter reviews by rating range', async () => {
      const response = await request(app)
        .get('/api/v1/reviews')
        .query({ minRating: 4, maxRating: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews.length).toBeGreaterThan(0);
      expect(response.body.data.reviews[0].rating).toBeGreaterThanOrEqual(4);
      expect(response.body.data.reviews[0].rating).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/v1/reviews/:id', () => {
    it('should get review by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/reviews/${testReview.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testReview.id);
      expect(response.body.data.rating).toBe(testReview.rating);
      expect(response.body.data.reviewText).toBe(testReview.reviewText);
    });

    it('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .get('/api/v1/reviews/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Review not found');
    });
  });

  describe('PUT /api/v1/reviews/:id', () => {
    it('should update review successfully', async () => {
      const updateData = {
        rating: 4,
        reviewText: 'Updated review text with more details about the book.'
      };

      const response = await request(app)
        .put(`/api/v1/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(updateData.rating);
      expect(response.body.data.reviewText).toBe(updateData.reviewText);
    });

    it('should update only rating', async () => {
      const updateData = {
        rating: 3
      };

      const response = await request(app)
        .put(`/api/v1/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(updateData.rating);
    });

    it('should update only review text', async () => {
      const updateData = {
        reviewText: 'Another updated review text with different content.'
      };

      const response = await request(app)
        .put(`/api/v1/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviewText).toBe(updateData.reviewText);
    });

    it('should reject update with invalid rating', async () => {
      const updateData = {
        rating: 6 // Invalid rating
      };

      const response = await request(app)
        .put(`/api/v1/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should reject update with short text', async () => {
      const updateData = {
        reviewText: 'Short' // Too short
      };

      const response = await request(app)
        .put(`/api/v1/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Review text must be at least 10 characters long');
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        rating: 4
      };

      const response = await request(app)
        .put(`/api/v1/reviews/${testReview.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should reject update with no fields', async () => {
      const response = await request(app)
        .put(`/api/v1/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('At least one field (rating or reviewText) must be provided');
    });
  });

  describe('DELETE /api/v1/reviews/:id', () => {
    it('should delete review successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/reviews/${testReview.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Review deleted successfully');
    });

    it('should reject delete without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/reviews/${testReview.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .delete('/api/v1/reviews/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Review not found');
    });
  });

  describe('GET /api/v1/reviews/user/:userId', () => {
    it('should get user reviews', async () => {
      const response = await request(app)
        .get(`/api/v1/reviews/user/${testUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeDefined();
      expect(response.body.data.totalCount).toBeDefined();
      expect(response.body.data.totalPages).toBeDefined();
      expect(response.body.data.currentPage).toBeDefined();
    });
  });

  describe('ReviewService Unit Tests', () => {
    it('should create review', async () => {
      // Create a new book for testing
      const newBook = await prisma.book.create({
        data: {
          title: 'New Test Book',
          author: 'New Test Author',
          description: 'A new test book',
          isbn: '0987654321',
          publishedYear: 2023
        }
      });

      const reviewData = {
        userId: testUser.id,
        bookId: newBook.id,
        rating: 4,
        reviewText: 'This is a great book for testing purposes.'
      };

      const review = await ReviewService.createReview(reviewData);
      
      expect(review).toBeDefined();
      expect(review.rating).toBe(reviewData.rating);
      expect(review.reviewText).toBe(reviewData.reviewText);
      expect(review.userId).toBe(reviewData.userId);
      expect(review.bookId).toBe(reviewData.bookId);

      // Clean up
      await prisma.review.delete({ where: { id: review.id } });
      await prisma.book.delete({ where: { id: newBook.id } });
    });

    it('should get book reviews', async () => {
      const result = await ReviewService.getBookReviews(testBook.id, 1, 10);
      
      expect(result.reviews).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBe(1);
      expect(Array.isArray(result.reviews)).toBe(true);
    });

    it('should get user reviews', async () => {
      const result = await ReviewService.getUserReviews(testUser.id, 1, 10);
      
      expect(result.reviews).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBe(1);
      expect(Array.isArray(result.reviews)).toBe(true);
    });

    it('should get recent reviews', async () => {
      const reviews = await ReviewService.getRecentReviews(10);
      
      expect(Array.isArray(reviews)).toBe(true);
    });
  });
});