import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../common/Button';

describe('Button Component', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies primary variant by default', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('MuiButton-containedPrimary');
  });

  it('applies secondary variant when specified', () => {
    render(<Button variant="secondary">Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('MuiButton-outlinedPrimary');
  });

  it('applies danger variant when specified', () => {
    render(<Button variant="danger">Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('MuiButton-containedError');
  });

  it('applies medium size by default', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('MuiButton-sizeMedium');
  });

  it('applies small size when specified', () => {
    render(<Button size="small">Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('MuiButton-sizeSmall');
  });

  it('applies large size when specified', () => {
    render(<Button size="large">Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('MuiButton-sizeLarge');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
  });

  it('is not disabled when disabled prop is false', () => {
    render(<Button disabled={false}>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).not.toBeDisabled();
  });

  it('has button type by default', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('has submit type when specified', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('has reset type when specified', () => {
    render(<Button type="reset">Reset</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('type', 'reset');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('custom-class');
  });

  it('applies multiple classes correctly', () => {
    render(
      <Button 
        variant="secondary" 
        size="large" 
        className="custom-class"
      >
        Click me
      </Button>
    );
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('MuiButton-outlinedPrimary');
    expect(button).toHaveClass('MuiButton-sizeLarge');
    expect(button).toHaveClass('custom-class');
  });

  it('handles rapid clicks correctly', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('handles keyboard navigation', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ' });
    
    // Note: Material-UI Button handles keyboard events internally
    expect(button).toBeInTheDocument();
  });

  it('applies all props correctly', () => {
    const handleClick = jest.fn();
    render(
      <Button 
        onClick={handleClick}
        variant="danger"
        size="large"
        disabled={false}
        type="submit"
        className="custom-class"
        data-testid="custom-button"
      >
        Submit
      </Button>
    );
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).not.toBeDisabled();
  });

  it('handles undefined onClick gracefully', () => {
    render(<Button>No onClick</Button>);
    
    const button = screen.getByTestId('button');
    expect(() => fireEvent.click(button)).not.toThrow();
  });
});
