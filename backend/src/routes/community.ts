import { Router } from 'express';
import { CommunityService } from '../services/communityService';
import { authenticate, authorize } from '../middleware/simple-auth';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { uuidParamSchema } from '../middleware/schemas';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route POST /api/v1/community/comments
 * @desc Add comment to review
 * @access Private
 */
router.post('/comments', authenticate, async (req, res, next) => {
  try {
    const { reviewId, content } = req.body;
    
    if (!reviewId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Review ID and content are required',
      });
    }

    const comment = await CommunityService.addComment({
      reviewId,
      userId: req.user!.id,
      content,
    });
    
    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/community/comments/:reviewId
 * @desc Get comments for a review
 * @access Public
 */
router.get('/comments/:reviewId', validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const result = await CommunityService.getReviewComments(
      reviewId,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/community/follow/:userId
 * @desc Follow a user
 * @access Private
 */
router.post('/follow/:userId', authenticate, validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    await CommunityService.followUser(req.user!.id, userId);
    
    res.status(200).json({
      success: true,
      message: 'User followed successfully',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route DELETE /api/v1/community/follow/:userId
 * @desc Unfollow a user
 * @access Private
 */
router.delete('/follow/:userId', authenticate, validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    await CommunityService.unfollowUser(req.user!.id, userId);
    
    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/community/activity-feed
 * @desc Get user's activity feed
 * @access Private
 */
router.get('/activity-feed', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await CommunityService.getActivityFeed(
      req.user!.id,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/community/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await CommunityService.getUserNotifications(
      req.user!.id,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route PUT /api/v1/community/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/notifications/:notificationId/read', authenticate, validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await CommunityService.markNotificationAsRead(notificationId, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route PUT /api/v1/community/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    await CommunityService.markAllNotificationsAsRead(req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/community/report-content
 * @desc Report inappropriate content
 * @access Private
 */
router.post('/report-content', authenticate, async (req, res, next) => {
  try {
    const { contentType, contentId, reason, description } = req.body;
    
    if (!contentType || !contentId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Content type, content ID, and reason are required',
      });
    }

    await CommunityService.reportContent({
      reporterId: req.user!.id,
      contentType,
      contentId,
      reason,
      description,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Content reported successfully',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/community/stats
 * @desc Get community statistics
 * @access Public
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await CommunityService.getCommunityStats();
    
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
