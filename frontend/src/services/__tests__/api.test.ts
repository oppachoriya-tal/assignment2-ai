// Mock API service for testing
export {}; // Make this file a module

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
  description: string;
  genre: {
    id: string;
    name: string;
  };
  averageRating: number;
  reviewCount: number;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getBooks(params?: {
    page?: number;
    limit?: number;
    search?: string;
    genre?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<{ books: Book[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/books${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ books: Book[]; pagination: any }>(endpoint);
  }

  async getBookById(id: string): Promise<ApiResponse<Book>> {
    return this.request<Book>(`/books/${id}`);
  }

  async createBook(book: Omit<Book, 'id'>): Promise<ApiResponse<Book>> {
    return this.request<Book>('/books', {
      method: 'POST',
      body: JSON.stringify(book),
    });
  }

  async updateBook(id: string, book: Partial<Book>): Promise<ApiResponse<Book>> {
    return this.request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(book),
    });
  }

  async deleteBook(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/books/${id}`, {
      method: 'DELETE',
    });
  }
}

// Tests
describe('ApiService', () => {
  let apiService: ApiService;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    apiService = new ApiService();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
            isVerified: true,
          },
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        },
        message: 'Login successful',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await apiService.login(credentials);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error for invalid credentials', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Invalid email or password',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response);

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(apiService.login(credentials)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('getBooks', () => {
    it('should fetch books with default parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          books: [
            {
              id: 'book-1',
              title: 'Test Book',
              author: 'Test Author',
              isbn: '1234567890',
              publishedYear: 2023,
              description: 'Test description',
              genre: { id: 'genre-1', name: 'Fiction' },
              averageRating: 4.5,
              reviewCount: 10,
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
        message: 'Books retrieved successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.getBooks();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/books',
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should fetch books with query parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          books: [],
          pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
        },
        message: 'Books retrieved successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const params = {
        page: 1,
        limit: 5,
        search: 'JavaScript',
        genre: 'Programming',
        sortBy: 'title',
        sortOrder: 'asc',
      };

      const result = await apiService.getBooks(params);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/books?page=1&limit=5&search=JavaScript&genre=Programming&sortBy=title&sortOrder=asc',
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getBookById', () => {
    it('should fetch book by id', async () => {
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        publishedYear: 2023,
        description: 'Test description',
        genre: { id: 'genre-1', name: 'Fiction' },
        averageRating: 4.5,
        reviewCount: 10,
      };

      const mockResponse = {
        success: true,
        data: mockBook,
        message: 'Book retrieved successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.getBookById('book-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/books/book-1',
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error if book not found', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Book not found',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response);

      await expect(apiService.getBookById('nonexistent-book')).rejects.toThrow(
        'Book not found'
      );
    });
  });

  describe('createBook', () => {
    it('should create book successfully', async () => {
      const bookData = {
        title: 'New Book',
        author: 'New Author',
        isbn: '1234567890',
        publishedYear: 2023,
        description: 'New book description',
        genre: { id: 'genre-1', name: 'Fiction' },
        averageRating: 0,
        reviewCount: 0,
      };

      const mockResponse = {
        success: true,
        data: { id: 'book-1', ...bookData },
        message: 'Book created successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.createBook(bookData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/books',
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify(bookData),
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateBook', () => {
    it('should update book successfully', async () => {
      const updateData = {
        title: 'Updated Book Title',
        description: 'Updated description',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'book-1',
          title: 'Updated Book Title',
          author: 'Test Author',
          isbn: '1234567890',
          publishedYear: 2023,
          description: 'Updated description',
          genre: { id: 'genre-1', name: 'Fiction' },
          averageRating: 4.5,
          reviewCount: 10,
        },
        message: 'Book updated successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.updateBook('book-1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/books/book-1',
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteBook', () => {
    it('should delete book successfully', async () => {
      const mockResponse = {
        success: true,
        data: undefined,
        message: 'Book deleted successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.deleteBook('book-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/books/book-1',
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'DELETE',
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getBooks()).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        redirected: false,
        type: 'basic',
        url: '',
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        text: jest.fn(),
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(apiService.getBooks()).rejects.toThrow('Invalid JSON');
    });
  });
});
