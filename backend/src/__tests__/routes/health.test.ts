import request from 'supertest';
import express from 'express';
import { UserRole } from '@prisma/client';

// Mock the dependencies BEFORE importing the route
vi.mock('../../middleware/simple-auth', () => ({
  authenticate: vi.fn(),
  authorize: vi.fn(() => vi.fn()),
}));
vi.mock('../../config/database', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    user: { count: vi.fn() },
    book: { count: vi.fn() },
    review: { count: vi.fn() },
  },
}));
vi.mock('../../config/redis', () => ({
  getRedisClient: vi.fn(),
}));
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Import after mocks
import healthRoutes from '../../routes/health';
import { authenticate, authorize } from '../../middleware/simple-auth';
import { prisma } from '../../config/database';
import { getRedisClient } from '../../config/redis';

// Mock fetch globally
global.fetch = vi.fn();

const mockAuthenticate = authenticate as vi.MockedFunction<typeof authenticate>;
const mockAuthorize = authorize as vi.MockedFunction<typeof authorize>;
const mockPrisma = prisma as vi.Mocked<typeof prisma>;
const mockGetRedisClient = getRedisClient as vi.MockedFunction<typeof getRedisClient>;
const mockFetch = global.fetch as vi.MockedFunction<typeof fetch>;

const app = express();
app.use(express.json());
app.use('/api/health', healthRoutes);

describe.skip('Health Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default middleware mocks
    mockAuthenticate.mockImplementation(async (req, res, next) => {
      req.user = { id: 'admin-user', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN };
      next();
    });
    mockAuthorize.mockImplementation(() => (req, res, next) => {
      next();
    });
  });

  describe('GET /api/health/', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/api/health/')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        service: 'Book Review API',
        version: '1.0.0'
      });
    });
  });

  describe('GET /api/health/database', () => {
    it('should return database health status successfully', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      (mockPrisma.user.count as vi.Mock).mockResolvedValue(10);
      (mockPrisma.book.count as vi.Mock).mockResolvedValue(25);
      (mockPrisma.review.count as vi.Mock).mockResolvedValue(50);

      const response = await request(app)
        .get('/api/health/database')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        database: {
          connected: true,
          stats: {
            users: 10,
            books: 25,
            reviews: 50
          }
        }
      });
    });

    it('should handle database connection error', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/health/database')
        .expect(500);

      expect(response.body).toEqual({
        status: 'ERROR',
        message: 'Database connection failed',
        error: 'Connection failed'
      });
    });
  });

  describe('GET /api/health/redis', () => {
    it('should return redis health status successfully', async () => {
      const mockRedis = {
        ping: vi.fn().mockResolvedValue('PONG'),
        info: vi.fn().mockResolvedValue('used_memory:1024'),
        dbSize: vi.fn().mockResolvedValue(5)
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const response = await request(app)
        .get('/api/health/redis')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        redis: {
          connected: true,
          keyCount: 5,
          memoryInfo: 'used_memory:1024'
        }
      });
    });

    it('should handle redis connection error', async () => {
      const mockRedis = {
        ping: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
        info: vi.fn(),
        dbSize: vi.fn()
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const response = await request(app)
        .get('/api/health/redis')
        .expect(500);

      expect(response.body).toEqual({
        status: 'ERROR',
        message: 'Redis connection failed',
        error: 'Redis connection failed'
      });
    });
  });

  describe('GET /api/health/ai', () => {
    it('should return ai health status successfully when API key is configured', async () => {
      // Mock environment variable
      process.env.GEMINI_API_KEY = 'test-api-key';
      
      // Mock GoogleGenerativeAI
      const mockGenerateContent = vi.fn().mockResolvedValue({ response: { text: () => 'test' } });
      const mockModel = { generateContent: mockGenerateContent };
      const mockGenAI = { getGenerativeModel: vi.fn().mockReturnValue(mockModel) };
      
      vi.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: vi.fn().mockImplementation(() => mockGenAI)
      }));

      const response = await request(app)
        .get('/api/health/ai')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        ai: {
          connected: true,
          service: 'Google Gemini',
          model: 'gemini-1.5-flash',
          apiKeyConfigured: true
        }
      });
    });

    it('should handle ai connection error when API key is not configured', async () => {
      // Remove API key
      delete process.env.GEMINI_API_KEY;

      const response = await request(app)
        .get('/api/health/ai')
        .expect(503);

      expect(response.body).toEqual({
        status: 'ERROR',
        timestamp: expect.any(String),
        ai: {
          connected: false,
          service: 'Google Gemini',
          error: 'API key not configured'
        }
      });
    });
  });

  describe('GET /api/health/system', () => {
    it('should return system health status', async () => {
      const response = await request(app)
        .get('/api/health/system')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        system: {
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          memory: expect.any(Object),
          platform: expect.any(String),
          nodeVersion: expect.any(String),
          environment: expect.any(String)
        }
      });
    });
  });

  describe('GET /api/health/full', () => {
    it('should return full health check with all services healthy', async () => {
      // Mock database
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      
      // Mock Redis
      const mockRedis = {
        ping: vi.fn().mockResolvedValue('PONG'),
        info: vi.fn(),
        dbSize: vi.fn()
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);
      
      // Mock Ollama
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ models: [{ name: 'llama2' }] })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const response = await request(app)
        .get('/api/health/full')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.services.database.status).toBe('OK');
      expect(response.body.services.redis.status).toBe('OK');
      expect(response.body.services.ai.status).toBe('OK');
    });

    it('should return degraded status when some services fail', async () => {
      // Mock database failure
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));
      
      // Mock Redis success
      const mockRedis = {
        ping: vi.fn().mockResolvedValue('PONG'),
        info: vi.fn(),
        dbSize: vi.fn()
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);
      
      // Mock Ollama failure
      mockFetch.mockRejectedValue(new Error('Ollama error'));

      const response = await request(app)
        .get('/api/health/full')
        .expect(503);

      expect(response.body.status).toBe('DEGRADED');
      expect(response.body.services.database.status).toBe('ERROR');
      expect(response.body.services.redis.status).toBe('OK');
      expect(response.body.services.ai.status).toBe('ERROR');
    });
  });
});
