import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from multiple sources
// 1. Load from root .env (if exists)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 2. Load from backend/.env (if exists)
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

// 3. Load from backend/.env.local (if exists) - highest priority
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env.local') });

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Dynamic URLs
  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || '3000'}`,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3333',

  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@bookreview.com',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/gif'],
  },

  // Google Gemini Configuration
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  
  // Service Discovery URLs (for Docker)
  services: {
    postgres: process.env.POSTGRES_URL || 'postgresql://bookreview_user:bookreview_password@postgres:5432/bookreview_db',
    redis: process.env.REDIS_URL || 'redis://redis:6379',
    elasticsearch: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  },

  // External APIs (Optional)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY || '',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/app.log',

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key',

  // Elasticsearch
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX || 'books',
  },

  // Validation
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};
