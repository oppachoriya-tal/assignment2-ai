import request from 'supertest';
import { app } from '../index';
import { prisma } from "../config/database"';
import { BookService } from '../services/bookService';

describe('Book Service', () => {
  let testBook: any;
  let testGenre: any;
  let testUser: any;
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
    testGenre = await prisma.genre.create({
      data: {
        name: 'Test Genre',
        description: 'A test genre for testing'
      }
    });

    // Create test book
    testBook = await prisma.book.create({
      data: {
        title: 'Test Book',
        author: 'Test Author',
        description: 'A test book for testing',
        isbn: '1234567890',
        publishedYear: 2023,
        price: 29.99,
        coverImageUrl: 'https://example.com/cover.jpg'
      }
    });

    // Associate book with genre
    await prisma.bookGenre.create({
      data: {
        bookId: testBook.id,
        genreId: testGenre.id
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

  describe('GET /api/v1/books', () => {
    it('should get books with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/books')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toBeDefined();
      expect(response.body.data.totalCount).toBeDefined();
      expect(response.body.data.totalPages).toBeDefined();
      expect(response.body.data.currentPage).toBe(1);
    });

    it('should search books by title', async () => {
      const response = await request(app)
        .get('/api/v1/books')
        .query({ search: 'Test Book' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeGreaterThan(0);
      expect(response.body.data.books[0].title).toContain('Test Book');
    });

    it('should search books by author', async () => {
      const response = await request(app)
        .get('/api/v1/books')
        .query({ search: 'Test Author' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeGreaterThan(0);
      expect(response.body.data.books[0].author).toContain('Test Author');
    });

    it('should filter books by genre', async () => {
      const response = await request(app)
        .get('/api/v1/books')
        .query({ genre: 'Test Genre' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeGreaterThan(0);
      expect(response.body.data.books[0].genres).toContain('Test Genre');
    });

    it('should filter books by price range', async () => {
      const response = await request(app)
        .get('/api/v1/books')
        .query({ minPrice: 20, maxPrice: 40 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeGreaterThan(0);
      expect(response.body.data.books[0].price).toBeGreaterThanOrEqual(20);
      expect(response.body.data.books[0].price).toBeLessThanOrEqual(40);
    });

    it('should sort books by title', async () => {
      const response = await request(app)
        .get('/api/v1/books')
        .query({ sortBy: 'title', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeGreaterThan(0);
      
      // Check if books are sorted by title
      const titles = response.body.data.books.map((book: any) => book.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    });

    it('should sort books by rating', async () => {
      const response = await request(app)
        .get('/api/v1/books')
        .query({ sortBy: 'rating', sortOrder: 'desc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/books/:id', () => {
    it('should get book by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/books/${testBook.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testBook.id);
      expect(response.body.data.title).toBe(testBook.title);
      expect(response.body.data.author).toBe(testBook.author);
      expect(response.body.data.averageRating).toBeDefined();
      expect(response.body.data.totalReviews).toBeDefined();
      expect(response.body.data.totalFavorites).toBeDefined();
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/v1/books/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Book not found');
    });
  });

  describe('GET /api/v1/books/genres', () => {
    it('should get all genres', async () => {
      const response = await request(app)
        .get('/api/v1/books/genres')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain('Test Genre');
    });
  });

  describe('POST /api/v1/books/:id/favorites', () => {
    it('should add book to favorites', async () => {
      const response = await request(app)
        .put(`/api/v1/books/${testBook.id}/favorites`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book added to favorites');
    });

    it('should reject adding same book to favorites twice', async () => {
      const response = await request(app)
        .put(`/api/v1/books/${testBook.id}/favorites`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Book is already in your favorites');
    });

    it('should reject adding to favorites without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/books/${testBook.id}/favorites`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('DELETE /api/v1/books/:id/favorites', () => {
    it('should remove book from favorites', async () => {
      const response = await request(app)
        .delete(`/api/v1/books/${testBook.id}/favorites`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book removed from favorites');
    });

    it('should reject removing from favorites without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/books/${testBook.id}/favorites`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('GET /api/v1/books/:id/favorites-status', () => {
    it('should check favorites status', async () => {
      const response = await request(app)
        .get(`/api/v1/books/${testBook.id}/favorites-status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isInFavorites).toBeDefined();
      expect(typeof response.body.data.isInFavorites).toBe('boolean');
    });

    it('should reject checking favorites status without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/books/${testBook.id}/favorites-status`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('BookService Unit Tests', () => {
    it('should get books with filters', async () => {
      const filters = {
        search: 'Test Book',
        page: 1,
        limit: 10
      };

      const result = await BookService.getBooks(filters);
      
      expect(result.books).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.totalPages).toBeDefined();
      expect(result.currentPage).toBe(1);
      expect(Array.isArray(result.books)).toBe(true);
    });

    it('should get book by ID', async () => {
      const book = await BookService.getBookById(testBook.id);
      
      expect(book).toBeDefined();
      expect(book.id).toBe(testBook.id);
      expect(book.title).toBe(testBook.title);
      expect(book.averageRating).toBeDefined();
      expect(book.totalReviews).toBeDefined();
      expect(book.totalFavorites).toBeDefined();
    });

    it('should get genres', async () => {
      const genres = await BookService.getGenres();
      
      expect(Array.isArray(genres)).toBe(true);
      expect(genres).toContain('Test Genre');
    });

    it('should check if book is in favorites', async () => {
      const isInFavorites = await BookService.isInFavorites(testUser.id, testBook.id);
      
      expect(typeof isInFavorites).toBe('boolean');
    });
  });
});