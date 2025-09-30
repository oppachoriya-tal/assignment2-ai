import { Router } from 'express';
import { GenreService } from '../services/genreService';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest, validateParams } from '../middleware/validation';
import { createGenreSchema, updateGenreSchema, uuidParamSchema } from '../middleware/schemas';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route GET /api/v1/genres
 * @desc Get all genres with book counts
 * @access Public
 */
router.get('/', async (req, res, next) => {
  try {
    const genres = await GenreService.getAllGenres();
    res.status(200).json({
      success: true,
      data: genres,
      count: genres.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/genres/popular
 * @desc Get popular genres
 * @access Public
 */
router.get('/popular', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const genres = await GenreService.getPopularGenres(parseInt(limit as string, 10));
    res.status(200).json({
      success: true,
      data: genres,
      count: genres.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/genres/:id
 * @desc Get genre by ID
 * @access Public
 */
router.get('/:id', validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const genre = await GenreService.getGenreById(id);
    
    if (!genre) {
      return res.status(404).json({
        success: false,
        message: 'Genre not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: genre,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route POST /api/v1/genres
 * @desc Create new genre
 * @access Private (Admin/Moderator only)
 */
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.MODERATOR), validateRequest(createGenreSchema), async (req, res, next) => {
  try {
    const genre = await GenreService.createGenre(req.body);
    res.status(201).json({
      success: true,
      message: 'Genre created successfully',
      data: genre,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/genres/:id
 * @desc Update genre
 * @access Private (Admin/Moderator only)
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.MODERATOR), validateParams(uuidParamSchema), validateRequest(updateGenreSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const genre = await GenreService.updateGenre(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Genre updated successfully',
      data: genre,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/genres/:id
 * @desc Delete genre
 * @access Private (Admin only)
 */
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    await GenreService.deleteGenre(id);
    res.status(200).json({
      success: true,
      message: 'Genre deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
