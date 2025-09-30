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
  Divider,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Stack,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  BookmarkAdd as BookmarkAddIcon,
  Bookmark as BookmarkIcon,
  Star as StarIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Language as LanguageIcon,
  LocalLibrary as LibraryIcon,
  Edit as EditIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Home as HomeIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  publisher?: string;
  language?: string;
  pageCount?: number;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInReadList, setIsInReadList] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    content: ''
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (id) {
      loadBookDetails();
      loadReviews();
      checkLoginStatus();
      checkReadListStatus();
    }
  }, [id]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  };

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBook(id!);
      
      if (response.success && response.data) {
        setBook(response.data);
      } else {
        setError('Book not found');
      }
    } catch (err) {
      setError('Failed to load book details');
      console.error('Error loading book:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await apiService.getReviews({ bookId: id });
      
      if (response.success && response.data) {
        setReviews(response.data.reviews || []);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const checkReadListStatus = () => {
    // Check if book is in user's read list
    const readList = JSON.parse(localStorage.getItem('readList') || '[]');
    setIsInReadList(readList.includes(id));
  };

  const handleAddToReadList = () => {
    const readList = JSON.parse(localStorage.getItem('readList') || '[]');
    if (isInReadList) {
      const updatedList = readList.filter((bookId: string) => bookId !== id);
      localStorage.setItem('readList', JSON.stringify(updatedList));
    } else {
      readList.push(id);
      localStorage.setItem('readList', JSON.stringify(readList));
    }
    setIsInReadList(!isInReadList);
  };


  const handleReviewSubmit = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const response = await apiService.createReview({
        bookId: id || "",
        rating: newReview.rating,
        reviewText: newReview.content
      });

      if (response.success) {
        setReviewDialogOpen(false);
        setNewReview({ rating: 5, content: '' });
        loadReviews(); // Reload reviews
        loadBookDetails(); // Reload book to update rating
      }
    } catch (err) {
      console.error('Error creating review:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" data-testid="book-detail-page">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !book) {
    return (
      <Container maxWidth="lg" data-testid="book-detail-page">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Book not found'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/books')}>
            Back to Books
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" data-testid="book-detail-page">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link component={RouterLink} to="/books" underline="hover" color="inherit">
            <MenuBookIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Books
          </Link>
          <Typography color="text.primary">{book.title}</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          {/* Left Column - Book Cover and Basic Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardMedia
                component="img"
                height="400"
                image={book.coverImageUrl || '/api/placeholder/300/400'}
                alt={book.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h5" component="h1" gutterBottom>
                  {book.title}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  by {book.author}
                </Typography>
                
                {/* Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={book.averageRating || 0} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {book.averageRating?.toFixed(1) || '0.0'} ({book.totalReviews || 0} reviews)
                  </Typography>
                </Box>

                {/* Genres */}
                <Box sx={{ mb: 2 }}>
                  {book.genres && book.genres.length > 0 ? (
                    book.genres.map((genre, index) => {
                      const genreName = typeof genre === 'string' ? genre : genre.name;
                      const genreKey = typeof genre === 'string' ? genre : genre.id;
                      return (
                        <Chip key={genreKey || index} label={genreName} size="small" sx={{ mr: 1, mb: 1 }} />
                      );
                    })
                  ) : (
                    <Chip label="General" size="small" sx={{ mr: 1, mb: 1 }} />
                  )}
                </Box>

                {/* Action Buttons */}
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={isInReadList ? <BookmarkIcon /> : <BookmarkAddIcon />}
                    onClick={handleAddToReadList}
                  >
                    {isInReadList ? 'Remove from Read List' : 'Add to Read List'}
                  </Button>
                  

                  {isLoggedIn && (
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<EditIcon />}
                      onClick={() => setReviewDialogOpen(true)}
                    >
                      Write a Review
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Book Details */}
          <Grid item xs={12} md={8}>
            {/* Publication Details */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Publication Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Published Year
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {book.publishedYear}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Author
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {book.author}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LibraryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Publisher
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {book.publisher || 'Not specified'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LanguageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Language
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {book.language || 'English'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MenuBookIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Pages
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {book.pageCount || 'Not specified'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <StarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Price
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    ${book.price?.toFixed(2) || 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Quick Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Summary
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {book.description || 'No description available.'}
              </Typography>
            </Paper>

            {/* Reviews Section */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Reviews ({book.totalReviews || 0})
              </Typography>
              
              {reviews.length > 0 ? (
                <List>
                  {reviews.map((review) => (
                    <ListItem key={review.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>
                              {review.user.firstName} {review.user.lastName}
                            </Typography>
                            <Rating value={review.rating} precision={0.1} size="small" readOnly />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {review.rating}/5
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {review.content}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(review.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No reviews yet. Be the first to write a review!
        </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Rating
        </Typography>
              <Rating
                value={newReview.rating}
                onChange={(event, newValue) => {
                  setNewReview({ ...newReview, rating: newValue || 5 });
                }}
                size="large"
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Review"
                value={newReview.content}
                onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                sx={{ mt: 2 }}
                placeholder="Share your thoughts about this book..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReviewSubmit} variant="contained">
              Submit Review
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default BookDetailPage;
