import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CustomThemeProvider } from '../contexts/ThemeContext';
import App from '../App';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import BooksPage from '../pages/BooksPage';
import ReviewsPage from '../pages/ReviewsPage';
import BookDetailPage from '../pages/BookDetailPage';
import RegisterPage from '../pages/RegisterPage';
import UserProfilePage from '../pages/UserProfilePage';
import FavoritesPage from '../pages/FavoritesPage';

// Create mock store
const createMockStore = (isAuthenticated = false) => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated, user: null }, action) => state,
      books: (state = { books: [], loading: false }, action) => state,
      reviews: (state = { reviews: [], loading: false }, action) => state,
    },
  });
};

const renderApp = (initialRoute = '/', isAuthenticated = false) => {
  const store = createMockStore(isAuthenticated);
  return render(
    <CustomThemeProvider>
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <App />
        </MemoryRouter>
      </Provider>
    </CustomThemeProvider>
  );
};

describe('App Component', () => {
  it('renders navbar and footer', () => {
    renderApp();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders home page by default', () => {
    renderApp();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders login page when navigating to /login', () => {
    renderApp('/login');
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders register page when navigating to /register', () => {
    renderApp('/register');
    expect(screen.getByTestId('register-page')).toBeInTheDocument();
  });

  it('renders books page when navigating to /books', () => {
    renderApp('/books');
    expect(screen.getByTestId('books-page')).toBeInTheDocument();
  });

  it('renders reviews page when navigating to /reviews', () => {
    renderApp('/reviews');
    expect(screen.getByTestId('reviews-page')).toBeInTheDocument();
  });

  it('renders profile page when navigating to /profile', () => {
    renderApp('/profile', true);
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });

  it('renders favorites page when navigating to /favorites', () => {
    renderApp('/favorites', true);
    expect(screen.getByTestId('favorites-page')).toBeInTheDocument();
  });

  it('renders book detail page when navigating to /books/:id', () => {
    renderApp('/books/123');
    expect(screen.getByTestId('book-detail-page')).toBeInTheDocument();
  });

  it('renders user profile page when navigating to /users/:id/profile', () => {
    renderApp('/users/123/profile');
    expect(screen.getByTestId('user-profile-page')).toBeInTheDocument();
  });

  it('renders not found page for unknown routes', () => {
    renderApp('/unknown');
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });

  it('has correct theme provider context', () => {
    renderApp();
    // Check that the theme provider is working by verifying components render
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('handles authentication state correctly', () => {
    // Test unauthenticated state
    renderApp('/profile', false);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();

    // Test authenticated state
    renderApp('/profile', true);
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });

  it('renders all main navigation routes', () => {
    const routes = ['/', '/books', '/reviews', '/login', '/register'];
    
    routes.forEach(route => {
      renderApp(route);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  it('handles protected routes correctly', () => {
    // Test that protected routes redirect when not authenticated
    renderApp('/favorites', false);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('maintains consistent layout structure', () => {
    renderApp();
    
    // Check that main layout elements are present
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    // Check that main content area exists
    const mainElement = document.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });
});