import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        px: 2, 
        mt: 'auto', 
        backgroundColor: 'grey.100',
        borderTop: '1px solid',
        borderColor: 'grey.300'
      }}
      data-testid="footer"
    >
      <Container maxWidth="lg">
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center"
        >
          © {currentYear} BookReview. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;