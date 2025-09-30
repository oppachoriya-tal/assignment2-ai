import { testPrisma } from './config/testConfig';

export default async function globalTeardown() {
  console.log('Tearing down test environment...');
  
  try {
    // Disconnect from test database
    await testPrisma.$disconnect();
    console.log('Test database disconnected');
    
    console.log('Test environment teardown complete');
  } catch (error) {
    console.error('Error during test teardown:', error);
  }
}
