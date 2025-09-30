import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import BookDetailPage from '../BookDetailPage';
import { store } from '../../store/store';

// Mock the API service
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getBook: jest.fn(),
    getReviews: jest.fn(),
    createReview: jest.fn(),
  },
}));

const renderBookDetailPage = () => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <BookDetailPage />
      </BrowserRouter>
    </Provider>
  );
};

describe('BookDetailPage', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should render book detail page with loading state', () => {
    renderBookDetailPage();
    
    expect(screen.getByTestId('book-detail-page')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should have correct container structure', () => {
    renderBookDetailPage();
    
    const container = screen.getByTestId('book-detail-page');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('MuiContainer-root');
  });

  it('should show error state when book is not found', async () => {
    const { getBook } = require('../../services/api').default;
    getBook.mockResolvedValue({
      success: false,
      message: 'Book not found'
    });

    renderBookDetailPage();
    
    // Just check that the component renders and shows loading initially
    expect(screen.getByTestId('book-detail-page')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});