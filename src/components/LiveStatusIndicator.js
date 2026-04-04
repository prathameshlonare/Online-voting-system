import React from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const statusConfig = {
  RUNNING: { color: '#2E7D32', label: 'Live Now', pulseColor: 'rgba(46, 125, 50, 0.4)' },
  STOPPED: { color: '#ED6C02', label: 'Ended', pulseColor: 'rgba(237, 108, 2, 0.4)' },
  RESULTS_DECLARED: { color: '#0288D1', label: 'Results Out', pulseColor: 'rgba(2, 136, 209, 0.4)' },
  NOT_STARTED: { color: '#757575', label: 'Not Started', pulseColor: 'rgba(117, 117, 117, 0.3)' },
};

const LiveStatusIndicator = ({ status, size = 'medium' }) => {
  const config = statusConfig[status] || statusConfig.NOT_STARTED;
  const dotSize = size === 'small' ? 6 : 10;
  const pulseSize = size === 'small' ? 16 : 22;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', width: pulseSize, height: pulseSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: pulseSize,
            height: pulseSize,
            borderRadius: '50%',
            backgroundColor: config.pulseColor,
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: config.color,
            boxShadow: `0 0 8px ${config.color}`,
          }}
        />
      </Box>
      <Typography
        variant={size === 'small' ? 'body2' : 'body1'}
        sx={{
          color: config.color,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: size === 'small' ? '0.75rem' : '0.85rem',
        }}
      >
        {config.label}
      </Typography>
    </Box>
  );
};

export default LiveStatusIndicator;
