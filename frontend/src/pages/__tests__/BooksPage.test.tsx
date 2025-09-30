import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import BooksPage from '../BooksPage';
import { store } from '../../store/store';

const renderBooksPage = () => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <BooksPage />
      </BrowserRouter>
    </Provider>
  );
};

describe('BooksPage', () => {
  it('should render books page', () => {
    renderBooksPage();
    
    expect(screen.getByTestId('books-page')).toBeInTheDocument();
    expect(screen.getByText('Discover Books')).toBeInTheDocument();
    expect(screen.getByText('Explore our collection of books, find trending titles, and get AI-powered recommendations')).toBeInTheDocument();
  });

  it('should have correct heading', () => {
    renderBooksPage();
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Discover Books');
  });

  it('should have correct container structure', () => {
    renderBooksPage();
    
    const container = screen.getByTestId('books-page');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('MuiContainer-root');
  });
});