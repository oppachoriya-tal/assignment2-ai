import { beforeEach, vi } from 'vitest';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { Request, Response, NextFunction } from 'express';

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock config
vi.mock('@/config/config', () => ({
  config: {
    isProduction: false,
    isDevelopment: true,
  },
}));

describe('Middleware Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/api/v1/test',
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-user-agent'),
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe('errorHandler', () => {
    it('should handle errors and return error response', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        stack: expect.any(String),
      });
    });

    it('should handle errors without message', () => {
      const error = new Error();
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '',
        stack: expect.any(String),
      });
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      
      errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: undefined,
        stack: undefined,
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 response', () => {
      notFoundHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Route /api/v1/test not found',
      });
    });
  });
});
