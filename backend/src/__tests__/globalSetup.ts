import { config } from 'dotenv';
import { testPrisma } from './config/testConfig';

// Load environment variables
config();

export default async function globalSetup() {
  console.log('Setting up test environment...');
  
  try {
    // Connect to test database
    await testPrisma.$connect();
    console.log('Test database connected');
    
    // Create test schema if needed
    // This would typically be handled by migrations in a real project
    
    console.log('Test environment setup complete');
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  }
}
