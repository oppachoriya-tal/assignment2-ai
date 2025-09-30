import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../Footer';

describe('Footer Component', () => {
  it('renders footer with copyright text', () => {
    render(<Footer />);
    
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} BookReview. All rights reserved./i)).toBeInTheDocument();
  });

  it('displays the current year in the copyright notice', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} BookReview. All rights reserved.`, 'i'))).toBeInTheDocument();
  });

  it('renders consistently', () => {
    const { rerender } = render(<Footer />);
    
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    rerender(<Footer />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
