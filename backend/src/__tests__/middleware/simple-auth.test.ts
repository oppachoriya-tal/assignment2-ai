import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth, authorize } from '../../middleware/simple-auth';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { UserRole } from '@prisma/client';

// Mock prisma
vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Simple Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      user: undefined,
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      };

      const tokenPayload = {
        userId: 'user-123',
        exp: Date.now() + 3600000, // 1 hour from now
      };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

      req.headers = { authorization: `Bearer ${token}` };
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser);

      await authenticate(req as Request, res as Response, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing authorization header', async () => {
      req.headers = {};

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
    });

    it('should handle invalid token format', async () => {
      req.headers = { authorization: 'InvalidFormat token' };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
    });

    it('should handle invalid token', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
    });

    it('should handle expired token', async () => {
      const tokenPayload = {
        userId: 'user-123',
        exp: Date.now() - 3600000, // 1 hour ago
      };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

      req.headers = { authorization: `Bearer ${token}` };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
    });

    it('should handle user not found', async () => {
      const tokenPayload = {
        userId: 'nonexistent-user',
        exp: Date.now() + 3600000,
      };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

      req.headers = { authorization: `Bearer ${token}` };
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      };

      const tokenPayload = {
        userId: 'user-123',
        exp: Date.now() + 3600000,
      };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

      req.headers = { authorization: `Bearer ${token}` };
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser);

      await optionalAuth(req as Request, res as Response, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should continue without auth when no token provided', async () => {
      req.headers = {};

      await optionalAuth(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without auth when token is invalid', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };

      await optionalAuth(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without auth when token is expired', async () => {
      const tokenPayload = {
        userId: 'user-123',
        exp: Date.now() - 3600000,
      };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

      req.headers = { authorization: `Bearer ${token}` };

      await optionalAuth(req as Request, res as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should allow access for authorized role', () => {
      req.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      };

      const middleware = authorize(UserRole.ADMIN);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      req.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      };

      const middleware = authorize(UserRole.ADMIN);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
      });
    });

    it('should deny access when user is not authenticated', () => {
      req.user = undefined;

      const middleware = authorize(UserRole.ADMIN);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should allow access for multiple roles', () => {
      req.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.MODERATOR,
      };

      const middleware = authorize(UserRole.ADMIN, UserRole.MODERATOR);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});