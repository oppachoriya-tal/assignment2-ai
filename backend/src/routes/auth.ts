import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    const user = await AuthService.register({
      email,
      password,
      firstName,
      lastName
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user }
    });
  } catch (error) {
    logger.error('Error registering user:', error);
    
    if ((error as Error).message === 'Email already exists') {
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to register user'
      });
    }
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    const { user, tokens } = await AuthService.login({ email, password });

    res.json({
      success: true,
      message: 'Login successful',
      data: { user, token: tokens.accessToken }
    });
  } catch (error) {
    logger.error('Error logging in user:', error);
    
    if ((error as Error).message === 'Invalid credentials') {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to login'
      });
    }
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (invalidate token)
 * @access Private
 */
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token required for logout'
      });
      return;
    }

    await AuthService.logout(req.user!.id, token);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await AuthService.getUserById(req.user!.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
      return;
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens }
    });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    
    if ((error as Error).message === 'Invalid refresh token') {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token'
      });
    }
  }
});

export default router;