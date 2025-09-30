import type { Config } from 'jest';
import { config } from 'dotenv';

// Load environment variables
config();

const jestConfig: Config = {
  // Test environment
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.test.ts'
  ],
  
  // Coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/**/__tests__/**',
    '!src/index.ts',
    '!src/config/database.ts',
    '!src/config/redis.ts'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Transform
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/__tests__/globalSetup.ts',
  globalTeardown: '<rootDir>/src/__tests__/globalTeardown.ts',
  
  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Module paths
  modulePaths: ['<rootDir>/src'],
  
  // Extensions to treat as ES modules
  extensionsToTreatAsEsm: ['.ts'],
  
  // Globals
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};

export default jestConfig;
