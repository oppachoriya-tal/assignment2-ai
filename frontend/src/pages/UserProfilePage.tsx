import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <Container maxWidth="lg" data-testid="user-profile-page">
      <Box sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          User Profile Page for ID: {id}
        </Typography>
        <Typography variant="body1">
          Details of a specific user profile will be displayed here.
        </Typography>
      </Box>
    </Container>
  );
};

export default UserProfilePage;
