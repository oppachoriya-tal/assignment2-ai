import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { CustomThemeProvider } from './contexts/ThemeContext';

// Pages
import HomePage from './pages/HomePage';
import BooksPage from './pages/BooksPage';
import BookDetailPage from './pages/BookDetailPage';
import ReviewsPage from './pages/ReviewsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import NotFoundPage from './pages/NotFoundPage';

// Styles
import { AppContainer } from './App.styles';

function App() {
  return (
    <CustomThemeProvider>
      <AppContainer>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, minHeight: 'calc(100vh - 64px)' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/books/:id" element={<BookDetailPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/users/:id/profile" element={<UserProfilePage />} />
            
            {/* Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Box>
        <Footer />
      </AppContainer>
    </CustomThemeProvider>
  );
}

export default App;
