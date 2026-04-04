// src/components/VoteForm.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Auth, API } from "../mocks";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CandidateCard from './CandidateCard';
import VoteProgressStepper from './VoteProgressStepper';
import ConfettiCelebration from './ConfettiCelebration';
import AnimatedResults from './AnimatedResults';
import { CandidateSkeleton, ResultsSkeleton } from './SkeletonLoaders';

const MessageDisplay = ({ title, message, severity = "info", showLogout = true, icon, onLogout }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center', width: '100%', maxWidth: '600px', mx: 'auto', borderRadius: 3, boxSizing: 'border-box' }}>
      {icon && <Box sx={{ fontSize: { xs: '2.5rem', sm: '3rem' }, color: `${severity}.main`, mb: 1.5 }}>{icon}</Box>}
      <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700, color: severity === 'error' ? 'error.main' : (severity === 'warning' ? 'warning.main' : 'primary.main'), wordBreak: 'break-word', fontSize: { xs: '1.3rem', sm: '1.75rem' } }}>
        {title}
      </Typography>
      <Alert severity={severity} sx={{ textAlign: 'left', mb: 3, wordBreak: 'break-word', fontSize: { xs: '0.9rem', sm: '1rem' } }} icon={false}>
        {message}
      </Alert>
      {showLogout && (
        <Button variant="contained" color="secondary" onClick={onLogout} startIcon={<LogoutIcon />}>
          Logout
        </Button>
      )}
    </Paper>
  </motion.div>
);

