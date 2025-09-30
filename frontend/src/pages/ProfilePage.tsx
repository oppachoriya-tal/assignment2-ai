import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Grid, 
  Rating, 
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Stack,
  Badge,
  LinearProgress,
  Fade,
  Zoom,
  Button,
  CardMedia,
  CardActionArea,
  Tooltip,
  Skeleton
} from '@mui/material';
import { 
  Person as PersonIcon,
  Favorite as FavoriteIcon,
  Star as StarIcon,
  Book as BookIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  MoreVert as MoreVertIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  lastLogin?: string;
}

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    coverImageUrl?: string;
  };
}

interface Favorite {
  id: string;
  title: string;
  author: string;
  coverImageUrl?: string;
  averageRating: number;
  totalReviews: number;
  addedToFavorites: string;
}

interface ProfileData {
  user: User;
  reviews: Review[];
  totalReviews: number;
  favorites: Favorite[];
  totalFavorites: number;
}

const ProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await apiService.makeRequest<ProfileData>('/v1/users/profile');
      
      if (response.success && response.data) {
        setProfileData(response.data);
      } else {
        setError('Failed to load profile data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
      <Container maxWidth="lg" data-testid="profile-page">
        <Box sx={{ py: 4 }}>
          <Stack spacing={3}>
            {/* Profile Header Skeleton */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Skeleton variant="circular" width={100} height={100} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={40} />
                    <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Skeleton variant="rounded" width={120} height={32} />
                      <Skeleton variant="rounded" width={120} height={32} />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            
            {/* Stats Skeleton */}
            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 2 }} />
                      <Skeleton variant="text" width="30%" height={32} sx={{ mx: 'auto' }} />
                      <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto' }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Content Skeleton */}
            <Card sx={{ borderRadius: 3 }}>
              <Skeleton variant="rectangular" height={48} />
              <Box sx={{ p: 3 }}>
                <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              </Box>
            </Card>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" data-testid="profile-page">
        <Box sx={{ py: 4 }}>
          <Fade in>
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 3,
                '& .MuiAlert-message': {
                  fontSize: '1.1rem'
                }
              }}
              action={
                <Button color="inherit" size="small" onClick={loadProfileData}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </Fade>
        </Box>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container maxWidth="lg" data-testid="profile-page">
        <Box sx={{ py: 4 }}>
          <Fade in>
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 3,
                '& .MuiAlert-message': {
                  fontSize: '1.1rem'
                }
              }}
            >
              No profile data available
            </Alert>
          </Fade>
        </Box>
      </Container>
    );
  }

  const { user, reviews, totalReviews, favorites, totalFavorites } = profileData;

  return (
    <Container maxWidth="lg" data-testid="profile-page">
      <Box sx={{ py: 4 }}>
        {/* Profile Header */}
        <Fade in timeout={800}>
          <Card 
            sx={{ 
              mb: 4, 
              borderRadius: 4, 
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.1)',
                backdropFilter: 'blur(1px)'
              }}
            />
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Stack direction="row" spacing={4} alignItems="center">
                <Zoom in timeout={1000}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: '#4caf50',
                          border: '3px solid white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
                          ✓
                        </Typography>
                      </Box>
                    }
                  >
                    <Avatar
                      src={user.avatarUrl || undefined}
                      sx={{ 
                        width: 120, 
                        height: 120,
                        border: '4px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                      }}
                    >
                      {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                    </Avatar>
                  </Badge>
                </Zoom>
                
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 700,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      mb: 1
                    }}
                  >
                    {user.firstName} {user.lastName}
                  </Typography>
                  
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Chip
                      icon={<PersonIcon />}
                      label={`@${user.username}`}
                      variant="filled"
                      size="medium"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                    <Chip
                      icon={<LanguageIcon />}
                      label="English"
                      variant="outlined"
                      size="small"
                      sx={{ 
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                  </Stack>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 2,
                      opacity: 0.9,
                      fontSize: '1.1rem'
                    }}
                  >
                    {user.email}
                  </Typography>
                  
                  {user.bio && (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mb: 3,
                        opacity: 0.95,
                        fontSize: '1.1rem',
                        lineHeight: 1.6,
                        fontStyle: 'italic'
                      }}
                    >
                      "{user.bio}"
                    </Typography>
                  )}
                  
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Chip
                      icon={<CalendarIcon />}
                      label={`Joined ${formatDate(user.createdAt)}`}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                    {user.lastLogin && (
                      <Chip
                        icon={<VisibilityIcon />}
                        label={`Last active ${formatDate(user.lastLogin)}`}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          borderColor: 'rgba(255,255,255,0.5)',
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    )}
                  </Stack>
                </Box>
                
                <Stack spacing={1}>
                  <Tooltip title="Edit Profile">
                    <IconButton 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share Profile">
                    <IconButton 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in timeout={1200}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(255, 107, 107, 0.3)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    opacity: 0.3
                  }}
                />
                <CardContent sx={{ textAlign: 'center', p: 3, position: 'relative' }}>
                  <StarIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {totalReviews}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.95rem' }}>
                    Reviews Written
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in timeout={1400}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(72, 52, 212, 0.3)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    opacity: 0.3
                  }}
                />
                <CardContent sx={{ textAlign: 'center', p: 3, position: 'relative' }}>
                  <FavoriteIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {totalFavorites}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.95rem' }}>
                    Favorite Books
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in timeout={1600}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 210, 211, 0.3)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    opacity: 0.3
                  }}
                />
                <CardContent sx={{ textAlign: 'center', p: 3, position: 'relative' }}>
                  <TrendingUpIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.95rem' }}>
                    Avg Rating Given
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in timeout={1800}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(255, 159, 243, 0.3)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    opacity: 0.3
                  }}
                />
                <CardContent sx={{ textAlign: 'center', p: 3, position: 'relative' }}>
                  <SchoolIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    USER
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.95rem' }}>
                    Member Since
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Tabs for Reviews and Favorites */}
        <Fade in timeout={2000}>
          <Paper 
            sx={{ 
              width: '100%',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="profile tabs"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  py: 2,
                  px: 3,
                  minHeight: 60
                },
                '& .Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 700
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab 
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CommentIcon />
                    <span>Reviews ({totalReviews})</span>
                  </Stack>
                } 
              />
              <Tab 
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FavoriteIcon />
                    <span>Favorites ({totalFavorites})</span>
                  </Stack>
                } 
              />
            </Tabs>
            
            <Box sx={{ p: 4 }}>
              {/* Reviews Tab */}
              {activeTab === 0 && (
                <Fade in timeout={300}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Recent Reviews
                      </Typography>
                      <Chip
                        label={`${reviews.length} total`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                    
                    {reviews.length === 0 ? (
                      <Box 
                        sx={{ 
                          textAlign: 'center', 
                          py: 8,
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          borderRadius: 3,
                          border: '2px dashed #ccc'
                        }}
                      >
                        <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No reviews yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Start reviewing books to see them here!
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={3}>
                        {reviews.map((review, index) => (
                          <Card 
                            key={review.id}
                            sx={{ 
                              borderRadius: 3,
                              overflow: 'hidden',
                              border: '1px solid #e0e0e0',
                              '&:hover': {
                                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                                transform: 'translateY(-2px)',
                                transition: 'all 0.3s ease'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Stack direction="row" spacing={3}>
                                <Avatar
                                  src={review.book.coverImageUrl}
                                  sx={{ 
                                    width: 80, 
                                    height: 120,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                  }}
                                >
                                  <BookIcon sx={{ fontSize: 40 }} />
                                </Avatar>
                                
                                <Box sx={{ flex: 1 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                    <Box>
                                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        {review.book.title}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        by {review.book.author}
                                      </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Rating value={review.rating} readOnly size="small" />
                                      <Typography variant="body2" color="text.secondary">
                                        {review.rating}/5
                                      </Typography>
                                    </Stack>
                                  </Stack>
                                  
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      mb: 2,
                                      lineHeight: 1.6,
                                      color: 'text.primary'
                                    }}
                                  >
                                    {review.reviewText}
                                  </Typography>
                                  
                                  <Stack direction="row" spacing={2} alignItems="center">
                                    <Chip
                                      icon={<CalendarIcon />}
                                      label={formatDate(review.createdAt)}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Box sx={{ flex: 1 }} />
                                    <Stack direction="row" spacing={1}>
                                      <Tooltip title="Helpful">
                                        <IconButton size="small">
                                          <ThumbUpIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Share">
                                        <IconButton size="small">
                                          <ShareIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="More">
                                        <IconButton size="small">
                                          <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </Stack>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Fade>
              )}

              {/* Favorites Tab */}
              {activeTab === 1 && (
                <Fade in timeout={300}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Favorite Books
                      </Typography>
                      <Chip
                        label={`${favorites.length} total`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Stack>
                    
                    {favorites.length === 0 ? (
                      <Box 
                        sx={{ 
                          textAlign: 'center', 
                          py: 8,
                          background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
                          borderRadius: 3,
                          border: '2px dashed #e17055'
                        }}
                      >
                        <FavoriteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No favorite books yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add books to your favorites to see them here!
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={3}>
                        {favorites.map((favorite, index) => (
                          <Grid item xs={12} sm={6} md={4} key={favorite.id}>
                            <Zoom in timeout={400 + index * 100}>
                              <Card 
                                sx={{ 
                                  height: '100%',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  border: '1px solid #e0e0e0',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                                    transform: 'translateY(-4px)',
                                    '& .book-cover': {
                                      transform: 'scale(1.05)'
                                    }
                                  }
                                }}
                              >
                                <CardActionArea sx={{ height: '100%' }}>
                                  <CardContent sx={{ p: 3 }}>
                                    <Stack spacing={2}>
                                      <Box sx={{ position: 'relative', textAlign: 'center' }}>
                                        <Avatar
                                          src={favorite.coverImageUrl}
                                          className="book-cover"
                                          sx={{ 
                                            width: 120, 
                                            height: 160, 
                                            mx: 'auto',
                                            borderRadius: 2,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                            transition: 'transform 0.3s ease'
                                          }}
                                        >
                                          <BookIcon sx={{ fontSize: 48 }} />
                                        </Avatar>
                                        <Chip
                                          label="Favorited"
                                          size="small"
                                          color="secondary"
                                          sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            bgcolor: 'rgba(255,255,255,0.9)',
                                            backdropFilter: 'blur(10px)'
                                          }}
                                        />
                                      </Box>
                                      
                                      <Box>
                                        <Typography 
                                          variant="h6" 
                                          sx={{ 
                                            fontWeight: 600, 
                                            mb: 1,
                                            lineHeight: 1.3,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                          }}
                                        >
                                          {favorite.title}
                                        </Typography>
                                        
                                        <Typography 
                                          variant="body2" 
                                          color="text.secondary" 
                                          sx={{ mb: 2 }}
                                        >
                                          by {favorite.author}
                                        </Typography>
                                        
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                          <Rating value={favorite.averageRating} readOnly size="small" />
                                          <Typography variant="caption" color="text.secondary">
                                            {favorite.averageRating}/5 ({favorite.totalReviews} reviews)
                                          </Typography>
                                        </Stack>
                                        
                                        <Chip
                                          icon={<CalendarIcon />}
                                          label={`Added ${formatDate(favorite.addedToFavorites)}`}
                                          size="small"
                                          variant="outlined"
                                          sx={{ width: '100%' }}
                                        />
                                      </Box>
                                    </Stack>
                                  </CardContent>
                                </CardActionArea>
                              </Card>
                            </Zoom>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </Fade>
              )}
            </Box>
          </Paper>
        </Fade>
      </Box>
    </Container>
  );
};

export default ProfilePage;