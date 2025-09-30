import React from 'react';
import { render } from '@testing-library/react';
import { AppContainer } from '../App.styles';

describe('App.styles', () => {
  it('renders AppContainer with correct styles', () => {
    const { container } = render(
      <AppContainer data-testid="app-container">
        <div>Test content</div>
      </AppContainer>
    );
    
    const appContainer = container.firstChild as HTMLElement;
    expect(appContainer).toBeInTheDocument();
    expect(appContainer).toHaveStyle({
      display: 'flex',
      'flex-direction': 'column',
      'min-height': '100vh'
    });
  });

  it('applies flex layout correctly', () => {
    const { container } = render(
      <AppContainer>
        <div>Child 1</div>
        <div>Child 2</div>
      </AppContainer>
    );
    
    const appContainer = container.firstChild as HTMLElement;
    expect(appContainer).toHaveStyle({
      display: 'flex',
      'flex-direction': 'column'
    });
  });

  it('maintains full viewport height', () => {
    const { container } = render(
      <AppContainer>
        <div>Content</div>
      </AppContainer>
    );
    
    const appContainer = container.firstChild as HTMLElement;
    expect(appContainer).toHaveStyle({
      'min-height': '100vh'
    });
  });
});
