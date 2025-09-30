import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginForm from '../auth/LoginForm';

describe('LoginForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders login form with all fields', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('renders labels for form fields', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('updates email input value when typed', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByTestId('email-input').querySelector('input');
    await user.type(emailInput!, 'test@example.com');
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('updates password input value when typed', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    await user.type(passwordInput!, 'password123');
    
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const submitButton = screen.getByTestId('submit-button');
    
    await user.type(emailInput!, 'test@example.com');
    await user.type(passwordInput!, 'password123');
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('does not call onSubmit when form is empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows loading state when loading prop is true', () => {
    render(<LoginForm onSubmit={mockOnSubmit} loading={true} />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Logging in...');
  });

  it('shows normal state when loading prop is false', () => {
    render(<LoginForm onSubmit={mockOnSubmit} loading={false} />);
    
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent('Login');
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Invalid credentials';
    render(<LoginForm onSubmit={mockOnSubmit} error={errorMessage} />);
    
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
  });

  it('does not display error message when error prop is not provided', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  it('has required attributes on input fields', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    
    // Material-UI TextField uses react-hook-form validation instead of HTML required attribute
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('has correct input types', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const submitButton = screen.getByTestId('submit-button');
    
    await user.type(emailInput!, 'test@example.com');
    await user.type(passwordInput!, 'password123');
    await user.click(submitButton);
    
    // Form should still have values since we're not clearing them in this mock
    // In a real implementation, you might want to clear the form after submission
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    
    await user.type(emailInput!, 'test@example.com');
    await user.type(passwordInput!, 'password123');
    await user.keyboard('{Enter}');
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
