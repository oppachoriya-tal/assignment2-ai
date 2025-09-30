import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';
import { authenticate, checkOwnership } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/users/profile
 * @desc Get current user's profile
 * @access Private
 */
router.get('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await UserService.getUserProfile(req.user!.id);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    if ((error as Error).message === 'User not found') {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile'
      });
    }
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Update current user's profile
 * @access Private
 */
router.put('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, bio, avatarUrl } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
      return;
    }

    // Validate field lengths
    if (firstName.length < 2 || firstName.length > 50) {
      res.status(400).json({
        success: false,
        message: 'First name must be between 2 and 50 characters'
      });
      return;
    }

    if (lastName.length < 2 || lastName.length > 50) {
      res.status(400).json({
        success: false,
        message: 'Last name must be between 2 and 50 characters'
      });
      return;
    }

    if (bio && bio.length > 500) {
      res.status(400).json({
        success: false,
        message: 'Bio must be less than 500 characters'
      });
      return;
    }

    const updatedProfile = await UserService.updateProfile(req.user!.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      bio: bio ? bio.trim() : undefined,
      avatarUrl: avatarUrl ? avatarUrl.trim() : undefined
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route GET /api/users/:userId/profile
 * @desc Get user's public profile
 * @access Public
 */
router.get('/:userId/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await UserService.getUserProfile(req.params.userId);

    // Remove sensitive information for public profile
    const publicProfile = {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      createdAt: profile.createdAt,
      stats: profile.stats
    };

    res.json({
      success: true,
      data: publicProfile
    });
  } catch (error) {
    logger.error('Error fetching public user profile:', error);
    if ((error as Error).message === 'User not found') {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile'
      });
    }
  }
});

/**
 * @route GET /api/users/:userId/reviews
 * @desc Get user's reviews
 * @access Public
 */
router.get('/:userId/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await UserService.getUserReviews(req.params.userId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reviews'
    });
  }
});

/**
 * @route GET /api/users/:userId/favorites
 * @desc Get user's favorite books
 * @access Public
 */
router.get('/:userId/favorites', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await UserService.getUserFavorites(req.params.userId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching user favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user favorites'
    });
  }
});

/**
 * @route GET /api/users/:userId/stats
 * @desc Get user's reading statistics
 * @access Public
 */
router.get('/:userId/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await UserService.getUserReadingStats(req.params.userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    if ((error as Error).message === 'User not found') {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics'
      });
    }
  }
});

/**
 * @route GET /api/users/search
 * @desc Search users by name or email
 * @access Public
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
      return;
    }

    const result = await UserService.searchUsers(
      query.trim(),
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

export default router;