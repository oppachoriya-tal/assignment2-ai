import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from './config';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.__prisma || new PrismaClient({
  log: config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

if (config.isDevelopment) {
  globalThis.__prisma = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Database disconnection failed:', error);
    throw error;
  }
};

// Graceful shutdown handlers removed to prevent infinite loops
