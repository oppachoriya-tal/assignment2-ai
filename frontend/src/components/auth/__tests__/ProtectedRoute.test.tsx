import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from '../ProtectedRoute';

// Mock component to test protected route
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

// Create mock store
const createMockStore = (isAuthenticated = false) => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated, user: null }, action) => state,
    },
  });
};

const renderProtectedRoute = (isAuthenticated = false, initialRoute = '/protected') => {
  const store = createMockStore(isAuthenticated);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('ProtectedRoute Component', () => {
  it('renders protected content when user is authenticated', () => {
    renderProtectedRoute(true);
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('redirects to login page when user is not authenticated', () => {
    renderProtectedRoute(false);
    
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('handles authentication state changes correctly', () => {
    // Test initial unauthenticated state
    renderProtectedRoute(false);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    
    // Clean up and test authenticated state
    cleanup();
    renderProtectedRoute(true);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('renders children correctly when authenticated', () => {
    const CustomChild = () => <div data-testid="custom-child">Custom Child Component</div>;
    
    const store = createMockStore(true);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute>
                  <CustomChild />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });

  it('handles multiple children correctly', () => {
    const store = createMockStore(true);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute>
                  <div data-testid="child-1">Child 1</div>
                  <div data-testid="child-2">Child 2</div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });
});
