// src/components/VoteForm.js
import React, { useState, useEffect, useMemo } from "react";
import { Auth, API } from "../mocks"; // Using mock AWS services
import {
  Typography, Box, Button, Paper, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, FormHelperText, Divider,
  Container, Fade, ListItemText, AlertTitle,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Required for Results Display

const VoteForm = ({ studentId, apiName }) => {
  // States
  const [eligibilityState, setEligibilityState] = useState({ loading: true, isEligible: null, error: null, checked: false, reason: null });
  const [allCandidates, setAllCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const [selectedPresidentId, setSelectedPresidentId] = useState("");
  const [selectedSecretaryId, setSelectedSecretaryId] = useState("");
  const [voteState, setVoteState] = useState({ loading: false, error: null, successMessage: null, hasVoted: false });
  const [startAnimation, setStartAnimation] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);

  const [electionSystemStatus, setElectionSystemStatus] = useState('LOADING');
  const [electionStatusLoading, setElectionStatusLoading] = useState(true);
  const [electionStatusError, setElectionStatusError] = useState(null);

  // Results viewing states - Required for displaying results
  const [viewingResultsData, setViewingResultsData] = useState(null);
  const [viewingResultsLoading, setViewingResultsLoading] = useState(false);
  const [viewingResultsError, setViewingResultsError] = useState(null);

  const currentApiName = apiName;

  useEffect(() => { const timer = setTimeout(() => setStartAnimation(true), 100); return () => clearTimeout(timer); }, []);

  // 1. Fetch Overall Election Status
  useEffect(() => {
    const fetchAppElectionStatus = async () => {
      if (!currentApiName) { setElectionSystemStatus('CONFIG_ERROR'); setElectionStatusError("API configuration is missing."); setElectionStatusLoading(false); return; }
      setElectionStatusLoading(true); setElectionStatusError(null);
      try {
        console.log("VoteForm: Attempting to fetch /election/status (Amplify Auth will handle token)");
        const response = await API.get(currentApiName, "/election/status", {});
        console.log("VoteForm: /election/status response:", response);
        if (response && response.status) {
          setElectionSystemStatus(response.status);
        } else {
          setElectionSystemStatus('UNKNOWN_STATUS'); setElectionStatusError("Could not retrieve election status properly.");
        }
      } catch (error) {
        console.warn("VoteForm: Error fetching /election/status:", error);
        let specificErrorMsg;
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          specificErrorMsg = "Not authorized to view current election details or the election is not accessible to you.";
          setElectionSystemStatus('ACCESS_DENIED_STATUS');
          setElectionStatusError(null);
          console.info("VoteForm: Could not fetch global election status (likely unauthorized). Assuming election might be running.");
        } else {
          const backendError = error.response?.data?.error || error.message || "Network or server error.";
          specificErrorMsg = `Error fetching status: ${backendError}`;
          setElectionStatusError(specificErrorMsg);
          setElectionSystemStatus('STATUS_FETCH_ERROR');
        }
      } finally {
        setElectionStatusLoading(false);
      }
    };
    if (currentApiName) fetchAppElectionStatus();
    else { setElectionSystemStatus('CONFIG_ERROR'); setElectionStatusError("API Name prop is missing."); setElectionStatusLoading(false); }
  }, [currentApiName]);


  // 2. Fetch Declared Results if applicable - This function is NEEDED for RESULTS_DECLARED status
  useEffect(() => {
    const fetchDeclaredResults = async () => {
      if (!currentApiName) { setViewingResultsError("API configuration missing for results."); return; }
      setViewingResultsLoading(true); setViewingResultsError(null); setViewingResultsData(null);
      try {
        console.log("VoteForm: Fetching /results (Amplify Auth will handle token)");
        const response = await API.get(currentApiName, "/results", {});

        if (response && typeof response === 'object' && Object.keys(response).length > 0) {
          setViewingResultsData(response); // Direct set, formatting Lambda madhe zali aahe
        } else {
          console.warn("Fetched results response is empty or not an object:", response);
          setViewingResultsData({});
          setViewingResultsError("No results data available or received unexpected format.");
        }
      } catch (error) {
        console.error("VoteForm: Error fetching /results:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          setViewingResultsError("Unauthorized: You do not have permission to view these results.");
        } else {
          const backendError = error.response?.data?.error || error.response?.data?.message || "Could not load results.";
          setViewingResultsError(`Error loading results: ${backendError}`);
        }
        setViewingResultsData(null); // Clear data on error
      } finally {
        setViewingResultsLoading(false);
      }
    };

    if (electionSystemStatus === 'RESULTS_DECLARED' && !electionStatusLoading) {
      fetchDeclaredResults(); // >>> CALL THIS FUNCTION WHEN STATUS IS RESULTS_DECLARED <<<
    }
  }, [electionSystemStatus, electionStatusLoading, currentApiName]);


  // 3. Check Eligibility & Vote Status (if election is RUNNING)
  const fetchAllRawCandidates = async () => {
    if (!currentApiName) { setCandidatesError("API configuration missing."); return; }
    setCandidatesLoading(true); setCandidatesError(null);
    try {
      console.log("VoteForm: Fetching /candidates (Amplify Auth will handle token)");
      const response = await API.get(currentApiName, "/candidates", {});
      if (Array.isArray(response)) { setAllCandidates(response); }
      else { setAllCandidates([]); setCandidatesError("Received unexpected format for candidates."); }
    } catch (error) {
      console.error("VoteForm: Error fetching /candidates:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        setCandidatesError("Unauthorized: You do not have permission to view candidates.");
      } else { setCandidatesError(`Error fetching candidates: ${error.response?.data?.error || error.message}`); }
      setAllCandidates([]);
    } finally { setCandidatesLoading(false); }
  };

  useEffect(() => {
    const checkEligibilityAndVoteStatus = async () => {
      if (!studentId || !currentApiName) {
        setEligibilityState({ loading: false, isEligible: false, error: "User/API configuration error.", checked: true, reason: "Missing required info." }); return;
      }
      setEligibilityState(prev => ({ ...prev, loading: true, error: null, reason: null, checked: false }));
      try {
        console.log("VoteForm: Fetching /eligibility (Amplify Auth will handle token)");
        const eligResponse = await API.get(currentApiName, "/eligibility", {
          queryStringParameters: { student_id: studentId },
        });
        if (eligResponse && typeof eligResponse.isEligible === 'boolean') {
          setEligibilityState({ loading: false, isEligible: eligResponse.isEligible, error: null, checked: true, reason: eligResponse.reason || (eligResponse.isEligible ? null : "As per records, you are not eligible.") });
          if (eligResponse.isEligible) {
            fetchAllRawCandidates(); // Fetch candidates only if eligible
          }
        } else { setEligibilityState({ loading: false, isEligible: false, error: "Could not determine eligibility status.", checked: true, reason: "Eligibility check response was unclear." }); }
      } catch (error) {
        console.error("VoteForm: Error fetching /eligibility:", error);
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
  }, [electionSystemStatus, electionStatusLoading, studentId, currentApiName]);


  // --- Helper Functions ---
  const presidentCandidates = useMemo(() => allCandidates.filter(c => c.role === 'President'), [allCandidates]);
  const secretaryCandidates = useMemo(() => allCandidates.filter(c => c.role === 'Secretary'), [allCandidates]);
  const handleInitiateVoteSubmit = () => { if (!selectedPresidentId || !selectedSecretaryId) { setVoteState(prev => ({ ...prev, error: "Please select a candidate for both President AND Secretary." })); return; } setVoteState(prev => ({ ...prev, error: null })); setOpenReviewDialog(true); };

  const handleConfirmVoteSubmit = async () => {
    setOpenReviewDialog(false);
    if (!currentApiName) { setVoteState(prev => ({ ...prev, error: "API configuration missing for voting." })); return; }
    setVoteState(prev => ({ ...prev, loading: true, error: null, successMessage: null }));
    try {
      const response = await API.post(currentApiName, "/vote", {
        body: {
          student_id: studentId,
          president_candidate_id: selectedPresidentId,
          secretary_candidate_id: selectedSecretaryId,
        },
      });
      if (response && (response.message || response.success)) {
        setVoteState(prev => ({ ...prev, loading: false, successMessage: response.message || "Votes submitted successfully! Thank you for participating.", error: null, hasVoted: true }));
        setSelectedPresidentId("");
        setSelectedSecretaryId("");
      } else {
        setVoteState(prev => ({ ...prev, loading: false, error: "Votes submitted, but confirmation was unclear. Please contact support.", successMessage: null }));
      }
    } catch (error) {
      const responseData = error.response?.data;
      const statusCode = error.response?.status;
      let displayError = "An unexpected error occurred while submitting your vote. Please try again or contact support.";
      if (responseData) {
        const backendErrorMessage = responseData.error || responseData.message || (typeof responseData === 'string' ? responseData : 'Unknown server error');
        if (statusCode === 409) { displayError = backendErrorMessage || "It appears you have already voted in this election."; setVoteState(prev => ({ ...prev, loading: false, error: displayError, successMessage: null, hasVoted: true })); return; }
        if (statusCode === 401 || statusCode === 403) { displayError = "Unauthorized: You do not have permission to submit this vote."; }
        else if (statusCode >= 400 && statusCode < 500) { displayError = `Submission failed: ${backendErrorMessage}`; }
        else { displayError = `Server error: ${backendErrorMessage}. Please try again later.`; }
      } else { displayError = `Network error: ${error.message || 'Could not reach server'}. Please check your connection and try again.`; }
      setVoteState(prev => ({ loading: false, error: displayError, successMessage: null }));
    }
  };

  const handleLogout = async () => { setVoteState(prev => ({ ...prev, loading: true })); try { await Auth.signOut(); } catch (error) { setVoteState(prev => ({ ...prev, loading: false, error: "Error signing out." })); } };
  const getCandidateNameById = (id, role) => {
    const candidatesList = role === 'President' ? presidentCandidates : secretaryCandidates;
    const candidate = candidatesList.find(c => c.candidate_id === id);
    return candidate ? candidate.name : 'N/A';
  };
  const MessageDisplay = ({ title, message, severity = "info", showLogout = true, icon }) => (<Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center', width: '100%', maxWidth: '600px', mx: 'auto', borderRadius: '12px', boxShadow: '0px 8px 24px rgba(0,0,0,0.12)', boxSizing: 'border-box' }}> {icon && <Box sx={{ fontSize: { xs: '2.5rem', sm: '3rem' }, color: `${severity}.main`, mb: 1.5 }}>{icon}</Box>} <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: severity === 'error' ? 'error.main' : (severity === 'warning' ? 'warning.main' : 'primary.main'), wordBreak: 'break-word', fontSize: { xs: '1.3rem', sm: '1.75rem' } }}> {title} </Typography> <Alert severity={severity} sx={{ textAlign: 'left', mb: 3, wordBreak: 'break-word', fontSize: { xs: '0.9rem', sm: '1rem' } }} icon={false}> {message} </Alert> {showLogout && (<Button variant="contained" color="secondary" onClick={handleLogout} sx={{ textTransform: 'none', fontSize: '1rem' }} startIcon={<LogoutIcon />}> Logout </Button>)} </Paper>);

  // --- Main Render Logic ---
  const renderMainContent = () => {
    // Loading and Error states for overall status
    if (electionStatusLoading && electionSystemStatus === 'LOADING') { return <Box sx={{ p: 3, textAlign: 'center' }}> <CircularProgress /> <Typography sx={{ mt: 2 }}>Loading Election Details...</Typography> </Box>; }
    if (electionStatusError || ['CONFIG_ERROR', 'STATUS_FETCH_ERROR', 'UNKNOWN_STATUS', 'ACCESS_DENIED_STATUS'].includes(electionSystemStatus)) { return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}> <MessageDisplay title="Election Information Error" message={electionStatusError || "Could not load election details at this time. Please try again later or contact support."} severity="error" /> </Box>; }

    // >>> C. Results Declared - SHOW RESULTS <<<
    if (electionSystemStatus === 'RESULTS_DECLARED') {
      return (
        <Container component="main" maxWidth="md" disableGutters sx={{ width: '100%' }}>
          <Paper elevation={4} sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%', borderRadius: '16px', boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}> <EmojiEventsIcon color="primary" sx={{ fontSize: { xs: '2.2rem', sm: '2.8rem' }, mr: 1.5 }} /> <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.6rem', sm: '2.2rem' }, color: 'primary.main' }}> Election Results </Typography> </Box>
              <Button variant="outlined" color="secondary" onClick={handleLogout} startIcon={<LogoutIcon />} sx={{ textTransform: 'none' }}>Logout</Button>
            </Box>
            <Divider sx={{ my: 2.5 }} />

            {/* Message for all users when results are out */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle sx={{ fontWeight: 'medium' }}>Voting Period Concluded</AlertTitle>
              The voting period for this election has finished. The official results are displayed below.
            </Alert>

            {/* >>> Results Display Logic - ADDED BACK <<< */}
            {viewingResultsLoading && <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 4, minHeight: '200px' }}><CircularProgress size={40} sx={{ mb: 2 }} /><Typography variant="h6">Loading Results...</Typography></Box>}
            {viewingResultsError && <Alert severity="error" sx={{ mt: 2 }}><AlertTitle>Error Loading Results</AlertTitle>{viewingResultsError}</Alert>}

            {/* Results Display Logic - Use viewingResultsData */}
            {viewingResultsData && !viewingResultsLoading && !viewingResultsError && (
              <Box>
                {/* Check if viewingResultsData is structured as expected (e.g., { President: [...], Secretary: [...] }) */}
                {Object.entries(viewingResultsData).length > 0 ? (
                  <>
                    {/* Display President Winner */}
                    {viewingResultsData.President && viewingResultsData.President.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ textTransform: 'capitalize', borderBottom: '2px solid', borderColor: 'primary.light', pb: 1, color: 'primary.dark', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>President Winner</Typography>
                        {/* Get the first candidate (winner) */}
                        {viewingResultsData.President[0] && (
                          <Paper elevation={4} sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: '10px', bgcolor: 'success.lighter', borderLeft: `6px solid success.main`, transition: 'all 0.2s ease-in-out' }}>
                            <EmojiEventsIcon sx={{ color: 'gold', fontSize: '2em', mr: 2 }} />
                            <Box>
                              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.15rem' }, color: 'success.darker' }}>
                                {viewingResultsData.President[0].name || viewingResultsData.President[0].candidate_id}
                              </Typography>
                            </Box>
                          </Paper>
                        )}
                        {!viewingResultsData.President[0] && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>No winner found for President.</Typography>
                        )}
                      </Box>
                    )}

                    {/* Display Secretary Winner */}
                    {viewingResultsData.Secretary && viewingResultsData.Secretary.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ textTransform: 'capitalize', borderBottom: '2px solid', borderColor: 'primary.light', pb: 1, color: 'primary.dark', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Secretary Winner</Typography>
                        {viewingResultsData.Secretary[0] && (
                          <Paper elevation={4} sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: '10px', bgcolor: 'success.lighter', borderLeft: `6px solid success.main`, transition: 'all 0.2s ease-in-out' }}>
                            <EmojiEventsIcon sx={{ color: 'gold', fontSize: '2em', mr: 2 }} />
                            <Box>
                              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.15rem' }, color: 'success.darker' }}>
                                {viewingResultsData.Secretary[0].name || viewingResultsData.Secretary[0].candidate_id}
                              </Typography>
                            </Box>
                          </Paper>
                        )}
                        {/* Optional: Message if no winner found for the role */}
                        {!viewingResultsData.Secretary[0] && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>No winner found for Secretary.</Typography>
                        )}
                      </Box>
                    )}

                    {/* Optional: Message if no winners found for any position */}
                    {(!viewingResultsData.President || viewingResultsData.President.length === 0) && (!viewingResultsData.Secretary || viewingResultsData.Secretary.length === 0) && (
                      <Alert severity="info" sx={{ mt: 2 }}>No winners declared for any position yet.</Alert>
                    )}

                  </>
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
        return (<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 160px)', p: 3 }}> <CircularProgress size={50} /> <Typography variant="h6" sx={{ mt: 2.5, color: 'text.secondary' }}>Checking Your Voting Eligibility...</Typography> </Box>);
      }
      if (eligibilityState.error && eligibilityState.checked) {
        return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}> <MessageDisplay title="Eligibility Check Failed" message={eligibilityState.error} severity="error" /> </Box>;
      }
      if (!eligibilityState.isEligible && eligibilityState.checked) {
        return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}> <MessageDisplay title="Voting Access Information" message={eligibilityState.reason || "You are currently unable to vote or access voting at this time."} severity="warning" /> </Box>;
      }
      if (eligibilityState.isEligible && eligibilityState.checked) {
        return (
          <Container component="main" maxWidth="md" disableGutters sx={{ width: '100%' }}> <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: '700px', mx: 'auto', borderRadius: '16px' }}> <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}> <Box sx={{ display: 'flex', alignItems: 'center' }}> <HowToVoteIcon color="primary" sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem' }, mr: 1 }} /> <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.3rem', sm: '1.75rem' } }}> Cast Your Votes </Typography> </Box> <Button variant="outlined" color="secondary" onClick={handleLogout} size="small" disabled={voteState.loading} startIcon={<LogoutIcon />}> Logout </Button> </Box> <Divider sx={{ my: 2 }} /> {!voteState.hasVoted && !candidatesLoading && !candidatesError && (presidentCandidates.length > 0 || secretaryCandidates.length > 0) && (<Alert severity="info" icon={<InfoOutlinedIcon fontSize="inherit" />} sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}> <AlertTitle sx={{ fontWeight: 'medium' }}>Voting Instructions</AlertTitle> Please select one candidate for each position and submit your vote. Review your selections carefully before submitting. </Alert>)} <Typography variant="body1" gutterBottom sx={{ mb: 2, textAlign: 'center' }}> Student ID: <strong>{studentId}</strong></Typography> {voteState.hasVoted && !voteState.loading && (<Alert severity={voteState.error ? "error" : "success"} iconMapping={{ success: <CheckCircleOutlineIcon fontSize="inherit" /> }}> <AlertTitle sx={{ fontWeight: 'bold' }}>{voteState.error ? "Vote Status" : "Vote Confirmed!"}</AlertTitle> {voteState.error || voteState.successMessage || "Your vote has been recorded."} </Alert>)} {candidatesLoading && !voteState.hasVoted && (<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 3, color: 'text.secondary', minHeight: '150px' }}> <CircularProgress size={30} sx={{ mb: 1.5 }} /> <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>Loading Candidates...</Typography> </Box>)} {candidatesError && !candidatesLoading && !voteState.hasVoted && (<Alert severity="error" sx={{ mt: 2 }}><AlertTitle>Error Loading Candidates</AlertTitle>{candidatesError}</Alert>)} {!voteState.hasVoted && !candidatesLoading && !candidatesError && ((presidentCandidates.length > 0 || secretaryCandidates.length > 0) ? (<form onSubmit={(e) => { e.preventDefault(); handleInitiateVoteSubmit(); }}> {presidentCandidates.length > 0 && <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2.5, borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: 'action.hover' }}> <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: 'primary.dark' }}> <AccountCircleIcon sx={{ mr: { xs: 0.5, sm: 1 }, color: 'primary.dark' }} /> Select President </Typography> <FormControl fullWidth margin="dense" required error={!!voteState.error && !selectedPresidentId} variant="outlined"> <InputLabel id="president-select-label">President Candidate</InputLabel> <Select labelId="president-select-label" id="president-select" value={selectedPresidentId} onChange={(e) => { setSelectedPresidentId(e.target.value); setVoteState(prev => ({ ...prev, error: null })) }} label="President Candidate" renderValue={(selected) => selected ? getCandidateNameById(selected, 'President') : <em>-- Select President --</em>} > <MenuItem value="" disabled><em>-- Select President --</em></MenuItem> {presidentCandidates.map((c) => (c?.candidate_id && c?.name ? (<MenuItem key={`pres-${c.candidate_id}`} value={c.candidate_id}><ListItemText primary={c.name} secondary={`Party: ${c.party || 'N/A'}`} /></MenuItem>) : null))} </Select> {(presidentCandidates.length === 0 && !candidatesLoading) && <FormHelperText sx={{ color: 'warning.dark' }}>No candidates available for President.</FormHelperText>} </FormControl> </Paper>} {secretaryCandidates.length > 0 && <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2.5, borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: 'action.hover' }}> <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: 'primary.dark' }}> <AccountCircleIcon sx={{ mr: { xs: 0.5, sm: 1 }, color: 'primary.dark' }} /> Select Secretary </Typography> <FormControl fullWidth margin="dense" required error={!!voteState.error && !selectedSecretaryId} variant="outlined"> <InputLabel id="secretary-select-label">Secretary Candidate</InputLabel> <Select labelId="secretary-select-label" id="secretary-select" value={selectedSecretaryId} onChange={(e) => { setSelectedSecretaryId(e.target.value); setVoteState(prev => ({ ...prev, error: null })) }} label="Secretary Candidate" renderValue={(selected) => selected ? getCandidateNameById(selected, 'Secretary') : <em>-- Select Secretary --</em>} > <MenuItem value="" disabled><em>-- Select Secretary --</em></MenuItem> {secretaryCandidates.map((c) => (c?.candidate_id && c?.name ? (<MenuItem key={`sec-${c.candidate_id}`} value={c.candidate_id}><ListItemText primary={c.name} secondary={`Party: ${c.party || 'N/A'}`} /></MenuItem>) : null))} </Select> {(secretaryCandidates.length === 0 && !candidatesLoading) && <FormHelperText sx={{ color: 'warning.dark' }}>No candidates available for Secretary.</FormHelperText>} </FormControl> </Paper>} {voteState.error && !voteState.hasVoted && (<Alert severity="error" sx={{ mt: 2 }}><AlertTitle>Error</AlertTitle>{voteState.error}</Alert>)} <Button type="submit" variant="contained" color="primary" fullWidth disabled={voteState.loading || candidatesLoading || !selectedPresidentId || !selectedSecretaryId} sx={{ mt: 3, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }} startIcon={voteState.loading ? null : <HowToVoteIcon />} > {voteState.loading ? <CircularProgress size={24} color="inherit" /> : "Review & Submit Votes"} </Button> </form>) : (<Alert severity="warning" sx={{ mt: 2 }}>No candidates are currently available for voting.</Alert>))} <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)} fullWidth maxWidth="xs"> <DialogTitle sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}> <Box sx={{ display: 'flex', alignItems: 'center' }}> <HowToVoteIcon sx={{ mr: 1 }} /> Review Selections </Box> </DialogTitle> <DialogContent dividers> <DialogContentText component="div" sx={{ mb: 1 }}>Confirm your choices:</DialogContentText> <Typography><strong>President:</strong> {getCandidateNameById(selectedPresidentId, 'President')}</Typography> <Typography><strong>Secretary:</strong> {getCandidateNameById(selectedSecretaryId, 'Secretary')}</Typography> <DialogContentText sx={{ mt: 1, fontSize: '0.8rem', color: 'text.secondary' }}>Once submitted, your vote cannot be changed.</DialogContentText> </DialogContent> <DialogActions sx={{ p: 1.5 }}> <Button onClick={() => setOpenReviewDialog(false)}>Edit</Button> <Button onClick={handleConfirmVoteSubmit} color="primary" variant="contained" autoFocus disabled={voteState.loading}>{voteState.loading ? <CircularProgress size={20} /> : "Submit Vote"}</Button> </DialogActions> </Dialog> </Paper> </Container>
        );
      }
      return (<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 160px)', p: 3 }}> <CircularProgress size={40} /> <Typography sx={{ mt: 2 }}>Loading voting information...</Typography> </Box>);
    }

    if (electionSystemStatus === 'NOT_STARTED') { return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}> <MessageDisplay title="Voting Not Started" message="The election voting period has not yet begun. Please check back later." severity="info" icon={<InfoOutlinedIcon />} /> </Box>; }
    if (electionSystemStatus === 'STOPPED') { return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}> <MessageDisplay title="Voting Closed" message="The election period has ended. Results will be announced soon." severity="info" icon={<InfoOutlinedIcon />} /> </Box>; }

    return <Box sx={{ p: 3, width: '100%', maxWidth: '600px', mx: 'auto' }}> <MessageDisplay title="Election Status" message="Please wait or refresh the page for current election details." severity="info" showLogout={false} /> </Box>;
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'grey.100', py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 1.5 }, boxSizing: 'border-box' }}>
      <Fade in={startAnimation} timeout={700}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 1 }}>
          {renderMainContent()}
        </Box>
      </Fade>
    </Box>
  );
};

export default VoteForm;