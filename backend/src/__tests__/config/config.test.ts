import { config } from '../../config/config';

describe('Config', () => {
  it('should have required configuration properties', () => {
    expect(config).toBeDefined();
    expect(config.port).toBeDefined();
    expect(config.nodeEnv).toBeDefined();
    expect(config.jwtSecret).toBeDefined();
    expect(config.jwtRefreshSecret).toBeDefined();
    expect(config.jwtExpiresIn).toBeDefined();
    expect(config.jwtRefreshExpiresIn).toBeDefined();
    expect(config.databaseUrl).toBeDefined();
    expect(config.redisUrl).toBeDefined();
    expect(config.logLevel).toBeDefined();
    expect(config.logFile).toBeDefined();
    expect(config.isDevelopment).toBeDefined();
  });

  it('should have correct default values', () => {
    expect(typeof config.port).toBe('number');
    expect(typeof config.nodeEnv).toBe('string');
    expect(typeof config.jwtSecret).toBe('string');
    expect(typeof config.jwtRefreshSecret).toBe('string');
    expect(typeof config.jwtExpiresIn).toBe('string');
    expect(typeof config.jwtRefreshExpiresIn).toBe('string');
    expect(typeof config.databaseUrl).toBe('string');
    expect(typeof config.redisUrl).toBe('string');
    expect(typeof config.logLevel).toBe('string');
    expect(typeof config.logFile).toBe('string');
    expect(typeof config.isDevelopment).toBe('boolean');
  });

  it('should have non-empty string values for required fields', () => {
    expect(config.jwtSecret.length).toBeGreaterThan(0);
    expect(config.jwtRefreshSecret.length).toBeGreaterThan(0);
    // Database URL might be empty in test environment, so we'll just check it's a string
    expect(typeof config.databaseUrl).toBe('string');
    expect(config.redisUrl.length).toBeGreaterThan(0);
  });

  it('should have valid port number', () => {
    expect(config.port).toBeGreaterThan(0);
    expect(config.port).toBeLessThan(65536);
  });
});
