import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  loading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, loading = false, error }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const handleFormSubmit = (data: LoginFormData) => {
    onSubmit(data);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      data-testid="login-form"
      sx={{ maxWidth: 400, mx: 'auto', p: 3 }}
    >
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Login
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="error-message">
          {error}
        </Alert>
      )}

      <TextField
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          },
        })}
        label="Email"
        type="email"
        fullWidth
        margin="normal"
        error={!!errors.email}
        helperText={errors.email?.message}
        data-testid="email-input"
      />

      <TextField
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters',
          },
        })}
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        error={!!errors.password}
        helperText={errors.password?.message}
        data-testid="password-input"
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={loading}
        sx={{ mt: 3 }}
        data-testid="submit-button"
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            Logging in...
          </Box>
        ) : (
          'Login'
        )}
      </Button>
    </Box>
  );
};

export default LoginForm;