const VoteForm = ({ studentId, apiName }) => {
  const [eligibilityState, setEligibilityState] = useState({ loading: true, isEligible: null, error: null, checked: false, reason: null });
  const [allCandidates, setAllCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [voteState, setVoteState] = useState({ loading: false, error: null, successMessage: null, hasVoted: false });
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [electionSystemStatus, setElectionSystemStatus] = useState('LOADING');
  const [electionStatusLoading, setElectionStatusLoading] = useState(true);
  const [electionStatusError, setElectionStatusError] = useState(null);

  const [viewingResultsData, setViewingResultsData] = useState(null);
  const [viewingResultsLoading, setViewingResultsLoading] = useState(false);
  const [viewingResultsError, setViewingResultsError] = useState(null);

  const currentApiName = apiName;

  const roles = useMemo(() => [...new Set(allCandidates.map(c => c.role))], [allCandidates]);
  const candidatesByRole = useMemo(() => {
    const map = {};
    roles.forEach(role => {
      map[role] = allCandidates.filter(c => c.role === role);
    });
    return map;
  }, [allCandidates, roles]);

  useEffect(() => {
    const allSelected = roles.length > 0 && roles.every(role => selectedCandidates[role]);
    const someSelected = Object.keys(selectedCandidates).length > 0;
    if (allSelected) setCurrentStep(1);
    else if (someSelected) setCurrentStep(0);
    else if (voteState.hasVoted) setCurrentStep(3);
    else setCurrentStep(0);
  }, [selectedCandidates, roles, voteState.hasVoted]);

  // 1. Fetch Overall Election Status
  useEffect(() => {
    const fetchAppElectionStatus = async () => {
      if (!currentApiName) { setElectionSystemStatus('CONFIG_ERROR'); setElectionStatusError("API configuration is missing."); setElectionStatusLoading(false); return; }
      setElectionStatusLoading(true); setElectionStatusError(null);
      try {
        const response = await API.get(currentApiName, "/election/status", {});
        if (response && response.status) {
          setElectionSystemStatus(response.status);
        } else {
          setElectionSystemStatus('UNKNOWN_STATUS');
          setElectionStatusError("Could not retrieve election status properly.");
        }
      } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          setElectionSystemStatus('ACCESS_DENIED_STATUS');
          setElectionStatusError(null);
        } else {
          const backendError = error.response?.data?.error || error.message || "Network or server error.";
          setElectionStatusError(`Error fetching status: ${backendError}`);
          setElectionSystemStatus('STATUS_FETCH_ERROR');
        }
      } finally {
        setElectionStatusLoading(false);
      }
    };
    if (currentApiName) fetchAppElectionStatus();
    else { setElectionSystemStatus('CONFIG_ERROR'); setElectionStatusError("API Name prop is missing."); setElectionStatusLoading(false); }
  }, [currentApiName]);

  // 2. Fetch Declared Results
  useEffect(() => {
    const fetchDeclaredResults = async () => {
      if (!currentApiName) { setViewingResultsError("API configuration missing for results."); return; }
      setViewingResultsLoading(true); setViewingResultsError(null); setViewingResultsData(null);
      try {
        const response = await API.get(currentApiName, "/results", {});
        if (response && typeof response === 'object' && Object.keys(response).length > 0) {
          setViewingResultsData(response);
        } else {
          setViewingResultsData({});
          setViewingResultsError("No results data available or received unexpected format.");
        }
      } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          setViewingResultsError("Unauthorized: You do not have permission to view these results.");
        } else {
          const backendError = error.response?.data?.error || error.response?.data?.message || "Could not load results.";
          setViewingResultsError(`Error loading results: ${backendError}`);
        }
        setViewingResultsData(null);
      } finally {
        setViewingResultsLoading(false);
      }
    };

    if (electionSystemStatus === 'RESULTS_DECLARED' && !electionStatusLoading) {
      fetchDeclaredResults();
    }
  }, [electionSystemStatus, electionStatusLoading, currentApiName]);

  // 3. Check Eligibility & Fetch Candidates
  const fetchAllRawCandidates = React.useCallback(async () => {
    if (!currentApiName) { setCandidatesError("API configuration missing."); return; }
    setCandidatesLoading(true); setCandidatesError(null);
    try {
      const response = await API.get(currentApiName, "/candidates", {});
      if (Array.isArray(response)) { setAllCandidates(response); }
      else { setAllCandidates([]); setCandidatesError("Received unexpected format for candidates."); }
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        setCandidatesError("Unauthorized: You do not have permission to view candidates.");
      } else { setCandidatesError(`Error fetching candidates: ${error.response?.data?.error || error.message}`); }
      setAllCandidates([]);
    } finally { setCandidatesLoading(false); }
  }, [currentApiName]);

  useEffect(() => {
    const checkEligibilityAndVoteStatus = async () => {
      if (!studentId || !currentApiName) {
        setEligibilityState({ loading: false, isEligible: false, error: "User/API configuration error.", checked: true, reason: "Missing required info." }); return;
      }
      setEligibilityState(prev => ({ ...prev, loading: true, error: null, reason: null, checked: false }));
      try {
        const eligResponse = await API.get(currentApiName, "/eligibility", {
          queryStringParameters: { student_id: studentId },
        });
        if (eligResponse && typeof eligResponse.isEligible === 'boolean') {
          setEligibilityState({ loading: false, isEligible: eligResponse.isEligible, error: null, checked: true, reason: eligResponse.reason || (eligResponse.isEligible ? null : "As per records, you are not eligible.") });
          if (eligResponse.isEligible) {
            fetchAllRawCandidates();
          }
        } else { setEligibilityState({ loading: false, isEligible: false, error: "Could not determine eligibility status.", checked: true, reason: "Eligibility check response was unclear." }); }
      } catch (error) {
        const backendError = error.response?.data?.message || error.response?.data?.error;
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          setEligibilityState({ loading: false, isEligible: false, error: "Unauthorized to check eligibility.", checked: true, reason: "Permission denied for eligibility check." });
        } else {
          setEligibilityState({ loading: false, isEligible: false, error: `Error checking eligibility: ${backendError || error.message || 'Unknown error'}`, checked: true, reason: "Error during eligibility check." });
        }
      }
    };

    if (!electionStatusLoading && electionSystemStatus === 'RUNNING') {
      checkEligibilityAndVoteStatus();
    } else if (!electionStatusLoading && electionSystemStatus !== 'RUNNING') {
      setEligibilityState(prev => ({ ...prev, loading: false, checked: true, isEligible: false, reason: `Election is currently ${electionSystemStatus?.toLowerCase().replace(/_/g, ' ')}.` }));
    }
  }, [electionSystemStatus, electionStatusLoading, studentId, currentApiName, fetchAllRawCandidates]);

  const handleLogout = useCallback(async () => {
    setVoteState(prev => ({ ...prev, loading: true }));
    try { await Auth.signOut(); }
    catch (error) { setVoteState(prev => ({ ...prev, loading: false, error: "Error signing out." })); }
  }, []);

  const handleSelectCandidate = useCallback((role, candidateId) => {
    setSelectedCandidates(prev => ({ ...prev, [role]: candidateId }));
  }, []);

  const handleInitiateVoteSubmit = useCallback(() => {
    const missingRoles = roles.filter(role => !selectedCandidates[role]);
    if (missingRoles.length > 0) {
      setVoteState(prev => ({ ...prev, error: `Please select a candidate for: ${missingRoles.join(', ')}.` }));
      return;
    }
    setVoteState(prev => ({ ...prev, error: null }));
    setCurrentStep(2);
    setOpenReviewDialog(true);
  }, [roles, selectedCandidates]);

  const handleConfirmVoteSubmit = useCallback(async () => {
    setOpenReviewDialog(false);
    if (!currentApiName) { setVoteState(prev => ({ ...prev, error: "API configuration missing for voting." })); return; }
    setVoteState(prev => ({ ...prev, loading: true, error: null, successMessage: null }));

    const voteBody = { student_id: studentId };
    roles.forEach(role => {
      voteBody[`${role.toLowerCase()}_candidate_id`] = selectedCandidates[role];
    });

    try {
      const response = await API.post(currentApiName, "/vote", { body: voteBody });
      if (response && (response.message || response.success)) {
        setVoteState(prev => ({ ...prev, loading: false, successMessage: response.message || "Votes submitted successfully! Thank you for participating.", error: null, hasVoted: true }));
        setSelectedCandidates({});
        setCurrentStep(3);
      } else {
        setVoteState(prev => ({ ...prev, loading: false, error: "Votes submitted, but confirmation was unclear. Please contact support.", successMessage: null }));
      }
    } catch (error) {
      const responseData = error.response?.data;
      const statusCode = error.response?.status;
      let displayError = "An unexpected error occurred while submitting your vote.";
      if (responseData) {
        const backendErrorMessage = responseData.error || responseData.message || (typeof responseData === 'string' ? responseData : 'Unknown server error');
        if (statusCode === 409) { displayError = backendErrorMessage || "It appears you have already voted in this election."; setVoteState(prev => ({ ...prev, loading: false, error: displayError, successMessage: null, hasVoted: true })); return; }
        if (statusCode === 401 || statusCode === 403) { displayError = "Unauthorized: You do not have permission to submit this vote."; }
        else if (statusCode >= 400 && statusCode < 500) { displayError = `Submission failed: ${backendErrorMessage}`; }
        else { displayError = `Server error: ${backendErrorMessage}. Please try again later.`; }
      } else { displayError = `Network error: ${error.message || 'Could not reach server'}.`; }
      setVoteState(prev => ({ loading: false, error: displayError, successMessage: null }));
    }
  }, [currentApiName, studentId, selectedCandidates, roles]);

  const getCandidateNameById = useCallback((id, role) => {
    const list = candidatesByRole[role] || [];
    const candidate = list.find(c => c.candidate_id === id);
    return candidate ? candidate.name : 'N/A';
  }, [candidatesByRole]);

  const roleColors = {
    President: { main: '#1565C0', light: '#E3F2FD', dark: '#0D47A1' },
    Secretary: { main: '#C2185B', light: '#FCE4EC', dark: '#880E4F' },
    Treasurer: { main: '#2E7D32', light: '#E8F5E9', dark: '#1B5E20' },
    VicePresident: { main: '#ED6C02', light: '#FFF3E0', dark: '#E65100' },
  };

  const getRoleColor = (role) => {
    if (roleColors[role]) return roleColors[role];
    const hash = role.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const hue = hash % 360;
    return { main: `hsl(${hue}, 60%, 45%)`, light: `hsl(${hue}, 60%, 92%)`, dark: `hsl(${hue}, 60%, 30%)` };
  };

  // --- Main Render Logic ---
  const renderMainContent = () => {
    if (electionStatusLoading && electionSystemStatus === 'LOADING') {
      return <Box sx={{ p: 3, textAlign: 'center' }}> <CircularProgress /> <Typography sx={{ mt: 2 }}>Loading Election Details...</Typography> </Box>;
    }
    if (electionStatusError || ['CONFIG_ERROR', 'STATUS_FETCH_ERROR', 'UNKNOWN_STATUS', 'ACCESS_DENIED_STATUS'].includes(electionSystemStatus)) {
      return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}>
        <MessageDisplay title="Election Information Error" message={electionStatusError || "Could not load election details at this time."} severity="error" onLogout={handleLogout} />
      </Box>;
    }

    // RESULTS_DECLARED
    if (electionSystemStatus === 'RESULTS_DECLARED') {
      return (
        <Container component="main" maxWidth="md" disableGutters sx={{ width: '100%' }}>
          <Paper elevation={4} sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%', borderRadius: 3, boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }}>
                  <EmojiEventsIcon color="primary" sx={{ fontSize: { xs: '2.2rem', sm: '2.8rem' }, mr: 1.5 }} />
                </motion.div>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2.2rem' }, color: 'primary.main', fontFamily: "'Playfair Display', serif" }}>
                  Election Results
                </Typography>
              </Box>
              <Button variant="outlined" color="secondary" onClick={handleLogout} startIcon={<LogoutIcon />}>Logout</Button>
            </Box>
            <Divider sx={{ my: 2.5 }} />

            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle sx={{ fontWeight: 'medium' }}>Voting Period Concluded</AlertTitle>
              The voting period has finished. The official results are displayed below.
            </Alert>

            {viewingResultsLoading && <ResultsSkeleton />}
            {viewingResultsError && <Alert severity="error" sx={{ mt: 2 }}><AlertTitle>Error Loading Results</AlertTitle>{viewingResultsError}</Alert>}

            {viewingResultsData && !viewingResultsLoading && !viewingResultsError && (
              <Box>
                {Object.entries(viewingResultsData).length > 0 ? (
                  <AnimatedResults results={viewingResultsData} />
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>No voting results data is currently published.</Alert>
                )}
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    if (electionSystemStatus === 'RUNNING') {
      if (eligibilityState.loading && !eligibilityState.checked) {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 160px)', p: 3 }}>
            <CircularProgress size={50} />
            <Typography variant="h6" sx={{ mt: 2.5, color: 'text.secondary' }}>Checking Your Voting Eligibility...</Typography>
          </Box>
        );
      }
      if (eligibilityState.error && eligibilityState.checked) {
        return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}>
          <MessageDisplay title="Eligibility Check Failed" message={eligibilityState.error} severity="error" onLogout={handleLogout} />
        </Box>;
      }
      if (!eligibilityState.isEligible && eligibilityState.checked) {
        return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}>
          <MessageDisplay title="Voting Access Information" message={eligibilityState.reason || "You are currently unable to vote."} severity="warning" onLogout={handleLogout} />
        </Box>;
      }
      if (eligibilityState.isEligible && eligibilityState.checked) {
        return (
          <Container component="main" maxWidth="md" disableGutters sx={{ width: '100%' }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: '700px', mx: 'auto', borderRadius: 3 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HowToVoteIcon color="primary" sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem' }, mr: 1 }} />
                  <Typography variant="h5" component="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.3rem', sm: '1.75rem' } }}>
                    Cast Your Votes
                  </Typography>
                </Box>
                <Button variant="outlined" color="secondary" onClick={handleLogout} disabled={voteState.loading} startIcon={<LogoutIcon />}>Logout</Button>
              </Box>
              <Divider sx={{ my: 2 }} />

              {/* Progress Stepper */}
              {!voteState.hasVoted && <VoteProgressStepper currentStep={currentStep} />}

              {/* Student ID */}
              <Typography variant="body1" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
                Student ID: <strong sx={{ color: 'text.primary' }}>{studentId}</strong>
              </Typography>

              {/* Success/Error */}
              {voteState.hasVoted && !voteState.loading && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                  <Alert severity={voteState.error ? "error" : "success"} iconMapping={{ success: <CheckCircleOutlineIcon fontSize="inherit" /> }} sx={{ mb: 3 }}>
                    <AlertTitle sx={{ fontWeight: 'bold' }}>{voteState.error ? "Vote Status" : "Vote Confirmed!"}</AlertTitle>
                    {voteState.error || voteState.successMessage || "Your vote has been recorded."}
                  </Alert>
                </motion.div>
              )}

              {/* Candidates Loading */}
              {candidatesLoading && !voteState.hasVoted && (
                <Box sx={{ mb: 3 }}>
                  {roles.map((role) => (
                    <Box key={role} sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>{role} Candidates</Typography>
                      <CandidateSkeleton count={2} />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Candidate Selection */}
              {!voteState.hasVoted && !candidatesLoading && !candidatesError && roles.length > 0 && (
                <Box>
                  {roles.map((role) => {
                    const roleCandidates = candidatesByRole[role] || [];
                    const color = getRoleColor(role);
                    if (roleCandidates.length === 0) return null;
                    return (
                      <Box key={role} sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: color.main, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color.main }} />
                          {role}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {roleCandidates.map((candidate) => (
                            <CandidateCard
                              key={candidate.candidate_id}
                              candidate={candidate}
                              role={role}
                              isSelected={selectedCandidates[role] === candidate.candidate_id}
                              onSelect={() => handleSelectCandidate(role, candidate.candidate_id)}
                            />
                          ))}
                        </Box>
                      </Box>
                    );
                  })}

                  {/* Submit Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      onClick={handleInitiateVoteSubmit}
                      disabled={roles.some(role => !selectedCandidates[role])}
                      sx={{
                        mt: 2,
                        py: 1.75,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        borderRadius: 3,
                        boxShadow: '0 4px 16px rgba(21, 101, 192, 0.3)',
                        '&:hover': {
                          boxShadow: '0 6px 24px rgba(21, 101, 192, 0.4)',
                        },
                      }}
                    >
                      Review & Submit Vote
                    </Button>
                  </motion.div>
                </Box>
              )}

              {/* No candidates */}
              {!voteState.hasVoted && !candidatesLoading && !candidatesError && roles.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <AlertTitle>No Candidates Registered</AlertTitle>
                  No candidates have been registered for this election yet. Please check back later.
                </Alert>
              )}

              {candidatesError && <Alert severity="error" sx={{ mt: 2 }}>{candidatesError}</Alert>}
              {voteState.error && !voteState.hasVoted && <Alert severity="error" sx={{ mt: 2 }}>{voteState.error}</Alert>}
            </Paper>

            {/* Review Dialog */}
            <Dialog open={openReviewDialog} onClose={() => { setOpenReviewDialog(false); setCurrentStep(1); }} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Review Your Vote</DialogTitle>
              <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                  Please confirm your selections below. This action cannot be undone.
                </DialogContentText>
                {roles.map((role) => {
                  const color = getRoleColor(role);
                  return (
                    <Paper key={role} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: `${color.main}08`, border: '1px solid', borderColor: `${color.main}20` }}>
                      <Typography variant="body2" sx={{ color: color.main, fontWeight: 600, mb: 0.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>{role}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: color.dark }}>
                        {getCandidateNameById(selectedCandidates[role], role)}
                      </Typography>
                    </Paper>
                  );
                })}
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => { setOpenReviewDialog(false); setCurrentStep(1); }} variant="outlined">
                  Go Back
                </Button>
                <Button onClick={handleConfirmVoteSubmit} variant="contained" color="primary" disabled={voteState.loading} autoFocus>
                  {voteState.loading ? <CircularProgress size={24} color="inherit" /> : "Confirm & Submit"}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Confetti on success */}
            <ConfettiCelebration active={voteState.hasVoted && !!voteState.successMessage} duration={4000} />
          </Container>
        );
      }
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 160px)', p: 3 }}>
          <CircularProgress size={40} />
          <Typography sx={{ mt: 2 }}>Loading voting information...</Typography>
        </Box>
      );
    }

    if (electionSystemStatus === 'NOT_STARTED') {
      return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}>
        <MessageDisplay title="Voting Not Started" message="The election voting period has not yet begun. Please check back later." severity="info" icon={<InfoOutlinedIcon />} onLogout={handleLogout} />
      </Box>;
    }
    if (electionSystemStatus === 'STOPPED') {
      return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}>
        <MessageDisplay title="Voting Closed" message="The election period has ended. Results will be announced soon." severity="info" icon={<InfoOutlinedIcon />} onLogout={handleLogout} />
      </Box>;
    }

    return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}>
      <MessageDisplay title="Election Status" message="Please wait or refresh the page for current election details." severity="info" showLogout={false} />
    </Box>;
  };

  return (
    <Box component="main" id="main-content" role="main" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'background.default', py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 1.5 }, boxSizing: 'border-box' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={electionSystemStatus}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          {renderMainContent()}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default VoteForm;
