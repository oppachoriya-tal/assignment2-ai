import request from 'supertest';
import express from 'express';
import { UserRole } from '@prisma/client';

// Mock the services and middleware BEFORE importing the route
vi.mock('../../services/recommendationService', () => ({
  RecommendationService: vi.fn(),
}));
vi.mock('../../services/aiService', () => ({
  AIService: {
    analyzeReview: vi.fn(),
    generateBookDescription: vi.fn(),
  },
}));
vi.mock('../../middleware/auth', () => ({
  authenticate: vi.fn(),
  optionalAuth: vi.fn(),
}));
vi.mock('../../middleware/validation', () => ({
  validateParams: vi.fn(() => vi.fn()),
  validateQuery: vi.fn(() => vi.fn()),
}));

// Import after mocks
import recommendationRoutes from '../../routes/recommendations';
import { RecommendationService } from '../../services/recommendationService';
import { AIService } from '../../services/aiService';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { validateParams, validateQuery } from '../../middleware/validation';

const mockRecommendationService = RecommendationService as vi.MockedClass<typeof RecommendationService>;
const mockAIService = AIService as vi.Mocked<typeof AIService>;
const mockAuthenticate = authenticate as vi.MockedFunction<typeof authenticate>;
const mockOptionalAuth = optionalAuth as vi.MockedFunction<typeof optionalAuth>;
const mockValidateParams = validateParams as vi.MockedFunction<typeof validateParams>;
const mockValidateQuery = validateQuery as vi.MockedFunction<typeof validateQuery>;

const app = express();
app.use(express.json());
app.use('/api/v1/recommendations', recommendationRoutes);

