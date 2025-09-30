import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import ReviewsPage from '../ReviewsPage';
import { store } from '../../store/store';

const renderReviewsPage = () => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ReviewsPage />
      </BrowserRouter>
    </Provider>
  );
};

describe('ReviewsPage', () => {
  it('should render reviews page', () => {
    renderReviewsPage();
    
    expect(screen.getByTestId('reviews-page')).toBeInTheDocument();
    expect(screen.getByText('Recent Book Reviews')).toBeInTheDocument();
    expect(screen.getByText(/Discover what readers are saying about their favorite books/)).toBeInTheDocument();
  });

  it('should have correct heading', () => {
    renderReviewsPage();
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Recent Book Reviews');
  });

  it('should have correct container structure', () => {
    renderReviewsPage();
    
    const container = screen.getByTestId('reviews-page');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('MuiContainer-root');
  });
});