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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  Rating,
  Avatar,
  Divider,
  Paper,
  InputAdornment,
  IconButton,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Refresh as RefreshIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
    coverImageUrl?: string;
  };
}

const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [reviewsPerPage, setReviewsPerPage] = useState(10);

  useEffect(() => {
    loadReviews();
  }, [currentPage, searchQuery, ratingFilter, sortBy, reviewsPerPage]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: reviewsPerPage
      };

      if (searchQuery) {
        params.search = searchQuery;
      }
      if (ratingFilter) {
        params.minRating = ratingFilter;
      }
      if (sortBy) {
        params.sortBy = sortBy;
      }

      const response = await apiService.getReviews(params);
      
      if (response.success && response.data) {
        setReviews(response.data.reviews || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      setError('Failed to load reviews');
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadReviews();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadReviews();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setReviewsPerPage(size);
    setCurrentPage(1);
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}/profile`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const BookCard: React.FC<{ book: any }> = ({ book }) => (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      transition: 'all 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
      },
      borderRadius: 2,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      {book.coverImageUrl ? (
        <CardMedia
          component="img"
          height="200"
          image={book.coverImageUrl}
          alt={book.title}
          sx={{ 
            objectFit: 'cover',
            borderRadius: '8px 8px 0 0'
          }}
        />
      ) : (
        <Box
          sx={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            borderRadius: '8px 8px 0 0',
            p: 2
          }}
        >
          <Typography 
            variant="h6" 
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
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography 
          variant="h6" 
          component="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: 'white',
            fontSize: '1rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {book.title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1, 
            fontWeight: 'medium',
            color: 'rgba(255,255,255,0.8)'
          }}
        >
          by {book.author}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          size="small" 
          onClick={() => handleBookClick(book.id)}
          sx={{ 
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.2)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
            }
          }}
        >
          View Book
        </Button>
      </CardActions>
    </Card>
  );

  const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
    <Card sx={{ mb: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2 }}>
            <PersonIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {review.user.firstName} {review.user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{review.user.username}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating value={review.rating} precision={0.1} size="small" readOnly />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {review.rating}/5
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
          {review.reviewText}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BookIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {review.book.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                by {review.book.author}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {formatDate(review.createdAt)}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => handleBookClick(review.book.id)}>
          View Book
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" data-testid="reviews-page">
      <Box sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Recent Book Reviews
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Discover what readers are saying about their favorite books. Showing {totalCount} reviews with book details.
        </Typography>

        {/* Search and Filter Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch}>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Rating</InputLabel>
                <Select
                  value={ratingFilter}
                  onChange={(e) => {
                    setRatingFilter(e.target.value);
                    handleFilterChange();
                  }}
                  label="Rating"
                >
                  <MenuItem value="">All Ratings</MenuItem>
                  <MenuItem value="5">5 Stars</MenuItem>
                  <MenuItem value="4">4+ Stars</MenuItem>
                  <MenuItem value="3">3+ Stars</MenuItem>
                  <MenuItem value="2">2+ Stars</MenuItem>
                  <MenuItem value="1">1+ Stars</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    handleFilterChange();
                  }}
                  label="Sort By"
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="rating_high">Highest Rating</MenuItem>
                  <MenuItem value="rating_low">Lowest Rating</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Per Page</InputLabel>
                <Select
                  value={reviewsPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  label="Per Page"
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadReviews}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Reviews List */}
        {!loading && (
          <Box>
            {reviews.length > 0 ? (
              <>
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                
                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No reviews found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Be the first to write a review!
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ReviewsPage;
