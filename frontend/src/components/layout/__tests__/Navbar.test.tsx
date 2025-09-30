import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../Navbar';
import { MemoryRouter } from 'react-router-dom';
import { CustomThemeProvider } from '../../../contexts/ThemeContext';

// Helper function to render Navbar with required providers
const renderNavbar = () => {
  return render(
    <CustomThemeProvider>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </CustomThemeProvider>
  );
};

describe('Navbar Component', () => {
  it('renders navbar with title', () => {
    renderNavbar();
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByText(/BookReview/)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderNavbar();

    expect(screen.getByTestId('books-link')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-link')).toBeInTheDocument();
    expect(screen.getByTestId('login-link')).toBeInTheDocument();
    expect(screen.getByTestId('register-link')).toBeInTheDocument();
  });

  it('brand link navigates to home', () => {
    renderNavbar();

    const brandLink = screen.getByText(/BookReview/);
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('Books link navigates to /books', () => {
    renderNavbar();

    const booksLink = screen.getByTestId('books-link');
    expect(booksLink).toHaveAttribute('href', '/books');
  });

  it('Reviews link navigates to /reviews', () => {
    renderNavbar();

    const reviewsLink = screen.getByTestId('reviews-link');
    expect(reviewsLink).toHaveAttribute('href', '/reviews');
  });

  it('Login link navigates to /login', () => {
    renderNavbar();

    const loginLink = screen.getByTestId('login-link');
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('Register link navigates to /register', () => {
    renderNavbar();

    const registerLink = screen.getByTestId('register-link');
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
