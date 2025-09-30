import request from 'supertest';
import { app } from '../index';
import { prisma } from '../config/database';
import { UserService } from '../services/userService';

describe('User Service', () => {
  let testUser: any;
  let testBook: any;
  let accessToken: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.userFavorite.deleteMany();
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

    // Create a review for the user
    await prisma.review.create({
      data: {
        userId: testUser.id,
        bookId: testBook.id,
        rating: 5,
        reviewText: 'This is an excellent book! Highly recommended.'
      }
    });

    // Add book to favorites
    await prisma.userFavorite.create({
      data: {
        userId: testUser.id,
        bookId: testBook.id
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.userFavorite.deleteMany();
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

  describe('GET /api/v1/users/profile', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.firstName).toBe(testUser.firstName);
      expect(response.body.data.lastName).toBe(testUser.lastName);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalReviews).toBeDefined();
      expect(response.body.data.stats.totalFavorites).toBeDefined();
      expect(response.body.data.stats.averageRating).toBeDefined();
      expect(response.body.data.stats.helpfulVotes).toBeDefined();
    });

    it('should reject profile request without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'This is my updated bio'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
      expect(response.body.data.bio).toBe(updateData.bio);
    });

    it('should reject update with invalid firstName', async () => {
      const updateData = {
        firstName: 'A', // Too short
        lastName: 'User'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('First name must be between 2 and 50 characters');
    });

    it('should reject update with invalid lastName', async () => {
      const updateData = {
        firstName: 'Test',
        lastName: 'A' // Too short
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Last name must be between 2 and 50 characters');
    });

    it('should reject update with long bio', async () => {
      const updateData = {
        firstName: 'Test',
        lastName: 'User',
        bio: 'A'.repeat(501) // Too long
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bio must be less than 500 characters');
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should reject update with missing required fields', async () => {
      const updateData = {
        firstName: 'Test'
        // Missing lastName
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('First name and last name are required');
    });
  });

  describe('GET /api/v1/users/:userId/profile', () => {
    it('should get public user profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}/profile`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.firstName).toBeDefined();
      expect(response.body.data.lastName).toBeDefined();
      expect(response.body.data.stats).toBeDefined();
      // Should not include sensitive information like email
      expect(response.body.data.email).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/non-existent-id/profile')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /api/v1/users/:userId/reviews', () => {
    it('should get user reviews', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}/reviews`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeDefined();
      expect(response.body.data.totalCount).toBeDefined();
      expect(response.body.data.totalPages).toBeDefined();
      expect(response.body.data.currentPage).toBeDefined();
      expect(response.body.data.reviews.length).toBeGreaterThan(0);
    });

    it('should get user reviews with pagination', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}/reviews`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeDefined();
      expect(response.body.data.currentPage).toBe(1);
    });
  });

  describe('GET /api/v1/users/:userId/favorites', () => {
    it('should get user favorites', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}/favorites`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.favorites).toBeDefined();
      expect(response.body.data.totalCount).toBeDefined();
      expect(response.body.data.totalPages).toBeDefined();
      expect(response.body.data.currentPage).toBeDefined();
      expect(response.body.data.favorites.length).toBeGreaterThan(0);
    });

    it('should get user favorites with pagination', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}/favorites`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.favorites).toBeDefined();
      expect(response.body.data.currentPage).toBe(1);
    });
  });

  describe('GET /api/v1/users/:userId/stats', () => {
    it('should get user reading statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalBooksRead).toBeDefined();
      expect(response.body.data.averageRating).toBeDefined();
      expect(response.body.data.favoriteGenres).toBeDefined();
      expect(response.body.data.booksReadThisYear).toBeDefined();
      expect(Array.isArray(response.body.data.favoriteGenres)).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/non-existent-id/stats')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /api/v1/users/search', () => {
    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'Test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.totalCount).toBeDefined();
      expect(response.body.data.totalPages).toBeDefined();
      expect(response.body.data.currentPage).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('should reject search with short query', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'A' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Search query must be at least 2 characters long');
    });

    it('should reject search without query', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Search query must be at least 2 characters long');
    });
  });

  describe('UserService Unit Tests', () => {
    it('should get user profile with statistics', async () => {
      const profile = await UserService.getUserProfile(testUser.id);
      
      expect(profile).toBeDefined();
      expect(profile.id).toBe(testUser.id);
      expect(profile.email).toBe(testUser.email);
      expect(profile.stats).toBeDefined();
      expect(profile.stats.totalReviews).toBeGreaterThan(0);
      expect(profile.stats.totalFavorites).toBeGreaterThan(0);
      expect(profile.stats.averageRating).toBeDefined();
    });

    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio'
      };

      const updatedProfile = await UserService.updateProfile(testUser.id, updateData);
      
      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.firstName).toBe(updateData.firstName);
      expect(updatedProfile.lastName).toBe(updateData.lastName);
      expect(updatedProfile.bio).toBe(updateData.bio);
    });

    it('should get user reviews', async () => {
      const result = await UserService.getUserReviews(testUser.id, 1, 10);
      
      expect(result.reviews).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBe(1);
      expect(Array.isArray(result.reviews)).toBe(true);
    });

    it('should get user favorites', async () => {
      const result = await UserService.getUserFavorites(testUser.id, 1, 10);
      
      expect(result.favorites).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBe(1);
      expect(Array.isArray(result.favorites)).toBe(true);
    });

    it('should get user reading statistics', async () => {
      const stats = await UserService.getUserReadingStats(testUser.id);
      
      expect(stats).toBeDefined();
      expect(stats.totalBooksRead).toBeDefined();
      expect(stats.averageRating).toBeDefined();
      expect(stats.favoriteGenres).toBeDefined();
      expect(stats.booksReadThisYear).toBeDefined();
      expect(Array.isArray(stats.favoriteGenres)).toBe(true);
    });

    it('should search users', async () => {
      const result = await UserService.searchUsers('Test', 1, 10);
      
      expect(result.users).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBe(1);
      expect(Array.isArray(result.users)).toBe(true);
    });
  });
});
