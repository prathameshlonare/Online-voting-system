import React from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';

export const CandidateSkeleton = ({ count = 3 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
      >
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={56} height={56} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={28} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
        </Paper>
      </motion.div>
    ))}
  </Box>
);

export const ResultsSkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {['President', 'Secretary'].map((role, i) => (
      <motion.div
        key={role}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.15 }}
      >
        <Skeleton variant="text" width="30%" height={36} sx={{ mb: 2 }} />
        {Array.from({ length: 3 }).map((_, j) => (
          <Paper key={j} sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="50%" height={24} />
                <Skeleton variant="text" width="30%" height={18} />
              </Box>
              <Skeleton variant="rounded" width={80} height={32} />
            </Box>
          </Paper>
        ))}
      </motion.div>
    ))}
  </Box>
);

export const PageSkeleton = ({ lines = 4 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={`${80 - i * 15}%`}
        height={24}
        animation="wave"
      />
    ))}
  </Box>
);

export const DashboardSkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={24} />
    </Paper>
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2 }} />
      <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2 }} />
    </Box>
  </Box>
);
