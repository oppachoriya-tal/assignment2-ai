import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';
import { AuthService } from '../../services/authService';
import { authenticate } from '../../middleware/auth';

// Mock the services
vi.mock('../../services/authService');
vi.mock('../../middleware/auth');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/register', () => {
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
        createdAt: new Date().toISOString(),
      };

      (AuthService.register as vi.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'User registered successfully',
        data: { user: mockUser }
      });
      expect(AuthService.register).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        username: 'johndoe',
        email: 'test@example.com',
        // Missing password, firstName, lastName
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'All fields are required'
      });
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        username: 'johndoe',
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email format'
      });
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        username: 'johndoe',
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    });

    it('should return 400 if user already exists', async () => {
      const userData = {
        username: 'johndoe',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      (AuthService.register as vi.Mock).mockRejectedValue(
        new Error('Email already exists')
      );

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Email already exists'
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockResult = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token'
        },
      };

      (AuthService.login as vi.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Login successful',
        data: { user: mockResult.user, token: mockResult.tokens.accessToken }
      });
      expect(AuthService.login).toHaveBeenCalledWith(loginData);
    });

    it('should return 400 for missing credentials', async () => {
      const loginData = {
        username: 'johndoe',
        // Missing password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Email and password are required'
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      (AuthService.login as vi.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid username or password'
      });
    });
  });

  describe('GET /auth/profile', () => {
    it('should get user profile successfully', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        username: 'johndoe',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      };

      (AuthService.getUserById as vi.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/profile')
        .query({ userId })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { user: mockUser }
      });
      expect(AuthService.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should return 400 for missing user ID', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'User ID is required'
      });
    });

    it('should return 404 for non-existent user', async () => {
      const userId = 'non-existent-user';

      (AuthService.getUserById as vi.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/auth/profile')
        .query({ userId })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'User not found'
      });
    });
  });
});