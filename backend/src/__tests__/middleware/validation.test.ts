import { Request, Response, NextFunction } from 'express';
import { validateRequest, validateParams, validateQuery } from '../../middleware/validation';
import Joi from 'joi';

// Mock Express objects
const mockRequest = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
}) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = vi.fn() as NextFunction;

describe('Validation Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateRequest', () => {
    it('should pass validation with valid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().min(18).max(100),
      });

      const req = mockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });

      const res = mockResponse();
      const middleware = validateRequest(schema);

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(req.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });
    });

    it('should fail validation with invalid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().min(18).max(100),
      });

      const req = mockRequest({
        name: '',
        email: 'invalid-email',
        age: 15,
      });

      const res = mockResponse();
      const middleware = validateRequest(schema);

      middleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'age',
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should strip unknown fields', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      });

      const req = mockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        unknownField: 'should be removed',
        anotherUnknown: 123,
      });

      const res = mockResponse();
      const middleware = validateRequest(schema);

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should handle empty body', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      const req = mockRequest({});
      const res = mockResponse();
      const middleware = validateRequest(schema);

      middleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
          }),
        ]),
      });
    });
  });

  describe('validateParams', () => {
    it('should pass validation with valid params', () => {
      const schema = Joi.object({
        id: Joi.string().uuid().required(),
        category: Joi.string().valid('books', 'reviews', 'users').required(),
      });

      const req = mockRequest({}, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'books',
      });

      const res = mockResponse();
      const middleware = validateParams(schema);

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(req.params).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'books',
      });
    });

    it('should fail validation with invalid params', () => {
      const schema = Joi.object({
        id: Joi.string().uuid().required(),
        category: Joi.string().valid('books', 'reviews', 'users').required(),
      });

      const req = mockRequest({}, {
        id: 'invalid-uuid',
        category: 'invalid-category',
      });

      const res = mockResponse();
      const middleware = validateParams(schema);

      middleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid parameters',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'category',
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle missing required params', () => {
      const schema = Joi.object({
        id: Joi.string().required(),
      });

      const req = mockRequest({}, {});
      const res = mockResponse();
      const middleware = validateParams(schema);

      middleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid parameters',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      });
    });
  });

  describe('validateQuery', () => {
    it('should pass validation with valid query params', () => {
      const schema = Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(10),
        search: Joi.string().optional(),
        sort: Joi.string().valid('asc', 'desc').default('asc'),
      });

      const req = mockRequest({}, {}, {
        page: '2',
        limit: '20',
        search: 'test',
        sort: 'desc',
      });

      const res = mockResponse();
      const middleware = validateQuery(schema);

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(req.query).toEqual({
        page: 2,
        limit: 20,
        search: 'test',
        sort: 'desc',
      });
    });

    it('should apply default values for missing query params', () => {
      const schema = Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(10),
        search: Joi.string().optional(),
        sort: Joi.string().valid('asc', 'desc').default('asc'),
      });

      const req = mockRequest({}, {}, {});
      const res = mockResponse();
      const middleware = validateQuery(schema);

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.query).toEqual({
        page: 1,
        limit: 10,
        sort: 'asc',
      });
    });

    it('should fail validation with invalid query params', () => {
      const schema = Joi.object({
        page: Joi.number().min(1).max(1000),
        limit: Joi.number().min(1).max(100),
        sort: Joi.string().valid('asc', 'desc'),
      });

      const req = mockRequest({}, {}, {
        page: 'invalid',
        limit: '200',
        sort: 'invalid-sort',
      });

      const res = mockResponse();
      const middleware = validateQuery(schema);

      middleware(req, res, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid query parameters',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'page',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'limit',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'sort',
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle empty query params', () => {
      const schema = Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(10),
      });

      const req = mockRequest({}, {}, {});
      const res = mockResponse();
      const middleware = validateQuery(schema);

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.query).toEqual({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null values in validateRequest', () => {
      const schema = Joi.object({
        name: Joi.string().allow(null),
        email: Joi.string().email().required(),
      });

      const req = mockRequest({
        name: null,
        email: 'test@example.com',
      });

      const res = mockResponse();
      const middleware = validateRequest(schema);

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.body).toEqual({
        name: null,
        email: 'test@example.com',
      });
    });

    it('should handle undefined values in validateParams', () => {
      const schema = Joi.object({
        id: Joi.string().optional(),
        category: Joi.string().required(),
      });

      const req = mockRequest({}, {
        id: undefined,
        category: 'books',
      });

      const res = mockResponse();
      const middleware = validateParams(schema);

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.params).toEqual({
        category: 'books',
      });
    });

    it('should handle complex nested validation', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          preferences: Joi.object({
            theme: Joi.string().valid('light', 'dark').default('light'),
            notifications: Joi.boolean().default(true),
          }).default({}),
        }).required(),
      });

      const req = mockRequest({
        user: {
          name: 'John Doe',
          preferences: {
            theme: 'dark',
            notifications: false,
          },
        },
      });

      const res = mockResponse();
      const middleware = validateRequest(schema);

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.body).toEqual({
        user: {
          name: 'John Doe',
          preferences: {
            theme: 'dark',
            notifications: false,
          },
        },
      });
    });
  });
});
