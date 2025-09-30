import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import feedbackRoutes from '../../routes/feedback';

// Mock the services
vi.mock('../../services/feedbackService', () => ({
  FeedbackService: {
    createFeedback: vi.fn(),
    getFeedback: vi.fn(),
    getFeedbackById: vi.fn(),
    updateFeedbackStatus: vi.fn(),
    getUserFeedback: vi.fn(),
    getFeedbackStats: vi.fn()
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

describe('Feedback Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/feedback', feedbackRoutes);
    vi.clearAllMocks();
  });

  describe('POST /api/feedback', () => {
    it('should submit feedback successfully', async () => {
      const { FeedbackService } = require('../../services/feedbackService');
      const mockFeedback = {
        id: 'feedback-id',
        userId: 'test-user-id',
        type: 'BUG_REPORT',
        subject: 'Test Subject',
        message: 'Test message',
        rating: 4,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      FeedbackService.createFeedback.mockResolvedValue(mockFeedback);

      const requestBody = {
        type: 'bug_report',
        subject: 'Test Subject',
        message: 'Test message',
        rating: 4,
        metadata: { browser: 'Chrome' }
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(requestBody)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockFeedback
      });
    });

    it('should return 400 when type is missing', async () => {
      const requestBody = {
        subject: 'Test Subject',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(requestBody)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Type, subject, and message are required'
      });
    });

    it('should return 400 when subject is missing', async () => {
      const requestBody = {
        type: 'bug_report',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(requestBody)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Type, subject, and message are required'
      });
    });

    it('should return 400 when message is missing', async () => {
      const requestBody = {
        type: 'bug_report',
        subject: 'Test Subject'
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(requestBody)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Type, subject, and message are required'
      });
    });

    it('should return 400 when feedback type is invalid', async () => {
      const requestBody = {
        type: 'invalid_type',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(requestBody)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid feedback type'
      });
    });

    it('should return 400 when rating is out of range', async () => {
      const requestBody = {
        type: 'bug_report',
        subject: 'Test Subject',
        message: 'Test message',
        rating: 6
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(requestBody)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    });

    it('should handle service errors', async () => {
      const { FeedbackService } = require('../../services/feedbackService');
      FeedbackService.createFeedback.mockRejectedValue(new Error('Service error'));

      const requestBody = {
        type: 'bug_report',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(requestBody)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to submit feedback'
      });
    });
  });

  describe('GET /api/feedback', () => {
    it('should get feedback list with pagination', async () => {
      const { FeedbackService } = require('../../services/feedbackService');
      const mockFeedbackList = [
        { id: 'feedback-1', type: 'BUG_REPORT', subject: 'Bug 1', status: 'PENDING' },
        { id: 'feedback-2', type: 'FEATURE_REQUEST', subject: 'Feature 1', status: 'RESOLVED' }
      ];

      FeedbackService.getFeedback.mockResolvedValue({
        data: mockFeedbackList,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });

      const response = await request(app)
        .get('/api/feedback')
        .query({ page: 1, limit: 10, status: 'PENDING' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          data: mockFeedbackList,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    });

    it('should handle service errors when fetching feedback list', async () => {
      const { FeedbackService } = require('../../services/feedbackService');
      FeedbackService.getFeedback.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/feedback')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch feedback'
      });
    });
  });
});
