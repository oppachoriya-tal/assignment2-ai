import request from 'supertest';
import express from 'express';
import genresRoutes from '../../routes/genres';
import { GenreService } from '../../services/genreService';

// Mock GenreService
vi.mock('../../services/genreService', () => ({
  GenreService: {
    getAllGenres: vi.fn(),
    getGenreById: vi.fn(),
    createGenre: vi.fn(),
    updateGenre: vi.fn(),
    deleteGenre: vi.fn(),
    getPopularGenres: vi.fn(),
  },
}));

// Mock middleware
vi.mock('../../middleware/simple-auth', () => ({
  authenticate: vi.fn((req: any, res: any, next: any) => {
    req.user = { id: 'user123', role: 'ADMIN' };
    next();
  }),
  authorize: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

vi.mock('../../middleware/validation', () => ({
  validateRequest: vi.fn(() => (req: any, res: any, next: any) => next()),
  validateParams: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

vi.mock('../../middleware/schemas', () => ({
  createGenreSchema: {},
  updateGenreSchema: {},
  uuidParamSchema: {},
}));

const app = express();
app.use(express.json());
app.use('/api/v1/genres', genresRoutes);

describe('Genres Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/genres', () => {
    it('should get all genres', async () => {
      const mockGenres = [
        { id: '1', name: 'Fiction', description: 'Fiction books' },
        { id: '2', name: 'Mystery', description: 'Mystery books' },
      ];
      
      (GenreService.getAllGenres as vi.Mock).mockResolvedValue(mockGenres);

      const response = await request(app)
        .get('/api/v1/genres')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockGenres,
        count: 2,
      });
      expect(GenreService.getAllGenres).toHaveBeenCalled();
    });

    it('should handle error when fetching genres', async () => {
      const error = new Error('Service error');
      (GenreService.getAllGenres as vi.Mock).mockRejectedValue(error);

      const response = await request(app)
        .get('/api/v1/genres')
        .expect(500);

      expect(response.body).toEqual({});
    });
  });

  describe('GET /api/v1/genres/popular', () => {
    it('should get popular genres', async () => {
      const mockGenres = [
        { id: '1', name: 'Fiction', bookCount: 100 },
        { id: '2', name: 'Mystery', bookCount: 50 },
      ];
      
      (GenreService.getPopularGenres as vi.Mock).mockResolvedValue(mockGenres);

      const response = await request(app)
        .get('/api/v1/genres/popular')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockGenres,
        count: 2,
      });
      expect(GenreService.getPopularGenres).toHaveBeenCalled();
    });

    it('should handle error when fetching popular genres', async () => {
      const error = new Error('Service error');
      (GenreService.getPopularGenres as vi.Mock).mockRejectedValue(error);

      const response = await request(app)
        .get('/api/v1/genres/popular')
        .expect(500);

      expect(response.body).toEqual({});
    });
  });
});
