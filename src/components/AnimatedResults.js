import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const AnimatedCounter = ({ target, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return <span ref={ref}>{count}</span>;
};

const AnimatedResults = ({ results }) => {
  if (!results || Object.keys(results).length === 0) return null;

  const maxVotes = Math.max(
    ...Object.values(results).flatMap(candidates =>
      candidates.map(c => c.vote_count || 0)
    ),
    1
  );

  return (
    <Box sx={{ mt: 2 }}>
      <AnimatePresence>
        {Object.entries(results).map(([role, candidates], roleIndex) => (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: roleIndex * 0.2, duration: 0.6, ease: 'easeOut' }}
          >
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                textTransform: 'capitalize',
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                pb: 1,
                color: 'primary.main',
                fontSize: { xs: '1.2rem', sm: '1.5rem' },
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
              }}
            >
              {role}
            </Typography>

            {candidates
              .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
              .map((candidate, index) => {
                const voteCount = candidate.vote_count || 0;
                const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;
                const isWinner = index === 0 && voteCount > 0;

                return (
                  <motion.div
                    key={candidate.candidate_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: roleIndex * 0.2 + index * 0.1 + 0.3,
                      duration: 0.5,
                      ease: 'easeOut',
                    }}
                  >
                    <Paper
                      elevation={isWinner ? 4 : 1}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        p: 2,
                        mb: 1.5,
                        borderRadius: 2,
                        bgcolor: isWinner ? 'success.lighter' : 'background.paper',
                        borderLeft: isWinner ? `6px solid` : '1px solid',
                        borderColor: isWinner ? 'success.main' : 'divider',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {isWinner && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: roleIndex * 0.2 + index * 0.1 + 0.5,
                            type: 'spring',
                            stiffness: 200,
                            damping: 10,
                          }}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                          }}
                        >
                          <EmojiEventsIcon sx={{ color: 'warning.main', fontSize: '1.8em' }} />
                        </motion.div>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 }, flex: 1, pr: isWinner ? 2 : 0 }}>
                        <Typography
                          variant="body1"
                          component="span"
                          sx={{
                            mr: 1.5,
                            color: isWinner ? 'success.dark' : 'text.secondary',
                            minWidth: '24px',
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          #{index + 1}
                        </Typography>
                        <Box>
                          <Typography
                            variant="body1"
                            component="div"
                            sx={{
                              fontWeight: isWinner ? 700 : 500,
                              fontSize: { xs: '0.95rem', sm: '1.05rem' },
                              color: isWinner ? 'success.darker' : 'text.primary',
                            }}
                          >
                            {candidate.name || candidate.candidate_id}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                          >
                            Party: ({candidate.party || 'N/A'})
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ width: { xs: '100%', sm: '140px' }, mb: { xs: 1, sm: 0 } }}>
                        <Box
                          sx={{
                            position: 'relative',
                            height: 8,
                            bgcolor: 'grey.200',
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{
                              delay: roleIndex * 0.2 + index * 0.1 + 0.4,
                              duration: 1.2,
                              ease: 'easeOut',
                            }}
                            style={{
                              height: '100%',
                              background: isWinner
                                ? 'linear-gradient(90deg, #2E7D32, #60AD5E)'
                                : 'linear-gradient(90deg, #1565C0, #5E92F3)',
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                      </Box>

                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          color: isWinner ? 'success.dark' : 'text.primary',
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          fontFamily: "'JetBrains Mono', monospace",
                          minWidth: '80px',
                          textAlign: 'right',
                        }}
                      >
                        <AnimatedCounter target={voteCount} /> votes
                      </Typography>
                    </Paper>
                  </motion.div>
                );
              })}
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default AnimatedResults;
