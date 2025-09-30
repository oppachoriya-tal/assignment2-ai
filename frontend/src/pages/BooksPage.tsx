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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField as MuiTextField,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Rating,
  InputAdornment,
  Paper,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`books-tabpanel-${index}`}
      aria-labelledby={`books-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const BooksPage: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [currentTab, setCurrentTab] = useState(0);
  const [genres, setGenres] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    publishedYear: new Date().getFullYear(),
    coverImageUrl: '',
    description: ''
  });

  useEffect(() => {
    loadBooks();
    loadGenres();
  }, []);

  useEffect(() => {
    if (currentTab === 1) {
      loadTrendingBooks();
    }
  }, [currentTab]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBooks({
        page: 1,
        limit: 200, // Increased limit to show more books
        search: searchQuery,
        genre: selectedGenre,
        sortBy
      });
      
      if (response.success && response.data) {
        setBooks(response.data.books || []);
      }
    } catch (err) {
      setError('Failed to load books');
      console.error('Error loading books:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingBooks = async () => {
    try {
      const response = await apiService.getBooks({
        page: 1,
        limit: 200, // Increased limit to show more trending books
        sortBy: 'title'
      });
      
      if (response.success && response.data) {
        // Sort by rating on the frontend since backend doesn't support it
        const books = response.data.books || [];
        const sortedBooks = books.sort((a: Book, b: Book) => (b.averageRating || 0) - (a.averageRating || 0));
        setTrendingBooks(sortedBooks);
      }
    } catch (err) {
      console.error('Error loading trending books:', err);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await apiService.getRecommendations();
      if (response.success && response.data) {
        setRecommendedBooks(response.data.recommendations || []);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const loadGenres = async () => {
    try {
      const response = await apiService.getGenres();
      if (response.success && response.data) {
        setGenres(response.data.map((g: any) => g.name));
      }
    } catch (err) {
      console.error('Error loading genres:', err);
    }
  };

  const handleSearch = () => {
    loadBooks();
  };

  const handleFilterChange = () => {
    loadBooks();
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
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)',
      '&:hover': { 
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        border: '1px solid rgba(0,0,0,0.1)'
      }
    }}>
      <CardMedia
        component="img"
        height="240"
        image={book.coverImageUrl || '/api/placeholder/200/300'}
        alt={book.title}
        sx={{ 
          objectFit: 'cover',
          borderRadius: '12px 12px 0 0'
        }}
      />
      <CardContent sx={{ 
        flexGrow: 1, 
        p: 3,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography variant="h6" component="h3" gutterBottom sx={{
          fontWeight: 600,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{
          fontWeight: 500,
          mb: 1
        }}>
          by {book.author}
        </Typography>
        <Typography variant="body2" sx={{ 
          mb: 2,
          color: 'text.secondary',
          fontSize: '0.875rem'
        }}>
          {book.publishedYear}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Rating value={book.averageRating || 0} precision={0.1} size="small" readOnly />
          <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
            ({book.totalReviews || 0} reviews)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto' }}>
          {book.genres?.slice(0, 3).map((genre, index) => {
            const genreName = typeof genre === 'string' ? genre : genre.name;
            const genreKey = typeof genre === 'string' ? genre : genre.id;
            return (
              <Chip 
                key={genreKey || index} 
                label={genreName} 
                size="small" 
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  borderRadius: 2
                }}
              />
            );
          })}
        </Box>
      </CardContent>
      <CardActions sx={{ p: 3, pt: 0 }}>
        <Button 
          size="medium" 
          onClick={() => handleBookClick(book.id)}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1
          }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" data-testid="books-page">
      <Box sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Discover Books
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Explore our collection of books, find trending titles, and get AI-powered recommendations
        </Typography>

        {/* Search and Filter Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search books..."
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={selectedGenre}
                  onChange={(e) => {
                    setSelectedGenre(e.target.value);
                    handleFilterChange();
                  }}
                  label="Genre"
                >
                  <MenuItem value="">All Genres</MenuItem>
                  {genres.map((genre) => (
                    <MenuItem key={genre} value={genre}>
                      {genre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
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
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="author">Author</MenuItem>
                  <MenuItem value="publishedYear">Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadBooks}
              >
                Refresh
              </Button>
            </Grid>
            <Grid item xs={12} md={'auto' as any}>
              <Button variant="contained" onClick={() => setAddOpen(true)} sx={{ textTransform: 'none' }}>
                Add New Book
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="All Books" />
            <Tab 
              label="Trending" 
              icon={<TrendingIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

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

        {/* All Books Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {books.map((book) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                <BookCard book={book} />
              </Grid>
            ))}
          </Grid>
          {books.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No books found
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Trending Books Tab */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h4" gutterBottom>
            <TrendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Trending Books
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Most popular and highly-rated books
          </Typography>
          <Grid container spacing={3}>
            {trendingBooks.map((book) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                <BookCard book={book} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

      </Box>

      {/* Add Book Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Add New Book</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <MuiTextField
              label="Title"
              fullWidth
              value={newBook.title}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MuiTextField
              label="Author"
              fullWidth
              value={newBook.author}
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MuiTextField
              label="Published Year"
              type="number"
              fullWidth
              value={newBook.publishedYear}
              onChange={(e) => setNewBook({ ...newBook, publishedYear: parseInt(e.target.value || '0', 10) })}
            />
          </Grid>
          <Grid item xs={12}>
            <MuiTextField
              label="Cover Image URL"
              fullWidth
              value={newBook.coverImageUrl}
              onChange={(e) => setNewBook({ ...newBook, coverImageUrl: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <MuiTextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              value={newBook.description}
              onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAddOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={async () => {
            try {
              const payload: any = {
                title: newBook.title,
                author: newBook.author,
                description: newBook.description,
                coverImageUrl: newBook.coverImageUrl || undefined,
                publishedYear: newBook.publishedYear,
              };
              const res = await apiService.createBook(payload);
              if (res.success) {
                setAddOpen(false);
                setNewBook({ title: '', author: '', publishedYear: new Date().getFullYear(), coverImageUrl: '', description: '' });
                await loadBooks();
              }
            } catch (e) {
              console.error('Failed to add book', e);
            }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
    </Container>
  );
};

export default BooksPage;
