import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props
}) => {
  const getMuiVariant = () => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'outlined';
      case 'danger':
        return 'contained';
      default:
        return 'contained';
    }
  };

  const getMuiSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'medium':
        return 'medium';
      case 'large':
        return 'large';
      default:
        return 'medium';
    }
  };

  const getColor = () => {
    if (variant === 'danger') return 'error';
    return 'primary';
  };

  return (
    <MuiButton
      variant={getMuiVariant()}
      size={getMuiSize()}
      color={getColor()}
      className={className}
      data-testid="button"
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
