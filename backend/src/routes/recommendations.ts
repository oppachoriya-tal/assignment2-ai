import { Router } from 'express';
import { RecommendationService } from '../services/recommendationService';
import { AIService } from '../services/aiService';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validation';
import { uuidParamSchema } from '../middleware/schemas';

const router = Router();

/**
 * @route GET /api/v1/recommendations
 * @desc Get personalized recommendations for user
 * @access Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const recommendationService = new RecommendationService();
    const recommendations = await recommendationService.generateRecommendations(
      req.user!.id,
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/recommendations/similar/:bookId
 * @desc Get books similar to the specified book
 * @access Public
 */
router.get('/similar/:bookId', validateParams(uuidParamSchema), optionalAuth, async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { limit = 5 } = req.query;
    
    const recommendationService = new RecommendationService();
    const similarBooks = await recommendationService.getSimilarBooks(
      bookId,
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      success: true,
      data: similarBooks,
      count: similarBooks.length,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/recommendations/trending
 * @desc Get trending books
 * @access Public
 */
router.get('/trending', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const recommendationService = new RecommendationService();
    const trendingBooks = await recommendationService.getTrendingBooks(
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      success: true,
      data: trendingBooks,
      count: trendingBooks.length,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/recommendations/genre/:genreId
 * @desc Get genre-based recommendations
 * @access Public
 */
router.get('/genre/:genreId', validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { genreId } = req.params;
    const { limit = 10 } = req.query;
    
    const recommendationService = new RecommendationService();
    const genreRecommendations = await recommendationService.getGenreRecommendations(
      genreId,
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      success: true,
      data: genreRecommendations,
      count: genreRecommendations.length,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /api/v1/recommendations/new-releases
 * @desc Get new releases recommendations
 * @access Public
 */
router.get('/new-releases', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const recommendationService = new RecommendationService();
    const newReleases = await recommendationService.getNewReleases(
      parseInt(limit as string, 10)
    );
    
    res.status(200).json({
      success: true,
      data: newReleases,
      count: newReleases.length,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/recommendations/analyze-review
 * @desc Analyze review using AI
 * @access Private
 */
router.post('/analyze-review', authenticate, async (req, res, next) => {
  try {
    const { reviewText } = req.body;
    
    if (!reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Review text is required',
      });
    }

    const analysis = await AIService.analyzeReview(reviewText);
    
    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/recommendations/generate-description
 * @desc Generate book description using AI
 * @access Private (Admin/Moderator only)
 */
router.post('/generate-description', authenticate, async (req, res, next) => {
  try {
    const { title, author, existingDescription } = req.body;
    
    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title and author are required',
      });
    }

    const description = await AIService.generateBookDescription(title, author, existingDescription);
    
    res.status(200).json({
      success: true,
      data: { description },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
