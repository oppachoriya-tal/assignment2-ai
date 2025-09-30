import { BookService } from '../../services/bookService';
import { prisma } from '../../config/database';

describe('BookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBooks', () => {
    it('should get books with pagination and filtering', async () => {
      const mockBooks = [
        {
          id: 'book-1',
          title: 'Test Book 1',
          author: 'Author 1',
          description: 'Test description',
          isbn: '1234567890',
          publishedYear: 2023,
          price: 29.99,
          coverImageUrl: 'https://example.com/cover1.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
          reviews: [{ rating: 4 }],
          favorites: [{ id: 'fav-1' }],
          genres: [{ genre: { name: 'Fiction' } }]
        }
      ];

      (prisma.book.findMany as vi.Mock).mockResolvedValue(mockBooks);
      (prisma.book.count as vi.Mock).mockResolvedValue(1);

      const result = await BookService.getBooks({
        page: 1,
        limit: 20,
        search: 'Test',
        genre: 'Fiction',
        minRating: 0,
        maxRating: 5,
        sortBy: 'title',
        sortOrder: 'asc'
      });

      expect(result).toEqual({
        books: [
          {
            id: 'book-1',
            title: 'Test Book 1',
            author: 'Author 1',
            description: 'Test description',
            isbn: '1234567890',
            publishedYear: 2023,
            price: 29.99,
            coverImageUrl: 'https://example.com/cover1.jpg',
            averageRating: 4,
            totalReviews: 1,
            totalFavorites: 1,
            genres: ['Fiction'],
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          }
        ],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      });
    });

    it('should handle empty results', async () => {
      (prisma.book.findMany as vi.Mock).mockResolvedValue([]);
      (prisma.book.count as vi.Mock).mockResolvedValue(0);

      const result = await BookService.getBooks();

      expect(result).toEqual({
        books: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      });
    });
  });

  describe('getBookById', () => {
    it('should get book by id successfully', async () => {
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Author',
        description: 'Test description',
        isbn: '1234567890',
        publishedYear: 2023,
        price: 29.99,
        coverImageUrl: 'https://example.com/cover.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            reviewText: 'Great book!',
            user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
          }
        ],
        favorites: [
          {
            id: 'fav-1',
            user: { id: 'user-1', firstName: 'John', lastName: 'Doe' }
          }
        ]
      };

      (prisma.book.findUnique as vi.Mock).mockResolvedValue(mockBook);

      const result = await BookService.getBookById('book-1');

      expect(result).toEqual({
        ...mockBook,
        averageRating: 5,
        totalReviews: 1,
        totalFavorites: 1
      });
    });

    it('should throw error if book not found', async () => {
      (prisma.book.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(BookService.getBookById('nonexistent-book')).rejects.toThrow(
        'Book not found'
      );
    });
  });

  describe('getGenres', () => {
    it('should return list of genres', async () => {
      const mockGenres = [
        { name: 'Fiction' },
        { name: 'Non-Fiction' },
        { name: 'Mystery' }
      ];

      (prisma.genre.findMany as vi.Mock).mockResolvedValue(mockGenres);

      const result = await BookService.getGenres();

      expect(result).toEqual(['Fiction', 'Non-Fiction', 'Mystery']);
    });
  });

  describe('addToFavorites', () => {
    it('should add book to favorites successfully', async () => {
      const userId = 'user-id';
      const bookId = 'book-id';

      (prisma.userFavorite.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.userFavorite.create as vi.Mock).mockResolvedValue({});

      await BookService.addToFavorites(userId, bookId);

      expect(prisma.userFavorite.findUnique).toHaveBeenCalledWith({
        where: {
          userId_bookId: {
            userId,
            bookId
          }
        }
      });
      expect(prisma.userFavorite.create).toHaveBeenCalledWith({
        data: {
          userId,
          bookId
        }
      });
    });

    it('should throw error if book already in favorites', async () => {
      const userId = 'user-id';
      const bookId = 'book-id';

      (prisma.userFavorite.findUnique as vi.Mock).mockResolvedValue({
        id: 'fav-1',
        userId,
        bookId
      });

      await expect(BookService.addToFavorites(userId, bookId)).rejects.toThrow(
        'Book is already in favorites'
      );
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove book from favorites successfully', async () => {
      const userId = 'user-id';
      const bookId = 'book-id';

      (prisma.userFavorite.deleteMany as vi.Mock).mockResolvedValue({});

      await BookService.removeFromFavorites(userId, bookId);

      expect(prisma.userFavorite.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          bookId
        }
      });
    });
  });

  describe('isInFavorites', () => {
    it('should return true if book is in favorites', async () => {
      const userId = 'user-id';
      const bookId = 'book-id';

      (prisma.userFavorite.findFirst as vi.Mock).mockResolvedValue({
        id: 'fav-1',
        userId,
        bookId
      });

      const result = await BookService.isInFavorites(userId, bookId);

      expect(result).toBe(true);
    });

    it('should return false if book is not in favorites', async () => {
      const userId = 'user-id';
      const bookId = 'book-id';

      (prisma.userFavorite.findFirst as vi.Mock).mockResolvedValue(null);

      const result = await BookService.isInFavorites(userId, bookId);

      expect(result).toBe(false);
    });
  });

  describe('getUserFavorites', () => {
    it('should return user favorites', async () => {
      const userId = 'user-id';
      const mockFavorites = [
        {
          id: 'fav-1',
          userId,
          bookId: 'book-1',
          createdAt: new Date(),
          book: {
            id: 'book-1',
            title: 'Book 1',
            author: 'Author 1',
            reviews: [{ rating: 4 }]
          }
        }
      ];

      (prisma.userFavorite.findMany as vi.Mock).mockResolvedValue(mockFavorites);

      const result = await BookService.getUserFavorites(userId);

      expect(result).toEqual([
        {
          id: 'book-1',
          title: 'Book 1',
          author: 'Author 1',
          averageRating: 4,
          totalReviews: 1,
          addedToFavorites: expect.any(Date),
          reviews: [{ rating: 4 }]
        }
      ]);
    });
  });
});