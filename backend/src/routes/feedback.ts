import { Router, Request, Response } from 'express';
import { FeedbackService } from '../services/feedbackService';
import { authenticate, authorize, optionalAuth } from '../middleware/simple-auth';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route POST /api/feedback
 * @desc Submit feedback
 * @access Public (with optional user context)
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { type, subject, message, rating, metadata } = req.body;

    if (!type || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, subject, and message are required'
      });
    }

    // Validate feedback type
    const validTypes = ['bug_report', 'feature_request', 'general_feedback', 'cover_generation', 'ui_improvement'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback type'
      });
    }

    // Convert to uppercase for Prisma enum
    const prismaType = type.toUpperCase().replace('_', '_') as 'BUG_REPORT' | 'FEATURE_REQUEST' | 'GENERAL_FEEDBACK' | 'COVER_GENERATION' | 'UI_IMPROVEMENT';

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const feedbackData = {
      userId: req.user?.id,
      type: prismaType,
      subject,
      message,
      rating,
      metadata,
      userAgent: req.get('User-Agent'),
      userEmail: req.body.userEmail
    };

    const feedback = await FeedbackService.createFeedback(feedbackData);

    return res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Error creating feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

/**
 * @route GET /api/feedback
 * @desc Get feedback (Admin only)
 * @access Private (Admin)
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const {
      type,
      status,
      userId,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      type: type as string,
      status: status as string,
      userId: userId as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await FeedbackService.getFeedback(filters);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
});

/**
 * @route GET /api/feedback/stats
 * @desc Get feedback statistics (Admin only)
 * @access Private (Admin)
 */
router.get('/stats', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const stats = await FeedbackService.getFeedbackStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching feedback stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics'
    });
  }
});

/**
 * @route GET /api/feedback/my
 * @desc Get user's feedback
 * @access Private
 */
router.get('/my', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await FeedbackService.getUserFeedback(req.user!.id, page, limit);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching user feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your feedback'
    });
  }
});

/**
 * @route GET /api/feedback/:id
 * @desc Get feedback by ID
 * @access Private (Admin or feedback owner)
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const feedback = await FeedbackService.getFeedbackById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can access this feedback
    if (req.user!.role !== UserRole.ADMIN && feedback.user?.id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    return res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Error fetching feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
});

/**
 * @route PUT /api/feedback/:id/status
 * @desc Update feedback status (Admin only)
 * @access Private (Admin)
 */
router.put('/:id/status', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { status, adminResponse } = req.body;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Convert to uppercase for Prisma enum
    const prismaStatus = status.toUpperCase().replace('_', '_') as 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

    const feedback = await FeedbackService.updateFeedbackStatus(
      req.params.id,
      prismaStatus,
      adminResponse
    );

    return res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Error updating feedback status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update feedback status'
    });
  }
});

/**
 * @route GET /api/feedback/types
 * @desc Get available feedback types
 * @access Public
 */
router.get('/types', async (req: Request, res: Response) => {
  try {
    const types = [
      {
        value: 'bug_report',
        label: 'Bug Report',
        description: 'Report a bug or technical issue'
      },
      {
        value: 'feature_request',
        label: 'Feature Request',
        description: 'Suggest a new feature or improvement'
      },
      {
        value: 'general_feedback',
        label: 'General Feedback',
        description: 'Share your thoughts about the platform'
      },
      {
        value: 'cover_generation',
        label: 'Cover Generation',
        description: 'Feedback about AI-generated book covers'
      },
      {
        value: 'ui_improvement',
        label: 'UI/UX Improvement',
        description: 'Suggestions for interface improvements'
      }
    ];

    return res.json({
      success: true,
      data: types
    });
  } catch (error) {
    logger.error('Error fetching feedback types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback types'
    });
  }
});

export default router;
