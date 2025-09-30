import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

// Mock the API service
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Create mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false, user: null }, action) => state,
    },
  });
};

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login page with correct structure', () => {
    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
  });

  it('renders login form with email and password inputs', () => {
    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('shows validation error for empty form submission', async () => {
    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

          it('handles successful login', async () => {
            const mockLoginResponse = {
              success: true,
              data: {
                tokens: {
                  accessToken: 'mock-access-token',
                  refreshToken: 'mock-refresh-token',
                },
              },
            };

            const { login } = require('../../services/api').default;
            login.mockResolvedValue(mockLoginResponse);

            const store = createMockStore();
            render(
              <MemoryRouter>
                <Provider store={store}>
                  <LoginPage />
                </Provider>
              </MemoryRouter>
            );
            
            const emailInput = screen.getByRole('textbox', { name: /email/i });
            const passwordInput = screen.getByLabelText(/password/i);
            const submitButton = screen.getByRole('button', { name: 'Sign In' });
            
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);
            
            await waitFor(() => {
              expect(login).toHaveBeenCalledWith({
                username: 'test@example.com',
                password: 'password123',
              });
            });
            
            await waitFor(() => {
              expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token');
              expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
            });
          });

  it('handles login failure', async () => {
    const mockLoginResponse = {
      success: false,
      message: 'Invalid credentials',
    };

    const { login } = require('../../services/api').default;
    login.mockResolvedValue(mockLoginResponse);

    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    const { login } = require('../../services/api').default;
    login.mockRejectedValue(new Error('Network error'));

    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: '' }); // Icon button without aria-label
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows loading state during login', async () => {
    const { login } = require('../../services/api').default;
    login.mockReturnValue(new Promise(() => {})); // Never resolve

    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('closes error alert when close button is clicked', async () => {
    const mockLoginResponse = {
      success: false,
      message: 'Invalid credentials',
    };

    const { login } = require('../../services/api').default;
    login.mockResolvedValue(mockLoginResponse);

    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
  });

  it('has correct container structure', () => {
    const store = createMockStore();
    render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    
    const container = screen.getByTestId('login-page');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('MuiContainer-root');
  });

  it('renders consistently', () => {
    const store = createMockStore();
    const { container } = render(
      <MemoryRouter>
        <Provider store={store}>
          <LoginPage />
        </Provider>
      </MemoryRouter>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
