// API Service for dynamic environment configuration
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ReviewRequest {
  bookId: string;
  rating: number;
  reviewText: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  reviewText?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Dynamic API URL resolution
    this.baseUrl = baseUrl || this.getApiBaseUrl();
  }

  private getApiBaseUrl(): string {
    // Check for environment variable first (Create React App uses REACT_APP_ prefix)
    if (process.env.REACT_APP_API_BASE) {
      return process.env.REACT_APP_API_BASE;
    }
    
    // Check for Vite environment variable (for future Vite migration)
    // Note: import.meta is not available in Jest environment
    // Skip this check in test environment to avoid coverage collection issues
    if (process.env.NODE_ENV !== 'test') {
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) {
          return import.meta.env.VITE_API_BASE;
        }
      } catch (e) {
        // Ignore import.meta errors in test environment
      }
    }

    // Check for window location (for production)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // If running on AWS or production
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:3000/api`;
      }
      
      // Local development
      return 'http://localhost:3000/api';
    }

    // Fallback
    return 'http://localhost:3000/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        // Force permissive CORS on client requests; backend must also allow '*'
        'Accept': 'application/json',
        // Add Authorization header if token exists
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      // Ensure browser sends CORS preflight properly
      mode: 'cors',
      credentials: 'omit',
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
    return this.request<LoginResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<ApiResponse<any>> {
    return this.request('/v1/auth/logout', {
      method: 'POST',
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<any>> {
    return this.request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<any>> {
    return this.request('/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.request('/v1/auth/profile');
  }

  async getBooks(params?: any): Promise<ApiResponse<any>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/v1/books${queryString}`);
  }

  async getBook(id: string): Promise<ApiResponse<any>> {
    return this.request(`/v1/books/${id}`);
  }

  async createBook(bookData: any): Promise<ApiResponse<any>> {
    return this.request('/v1/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  async updateBook(id: string, bookData: any): Promise<ApiResponse<any>> {
    return this.request(`/v1/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  }

  async deleteBook(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/books/${id}`, {
      method: 'DELETE',
    });
  }

  async getReviews(params?: any): Promise<ApiResponse<any>> {
    let endpoint = '/v1/reviews';
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.bookId) queryParams.append('bookId', params.bookId);
      if (params.search) queryParams.append('search', params.search);
      if (params.minRating) queryParams.append('minRating', params.minRating.toString());
      if (params.maxRating) queryParams.append('maxRating', params.maxRating.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
    }
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }
    
    return this.request(endpoint);
  }

  async createReview(reviewData: ReviewRequest): Promise<ApiResponse<any>> {
    return this.request('/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async updateReview(reviewId: string, reviewData: UpdateReviewRequest): Promise<ApiResponse<any>> {
    return this.request(`/v1/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  async deleteReview(reviewId: string): Promise<ApiResponse<any>> {
    return this.request(`/v1/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  async getReviewById(reviewId: string): Promise<ApiResponse<any>> {
    return this.request(`/v1/reviews/${reviewId}`);
  }

  async getUserReviews(userId: string, limit?: number): Promise<ApiResponse<any>> {
    const queryString = limit ? `?limit=${limit}` : '';
    return this.request(`/v1/reviews/user/${userId}${queryString}`);
  }

  async voteReviewHelpful(reviewId: string, isHelpful: boolean): Promise<ApiResponse<any>> {
    return this.request(`/v1/reviews/${reviewId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ isHelpful }),
    });
  }

  async getRecommendations(): Promise<ApiResponse<any>> {
    return this.request('/v1/recommendations');
  }

  async searchBooks(query: string): Promise<ApiResponse<any>> {
    return this.request(`/v1/books/search?q=${encodeURIComponent(query)}`);
  }

  // Generic request method for custom endpoints
  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, options);
  }

  // Get genres
  async getGenres(): Promise<ApiResponse<any>> {
    return this.request('/v1/genres');
  }

  // Get enhanced books with AI features
  async getEnhancedBooks(params?: any): Promise<ApiResponse<any>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/v1/books/advanced${queryString}`);
  }

  // Favorites methods
  async getFavorites(): Promise<ApiResponse<any>> {
    return this.request('/v1/users/favorites');
  }

  async addToFavorites(bookId: string): Promise<ApiResponse<any>> {
    return this.request(`/v1/books/${bookId}/favorites`, {
      method: 'PUT',
    });
  }

  async removeFromFavorites(bookId: string): Promise<ApiResponse<any>> {
    return this.request(`/v1/books/${bookId}/favorites`, {
      method: 'DELETE',
    });
  }

  async isInFavorites(bookId: string): Promise<ApiResponse<any>> {
    return this.request(`/v1/books/${bookId}/favorites-status`);
  }

  // User profile methods
  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.request('/v1/users/profile');
  }

  async getUserFavorites(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/v1/users/${userId}/favorites`);
  }

  // AI Recommendations
  async getAIRecommendations(query: string, limit: number = 3): Promise<ApiResponse<any>> {
    return this.request('/ai/recommendations', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  }

  async getPersonalizedRecommendations(query?: string, limit: number = 5): Promise<ApiResponse<any>> {
    return this.request('/ai/recommendations/personalized', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  }

  // AI Cover generation
  async generateBookCover(coverData: any): Promise<ApiResponse<any>> {
    return this.request('/ai/cover/generate', {
      method: 'POST',
      body: JSON.stringify(coverData),
    });
  }

  async generateCoverOptions(coverData: any): Promise<ApiResponse<any>> {
    return this.request('/ai/cover/generate-options', {
      method: 'POST',
      body: JSON.stringify(coverData),
    });
  }

  async getCoverStyles(): Promise<ApiResponse<any>> {
    return this.request('/ai/cover/styles');
  }

  async applyCoverToBook(bookId: string, style: string): Promise<ApiResponse<any>> {
    return this.request(`/ai/cover/apply/${bookId}`, {
      method: 'POST',
      body: JSON.stringify({ style }),
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
