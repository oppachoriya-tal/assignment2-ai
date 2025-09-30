import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { config } from '../config/config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BookReview API',
      version: '1.0.0',
      description: 'A comprehensive book review platform API with AI-powered recommendations',
      contact: {
        name: 'BookReview Team',
        email: 'support@bookreview.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.bookreview.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              description: 'User avatar URL',
            },
            bio: {
              type: 'string',
              description: 'User biography',
            },
            role: {
              type: 'string',
              enum: ['USER', 'MODERATOR', 'ADMIN'],
              description: 'User role',
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether user email is verified',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
            },
          },
        },
        Book: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Book ID',
            },
            title: {
              type: 'string',
              description: 'Book title',
            },
            author: {
              type: 'string',
              description: 'Book author',
            },
            description: {
              type: 'string',
              description: 'Book description',
            },
            coverImageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Book cover image URL',
            },
            publishedYear: {
              type: 'integer',
              description: 'Publication year',
            },
            pageCount: {
              type: 'integer',
              description: 'Number of pages',
            },
            language: {
              type: 'string',
              description: 'Book language',
            },
            publisher: {
              type: 'string',
              description: 'Publisher name',
            },
            averageRating: {
              type: 'number',
              format: 'float',
              description: 'Average rating (1-5)',
            },
            totalReviews: {
              type: 'integer',
              description: 'Total number of reviews',
            },
            genres: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Genre',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Book creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
            },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Review ID',
            },
            bookId: {
              type: 'string',
              format: 'uuid',
              description: 'Book ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Rating (1-5 stars)',
            },
            reviewText: {
              type: 'string',
              description: 'Review text content',
            },
            isHelpfulCount: {
              type: 'integer',
              description: 'Number of helpful votes',
            },
            isFlagged: {
              type: 'boolean',
              description: 'Whether review is flagged',
            },
            isModerated: {
              type: 'boolean',
              description: 'Whether review is moderated',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Review creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            book: {
              $ref: '#/components/schemas/Book',
            },
          },
        },
        Genre: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Genre ID',
            },
            name: {
              type: 'string',
              description: 'Genre name',
            },
            description: {
              type: 'string',
              description: 'Genre description',
            },
            bookCount: {
              type: 'integer',
              description: 'Number of books in this genre',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Genre creation date',
            },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            tokens: {
              $ref: '#/components/schemas/AuthTokens',
            },
          },
        },
        Recommendation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Book ID',
            },
            title: {
              type: 'string',
              description: 'Book title',
            },
            author: {
              type: 'string',
              description: 'Book author',
            },
            coverImageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Book cover image URL',
            },
            averageRating: {
              type: 'number',
              format: 'float',
              description: 'Average rating',
            },
            totalReviews: {
              type: 'integer',
              description: 'Total number of reviews',
            },
            reason: {
              type: 'string',
              description: 'Reason for recommendation',
            },
            confidence: {
              type: 'number',
              format: 'float',
              description: 'Confidence score (0-1)',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name',
                  },
                  message: {
                    type: 'string',
                    description: 'Error message',
                  },
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: 'Current page',
                },
                limit: {
                  type: 'integer',
                  description: 'Items per page',
                },
                total: {
                  type: 'integer',
                  description: 'Total items',
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total pages',
                },
                hasNext: {
                  type: 'boolean',
                  description: 'Has next page',
                },
                hasPrev: {
                  type: 'boolean',
                  description: 'Has previous page',
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BookReview API Documentation',
  }));

  app.get('/api/v1/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};
