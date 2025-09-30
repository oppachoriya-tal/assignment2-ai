import Joi from 'joi';

// Auth schemas
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'Password is required',
    }),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required',
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must not exceed 50 characters',
      'any.required': 'Last name is required',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
  rememberMe: Joi.boolean()
    .optional()
    .default(false),
});

export const passwordResetSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
});

export const passwordResetConfirmSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required',
    }),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'New password is required',
    }),
});

// Book schemas
export const createBookSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.min': 'Title is required',
      'string.max': 'Title must not exceed 500 characters',
      'any.required': 'Title is required',
    }),
  author: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Author is required',
      'string.max': 'Author must not exceed 255 characters',
      'any.required': 'Author is required',
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must not exceed 2000 characters',
    }),
  isbn: Joi.string()
    .pattern(/^[0-9]{10,13}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'ISBN must be 10-13 digits',
    }),
  publishedYear: Joi.number()
    .integer()
    .min(1000)
    .max(new Date().getFullYear() + 1)
    .optional()
    .messages({
      'number.min': 'Published year must be valid',
      'number.max': 'Published year cannot be in the future',
    }),
  pageCount: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .optional()
    .messages({
      'number.min': 'Page count must be at least 1',
      'number.max': 'Page count must not exceed 10000',
    }),
  language: Joi.string()
    .length(2)
    .optional()
    .default('en')
    .messages({
      'string.length': 'Language must be a 2-character code',
    }),
  publisher: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Publisher must not exceed 255 characters',
    }),
  genreIds: Joi.array()
    .items(Joi.string().uuid())
    .optional()
    .default([])
    .messages({
      'array.items': 'Genre IDs must be valid UUIDs',
    }),
});

export const updateBookSchema = createBookSchema.fork(['title', 'author'], (schema) => schema.optional());

export const bookQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  search: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Search term must not exceed 100 characters',
    }),
  genre: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Genre must be a valid UUID',
    }),
  author: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Author filter must not exceed 255 characters',
    }),
  minRating: Joi.number()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Minimum rating must be at least 1',
      'number.max': 'Minimum rating must not exceed 5',
    }),
  maxRating: Joi.number()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Maximum rating must be at least 1',
      'number.max': 'Maximum rating must not exceed 5',
    }),
  sortBy: Joi.string()
    .valid('title', 'author', 'publishedYear', 'rating', 'createdAt')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: title, author, publishedYear, rating, createdAt',
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc',
    }),
});

// Review schemas
export const createReviewSchema = Joi.object({
  bookId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Book ID must be a valid UUID',
      'any.required': 'Book ID is required',
    }),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must not exceed 5',
      'any.required': 'Rating is required',
    }),
  reviewText: Joi.string()
    .min(50)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Review must be at least 50 characters long',
      'string.max': 'Review must not exceed 2000 characters',
      'any.required': 'Review text is required',
    }),
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must not exceed 5',
    }),
  reviewText: Joi.string()
    .min(50)
    .max(2000)
    .optional()
    .messages({
      'string.min': 'Review must be at least 50 characters long',
      'string.max': 'Review must not exceed 2000 characters',
    }),
}).min(1);

export const reviewQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 50',
    }),
  bookId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Book ID must be a valid UUID',
    }),
  userId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'User ID must be a valid UUID',
    }),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must not exceed 5',
    }),
  sortBy: Joi.string()
    .valid('createdAt', 'rating', 'helpful')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, rating, helpful',
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc',
    }),
});

// User schemas
export const updateUserSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must not exceed 50 characters',
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must not exceed 50 characters',
    }),
  bio: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Bio must not exceed 500 characters',
    }),
}).min(1);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'New password is required',
    }),
});

// Genre schemas
export const createGenreSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Genre name must be at least 2 characters long',
      'string.max': 'Genre name must not exceed 100 characters',
      'any.required': 'Genre name is required',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
});

export const updateGenreSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Genre name must be at least 2 characters long',
      'string.max': 'Genre name must not exceed 100 characters',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
}).min(1);

// Common schemas
export const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'ID must be a valid UUID',
      'any.required': 'ID is required',
    }),
});
