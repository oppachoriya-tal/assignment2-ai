import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { JWTService } from '../utils/jwt';
import bcrypt from 'bcryptjs';
import { redis } from '../config/redis';
import { UserRole } from '@prisma/client';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<UserResponse> {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email
        }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'USER'
        }
      });

      logger.info(`New user registered: ${user.email}`);

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      };
    } catch (error) {
      logger.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(data: LoginData): Promise<{ user: UserResponse; tokens: TokenPair }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Generate token pair
      const tokens = await this.generateTokenPair(user.id, user.email, user.role as UserRole);

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt
        },
        tokens
      };
    } catch (error) {
      logger.error('Error logging in user:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh token pair
   */
  static async generateTokenPair(userId: string, email: string, role: string): Promise<TokenPair> {
    const accessToken = JWTService.generateAccessToken({
      userId,
      email,
      role: role as UserRole
    });

    const refreshToken = JWTService.generateRefreshToken({
      userId,
      email,
      role: role as UserRole
    });

    // Store refresh token in Redis with expiration
    const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
    await redis().setEx(`refresh_token:${userId}`, refreshTokenExpiry, refreshToken);

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = JWTService.verifyRefreshToken(refreshToken);
      
      // Check if refresh token exists in Redis
      const storedToken = await redis().get(`refresh_token:${payload.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new token pair
      const tokens = await this.generateTokenPair(user.id, user.email, user.role as UserRole);

      logger.info(`Token refreshed for user: ${user.email}`);
      return tokens;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Logout user (blacklist tokens)
   */
  static async logout(userId: string, accessToken: string): Promise<void> {
    try {
      // Add access token to blacklist
      const tokenExpiry = 15 * 60; // 15 minutes (access token expiry)
      await redis().setEx(`blacklist:${accessToken}`, tokenExpiry, 'true');

      // Remove refresh token from Redis
      await redis().del(`refresh_token:${userId}`);

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   */
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const isBlacklisted = await redis().get(`blacklist:${token}`);
      return !!isBlacklisted;
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserResponse | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      };
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserResponse | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      };
    } catch (error) {
      logger.error('Error fetching user by email:', error);
      throw error;
    }
  }
}