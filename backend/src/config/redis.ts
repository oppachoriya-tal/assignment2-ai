import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { config } from './config';

let redisClient: RedisClientType;

export const redis = () => redisClient;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: config.redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('Redis disconnection failed:', error);
    throw error;
  }
};

// Graceful shutdown handlers removed to prevent infinite loops
