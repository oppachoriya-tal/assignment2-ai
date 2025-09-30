import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import aiRoutes from '../../routes/ai';

// Mock the services
vi.mock('../../services/aiCoverService', () => ({
  AICoverService: {
    getAvailableStyles: vi.fn(),
    generateBookCover: vi.fn(),
    getCoverById: vi.fn(),
    getUserCovers: vi.fn(),
    deleteCover: vi.fn()
  }
}));

vi.mock('../../middleware/simple-auth', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'test-user-id', username: 'testuser', email: 'test@example.com', role: 'USER' };
    next();
  }),
      authorize: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
  optionalAuth: vi.fn((req, res, next) => {
    req.user = { id: 'test-user-id', username: 'testuser', email: 'test@example.com', role: 'USER' };
    next();
  })
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('AI Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);
    vi.clearAllMocks();
  });

  describe('GET /api/ai/cover/styles', () => {
    it('should return available cover styles', async () => {
      const { AICoverService } = require('../../services/aiCoverService');
      AICoverService.getAvailableStyles.mockReturnValue(['modern', 'vintage', 'minimalist']);

      const response = await request(app)
        .get('/api/ai/cover/styles')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: ['modern', 'vintage', 'minimalist']
      });
    });

    it('should handle errors when fetching cover styles', async () => {
      const { AICoverService } = require('../../services/aiCoverService');
      AICoverService.getAvailableStyles.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const response = await request(app)
        .get('/api/ai/cover/styles')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch cover styles'
      });
    });
  });

  describe('POST /api/ai/cover/generate', () => {
    it('should generate a book cover with valid input', async () => {
      const { AICoverService } = require('../../services/aiCoverService');
      const mockCoverData = {
        id: 'cover-id',
        title: 'Test Book',
        author: 'Test Author',
        coverUrl: 'https://example.com/cover.jpg',
        style: 'modern'
      };

      AICoverService.generateBookCover.mockResolvedValue(mockCoverData);

      const requestBody = {
        title: 'Test Book',
        author: 'Test Author',
        genre: 'Fiction',
        description: 'A test book',
        style: 'modern'
      };

      const response = await request(app)
        .post('/api/ai/cover/generate')
        .send(requestBody)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockCoverData
      });
    });

    it('should return 400 when title is missing', async () => {
      const requestBody = {
        author: 'Test Author',
        genre: 'Fiction'
      };

      const response = await request(app)
        .post('/api/ai/cover/generate')
        .send(requestBody)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Title and author are required'
      });
    });

    it('should return 400 when author is missing', async () => {
      const requestBody = {
        title: 'Test Book',
        genre: 'Fiction'
      };

      const response = await request(app)
        .post('/api/ai/cover/generate')
        .send(requestBody)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Title and author are required'
      });
    });

    it('should handle service errors during cover generation', async () => {
      const { AICoverService } = require('../../services/aiCoverService');
      AICoverService.generateBookCover.mockRejectedValue(new Error('Generation failed'));

      const requestBody = {
        title: 'Test Book',
        author: 'Test Author',
        style: 'modern'
      };

      const response = await request(app)
        .post('/api/ai/cover/generate')
        .send(requestBody)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to generate book cover'
      });
    });
  });
});
