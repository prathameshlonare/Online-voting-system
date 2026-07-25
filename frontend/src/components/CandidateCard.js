import React from 'react';
import { motion } from 'framer-motion';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const roleColors = {
  President: { bg: '#1565C0', light: '#E3F2FD', dark: '#0D47A1' },
  Secretary: { bg: '#C2185B', light: '#FCE4EC', dark: '#880E4F' },
  Treasurer: { bg: '#2E7D32', light: '#E8F5E9', dark: '#1B5E20' },
  VicePresident: { bg: '#ED6C02', light: '#FFF3E0', dark: '#E65100' },
};

const getRoleColor = (role) => {
  if (roleColors[role]) return roleColors[role];
  const hash = role.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return { bg: `hsl(${hue}, 60%, 45%)`, light: `hsl(${hue}, 60%, 92%)`, dark: `hsl(${hue}, 60%, 30%)` };
};

const CandidateCard = ({ candidate, isSelected, onSelect, role }) => {
  const initials = candidate.name
    ? candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const palette = getRoleColor(role);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        onClick={onSelect}
        elevation={isSelected ? 6 : 2}
        sx={{
          p: 2.5,
          borderRadius: 3,
          cursor: 'pointer',
          border: '2px solid',
          borderColor: isSelected ? palette.bg : 'transparent',
          bgcolor: isSelected ? palette.light : 'background.paper',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: isSelected ? palette.bg : 'grey.300',
            boxShadow: isSelected ? 6 : 3,
          },
        }}
      >
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
            }}
          >
            <CheckCircleIcon sx={{ color: palette.bg, fontSize: '1.6em' }} />
          </motion.div>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: palette.bg,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              flexShrink: 0,
            }}
          >
            {initials}
          </Box>

          <Box sx={{ flex: 1, pr: isSelected ? 2 : 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: isSelected ? 700 : 600,
                fontSize: '1.05rem',
                color: isSelected ? palette.dark : 'text.primary',
                lineHeight: 1.3,
              }}
            >
              {candidate.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.85rem',
                mt: 0.25,
              }}
            >
              {candidate.party}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default CandidateCard;
