// src/components/WelcomePage.js

import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
    const navigate = useNavigate(); 

    const handleGetStarted = () => {
        navigate('/auth'); 
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                bgcolor: 'grey.100', 
                py: { xs: 4, sm: 6, md: 8 }, 
                px: 2, 
                textAlign: 'center', 
            }}
        >
            <Container maxWidth="sm"> 
                <Paper
                    elevation={4} 
                    sx={{
                        p: { xs: 3, sm: 4, md: 5 }, 
                        borderRadius: '12px', // Border radius
                        boxShadow: '0px 8px 24px rgba(0,0,0,0.1)', 
                        bgcolor: 'background.paper', 
                    }}
                >
                    <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom
                        sx={{
                            fontWeight: 'bold',
                            color: 'primary.main', // Theme primary color
                            fontSize: { xs: '1.8rem', sm: '2.5rem' }, // Responsive font size
                            mb: 2, // Bottom margin
                        }}
                    >
                        RCERT
                    </Typography>

                    <Typography
                        variant="h5"
                        component="h2"
                        gutterBottom
                        sx={{
                            color: 'text.primary',
                            fontSize: { xs: '1.4rem', sm: '1.8rem' },
                            mb: 3,
                        }}
                    >
                        Welcome to the RCERT Voting System
                    </Typography>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                        paragraph
                        sx={{ mb: 4 }}
                    >
                        This system is designed to facilitate secure and transparent voting
                        for the Presidential and Secretarial positions of RCERT.
                        Your participation is important.
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleGetStarted}
                        sx={{
                            mt: 2, 
                            py: 1.5, 
                            px: 4, 
                            fontSize: { xs: '1rem', sm: '1.1rem' }, 
                            textTransform: 'none', 
                            borderRadius: '8px', 
                            transition: 'transform 0.2s ease-in-out', 
                            '&:hover': {
                                transform: 'scale(1.05)', 
                            }
                        }}
                    >
                        Get Started (Login/Signup)
                    </Button>

                    <Box sx={{ mt: 6, borderTop: '1px solid #eee', pt: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Developed as part of a Mini Project by:
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                            Prathamesh Lonare, Swapnil Kumbhare, 
                            Mohak Talodhikar, Suyog Madavi
                        </Typography>
                    </Box>

                </Paper>
            </Container>
        </Box>
    );
};

export default WelcomePage;