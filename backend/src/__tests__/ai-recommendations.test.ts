import request from 'supertest';
import { app } from '../index';
import { prisma } from '../config/database';

describe('AI Recommendation System', () => {
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

    // Create test genre
    const testGenre = await prisma.genre.create({
      data: {
        name: 'Fiction',
        description: 'Fictional literature'
      }
    });

    // Create test books
    testBook = await prisma.book.create({
      data: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'A classic American novel',
        isbn: '1234567890',
        publishedYear: 1925,
        price: 12.99
      }
    });

    await prisma.bookGenre.create({
      data: {
        bookId: testBook.id,
        genreId: testGenre.id
      }
    });

    // Create additional books for recommendations
    const books = [
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'A novel about racial injustice',
        isbn: '0987654321',
        publishedYear: 1960,
        price: 14.99
      },
      {
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian social science fiction novel',
        isbn: '1122334455',
        publishedYear: 1949,
        price: 13.99
      },
      {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        description: 'A romantic novel',
        isbn: '5566778899',
        publishedYear: 1813,
        price: 11.99
      }
    ];

    for (const bookData of books) {
      const book = await prisma.book.create({ data: bookData });
      await prisma.bookGenre.create({
        data: {
          bookId: book.id,
          genreId: testGenre.id
        }
      });
    }

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

  describe('POST /api/ai/recommendations', () => {
    it('should get AI recommendations with query', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations')
        .send({
          query: 'classic literature',
          limit: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.explanation).toBeDefined();
      expect(response.body.data.query).toBe('classic literature');
      expect(response.body.data.totalFound).toBeDefined();
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should get AI recommendations with default limit', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations')
        .send({
          query: 'fiction books'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.recommendations.length).toBeLessThanOrEqual(3); // Default limit
    });

    it('should reject recommendations without query', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations')
        .send({
          limit: 3
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Query is required');
    });

    it('should handle empty query', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations')
        .send({
          query: '',
          limit: 3
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Query is required');
    });

    it('should return recommendations with proper structure', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations')
        .send({
          query: 'classic novels',
          limit: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.recommendations.length > 0) {
        const recommendation = response.body.data.recommendations[0];
        expect(recommendation.id).toBeDefined();
        expect(recommendation.title).toBeDefined();
        expect(recommendation.author).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(recommendation.averageRating).toBeDefined();
        expect(recommendation.totalReviews).toBeDefined();
        expect(recommendation.recommendationReason).toBeDefined();
        expect(recommendation.confidence).toBeDefined();
        expect(Array.isArray(recommendation.genres)).toBe(true);
      }
    });
  });

  describe('POST /api/ai/recommendations/personalized', () => {
    it('should get personalized recommendations', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations/personalized')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          query: 'books similar to what I like',
          limit: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.explanation).toBeDefined();
      expect(response.body.data.profileInsights).toBeDefined();
      expect(response.body.data.userProfile).toBeDefined();
      expect(response.body.data.query).toBe('books similar to what I like');
      expect(response.body.data.totalFound).toBeDefined();
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should get personalized recommendations without query', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations/personalized')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          limit: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.userProfile).toBeDefined();
      expect(response.body.data.query).toBe('Personalized recommendations');
    });

    it('should reject personalized recommendations without authentication', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations/personalized')
        .send({
          query: 'books I might like',
          limit: 3
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should return personalized recommendations with user profile', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations/personalized')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          query: 'recommendations based on my preferences',
          limit: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userProfile).toBeDefined();
      expect(response.body.data.userProfile.totalReviews).toBeDefined();
      expect(response.body.data.userProfile.totalFavorites).toBeDefined();
      expect(response.body.data.userProfile.averageRatingGiven).toBeDefined();
      expect(response.body.data.userProfile.preferredGenres).toBeDefined();
      expect(response.body.data.userProfile.preferredAuthors).toBeDefined();
      expect(Array.isArray(response.body.data.userProfile.preferredGenres)).toBe(true);
      expect(Array.isArray(response.body.data.userProfile.preferredAuthors)).toBe(true);
    });

    it('should return recommendations with match factors', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations/personalized')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          query: 'books matching my taste',
          limit: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.recommendations.length > 0) {
        const recommendation = response.body.data.recommendations[0];
        expect(recommendation.matchFactors).toBeDefined();
        expect(Array.isArray(recommendation.matchFactors)).toBe(true);
      }
    });
  });

  describe('GET /api/ai/status', () => {
    it('should get AI service status', async () => {
      const response = await request(app)
        .get('/api/ai/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.geminiAvailable).toBeDefined();
      expect(response.body.data.serviceStats).toBeDefined();
      expect(response.body.data.status).toBeDefined();
      expect(['operational', 'limited']).toContain(response.body.data.status);
    });
  });

  describe('AI Recommendation Edge Cases', () => {
    it('should handle recommendations with very specific query', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations')
        .send({
          query: 'science fiction books about space exploration with strong female characters',
          limit: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.explanation).toBeDefined();
    });

    it('should handle recommendations with very general query', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations')
        .send({
          query: 'books',
          limit: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeDefined();
    });

    it('should handle personalized recommendations for user with no history', async () => {
      // Create a new user with no reviews or favorites
      const newUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const userResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(newUserData);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: newUserData.email,
          password: newUserData.password
        });

      const newAccessToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .post('/api/ai/recommendations/personalized')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          query: 'recommendations for new user',
          limit: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.userProfile.totalReviews).toBe(0);
      expect(response.body.data.userProfile.totalFavorites).toBe(0);

      // Clean up
      await prisma.user.delete({ where: { id: userResponse.body.data.user.id } });
    });

    it('should handle recommendations with large limit', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations')
        .send({
          query: 'classic literature',
          limit: 20
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.recommendations.length).toBeLessThanOrEqual(20);
    });
  });
});
