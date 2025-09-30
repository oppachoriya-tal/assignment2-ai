import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Rating,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Favorite as FavoriteIcon, Book as BookIcon } from '@mui/icons-material';
import apiService from '../services/api';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl: string;
  isbn: string;
  publishedYear: number;
  genres: Array<{id: string; name: string; description?: string}> | string[];
  averageRating: number;
  totalReviews: number;
  price: number;
  totalFavorites: number;
}

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
    loadFavoriteBooks();
  }, []);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
    
    if (!token) {
      navigate('/login');
    }
  };

  const loadFavoriteBooks = async () => {
    try {
      setLoading(true);
      
      // Get favorite book IDs from localStorage
      const favoriteIds = JSON.parse(localStorage.getItem('readList') || '[]');
      
      if (favoriteIds.length === 0) {
        setFavoriteBooks([]);
        return;
      }

      // Fetch book details for each favorite
      const bookPromises = favoriteIds.map(async (bookId: string) => {
        try {
          const response = await apiService.getBook(bookId);
          return response.success ? response.data : null;
        } catch (err) {
          console.error(`Error fetching book ${bookId}:`, err);
          return null;
        }
      });

      const books = await Promise.all(bookPromises);
      const validBooks = books.filter(book => book !== null);
      
      setFavoriteBooks(validBooks);
    } catch (err) {
      setError('Failed to load favorite books');
      console.error('Error loading favorite books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (bookId: string) => {
    const favoriteIds = JSON.parse(localStorage.getItem('readList') || '[]');
    const updatedFavorites = favoriteIds.filter((id: string) => id !== bookId);
    localStorage.setItem('readList', JSON.stringify(updatedFavorites));
    setFavoriteBooks(prev => prev.filter(book => book.id !== bookId));
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const BookCard: React.FC<{ book: Book }> = ({ book }) => (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      transition: 'all 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
      },
      borderRadius: 4,
      boxShadow: '0 6px 25px rgba(0,0,0,0.1)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Gradient overlay for better text readability */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
          zIndex: 1
        }}
      />
      
      {book.coverImageUrl ? (
        <CardMedia
          component="img"
          height="280"
          image={book.coverImageUrl}
          alt={book.title}
          sx={{ 
            objectFit: 'cover',
            borderRadius: '16px 16px 0 0',
            position: 'relative',
            zIndex: 2
          }}
        />
      ) : (
        <Box
          sx={{
            height: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            borderRadius: '16px 16px 0 0',
            p: 3,
            position: 'relative',
            zIndex: 2
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              textAlign: 'center', 
              fontWeight: 'bold',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              lineHeight: 1.2
            }}
          >
            {book.title}
          </Typography>
        </Box>
      )}
      
      <CardContent sx={{ 
        flexGrow: 1, 
        p: 3, 
        position: 'relative', 
        zIndex: 2,
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <Typography 
          variant="h6" 
          component="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: 'white',
            fontSize: '1.2rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          {book.title}
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 2, 
            fontWeight: 'medium',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '0.95rem'
          }}
        >
          by {book.author}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2,
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.9rem'
          }}
        >
          Published: {book.publishedYear}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Rating 
            value={book.averageRating || 0} 
            precision={0.1} 
            size="small" 
            readOnly 
            sx={{ 
              '& .MuiRating-iconFilled': { color: '#ffd700' },
              '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.3)' }
            }}
          />
          <Typography variant="body2" sx={{ ml: 1, color: 'rgba(255,255,255,0.9)' }}>
            ({book.totalReviews || 0} reviews)
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {book.genres && book.genres.length > 0 ? (
            book.genres.slice(0, 2).map((genre, index) => {
              const genreName = typeof genre === 'string' ? genre : genre.name;
              const genreKey = typeof genre === 'string' ? genre : genre.id;
              return (
                <Chip 
                  key={genreKey || index} 
                  label={genreName} 
                  size="small" 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    fontSize: '0.75rem',
                    height: 24,
                    fontWeight: 'medium',
                    backdropFilter: 'blur(5px)'
                  }} 
                />
              );
            })
          ) : (
            <Chip 
              label="General" 
              size="small" 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontSize: '0.75rem',
                height: 24,
                fontWeight: 'medium',
                backdropFilter: 'blur(5px)'
              }} 
            />
          )}
        </Box>
      </CardContent>
      
      <CardActions sx={{ 
        p: 3, 
        pt: 0, 
        position: 'relative', 
        zIndex: 2,
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <Button 
          size="medium" 
          onClick={() => handleBookClick(book.id)}
          sx={{ 
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 'medium',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          View Details
        </Button>
        <Button 
          size="medium" 
          onClick={() => handleRemoveFavorite(book.id)}
          startIcon={<FavoriteIcon />}
          sx={{ 
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 'medium',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Remove
        </Button>
      </CardActions>
    </Card>
  );

  if (!isLoggedIn) {
    return null; // Will redirect to login
  }

  return (
    <Container maxWidth="lg" data-testid="favorites-page">
      <Box sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          <FavoriteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          My Favorite Books
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your personal collection of favorite books
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : favoriteBooks.length > 0 ? (
          <Grid container spacing={3}>
            {favoriteBooks.map((book) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                <BookCard book={book} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Favorite Books Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start exploring books and add them to your favorites!
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/books')}
              startIcon={<BookIcon />}
            >
              Browse Books
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default FavoritesPage;
