import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: Date;
  lastLogin?: Date;
  stats: {
    totalReviews: number;
    totalFavorites: number;
    averageRating: number;
    helpfulVotes: number;
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}

export class UserService {
  /**
   * Get user profile with statistics
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          reviews: {
            select: {
              rating: true,
              id: true
            }
          },
          favorites: {
            select: {
              id: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate statistics
      const totalReviews = user.reviews.length;
      const totalFavorites = user.favorites.length;
      const helpfulVotes = 0; // Will be calculated separately if needed
      
      const ratings = user.reviews.map((review: any) => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl || undefined,
        bio: user.bio || undefined,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || undefined,
        stats: {
          totalReviews,
          totalFavorites,
          averageRating: Math.round(averageRating * 10) / 10,
          helpfulVotes
        }
      };
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          bio: data.bio,
          avatarUrl: data.avatarUrl
        }
      });

      // Return updated profile with stats
      return await this.getUserProfile(userId);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user's reviews with pagination
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
        reviews: reviews.map(review => ({
          ...review,
          helpfulVotes: 0 // Will be calculated separately if needed
        })),
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
   * Get user's favorite books with pagination
   */
  static async getUserFavorites(userId: string, page: number = 1, limit: number = 10): Promise<{
    favorites: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const favorites = await prisma.userFavorite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          book: {
            include: {
              reviews: {
                select: {
                  rating: true
                }
              },
              genres: {
                include: {
                  genre: true
                }
              }
            }
          }
        }
      });

      const totalCount = await prisma.userFavorite.count({
        where: { userId }
      });

      const favoritesWithStats = favorites.map(item => {
        const ratings = item.book.reviews.map(review => review.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          ...item.book,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: item.book.reviews.length,
          genres: item.book.genres.map(bg => bg.genre.name),
          addedToFavorites: item.createdAt
        };
      });

      return {
        favorites: favoritesWithStats,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      logger.error('Error fetching user favorites:', error);
      throw error;
    }
  }

  /**
   * Get user's reading statistics
   */
  static async getUserReadingStats(userId: string): Promise<{
    totalBooksRead: number;
    totalPagesRead: number;
    averageRating: number;
    favoriteGenres: string[];
    readingGoal: number;
    booksReadThisYear: number;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          reviews: {
            include: {
              book: {
                include: {
                  genres: {
                    include: {
                      genre: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const totalBooksRead = user.reviews.length;
      const ratings = user.reviews.map(review => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      // Calculate favorite genres
      const genreCounts: { [key: string]: number } = {};
      user.reviews.forEach(review => {
        review.book.genres.forEach(bookGenre => {
          const genreName = bookGenre.genre.name;
          genreCounts[genreName] = (genreCounts[genreName] || 0) + 1;
        });
      });

      const favoriteGenres = Object.entries(genreCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([genre]) => genre);

      // Books read this year
      const currentYear = new Date().getFullYear();
      const booksReadThisYear = user.reviews.filter(review => 
        review.createdAt.getFullYear() === currentYear
      ).length;

      return {
        totalBooksRead,
        totalPagesRead: 0, // Would need page count in book model
        averageRating: Math.round(averageRating * 10) / 10,
        favoriteGenres,
        readingGoal: 0, // Would need reading goal in user model
        booksReadThisYear
      };
    } catch (error) {
      logger.error('Error fetching user reading stats:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(query: string, page: number = 1, limit: number = 10): Promise<{
    users: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ],
          isActive: true
        },
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: {
              reviews: true,
              favorites: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalCount = await prisma.user.count({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ],
          isActive: true
        }
      });

      return {
        users: users.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          totalReviews: user._count.reviews,
          totalFavorites: user._count.favorites
        })),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }
}