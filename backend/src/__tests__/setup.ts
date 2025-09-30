import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock database for tests to avoid database setup issues
vi.mock('../config/database', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    book: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    review: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    genre: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    userFavorite: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    bookGenre: {
      create: vi.fn(),
      createMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    feedback: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    reviewHelpful: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    userFollow: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  }
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));

// Mock nodemailer
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn(),
  })),
}));

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(),
      moderateContent: vi.fn(),
    })),
  })),
}));

// Mock services that are causing import issues
vi.mock('../services/geminiService', () => ({
  GeminiService: {
    generateJSON: vi.fn(),
    moderateContent: vi.fn(),
    generateContent: vi.fn(),
  },
}));

vi.mock('../services/aiService', () => ({
  AIService: {
    generateRecommendations: vi.fn(),
    generatePersonalizedRecommendations: vi.fn(),
  },
}));

// Mock EmailService
vi.mock('../services/emailService', () => ({
  EmailService: {
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock Redis
vi.mock('../config/redis', () => ({
  redis: vi.fn(() => ({
    setEx: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    set: vi.fn(),
    exists: vi.fn(),
  })),
}));

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  console.log('Test setup: Using mocked database');
});

// Global test teardown
afterAll(async () => {
  console.log('Test cleanup: Mocked database cleanup');
});

// Clean up after each test
afterEach(async () => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});