import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import UserProfilePage from '../UserProfilePage';
import { store } from '../../store/store';

const renderUserProfilePage = () => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    </Provider>
  );
};

describe('UserProfilePage', () => {
  it('should render user profile page', () => {
    renderUserProfilePage();
    
    expect(screen.getByTestId('user-profile-page')).toBeInTheDocument();
    expect(screen.getByText(/User Profile Page for ID:/)).toBeInTheDocument();
    expect(screen.getByText('Details of a specific user profile will be displayed here.')).toBeInTheDocument();
  });

  it('should have correct heading', () => {
    renderUserProfilePage();
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/User Profile Page for ID:/);
  });

  it('should have correct container structure', () => {
    renderUserProfilePage();
    
    const container = screen.getByTestId('user-profile-page');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('MuiContainer-root');
  });
});