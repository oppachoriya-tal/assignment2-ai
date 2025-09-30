import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';

// Mock the API service
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
  },
}));

// Create mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false, user: null }, action) => state,
    },
  });
};

const renderRegisterPage = () => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    </Provider>
  );
};

describe('RegisterPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders register page with correct structure', () => {
    renderRegisterPage();
    
    expect(screen.getByTestId('register-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText('Join our community of book lovers')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderRegisterPage();
    
    expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /last name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    expect(firstNameInput).toHaveValue('John');
    expect(lastNameInput).toHaveValue('Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('shows validation error for empty first name', async () => {
    renderRegisterPage();
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty last name', async () => {
    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    });
  });

  it('shows validation error for mismatched passwords', async () => {
    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('handles successful registration', async () => {
    const mockRegisterResponse = {
      success: true,
      message: 'Account created successfully',
    };

    const { register } = require('../../services/api').default;
    register.mockResolvedValue(mockRegisterResponse);

    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'john@example.com',
        password: 'password123',
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument();
      expect(screen.getByText('Your account has been created successfully. Redirecting to login...')).toBeInTheDocument();
    });
  });

  it('handles registration failure', async () => {
    const mockRegisterResponse = {
      success: false,
      message: 'Email already exists',
    };

    const { register } = require('../../services/api').default;
    register.mockResolvedValue(mockRegisterResponse);

    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    const { register } = require('../../services/api').default;
    register.mockRejectedValue(new Error('Network error'));

    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderRegisterPage();
    
    const passwordInput = screen.getByLabelText(/^password/i);
    const toggleButtons = screen.getAllByRole('button', { name: '' }); // Icon buttons without aria-labels
    const passwordToggleButton = toggleButtons[0]; // First toggle button
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(passwordToggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(passwordToggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('toggles confirm password visibility', () => {
    renderRegisterPage();
    
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const toggleButtons = screen.getAllByRole('button', { name: '' }); // Icon buttons without aria-labels
    const confirmToggleButton = toggleButtons[1]; // Second toggle button
    
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(confirmToggleButton);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(confirmToggleButton);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('shows loading state during registration', async () => {
    const { register } = require('../../services/api').default;
    register.mockReturnValue(new Promise(() => {})); // Never resolve

    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('closes error alert when close button is clicked', async () => {
    const mockRegisterResponse = {
      success: false,
      message: 'Email already exists',
    };

    const { register } = require('../../services/api').default;
    register.mockResolvedValue(mockRegisterResponse);

    renderRegisterPage();
    
    const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /last name/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Email already exists')).not.toBeInTheDocument();
  });

  it('has correct container structure', () => {
    renderRegisterPage();
    
    const container = screen.getByTestId('register-page');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('MuiContainer-root');
  });

  it('renders consistently', () => {
    const { container } = renderRegisterPage();
    expect(container.firstChild).toMatchSnapshot();
  });
});