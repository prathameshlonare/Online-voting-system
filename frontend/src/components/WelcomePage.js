import React from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

const floatingShapes = [
  { size: 300, x: '10%', y: '20%', duration: 20, opacity: 0.03, color: '#1565C0', rotate: 45 },
  { size: 200, x: '75%', y: '15%', duration: 25, opacity: 0.04, color: '#C2185B', rotate: -30 },
  { size: 150, x: '85%', y: '70%', duration: 18, opacity: 0.03, color: '#2E7D32', rotate: 60 },
  { size: 250, x: '5%', y: '75%', duration: 22, opacity: 0.04, color: '#ED6C02', rotate: -45 },
  { size: 100, x: '50%', y: '50%', duration: 15, opacity: 0.02, color: '#0288D1', rotate: 30 },
];

const features = [
  { icon: SecurityIcon, title: 'Secure', desc: 'Verified student authentication' },
  { icon: SpeedIcon, title: 'Instant', desc: 'Real-time vote counting' },
  { icon: HowToVoteIcon, title: 'Transparent', desc: 'Live results you can trust' },
];

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <Box
      component="main"
      id="main-content"
      role="main"
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#0A1628',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Animated Background */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {floatingShapes.map((shape, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [shape.rotate, shape.rotate + 360],
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: shape.x,
              top: shape.y,
              width: shape.size,
              height: shape.size,
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              background: shape.color,
              opacity: shape.opacity,
            }}
          />
        ))}

        {/* Gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 20%, rgba(21, 101, 192, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(194, 24, 91, 0.1) 0%, transparent 60%)',
          }}
        />
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, sm: 10, md: 14 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(21, 101, 192, 0.15)',
              border: '1px solid rgba(21, 101, 192, 0.3)',
              borderRadius: 100,
              px: 2,
              py: 0.75,
              mb: 4,
              mx: { xs: 'auto', sm: 0 },
              width: { xs: 'fit-content', sm: 'auto' },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#2E7D32',
                boxShadow: '0 0 8px #2E7D32',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 500,
                fontSize: '0.85rem',
                letterSpacing: '0.03em',
              }}
            >
              RCERT Elections 2026
            </Typography>
          </Box>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              fontSize: { xs: '2.8rem', sm: '4rem', md: '5rem' },
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              mb: 2,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #5E92F3 50%, #C2185B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your Voice.
            <br />
            Your Vote.
          </Typography>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 300,
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              lineHeight: 1.6,
              maxWidth: '540px',
              mb: 5,
              mx: { xs: 'auto', sm: 0 },
            }}
          >
            Cast your ballot securely and instantly for the Presidential and Secretarial positions. Every vote shapes the future of RCERT.
          </Typography>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{ marginBottom: '4rem' }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              bgcolor: '#fff',
              color: '#0A1628',
              fontWeight: 700,
              fontSize: '1.1rem',
              px: 5,
              py: 1.75,
              borderRadius: 3,
              boxShadow: '0 4px 24px rgba(255,255,255,0.15)',
              '&:hover': {
                bgcolor: '#f0f0f0',
                boxShadow: '0 8px 32px rgba(255,255,255,0.25)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Cast Your Vote
          </Button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 3,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Icon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.5em', mb: 1 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '1rem',
                      mb: 0.25,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {feature.desc}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
        >
          <Box
            sx={{
              mt: 6,
              pt: 3,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
              Developed by Prathamesh Lonare, Swapnil Kumbhare, Mohak Talodhikar, Suyog Madavi
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default WelcomePage;
