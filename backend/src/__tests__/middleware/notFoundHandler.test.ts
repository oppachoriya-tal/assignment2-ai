import { Request, Response } from 'express';
import { beforeEach, vi } from 'vitest';
import { notFoundHandler } from '../../middleware/notFoundHandler';

// Mock Express objects
const mockRequest = (originalUrl = '/test-route') => ({
  originalUrl,
}) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('Not Found Handler Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 with correct message for any route', () => {
    const req = mockRequest('/api/nonexistent');
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Route /api/nonexistent not found',
    });
  });

  it('should handle root route', () => {
    const req = mockRequest('/');
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Route / not found',
    });
  });

  it('should handle nested routes', () => {
    const req = mockRequest('/api/v1/users/123/profile/settings');
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Route /api/v1/users/123/profile/settings not found',
    });
  });

  it('should handle routes with query parameters', () => {
    const req = mockRequest('/api/search?q=test&page=1');
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Route /api/search?q=test&page=1 not found',
    });
  });

  it('should handle empty route', () => {
    const req = mockRequest('');
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Route  not found',
    });
  });

  it('should handle special characters in route', () => {
    const req = mockRequest('/api/test%20route/with-special_chars');
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Route /api/test%20route/with-special_chars not found',
    });
  });

  it('should return proper response structure', () => {
    const req = mockRequest('/test');
    const res = mockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Route /test not found',
    });
  });
});
