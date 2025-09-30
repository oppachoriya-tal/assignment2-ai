import { PrismaClient } from '@prisma/client';

// Test database configuration
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://bookreview_user:bookreview_password@localhost:5432/bookreview_test_db?schema=public'
    }
  }
});

export { testPrisma };

export async function teardownTestDatabase() {
  try {
    await testPrisma.$disconnect();
    console.log('Test database disconnected');
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
  }
}