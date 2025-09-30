import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Tooltip,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mode, toggleColorMode } = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  // Use Redux state instead of local state
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  // Get username from Redux state
  const username = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email) : null;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local storage and redirect, even if API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Dispatch logout action to Redux
      dispatch(logout());
      
      handleMenuClose();
      navigate('/');
    }
  };

  return (
    <AppBar position="static" data-testid="navbar">
      <Toolbar>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 'bold'
          }}
        >
          📚 BookReview
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/books"
            data-testid="books-link"
          >
            Books
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/reviews"
            data-testid="reviews-link"
          >
            Reviews
          </Button>
          
          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton color="inherit" onClick={toggleColorMode}>
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Auth Section */}
          {isAuthenticated ? (
            <>
              <Button 
                color="inherit" 
                component={Link} 
                to="/favorites"
                data-testid="favorites-link"
                startIcon={<FavoriteIcon />}
              >
                My Favorites
              </Button>
              {username && (
                <Typography variant="body2" sx={{ mx: 1, opacity: 0.9 }}>
                  {username}
                </Typography>
              )}
              <Tooltip title="Account">
                <IconButton
                  color="inherit"
                  onClick={handleMenuOpen}
                  data-testid="account-menu"
                >
                  <AccountIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                component={Link} 
                to="/login"
                data-testid="login-link"
              >
                Login
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/register"
                data-testid="register-link"
                variant="outlined"
                sx={{ 
                  borderColor: 'inherit',
                  '&:hover': {
                    borderColor: 'inherit',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;