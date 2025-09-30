import { GenreService } from '@/services/genreService';
import { prisma } from '@/config/database';

describe('GenreService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllGenres', () => {
    it('should get all genres successfully', async () => {
      const mockGenres = [
        { id: 'genre-1', name: 'Fiction', description: 'Fictional works', _count: { books: 10 } },
        { id: 'genre-2', name: 'Non-Fiction', description: 'Non-fictional works', _count: { books: 5 } },
        { id: 'genre-3', name: 'Science Fiction', description: 'Sci-fi works', _count: { books: 8 } },
      ];

      (prisma.genre.findMany as vi.Mock).mockResolvedValue(mockGenres);

      const result = await GenreService.getAllGenres();

      expect(result).toEqual([
        { id: 'genre-1', name: 'Fiction', description: 'Fictional works', _count: { books: 10 }, bookCount: 10 },
        { id: 'genre-2', name: 'Non-Fiction', description: 'Non-fictional works', _count: { books: 5 }, bookCount: 5 },
        { id: 'genre-3', name: 'Science Fiction', description: 'Sci-fi works', _count: { books: 8 }, bookCount: 8 },
      ]);
      expect(prisma.genre.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              books: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('should handle empty genres list', async () => {
      (prisma.genre.findMany as vi.Mock).mockResolvedValue([]);

      const result = await GenreService.getAllGenres();

      expect(result).toEqual([]);
    });
  });

  describe('getGenreById', () => {
    it('should get genre by id successfully', async () => {
      const mockGenre = {
        id: 'genre-1',
        name: 'Fiction',
        description: 'Fictional works',
        _count: { books: 10 },
      };

      (prisma.genre.findUnique as vi.Mock).mockResolvedValue(mockGenre);

      const result = await GenreService.getGenreById('genre-1');

      expect(result).toEqual({
        ...mockGenre,
        bookCount: 10,
      });
      expect(prisma.genre.findUnique).toHaveBeenCalledWith({
        where: { id: 'genre-1' },
        include: {
          _count: {
            select: { books: true },
          },
        },
      });
    });

    it('should return null if genre not found', async () => {
      (prisma.genre.findUnique as vi.Mock).mockResolvedValue(null);

      const result = await GenreService.getGenreById('nonexistent-genre');

      expect(result).toBeNull();
    });
  });

  describe('createGenre', () => {
    it('should create genre successfully', async () => {
      const genreData = {
        name: 'Mystery',
        description: 'Mystery novels',
      };

      const mockGenre = {
        id: 'genre-1',
        ...genreData,
      };

      (prisma.genre.create as vi.Mock).mockResolvedValue(mockGenre);

      const result = await GenreService.createGenre(genreData);

      expect(result).toEqual(mockGenre);
      expect(prisma.genre.create).toHaveBeenCalledWith({
        data: genreData,
      });
    });

    it('should throw error if genre with same name already exists', async () => {
      const genreData = {
        name: 'Fiction',
        description: 'Fictional works',
      };

      (prisma.genre.create as vi.Mock).mockRejectedValue(
        new Error('Unique constraint failed on name')
      );

      await expect(GenreService.createGenre(genreData)).rejects.toThrow(
        'Unique constraint failed on name'
      );
    });
  });

  describe('updateGenre', () => {
    it('should update genre successfully', async () => {
      const genreId = 'genre-1';
      const updateData = {
        name: 'Updated Fiction',
        description: 'Updated description',
      };

      const mockExistingGenre = {
        id: genreId,
        name: 'Fiction',
        description: 'Original description',
      };

      const mockUpdatedGenre = {
        id: genreId,
        ...updateData,
      };

      (prisma.genre.findUnique as vi.Mock).mockResolvedValueOnce(mockExistingGenre);
      (prisma.genre.findUnique as vi.Mock).mockResolvedValueOnce(null); // No name conflict
      (prisma.genre.update as vi.Mock).mockResolvedValue(mockUpdatedGenre);

      const result = await GenreService.updateGenre(genreId, updateData);

      expect(result).toEqual(mockUpdatedGenre);
      expect(prisma.genre.update).toHaveBeenCalledWith({
        where: { id: genreId },
        data: updateData,
      });
    });

    it('should throw error if genre not found', async () => {
      const genreId = 'nonexistent-genre';
      const updateData = {
        name: 'Updated Genre',
      };

      (prisma.genre.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(GenreService.updateGenre(genreId, updateData)).rejects.toThrow(
        'Genre not found'
      );
    });
  });

  describe('deleteGenre', () => {
    it('should delete genre successfully', async () => {
      const genreId = 'genre-1';

      const mockExistingGenre = {
        id: genreId,
        name: 'Fiction',
        description: 'Fictional works',
        _count: { books: 0 }, // No books associated
      };

      (prisma.genre.findUnique as vi.Mock).mockResolvedValue(mockExistingGenre);
      (prisma.genre.delete as vi.Mock).mockResolvedValue({ id: genreId });

      await GenreService.deleteGenre(genreId);

      expect(prisma.genre.delete).toHaveBeenCalledWith({
        where: { id: genreId },
      });
    });

    it('should throw error if genre not found', async () => {
      const genreId = 'nonexistent-genre';

      (prisma.genre.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(GenreService.deleteGenre(genreId)).rejects.toThrow(
        'Genre not found'
      );
    });
  });

  describe('getPopularGenres', () => {
    it('should get popular genres successfully', async () => {
      const mockPopularGenres = [
        { id: 'genre-1', name: 'Fiction', description: 'Fictional works', _count: { books: 50 } },
        { id: 'genre-2', name: 'Non-Fiction', description: 'Non-fictional works', _count: { books: 30 } },
        { id: 'genre-3', name: 'Science Fiction', description: 'Sci-fi works', _count: { books: 20 } },
      ];

      (prisma.genre.findMany as vi.Mock).mockResolvedValue(mockPopularGenres);

      const result = await GenreService.getPopularGenres(10);

      expect(result).toEqual([
        { id: 'genre-1', name: 'Fiction', description: 'Fictional works', _count: { books: 50 }, bookCount: 50 },
        { id: 'genre-2', name: 'Non-Fiction', description: 'Non-fictional works', _count: { books: 30 }, bookCount: 30 },
        { id: 'genre-3', name: 'Science Fiction', description: 'Sci-fi works', _count: { books: 20 }, bookCount: 20 },
      ]);
      expect(prisma.genre.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              books: true,
            },
          },
        },
        orderBy: {
          books: {
            _count: 'desc',
          },
        },
        take: 10,
      });
    });
  });

  // Note: getGenreStats method doesn't exist in the actual service
  // This test is skipped for now
  describe.skip('getGenreStats', () => {
    it('should be implemented when method is added', () => {
      expect(true).toBe(true);
    });
  });
});
