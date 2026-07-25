import React from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

const steps = [
  { label: 'Select', icon: HowToVoteIcon },
  { label: 'Review', icon: AssignmentTurnedInIcon },
  { label: 'Confirm', icon: ThumbUpIcon },
  { label: 'Done', icon: CheckCircleIcon },
];

const VoteProgressStepper = ({ currentStep = 0 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 3,
        px: 2,
      }}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.label}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isCompleted ? 'success.main' : isCurrent ? 'primary.main' : 'grey.300',
                    color: isCompleted || isCurrent ? '#fff' : 'grey.500',
                    transition: 'all 0.3s ease',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(21, 101, 192, 0.2)' : 'none',
                  }}
                >
                  <Icon sx={{ fontSize: '1.2em' }} />
                </Box>
              </motion.div>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: isCurrent ? 700 : isCompleted ? 600 : 400,
                  color: isCompleted ? 'success.main' : isCurrent ? 'primary.main' : 'text.disabled',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {step.label}
              </Typography>
            </Box>

            {index < steps.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 3,
                  mx: 1,
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: 'grey.200',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    width: index < currentStep ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    backgroundColor: '#2E7D32',
                    borderRadius: 2,
                  }}
                />
              </Box>
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default VoteProgressStepper;
