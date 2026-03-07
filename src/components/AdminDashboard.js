// src/components/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { Auth, API, Storage } from '../mocks'; // Using mock AWS services

// PDF Export Libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  Typography, Box, Button, Paper, CircularProgress, Alert,
  Divider, TextField, FormControl, InputLabel, Select, MenuItem, LinearProgress,
  Grid, Container, Fade, Tooltip,
  Tabs, Tab,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  AlertTitle
} from "@mui/material";

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import GavelIcon from '@mui/icons-material/Gavel';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// CsvUploader Component
const CsvUploader = ({ onUploadStatus }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      onUploadStatus(null, null); // Clear previous status
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onUploadStatus(null, "Please select a CSV file first.");
      return;
    }
    setIsUploading(true);
    onUploadStatus("Uploading...", null);
    setUploadProgress(0);

    const s3Key = `attendance/attendance_data.csv`; // Fixed key, will overwrite in the root of the bucket

    try {
      await Storage.put(s3Key, selectedFile, {
        contentType: 'text/csv',
        progressCallback(progress) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setUploadProgress(percent);
          onUploadStatus(`Uploading: ${percent}%`, null);
        },
      });
      console.log('S3 Upload Successful for key:', s3Key);
      onUploadStatus(`File uploaded successfully to S3 as ${s3Key}. Processing will follow shortly.`, null);
      setSelectedFile(null);
      setUploadProgress(100); // Indicate completion
    } catch (error) {
      console.error("Error uploading file via Amplify Storage:", error);
      onUploadStatus(null, `Error uploading file: ${error.message || 'Upload failed. Check S3 CORS & IAM permissions.'}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: '8px', textAlign: 'center', backgroundColor: 'grey.50' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
        <CloudUploadIcon sx={{ mr: 1, color: 'primary.main' }} /> Upload Student Attendance CSV
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
        Upload the CSV containing student IDs and attendance for eligibility. This will overwrite any previous file.
      </Typography>
      <FormControl fullWidth margin="dense">
        <TextField
          type="file"
          onChange={handleFileChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ accept: ".csv" }}
          variant="outlined"
          size="small"
          key={selectedFile ? 'file-selected' : 'file-empty'}
        />
        {selectedFile && <Typography variant="caption" sx={{ mt: 0.5, textAlign: 'left', color: 'text.secondary' }}>Selected: {selectedFile.name}</Typography>}
        {(isUploading || (uploadProgress > 0 && uploadProgress < 100)) && (
          <Box sx={{ width: '100%', mt: 1 }}><LinearProgress variant="determinate" value={uploadProgress} /></Box>
        )}
      </FormControl>
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={isUploading || !selectedFile}
        sx={{ mt: 1.5, py: 1.2, textTransform: 'none', fontSize: { xs: '0.9rem', sm: '1rem' } }}
        startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
      >
        {isUploading ? "Uploading..." : "Upload CSV"}
      </Button>
    </Paper>
  );
};

// TabPanel helper component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3, pb: 1 }}> {/* Padding for tab content */}
          {children}
        </Box>
      )}
    </div>
  );
}
function a11yProps(index) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminDashboard = ({ apiName }) => {
  // States
  const [adminUsername, setAdminUsername] = useState("");
  const [candidateFormData, setCandidateFormData] = useState({ role: "President", candidate_id: "", name: "", party: "" });
  const [addingCandidate, setAddingCandidate] = useState(false);
  const [addCandidateMessage, setAddCandidateMessage] = useState("");
  const [addCandidateError, setAddCandidateError] = useState("");
  const [csvUploadMessage, setCsvUploadMessage] = useState("");
  const [csvUploadError, setCsvUploadError] = useState("");
  const [votingResults, setVotingResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);
  const [electionStatus, setElectionStatus] = useState('LOADING');
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [startAnimation, setStartAnimation] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [openResetDialog, setOpenResetDialog] = useState(false);

  const currentApiName = apiName; // Use the prop

  useEffect(() => {
    const timer = setTimeout(() => setStartAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch election status
  const fetchElectionStatus = async () => {
    if (!currentApiName) {
      setStatusError("API Name not configured.");
      setElectionStatus("CONFIG_ERROR");
      setStatusLoading(false);
      return;
    }
    console.log("AdminDashboard: Attempting to fetch /election/status");
    setStatusLoading(true);
    setStatusError(null); // Clear previous error
    try {
      const response = await API.get(currentApiName, "/election/status", {});
      console.log("AdminDashboard: /election/status response:", response);
      if (response && response.status) {
        setElectionStatus(response.status);
      } else {
        setElectionStatus('UNKNOWN');
        setStatusError("Could not retrieve election status properly.");
      }
    } catch (error) {
      console.error("AdminDashboard: Error fetching status:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        setStatusError("Unauthorized: You do not have permission to fetch election status.");
      } else {
        const backendError = error.response?.data?.error || error.message || "Could not fetch status.";
        setStatusError(`Error fetching status: ${backendError}`);
      }
      setElectionStatus('ERROR');
    } finally {
      setStatusLoading(false);
    }
  };
  
  // Fetch admin details and initial election status on mount
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setAdminUsername(user.attributes.preferred_username || user.username);
      } catch (error) {
        console.error("AdminDashboard: Error fetching admin details:", error);
        setActionError(`Error fetching admin details: ${error.message}`); // Use general actionError
        setAdminUsername("Admin (Error)");
      }
    };
    const loadInitialData = async () => {
      await fetchAdminDetails(); // Wait for admin details to load
      await fetchElectionStatus(); // Then fetch election status
    }
    if (currentApiName) {
      loadInitialData();
    } else {
      setStatusError("API configuration is missing. Dashboard cannot function.");
      setElectionStatus("CONFIG_ERROR");
      setStatusLoading(false);
    }
  }, [currentApiName]);


  // Handlers
  const handleLogout = async () => {
    setActionLoading(true);
    setActionError(null); // Clear previous errors
    try {
      await Auth.signOut();
      // App.js Auth listener should handle redirect.
    } catch (error) {
      console.error("Error signing out admin:", error);
      setActionError(`Logout failed: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCandidateFormChange = (e) => {
    setCandidateFormData({ ...candidateFormData, [e.target.name]: e.target.value, });
    setAddCandidateMessage(""); // Clear message on form change
    setAddCandidateError("");   // Clear error on form change
  };

  const handleAddCandidateSubmit = async (e) => {
    e.preventDefault();
    if (!currentApiName) { setAddCandidateError("API endpoint name is not configured."); return; }
    setAddingCandidate(true); setAddCandidateMessage(""); setAddCandidateError("");
    const { role, candidate_id, name, party } = candidateFormData;
    if (!role || !candidate_id || !name || !party) {
      setAddCandidateError("Please fill in all candidate details.");
      setAddingCandidate(false);
      return;
    }
    try {
      const response = await API.post(currentApiName, "/candidates", { body: candidateFormData });
      setAddCandidateMessage(response.message || "Candidate added successfully!");
      setCandidateFormData({ role: candidateFormData.role, candidate_id: "", name: "", party: "" }); // Reset form but keep role
    } catch (error) {
      const backendError = error.response?.data?.error || error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null);
      setAddCandidateError(`Failed to add candidate: ${backendError || error.message || 'Unknown API error'}`);
    } finally {
      setAddingCandidate(false);
    }
  };

  const handleCsvUploadStatus = (message, error) => {
    setCsvUploadMessage(message || "");
    setCsvUploadError(error || "");
  };

  const fetchVotingResults = async () => {
    setResultsLoading(true); setResultsError(null); setVotingResults(null);
    if (!currentApiName) { setResultsError("API Name not configured."); setResultsLoading(false); return; }
    try {
      console.log("AdminDashboard: Fetching /results (Amplify Auth will handle token)");
      const response = await API.get(currentApiName, "/results", {});
      console.log("AdminDashboard: /results response:", response);
      setVotingResults(response);
    } catch (error) {
      console.error("AdminDashboard: Error fetching results:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        setResultsError("Unauthorized: You do not have permission to view results.");
      } else {
        const backendError = error.response?.data?.error || error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null);
        setResultsError(`Error fetching results: ${backendError || error.message || 'Could not fetch results.'}`);
      }
      setVotingResults(null); // Clear results on error
    } finally {
      setResultsLoading(false);
    }
  };

  const handleElectionAction = async (actionPath, successMessagePrefix, failureMessagePrefix, expectedNewStatusFrontend) => {
    setActionLoading(true); setActionMessage(null); setActionError(null);
    if (!currentApiName) { setActionError("API Name not configured."); setActionLoading(false); return; }
    try {
      console.log(`AdminDashboard: Performing action ${actionPath}`);
      const response = await API.post(currentApiName, actionPath, {});
      console.log(`AdminDashboard: Action ${actionPath} response:`, response);
      setActionMessage(response.message || `${successMessagePrefix} successfully!`);
      setElectionStatus(response.newStatus || expectedNewStatusFrontend); // Optimistic update or from response
    } catch (error) {
      console.error(`AdminDashboard: Error performing action ${actionPath}:`, error);
      const backendError = error.response?.data?.error || error.response?.data?.message || `Failed to ${failureMessagePrefix.toLowerCase()}.`;
      setActionError(`${failureMessagePrefix} Failed: ${backendError}`);
      // Re-fetch true status on error
      if (error.response?.data?.currentStatus) {
        setElectionStatus(error.response.data.currentStatus);
      } else {
        fetchElectionStatus(); 
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartElection = () => handleElectionAction("/election/start", "Election started", "Start Election", 'RUNNING');
  const handleStopElection = () => handleElectionAction("/election/stop", "Election stopped", "Stop Election", 'STOPPED');
  const handleDeclareResults = () => handleElectionAction("/election/declare", "Results declared", "Declare Results", 'RESULTS_DECLARED');

  const handleInitiateResetElection = () => { setOpenResetDialog(true); };
  const handleConfirmResetElection = async () => {
    setOpenResetDialog(false);
    setActionLoading(true); setActionMessage(null); setActionError(null);
    if (!currentApiName) { setActionError("API Name not configured for reset."); setActionLoading(false); return; }
    try {
      const response = await API.post(currentApiName, "/election/reset", {});
      setActionMessage(response.message || "Election cycle has been reset successfully!");
      setElectionStatus(response.newStatus || 'NOT_STARTED'); // Update frontend status
      setVotingResults(null); // Clear results as they are no longer valid
      setAddCandidateMessage(""); setAddCandidateError(""); // Clear other messages
    } catch (error) {
      const backendError = error.response?.data?.error || error.message || "Failed to reset.";
      setActionError(`Reset Failed: ${backendError}`);
      fetchElectionStatus(); // Re-fetch true status on error
    } finally {
      setActionLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Clear messages from other tabs when switching
    setActionMessage(null); setActionError(null);
    setCsvUploadMessage(""); setCsvUploadError("");
    setAddCandidateMessage(""); setAddCandidateError("");

    if (newValue === 1 && (!votingResults || resultsError) && !resultsLoading) {
      fetchVotingResults(); // Fetch results if View Results tab is selected and data isn't there/fresh
    }
    if (newValue === 2 && !statusLoading) { // Election Control tab
      fetchElectionStatus(); // Refresh status
    }
  };

  const handleExportPdf = () => {
    if (!votingResults || Object.keys(votingResults).length === 0) {
      setActionError("No results available to export."); // Use actionError for general messages
      setTimeout(() => setActionError(null), 3000);
      return;
    }
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const generationDate = new Date().toLocaleString();

        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Official Election Results", pageWidth / 2, 22, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${generationDate}`, pageWidth / 2, 29, { align: "center" });
        
        let startY = 40;

        Object.entries(votingResults).forEach(([role, candidates]) => {
            const lastTable = doc.lastAutoTable; 
            if (lastTable && lastTable.finalY) {
                startY = lastTable.finalY + 15; // Add margin between tables
            }

            if (startY > doc.internal.pageSize.getHeight() - 30) { // Check if new page is needed
                doc.addPage();
                startY = 20; // Reset Y for new page
            }

            doc.setFontSize(15);
            doc.setFont("helvetica", "bold");
            doc.text(`Results for: ${role.charAt(0).toUpperCase() + role.slice(1)}`, 14, startY);

            const tableColumn = ["Rank", "Candidate Name", "Party", "Vote Count"];
            const tableRows = [];

            // Ensure candidates is an array before sorting
            const sortedCandidates = Array.isArray(candidates) ? [...candidates].sort((a, b) => b.vote_count - a.vote_count) : [];

            sortedCandidates.forEach((candidate, idx) => {
                const candidateData = [
                    `#${idx + 1}`,
                    candidate.name || 'N/A',
                    candidate.party || 'N/A',
                    candidate.vote_count,
                ];
                tableRows.push(candidateData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: startY + 6,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 18, halign: 'center' }, // Rank
                    1: { cellWidth: 'auto' }, // Name
                    2: { cellWidth: 'auto' }, // Party
                    3: { cellWidth: 30, halign: 'center' }, // Vote Count
                },
                didDrawPage: (data) => { // Update startY for next elements if page breaks
                    startY = data.cursor.y;
                }
            });
        });

        doc.save(`election-results-${new Date().toISOString().slice(0, 10)}.pdf`);
        setActionMessage("Results PDF exported successfully!");
        setTimeout(() => setActionMessage(null), 3000);

    } catch (error) {
        console.error("Error exporting PDF:", error);
        setActionError("Failed to export results as PDF.");
        setTimeout(() => setActionError(null), 3000);
    }
  };


  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', bgcolor: 'grey.100', py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2 }, boxSizing: 'border-box' }}>
      <Fade in={startAnimation} timeout={600}>
        <Container maxWidth="lg" disableGutters sx={{ boxSizing: 'border-box' }}>
          <Paper elevation={4} sx={{ p: { xs: 1.5, sm: 2.5, md: 3.5 }, borderRadius: '12px', boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' }}>
            {/* --- Header --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: 1 }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '1.8rem', sm: '2.5rem' } }}>Admin Dashboard</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Welcome, {adminUsername || "Admin"}</Typography>
              </Box>
              <Tooltip title={actionLoading ? "Processing..." : "Logout Admin"}>
                <Button variant="outlined" color="error" onClick={handleLogout} startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <LogoutIcon />} disabled={actionLoading} sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                  Logout
                </Button>
              </Tooltip>
            </Box>
            <Divider sx={{ my: 2.5 }} />

            {/* --- Overview Section --- */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'primary.lighter', borderRadius: '8px', border: theme => `1px solid ${theme.palette.primary.light}` }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', color: 'primary.darker' }}>
                <DashboardIcon sx={{ mr: 1 }} /> Election Overview
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                    Current Status:
                    {statusLoading ? (
                      <CircularProgress size={16} sx={{ ml: 1 }} />
                    ) : (
                      <strong style={{ marginLeft: '8px', color: electionStatus === 'RUNNING' ? 'green' : (electionStatus === 'STOPPED' ? 'orange' : (electionStatus === 'RESULTS_DECLARED' ? 'blue' : 'inherit')) }}>
                        {electionStatus || 'N/A'}
                      </strong>
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* --- CSV Uploader Section --- */}
            <Box sx={{ my: 3 }}>
              <CsvUploader onUploadStatus={handleCsvUploadStatus} />
              {csvUploadError && <Alert severity="error" sx={{ mt: 1.5, textAlign: 'left', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>{csvUploadError}</Alert>}
              {csvUploadMessage && <Alert severity="info" sx={{ mt: 1.5, textAlign: 'left', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>{csvUploadMessage}</Alert>}
            </Box>
            <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

            {/* --- Tabs for Main Admin Actions --- */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
              <Tabs value={currentTab} onChange={handleTabChange} aria-label="Admin Actions Tabs" variant="fullWidth" indicatorColor="primary" textColor="primary">
                <Tab label="Add Candidate" icon={<AddCircleOutlineIcon />} iconPosition="start" {...a11yProps(0)} sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />
                <Tab label="View Results" icon={<BarChartIcon />} iconPosition="start" {...a11yProps(1)} sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />
                <Tab label="Election Control" icon={<SettingsIcon />} iconPosition="start" {...a11yProps(2)} sx={{ textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />
              </Tabs>
            </Box>

            {/* --- TabPanel Content START --- */}
            <TabPanel value={currentTab} index={0}>
              {/* Add Candidate Section Content */}
              <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 } }}>
                {!currentApiName && <Alert severity="warning" sx={{ mb: 2 }}>API Name not provided. Cannot add candidates.</Alert>}
                <form onSubmit={handleAddCandidateSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}> <FormControl fullWidth margin="normal" required variant="outlined"> <InputLabel id="role-select-label">Role</InputLabel> <Select labelId="role-select-label" name="role" value={candidateFormData.role} onChange={handleCandidateFormChange} label="Role" > <MenuItem value="President">President</MenuItem> <MenuItem value="Secretary">Secretary</MenuItem> </Select> </FormControl> </Grid>
                    <Grid item xs={12} sm={6}> <TextField label="Candidate ID" type="text" name="candidate_id" value={candidateFormData.candidate_id} onChange={handleCandidateFormChange} fullWidth margin="normal" required helperText="Unique ID (e.g., pres_001)" variant="outlined" /> </Grid>
                    <Grid item xs={12} sm={6}> <TextField label="Candidate Name" type="text" name="name" value={candidateFormData.name} onChange={handleCandidateFormChange} fullWidth margin="normal" required variant="outlined" /> </Grid>
                    <Grid item xs={12} sm={6}> <TextField label="Party" type="text" name="party" value={candidateFormData.party} onChange={handleCandidateFormChange} fullWidth margin="normal" required variant="outlined" /> </Grid>
                  </Grid>
                  {addCandidateError && <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{addCandidateError}</Alert>}
                  {addCandidateMessage && <Alert severity="success" sx={{ mt: 2, textAlign: 'left' }}>{addCandidateMessage}</Alert>}
                  <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2.5, py: 1.2, textTransform: 'none', fontSize: { xs: '0.9rem', sm: '1rem' } }} disabled={addingCandidate || !currentApiName}> {addingCandidate ? <CircularProgress size={24} color="inherit" /> : "Add Candidate"} </Button>
                </form>
              </Paper>
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              {/* View Results Section Content */}
              <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, minHeight: 200 }}>
                {resultsLoading && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3, height: '100%' }}><CircularProgress size={40} /></Box>}
                {resultsError && <Alert severity="error" sx={{ mt: 2 }}><AlertTitle>Error Loading Results</AlertTitle>{resultsError}</Alert>}
                
                {votingResults && !resultsLoading && !resultsError && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                      <Tooltip title="Export results as a PDF document">
                        <span> {/* Tooltip needs a span wrapper for disabled button */}
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleExportPdf}
                            startIcon={<PictureAsPdfIcon />}
                            disabled={!votingResults || Object.keys(votingResults).length === 0}
                            sx={{ textTransform: 'none' }}
                          >
                            Export to PDF
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>

                    {Object.entries(votingResults).length > 0 ? Object.entries(votingResults).map(([role, candidates]) => (<Box key={role} sx={{ mb: 3 }}> <Typography variant="h6" component="h4" gutterBottom sx={{ textTransform: 'capitalize', borderBottom: '1px solid #ccc', pb: 1, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.15rem' } }}>{role}</Typography> {candidates && candidates.length > 0 ? (<Box component="ul" sx={{ listStyle: 'none', p: 0 }}> {candidates.sort((a, b) => b.vote_count - a.vote_count).map((candidate, index) => (<Paper component="li" elevation={index === 0 ? 3 : 1} key={candidate.candidate_id} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, p: 1.5, mb: 1, borderRadius: '8px', bgcolor: index === 0 ? 'success.lighter' : 'background.paper', borderLeft: index === 0 ? `5px solid` : '1px solid', borderColor: index === 0 ? 'success.main' : 'grey.300', transition: 'all 0.2s ease-in-out', '&:hover': { boxShadow: 3, transform: 'translateY(-1px)' } }}> <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}> <Typography variant="body1" component="span" sx={{ mr: 1.5, color: index === 0 ? 'success.dark' : 'text.secondary', minWidth: '20px', fontWeight: 'medium' }}>#{index + 1}</Typography> <Box> <Typography variant="body1" component="div" sx={{ fontWeight: 'medium', fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: index === 0 ? 'success.darker' : 'text.primary' }}> {candidate.name || candidate.candidate_id} {index === 0 && <EmojiEventsIcon sx={{ color: 'gold', verticalAlign: 'middle', ml: 0.5, fontSize: '1.2em' }} />} </Typography> <Typography variant="body2" component="span" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}> Party: ({candidate.party || 'N/A'}) </Typography> </Box> </Box> <Typography variant="body1" sx={{ fontWeight: 'bold', color: index === 0 ? 'success.dark' : 'secondary.main', fontSize: { xs: '0.95rem', sm: '1.05rem' }, mt: { xs: 1, sm: 0 }, alignSelf: { xs: 'flex-end', sm: 'center' } }}> {candidate.vote_count} Votes </Typography> </Paper>))} </Box>) : (<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No votes recorded or results available for this role.</Typography>)} </Box>)) : (<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 2, textAlign: 'center' }}>No voting results data is currently published.</Typography>)} 
                  </Box>
                )}
                {!votingResults && !resultsLoading && !resultsError && (<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 2, textAlign: 'center' }}> Click the "View Results" tab to fetch results. </Typography>)}
              </Paper>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              {/* Manage Election Section Content */}
              <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 } }}>
                <Box sx={{ my: 2, p: { xs: 1, sm: 1.5 }, border: '1px solid #b0bec5', borderRadius: '8px', bgcolor: 'grey.100' }}>
                  <Typography variant="body1" component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}> <span style={{ fontSize: '0.95rem' }}>Current Status: {statusLoading ? <CircularProgress size={18} sx={{ ml: 1 }} /> : <strong style={{ marginLeft: '8px', color: electionStatus === 'RUNNING' ? 'green' : (electionStatus === 'STOPPED' ? 'orange' : (electionStatus === 'RESULTS_DECLARED' ? 'blue' : 'inherit')) }}>{electionStatus || 'N/A'}</strong>}</span> <Tooltip title="Refresh Status"> <Button size="small" onClick={fetchElectionStatus} disabled={statusLoading || actionLoading} startIcon={<RefreshIcon />} sx={{ textTransform: 'none' }}>Refresh</Button> </Tooltip> </Typography>
                  {statusError && <Alert severity="warning" sx={{ mt: 1, textAlign: 'left', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>{statusError}</Alert>}
                </Box>
                <Grid container spacing={1.5} justifyContent="center" alignItems="center">
                  <Grid item xs={12} sm={6} md={3}> <Tooltip title="Allow users to start voting"> <Button fullWidth variant="contained" color="success" onClick={handleStartElection} disabled={actionLoading || statusLoading || electionStatus === 'RUNNING' || electionStatus === 'RESULTS_DECLARED'} startIcon={<PlayArrowIcon />} sx={{ textTransform: 'none' }}> Start </Button> </Tooltip> </Grid>
                  <Grid item xs={12} sm={6} md={3}> <Tooltip title="Stop accepting new votes"> <Button fullWidth variant="contained" color="error" onClick={handleStopElection} disabled={actionLoading || statusLoading || electionStatus !== 'RUNNING'} startIcon={<StopIcon />} sx={{ textTransform: 'none' }}> Stop </Button> </Tooltip> </Grid>
                  <Grid item xs={12} sm={6} md={3}> <Tooltip title="Make voting results public (after stopping)"> <Button fullWidth variant="contained" color="info" onClick={handleDeclareResults} disabled={actionLoading || statusLoading || electionStatus !== 'STOPPED'} startIcon={<GavelIcon />} sx={{ textTransform: 'none' }}> Declare </Button> </Tooltip> </Grid>
                  <Grid item xs={12} sm={6} md={3}> <Tooltip title="Reset all votes and election status to NOT_STARTED"> <Button fullWidth variant="outlined" color="warning" onClick={handleInitiateResetElection} disabled={actionLoading || statusLoading || electionStatus === 'RUNNING'} startIcon={<RestartAltIcon />} sx={{ textTransform: 'none' }}> Reset Cycle </Button> </Tooltip> </Grid>
                </Grid>
                {(actionError || actionMessage) && <Box sx={{ mt: 2.5 }}> {actionError && <Alert severity="error" sx={{ textAlign: 'left' }}>{actionError}</Alert>} {actionMessage && <Alert severity="success" sx={{ textAlign: 'left' }}>{actionMessage}</Alert>} </Box>}
              </Paper>
            </TabPanel>
            {/* --- TabPanel Content END --- */}


            {/* Reset Confirmation Dialog */}
            <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)} aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description" >
              <DialogTitle id="reset-dialog-title" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>{"Confirm Election Reset"}</DialogTitle>
              <DialogContent sx={{ pt: '20px !important' }}>
                <DialogContentText id="reset-dialog-description"> Are you absolutely sure you want to reset the entire election cycle? This action will delete all current votes, candidate data (if applicable on reset), and set the election status to 'NOT_STARTED'. <br /><strong>This action cannot be undone.</strong> </DialogContentText>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}> <Button onClick={() => setOpenResetDialog(false)} color="primary" variant="outlined">Cancel</Button> <Button onClick={handleConfirmResetElection} color="error" variant="contained" autoFocus>Confirm Reset</Button> </DialogActions>
            </Dialog>

          </Paper>
        </Container>
      </Fade>
    </Box>
  );
};

export default AdminDashboard;