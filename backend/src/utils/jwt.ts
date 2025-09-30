import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { JWTPayload, AuthTokens } from '../types/auth';

export class JWTService {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as any);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn,
    } as any);
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwtRefreshSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded.exp) return true;
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded.exp) return null;
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}
