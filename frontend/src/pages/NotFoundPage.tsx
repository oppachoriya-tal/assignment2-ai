import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const NotFoundPage: React.FC = () => {
  return (
    <Container maxWidth="sm" data-testid="not-found-page">
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The page you are looking for does not exist.
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
