import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { Genre, Prisma } from '@prisma/client';

export interface GenreWithCount extends Genre {
  bookCount: number;
}

export class GenreService {
  /**
   * Get all genres with book counts
   */
  static async getAllGenres(): Promise<GenreWithCount[]> {
    try {
      const genres = await prisma.genre.findMany({
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

      return genres.map((genre) => ({
        ...genre,
        bookCount: genre._count.books,
      }));
    } catch (error) {
      logger.error('Failed to get all genres:', error);
      throw error;
    }
  }

  /**
   * Get genre by ID
   */
  static async getGenreById(id: string): Promise<GenreWithCount | null> {
    try {
      const genre = await prisma.genre.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              books: true,
            },
          },
        },
      });

      if (!genre) {
        return null;
      }

      return {
        ...genre,
        bookCount: genre._count.books,
      };
    } catch (error) {
      logger.error('Failed to get genre by ID:', error);
      throw error;
    }
  }

  /**
   * Create new genre
   */
  static async createGenre(data: { name: string; description?: string }): Promise<Genre> {
    try {
      // Check if genre already exists
      const existingGenre = await prisma.genre.findUnique({
        where: { name: data.name },
      });

      if (existingGenre) {
        throw new Error('Genre with this name already exists');
      }

      const genre = await prisma.genre.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });

      logger.info(`Genre created: ${genre.name}`);
      return genre;
    } catch (error) {
      logger.error('Failed to create genre:', error);
      throw error;
    }
  }

  /**
   * Update genre
   */
  static async updateGenre(id: string, data: { name?: string; description?: string }): Promise<Genre> {
    try {
      // Check if genre exists
      const existingGenre = await prisma.genre.findUnique({
        where: { id },
      });

      if (!existingGenre) {
        throw new Error('Genre not found');
      }

      // Check if new name conflicts with existing genre
      if (data.name && data.name !== existingGenre.name) {
        const nameConflict = await prisma.genre.findUnique({
          where: { name: data.name },
        });

        if (nameConflict) {
          throw new Error('Genre with this name already exists');
        }
      }

      const genre = await prisma.genre.update({
        where: { id },
        data,
      });

      logger.info(`Genre updated: ${genre.name}`);
      return genre;
    } catch (error) {
      logger.error('Failed to update genre:', error);
      throw error;
    }
  }

  /**
   * Delete genre
   */
  static async deleteGenre(id: string): Promise<void> {
    try {
      // Check if genre exists
      const existingGenre = await prisma.genre.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              books: true,
            },
          },
        },
      });

      if (!existingGenre) {
        throw new Error('Genre not found');
      }

      // Check if genre has books
      if (existingGenre._count.books > 0) {
        throw new Error('Cannot delete genre that has books assigned');
      }

      await prisma.genre.delete({
        where: { id },
      });

      logger.info(`Genre deleted: ${existingGenre.name}`);
    } catch (error) {
      logger.error('Failed to delete genre:', error);
      throw error;
    }
  }

  /**
   * Get popular genres (most used)
   */
  static async getPopularGenres(limit: number = 10): Promise<GenreWithCount[]> {
    try {
      const genres = await prisma.genre.findMany({
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
        take: limit,
      });

      return genres.map((genre) => ({
        ...genre,
        bookCount: genre._count.books,
      }));
    } catch (error) {
      logger.error('Failed to get popular genres:', error);
      throw error;
    }
  }
}