describe.skip('Recommendation Routes', () => {
  let mockRecommendationServiceInstance: vi.Mocked<RecommendationService>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock instance
    mockRecommendationServiceInstance = {
      generateRecommendations: vi.fn(),
      getSimilarBooks: vi.fn(),
      getTrendingBooks: vi.fn(),
      getGenreRecommendations: vi.fn(),
      getNewReleases: vi.fn(),
    } as any;
    
    mockRecommendationService.mockImplementation(() => mockRecommendationServiceInstance);
    
    // Mock middleware to pass through
    mockAuthenticate.mockImplementation(async (req, res, next) => {
      req.user = { id: 'user-1', username: 'testuser', email: 'test@example.com', role: UserRole.USER };
      next();
    });
    
    mockOptionalAuth.mockImplementation(async (req, res, next) => {
      req.user = { id: 'user-1', username: 'testuser', email: 'test@example.com', role: UserRole.USER };
      next();
    });
    
    mockValidateParams.mockImplementation(() => (req, res, next) => next());
    mockValidateQuery.mockImplementation(() => (req, res, next) => next());
  });

  describe('GET /api/v1/recommendations', () => {
    it('should get personalized recommendations successfully', async () => {
      const mockRecommendations = [
        { id: 'book-1', title: 'Recommended Book 1' },
        { id: 'book-2', title: 'Recommended Book 2' }
      ];
      
      mockRecommendationServiceInstance.generateRecommendations.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .get('/api/v1/recommendations')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockRecommendations,
        count: 2
      });
      expect(mockRecommendationServiceInstance.generateRecommendations).toHaveBeenCalledWith('user-1', 5);
    });

    it('should use default limit when not provided', async () => {
      const mockRecommendations: any[] = [];
      
      mockRecommendationServiceInstance.generateRecommendations.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .get('/api/v1/recommendations')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockRecommendations,
        count: 0
      });
      expect(mockRecommendationServiceInstance.generateRecommendations).toHaveBeenCalledWith('user-1', 10);
    });
  });

  describe('GET /api/v1/recommendations/similar/:bookId', () => {
    it('should get similar books successfully', async () => {
      const bookId = 'book-123';
      const mockSimilarBooks = [
        { id: 'book-2', title: 'Similar Book 1' },
        { id: 'book-3', title: 'Similar Book 2' }
      ];
      
      mockRecommendationServiceInstance.getSimilarBooks.mockResolvedValue(mockSimilarBooks);

      const response = await request(app)
        .get(`/api/v1/recommendations/similar/${bookId}`)
        .query({ limit: 3 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockSimilarBooks,
        count: 2
      });
      expect(mockRecommendationServiceInstance.getSimilarBooks).toHaveBeenCalledWith(bookId, 3);
    });
  });

  describe('GET /api/v1/recommendations/trending', () => {
    it('should get trending books successfully', async () => {
      const mockTrendingBooks = [
        { id: 'book-4', title: 'Trending Book 1' },
        { id: 'book-5', title: 'Trending Book 2' }
      ];
      
      mockRecommendationServiceInstance.getTrendingBooks.mockResolvedValue(mockTrendingBooks);

      const response = await request(app)
        .get('/api/v1/recommendations/trending')
        .query({ limit: 8 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockTrendingBooks,
        count: 2
      });
      expect(mockRecommendationServiceInstance.getTrendingBooks).toHaveBeenCalledWith(8);
    });
  });

  describe('GET /api/v1/recommendations/genre/:genreId', () => {
    it('should get genre-based recommendations successfully', async () => {
      const genreId = 'genre-123';
      const mockGenreRecommendations = [
        { id: 'book-6', title: 'Genre Book 1' }
      ];
      
      mockRecommendationServiceInstance.getGenreRecommendations.mockResolvedValue(mockGenreRecommendations);

      const response = await request(app)
        .get(`/api/v1/recommendations/genre/${genreId}`)
        .query({ limit: 6 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockGenreRecommendations,
        count: 1
      });
      expect(mockRecommendationServiceInstance.getGenreRecommendations).toHaveBeenCalledWith(genreId, 6);
    });
  });

  describe('GET /api/v1/recommendations/new-releases', () => {
    it('should get new releases successfully', async () => {
      const mockNewReleases = [
        { id: 'book-7', title: 'New Release 1' },
        { id: 'book-8', title: 'New Release 2' }
      ];
      
      mockRecommendationServiceInstance.getNewReleases.mockResolvedValue(mockNewReleases);

      const response = await request(app)
        .get('/api/v1/recommendations/new-releases')
        .query({ limit: 4 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockNewReleases,
        count: 2
      });
      expect(mockRecommendationServiceInstance.getNewReleases).toHaveBeenCalledWith(4);
    });
  });

  describe('POST /api/v1/recommendations/analyze-review', () => {
    it('should analyze review successfully', async () => {
      const reviewText = 'This book was amazing!';
      const mockAnalysis = {
        sentiment: 'positive' as const,
        rating: 5,
        summary: 'Great book',
        themes: ['adventure', 'friendship'],
        quality: 4.5
      };
      
      mockAIService.analyzeReview.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/v1/recommendations/analyze-review')
        .send({ reviewText })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAnalysis
      });
      expect(mockAIService.analyzeReview).toHaveBeenCalledWith(reviewText);
    });

    it('should return error when review text is missing', async () => {
      const response = await request(app)
        .post('/api/v1/recommendations/analyze-review')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Review text is required'
      });
    });
  });

  describe('POST /api/v1/recommendations/generate-description', () => {
    it('should generate book description successfully', async () => {
      const title = 'Test Book';
      const author = 'Test Author';
      const existingDescription = 'Old description';
      const mockDescription = 'AI generated description';
      
      mockAIService.generateBookDescription.mockResolvedValue(mockDescription);

      const response = await request(app)
        .post('/api/v1/recommendations/generate-description')
        .send({ title, author, existingDescription })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { description: mockDescription }
      });
      expect(mockAIService.generateBookDescription).toHaveBeenCalledWith(title, author, existingDescription);
    });

    it('should return error when title is missing', async () => {
      const response = await request(app)
        .post('/api/v1/recommendations/generate-description')
        .send({ author: 'Test Author' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Title and author are required'
      });
    });

    it('should return error when author is missing', async () => {
      const response = await request(app)
        .post('/api/v1/recommendations/generate-description')
        .send({ title: 'Test Book' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Title and author are required'
      });
    });
  });
});
