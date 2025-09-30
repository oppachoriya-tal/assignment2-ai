import { Router } from 'express';
import { ModerationService } from '../services/moderationService';
import { authenticate, authorize } from '../middleware/simple-auth';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { uuidParamSchema } from '../middleware/schemas';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route GET /api/v1/moderation/queue
 * @desc Get moderation queue
 * @access Private (Moderator/Admin only)
 */
router.get('/queue', authenticate, authorize(UserRole.MODERATOR, UserRole.ADMIN), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await ModerationService.getModerationQueue(
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/moderation/moderate-content
 * @desc Moderate content using AI
 * @access Private (Moderator/Admin only)
 */
router.post('/moderate-content', authenticate, authorize(UserRole.MODERATOR, UserRole.ADMIN), async (req, res, next) => {
  try {
    const { content, contentType } = req.body;
    
    if (!content || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content and content type are required',
      });
    }

    const moderation = await ModerationService.moderateContent(content, contentType);
    
    return res.status(200).json({
      success: true,
      data: moderation,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/moderation/approve/:contentId
 * @desc Approve content
 * @access Private (Moderator/Admin only)
 */
router.post('/approve/:contentId', authenticate, authorize(UserRole.MODERATOR, UserRole.ADMIN), validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { contentType, reason } = req.body;
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content type is required',
      });
    }

    await ModerationService.approveContent(
      contentId,
      contentType,
      req.user!.id,
      reason
    );
    
    return res.status(200).json({
      success: true,
      message: 'Content approved successfully',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/moderation/reject/:contentId
 * @desc Reject content
 * @access Private (Moderator/Admin only)
 */
router.post('/reject/:contentId', authenticate, authorize(UserRole.MODERATOR, UserRole.ADMIN), validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { contentType, reason } = req.body;
    
    if (!contentType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Content type and reason are required',
      });
    }

    await ModerationService.rejectContent(
      contentId,
      contentType,
      req.user!.id,
      reason
    );
    
    return res.status(200).json({
      success: true,
      message: 'Content rejected successfully',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/moderation/edit/:contentId
 * @desc Edit content
 * @access Private (Moderator/Admin only)
 */
router.post('/edit/:contentId', authenticate, authorize(UserRole.MODERATOR, UserRole.ADMIN), validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { contentType, newContent, reason } = req.body;
    
    if (!contentType || !newContent || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Content type, new content, and reason are required',
      });
    }

    await ModerationService.editContent(
      contentId,
      contentType,
      req.user!.id,
      newContent,
      reason
    );
    
    return res.status(200).json({
      success: true,
      message: 'Content edited successfully',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/moderation/stats
 * @desc Get moderation statistics
 * @access Private (Moderator/Admin only)
 */
router.get('/stats', authenticate, authorize(UserRole.MODERATOR, UserRole.ADMIN), async (req, res, next) => {
  try {
    const stats = await ModerationService.getModerationStats();
    
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/moderation/user-history/:userId
 * @desc Get user moderation history
 * @access Private (Moderator/Admin only)
 */
router.get('/user-history/:userId', authenticate, authorize(UserRole.MODERATOR, UserRole.ADMIN), validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await ModerationService.getUserModerationHistory(
      userId,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/moderation/bulk-moderate
 * @desc Bulk moderate content
 * @access Private (Admin only)
 */
router.post('/bulk-moderate', authenticate, authorize(UserRole.ADMIN), async (req, res, next) => {
  try {
    const { contentIds, contentType, action, reason } = req.body;
    
    if (!contentIds || !Array.isArray(contentIds) || !contentType || !action) {
      return res.status(400).json({
        success: false,
        message: 'Content IDs array, content type, and action are required',
      });
    }

    await ModerationService.bulkModerateContent(
      contentIds,
      contentType,
      action,
      req.user!.id,
      reason
    );
    
    return res.status(200).json({
      success: true,
      message: `Bulk ${action} completed for ${contentIds.length} items`,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
