import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, optionalAuth } from '@/middleware/auth';
import { JWTService } from '@/utils/jwt';
import { UserRole } from '@prisma/client';

// Mock JWT service
vi.mock('@/utils/jwt');
const mockJWTService = JWTService as vi.Mocked<typeof JWTService>;

// Mock Prisma
vi.mock('@/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { prisma } from '@/config/database';
const mockPrisma = prisma as vi.Mocked<typeof prisma>;
const mockFindUnique = mockPrisma.user.findUnique as vi.MockedFunction<typeof prisma.user.findUnique>;

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockReq = {
      headers: {},
    };
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        iat: 1234567890,
        exp: 1234567890,
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJWTService.verifyAccessToken.mockReturnValue(mockUser);
      
      // Mock the database call
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        isActive: true,
      } as any);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockJWTService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        }
      });
      expect(mockReq.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      mockReq.headers = {};

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      mockReq.headers = {
        authorization: 'InvalidFormat token',
      };

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockJWTService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    beforeEach(() => {
      // Set up authenticated user
      mockReq.user = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      };
    });

    it('should authorize user with correct role', () => {
      const authorizeUser = authorize('USER');

      authorizeUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should authorize user with admin role when required', () => {
      mockReq.user!.role = 'ADMIN';
      const authorizeAdmin = authorize('ADMIN');

      authorizeAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user with insufficient role', () => {
      const authorizeAdmin = authorize('ADMIN');

      authorizeAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authorize user with multiple allowed roles', () => {
      mockReq.user!.role = 'MODERATOR';
      const authorizeMultiple = authorize('USER', 'MODERATOR', 'ADMIN');

      authorizeMultiple(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user not in allowed roles', () => {
      mockReq.user!.role = 'USER';
      const authorizeModerator = authorize('MODERATOR', 'ADMIN');

      authorizeModerator(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle request without user', () => {
      mockReq.user = undefined;
      const authorizeUser = authorize('USER');

      authorizeUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        iat: 1234567890,
        exp: 1234567890,
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJWTService.verifyAccessToken.mockReturnValue(mockUser);
      
      // Mock the database call
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        isActive: true,
      } as any);

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockJWTService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        }
      });
      expect(mockReq.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication if no token provided', async () => {
      mockReq.headers = {};

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });
});
