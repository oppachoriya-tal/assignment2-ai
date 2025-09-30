import { Router } from 'express';
import { ReviewService } from '../services/reviewService';
import { authenticate, checkOwnership } from '../middleware/auth';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import { 
  createReviewSchema, 
  updateReviewSchema, 
  reviewQuerySchema, 
  uuidParamSchema 
} from '../middleware/schemas';

const router = Router();

/**
 * @route GET /api/v1/reviews
 * @desc Get paginated reviews with optional filters
 * @access Public
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('Reviews route called with query:', req.query);
    const result = await ReviewService.getReviews(req.query);
    console.log('ReviewService result:', result);
    return res.status(200).json({
      success: true,
      data: {
        reviews: result.reviews,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage
      }
    });
  } catch (error) {
    console.error('Error in reviews route:', error);
    return next(error);
  }
});

/**
 * @route GET /api/v1/reviews/:id
 * @desc Get review by ID
 * @access Public
 */
router.get('/:id', validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await ReviewService.getReviewById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/reviews
 * @desc Create new review
 * @access Private
 */
router.post('/', authenticate, validateRequest(createReviewSchema), async (req, res, next) => {
  try {
    const review = await ReviewService.createReview({
      ...req.body,
      userId: req.user!.id,
    });
    
    return res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route PUT /api/v1/reviews/:id
 * @desc Update review
 * @access Private (Owner only)
 */
router.put('/:id', authenticate, validateParams(uuidParamSchema), validateRequest(updateReviewSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await ReviewService.updateReview(id, req.user!.id, req.body);
    
    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route DELETE /api/v1/reviews/:id
 * @desc Delete review
 * @access Private (Owner only)
 */
router.delete('/:id', authenticate, validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    await ReviewService.deleteReview(id, req.user!.id);
    
    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/reviews/:id/helpful
 * @desc Vote on review helpfulness
 * @access Private
 */
router.post('/:id/helpful', authenticate, validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isHelpful } = req.body;
    
    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isHelpful must be a boolean value',
      });
    }

    await ReviewService.voteReviewHelpful(id, req.user!.id, isHelpful);
    
    return res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/reviews/user/:userId
 * @desc Get user's reviews
 * @access Public
 */
router.get('/user/:userId', validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    const reviews = await ReviewService.getUserReviews(userId, parseInt(limit as string, 10));
    
    return res.status(200).json({
      success: true,
      data: reviews,
      count: reviews.reviews ? reviews.reviews.length : 0,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
