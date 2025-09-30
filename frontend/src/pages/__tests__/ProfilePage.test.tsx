import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProfilePage from '../ProfilePage';
import { apiService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    makeRequest: jest.fn(),
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Create mock store
const createMockStore = (isAuthenticated = true) => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated, user: { id: '1', email: 'test@example.com' } }, action) => state,
    },
  });
};

describe('ProfilePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockApiService.makeRequest.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );
    
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
    // Check for skeleton loading elements by class name
    expect(document.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('renders profile data successfully', async () => {
    const mockProfileData = {
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        bio: 'Test bio',
        createdAt: '2023-01-01T00:00:00Z',
        lastLogin: '2023-12-01T00:00:00Z'
      },
      reviews: [
        {
          id: 'review-1',
          rating: 5,
          reviewText: 'Great book!',
          createdAt: '2023-11-01T00:00:00Z',
          book: {
            id: 'book-1',
            title: 'Test Book',
            author: 'Test Author',
            coverImageUrl: null
          }
        }
      ],
      totalReviews: 1,
      favorites: [
        {
          id: 'book-1',
          title: 'Test Book',
          author: 'Test Author',
          coverImageUrl: null,
          averageRating: 4.5,
          totalReviews: 10,
          addedToFavorites: '2023-10-01T00:00:00Z'
        }
      ],
      totalFavorites: 1
    };

    mockApiService.makeRequest.mockResolvedValue({
      success: true,
      data: mockProfileData
    });
    
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('"Test bio"')).toBeInTheDocument();
    });

    // Check stats cards
    expect(screen.getAllByText('1')[0]).toBeInTheDocument(); // Reviews count
    expect(screen.getByText('Reviews Written')).toBeInTheDocument();
    expect(screen.getByText('Favorite Books')).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByText('Reviews (1)')).toBeInTheDocument();
    expect(screen.getByText('Favorites (1)')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    mockApiService.makeRequest.mockRejectedValue(new Error('API Error'));
    
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('renders no data state when API returns no data', async () => {
    mockApiService.makeRequest.mockResolvedValue({
      success: false,
      message: 'Failed to load profile data'
    });
    
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load profile data')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    const mockProfileData = {
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        bio: 'Test bio',
        createdAt: '2023-01-01T00:00:00Z',
        lastLogin: '2023-12-01T00:00:00Z'
      },
      reviews: [],
      totalReviews: 0,
      favorites: [],
      totalFavorites: 0
    };

    mockApiService.makeRequest.mockResolvedValue({
      success: true,
      data: mockProfileData
    });
    
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Check that Reviews tab is active by default
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    expect(screen.getByText('Start reviewing books to see them here!')).toBeInTheDocument();
  });

  it('has correct container structure', async () => {
    const mockProfileData = {
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        bio: 'Test bio',
        createdAt: '2023-01-01T00:00:00Z',
        lastLogin: '2023-12-01T00:00:00Z'
      },
      reviews: [],
      totalReviews: 0,
      favorites: [],
      totalFavorites: 0
    };

    mockApiService.makeRequest.mockResolvedValue({
      success: true,
      data: mockProfileData
    });
    
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const profileContainer = screen.getByTestId('profile-page');
    expect(profileContainer).toBeInTheDocument();
    expect(profileContainer).toHaveClass('MuiContainer-root');
  });

  it('renders consistently', async () => {
    const mockProfileData = {
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        bio: 'Test bio',
        createdAt: '2023-01-01T00:00:00Z',
        lastLogin: '2023-12-01T00:00:00Z'
      },
      reviews: [],
      totalReviews: 0,
      favorites: [],
      totalFavorites: 0
    };

    mockApiService.makeRequest.mockResolvedValue({
      success: true,
      data: mockProfileData
    });
    
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <ProfilePage />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    expect(container.firstChild).toMatchSnapshot();
  });
});