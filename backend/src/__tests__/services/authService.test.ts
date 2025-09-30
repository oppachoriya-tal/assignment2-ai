import { AuthService } from '../../services/authService';
import { prisma } from '../../config/database';
import { JWTService } from '../../utils/jwt';
import { EmailService } from '../../services/emailService';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        createdAt: new Date(),
      };

      (prisma.user.findFirst as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as vi.Mock).mockResolvedValue('hashed-password');
      (EmailService.sendVerificationEmail as any).mockResolvedValue(undefined);

      const result = await AuthService.register(userData);

      expect(result).toEqual(mockUser);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com'
        }
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
        },
      });
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      (prisma.user.findFirst as vi.Mock).mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@example.com',
      });

      await expect(AuthService.register(userData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as vi.Mock).mockResolvedValue(true);
      (prisma.user.update as vi.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.login(loginData);

      expect(result.user.id).toBe('user-id');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.firstName).toBe('John');
      expect(result.user.lastName).toBe('Doe');
      expect(result.user.role).toBe('USER');
      expect(result.user.createdAt).toBeInstanceOf(Date);

      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(typeof result.tokens.accessToken).toBe('string');
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(AuthService.login(loginData)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error for wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as vi.Mock).mockResolvedValue(false);

      await expect(AuthService.login(loginData)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error if email already exists during registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      (prisma.user.findFirst as vi.Mock).mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@example.com',
      });

      await expect(AuthService.register(userData)).rejects.toThrow(
        'Email already exists'
      );
    });

    it('should handle database errors during registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      (prisma.user.findFirst as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockRejectedValue(new Error('Database error'));

      await expect(AuthService.register(userData)).rejects.toThrow('Database error');
    });

    it('should handle database errors during login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      (prisma.user.findUnique as vi.Mock).mockRejectedValue(new Error('Database error'));

      await expect(AuthService.login(loginData)).rejects.toThrow('Database error');
    });

  });

});
