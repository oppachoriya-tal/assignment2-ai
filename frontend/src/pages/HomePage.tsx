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
  Tabs,
  Tab,
  IconButton,
  Rating,
  InputAdornment,
  Paper,
  Pagination,
  Stack,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  FilterList as FilterIcon
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
      id={`home-tabpanel-${index}`}
      aria-labelledby={`home-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const HomePage: React.FC = () => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(24);
  const [ratingFilter, setRatingFilter] = useState('');
  // AI Recommended tab query state
  const [aiQuery, setAiQuery] = useState('');
  const sampleQueries = [
    'I love fast-paced sci‑fi with 4.5+ stars',
    'Cozy mystery with witty dialogue and strong heroine',
    'Epic fantasy like LOTR but more character-driven',
    'Short, uplifting non‑fiction about habits and focus',
    'Modern romance with slow burn and realistic characters'
  ];

  useEffect(() => {
    loadBooks();
    loadGenres();
  }, [currentPage, searchQuery, selectedGenre, sortBy, ratingFilter, booksPerPage]);

  useEffect(() => {
    if (currentTab === 1) {
      // Don't load recommendations automatically - wait for user query
      setRecommendedBooks([]);
    }
  }, [currentTab]);


  const loadBooks = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: booksPerPage,
        search: searchQuery,
        genre: selectedGenre,
        sortBy
      };

      // Add rating filter if selected
      if (ratingFilter) {
        params.minRating = ratingFilter;
      }

      const response = await apiService.getBooks(params);
      
      if (response.success && response.data) {
        setBooks(response.data.books || []);
        setTotalPages(response.data.pagination?.pages || 1);
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
        limit: 50, // Increased limit to show more trending books
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

  const loadRecommendations = async (query?: string) => {
    try {
      setLoading(true);
      
      // Use provided query or AI query, but require at least some input
      const searchQuery = query || aiQuery.trim();
      if (!searchQuery) {
        setError('Please enter a query to get AI recommendations');
        setLoading(false);
        return;
      }
      
      // Call the AI recommendations endpoint with limit 5
      const response = await apiService.getAIRecommendations(searchQuery, 5);
      
      if (response.success && response.data?.recommendations) {
        setRecommendedBooks(response.data.recommendations);
        setError(null);
      } else {
        setError('Failed to get AI recommendations. Please try again.');
        setRecommendedBooks([]);
      }
    } catch (err) {
      console.error('Error loading AI recommendations:', err);
      setError('Failed to get AI recommendations. Please try again.');
      setRecommendedBooks([]);
    } finally {
      setLoading(false);
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
    setCurrentPage(1);
    loadBooks();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadBooks();
  };

  const handlePageSizeChange = (newSize: number) => {
    setBooksPerPage(newSize);
    setCurrentPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
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
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" data-testid="home-page">
      {/* Hero Section */}
      <Box sx={{ py: 6, textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          📚 BookReview
        </Typography>
        <Typography variant="h4" component="p" color="text.secondary" sx={{ mb: 3 }}>
          Discover Your Next Favorite Book
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Explore our vast collection of books, read reviews from fellow readers, and get AI-powered recommendations tailored just for you.
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Find Your Perfect Book
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search books, authors, or genres..."
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
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="author">Author</MenuItem>
                <MenuItem value="publishedYear">Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadBooks}
              sx={{ height: '56px' }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="All Books" />
          <Tab label="AI Recommended" />
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
        
        {/* Pagination Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Show:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={booksPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              books per page
            </Typography>
          </Box>
          
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          )}
        </Box>

        {books.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No books found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* AI Recommended Tab */}
      <TabPanel value={currentTab} index={1}>
        <Typography variant="h4" gutterBottom>
          AI Recommended Books
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Top 5 books selected by our AI algorithm based on ratings, reviews, and content quality.
        </Typography>

        {/* Gemini-driven sample queries and textbox */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Describe what you want to read (e.g., ‘hard sci‑fi with deep worldbuilding’)"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // For now we trigger the same recommendations loader; backend uses user profile + Gemini
                    loadRecommendations();
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button variant="contained" onClick={() => loadRecommendations()} sx={{ textTransform: 'none' }}>
                  Get AI Picks
                </Button>
                <Button variant="outlined" onClick={() => setAiQuery('')} sx={{ textTransform: 'none' }}>
                  Clear
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {sampleQueries.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    onClick={() => {
                      setAiQuery(q);
                      // Trigger load with selected query
                      loadRecommendations(q);
                    }}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : recommendedBooks.length > 0 ? (
          <Grid container spacing={3}>
            {recommendedBooks.map((book) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={book.id}>
                <BookCard book={book} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Loading AI recommendations...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Our AI is analyzing books to find the best recommendations
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Quick Stats */}
      <Paper sx={{ p: 3, mt: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Why Choose BookReview?
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Trusted Reviews
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Read honest reviews from real readers before you buy
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Community Reviews
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join our community of readers and share your thoughts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <TrendingIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Trending Books
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Discover what's popular and trending in the reading community
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default HomePage;
