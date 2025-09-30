import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFoundPage from '../NotFoundPage';

describe('NotFoundPage Component', () => {
  it('renders 404 page with correct content', () => {
    render(<NotFoundPage />);
    
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('The page you are looking for does not exist.')).toBeInTheDocument();
  });

  it('has correct heading structure', () => {
    render(<NotFoundPage />);
    
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2 = screen.getByRole('heading', { level: 2 });
    
    expect(h1).toHaveTextContent('404');
    expect(h2).toHaveTextContent('Page Not Found');
  });

  it('has correct container structure', () => {
    render(<NotFoundPage />);
    
    const container = screen.getByTestId('not-found-page');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('MuiContainer-root');
  });

  it('renders consistently', () => {
    const { container } = render(<NotFoundPage />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('has accessible text content', () => {
    render(<NotFoundPage />);
    
    // Check that headings are accessible
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    
    // Check that descriptive text is accessible
    const description = screen.getByText('The page you are looking for does not exist.');
    expect(description).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<NotFoundPage />);
    
    // Should have proper heading hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent('404');
    expect(headings[1]).toHaveTextContent('Page Not Found');
  });
});
