// src/components/AdminDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Auth, API, Storage } from '../mocks'; // Using mock AWS services

// PDF Export Libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Fade from '@mui/material/Fade';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import AlertTitle from '@mui/material/AlertTitle';
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LiveStatusIndicator from './LiveStatusIndicator';
import AnimatedResults from './AnimatedResults';
import { ResultsSkeleton } from './SkeletonLoaders';

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
  const [availableRoles, setAvailableRoles] = useState(["President", "Secretary"]);
  const [newRoleInput, setNewRoleInput] = useState("");
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
  const fetchElectionStatus = React.useCallback(async () => {
    if (!currentApiName) {
      setStatusError("API Name not configured.");
      setElectionStatus("CONFIG_ERROR");
      setStatusLoading(false);
      return;
    }
    console.log("AdminDashboard: Attempting to fetch /election/status");
    setStatusLoading(true);
    setStatusError(null);
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
  }, [currentApiName]);
  
  // Fetch admin details and initial election status on mount (parallel)
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setAdminUsername(user.attributes.preferred_username || user.username);
      } catch (error) {
        console.error("AdminDashboard: Error fetching admin details:", error);
        setActionError(`Error fetching admin details: ${error.message}`);
        setAdminUsername("Admin (Error)");
      }
    };
    const loadInitialData = async () => {
      await Promise.all([fetchAdminDetails(), fetchElectionStatus()]);
    }
    if (currentApiName) {
      loadInitialData();
    } else {
      setStatusError("API configuration is missing. Dashboard cannot function.");
      setElectionStatus("CONFIG_ERROR");
      setStatusLoading(false);
    }
  }, [currentApiName, fetchElectionStatus]);


  // Handlers
  const handleLogout = useCallback(async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await Auth.signOut();
    } catch (error) {
      console.error("Error signing out admin:", error);
      setActionError(`Logout failed: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handleCandidateFormChange = useCallback((e) => {
    setCandidateFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setAddCandidateMessage("");
    setAddCandidateError("");
  }, []);

  const handleAddRole = useCallback(() => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    if (availableRoles.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      setAddCandidateError(`Role "${trimmed}" already exists.`);
      return;
    }
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    setAvailableRoles(prev => [...prev, capitalized]);
    setNewRoleInput("");
    setAddCandidateError("");
    setAddCandidateMessage(`Role "${capitalized}" added successfully!`);
  }, [newRoleInput, availableRoles]);

  const handleRemoveRole = useCallback((roleToRemove) => {
    if (availableRoles.length <= 1) {
      setAddCandidateError("Cannot remove the last remaining role. At least one role is required.");
      return;
    }
    setAvailableRoles(prev => prev.filter(r => r !== roleToRemove));
    if (candidateFormData.role === roleToRemove) {
      setCandidateFormData(prev => ({ ...prev, role: availableRoles.find(r => r !== roleToRemove) || "" }));
    }
    setAddCandidateMessage(`Role "${roleToRemove}" removed.`);
  }, [availableRoles, candidateFormData.role]);

  const handleAddCandidateSubmit = useCallback(async (e) => {
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
      setCandidateFormData(prev => ({ role: prev.role, candidate_id: "", name: "", party: "" }));
    } catch (error) {
      const backendError = error.response?.data?.error || error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null);
      setAddCandidateError(`Failed to add candidate: ${backendError || error.message || 'Unknown API error'}`);
    } finally {
      setAddingCandidate(false);
    }
  }, [currentApiName, candidateFormData]);

  const handleCsvUploadStatus = useCallback((message, error) => {
    setCsvUploadMessage(message || "");
    setCsvUploadError(error || "");
  }, []);

  const fetchVotingResults = useCallback(async () => {
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
      setVotingResults(null);
    } finally {
      setResultsLoading(false);
    }
  }, [currentApiName]);

  const handleElectionAction = useCallback(async (actionPath, successMessagePrefix, failureMessagePrefix, expectedNewStatusFrontend) => {
    setActionLoading(true); setActionMessage(null); setActionError(null);
    if (!currentApiName) { setActionError("API Name not configured."); setActionLoading(false); return; }
    try {
      console.log(`AdminDashboard: Performing action ${actionPath}`);
      const response = await API.post(currentApiName, actionPath, {});
      console.log(`AdminDashboard: Action ${actionPath} response:`, response);
      setActionMessage(response.message || `${successMessagePrefix} successfully!`);
      setElectionStatus(response.newStatus || expectedNewStatusFrontend);
    } catch (error) {
      console.error(`AdminDashboard: Error performing action ${actionPath}:`, error);
      const backendError = error.response?.data?.error || error.response?.data?.message || `Failed to ${failureMessagePrefix.toLowerCase()}.`;
      setActionError(`${failureMessagePrefix} Failed: ${backendError}`);
      if (error.response?.data?.currentStatus) {
        setElectionStatus(error.response.data.currentStatus);
      } else {
        fetchElectionStatus();
      }
    } finally {
      setActionLoading(false);
    }
  }, [currentApiName, fetchElectionStatus]);

  const handleStartElection = useCallback(() => handleElectionAction("/election/start", "Election started", "Start Election", 'RUNNING'), [handleElectionAction]);
  const handleStopElection = useCallback(() => handleElectionAction("/election/stop", "Election stopped", "Stop Election", 'STOPPED'), [handleElectionAction]);
  const handleDeclareResults = useCallback(() => handleElectionAction("/election/declare", "Results declared", "Declare Results", 'RESULTS_DECLARED'), [handleElectionAction]);

  const handleInitiateResetElection = useCallback(() => { setOpenResetDialog(true); }, []);
  const handleConfirmResetElection = useCallback(async () => {
    setOpenResetDialog(false);
    setActionLoading(true); setActionMessage(null); setActionError(null);
    if (!currentApiName) { setActionError("API Name not configured for reset."); setActionLoading(false); return; }
    try {
      const response = await API.post(currentApiName, "/election/reset", {});
      setActionMessage(response.message || "Election cycle has been reset successfully!");
      setElectionStatus(response.newStatus || 'NOT_STARTED');
      setVotingResults(null);
      setAddCandidateMessage(""); setAddCandidateError("");
    } catch (error) {
      const backendError = error.response?.data?.error || error.message || "Failed to reset.";
      setActionError(`Reset Failed: ${backendError}`);
      fetchElectionStatus();
    } finally {
      setActionLoading(false);
    }
  }, [currentApiName, fetchElectionStatus]);

  const handleTabChange = useCallback((event, newValue) => {
    setCurrentTab(newValue);
    setActionMessage(null); setActionError(null);
    setCsvUploadMessage(""); setCsvUploadError("");
    setAddCandidateMessage(""); setAddCandidateError("");

    if (newValue === 1 && (!votingResults || resultsError) && !resultsLoading) {
      fetchVotingResults();
    }
    if (newValue === 2 && !statusLoading) {
      fetchElectionStatus();
    }
  }, [fetchVotingResults, fetchElectionStatus, votingResults, resultsError, resultsLoading, statusLoading]);

  const handleExportPdf = useCallback(() => {
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
  }, [votingResults]);


  return (
    <Box component="main" id="main-content" role="main" sx={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', bgcolor: 'grey.100', py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2 }, boxSizing: 'border-box' }}>
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
            <Paper elevation={0} sx={{ p: 2, mb: 4, backgroundColor: 'primary.50', borderRadius: 2, border: theme => `1px solid ${theme.palette.primary[200]}` }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                <DashboardIcon sx={{ mr: 1 }} /> Election Overview
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                    Current Status:{' '}
                    {statusLoading ? (
                      <CircularProgress size={20} sx={{ ml: 1 }} aria-label="Loading election status" />
                    ) : (
                      <Box sx={{ ml: 1 }}><LiveStatusIndicator status={electionStatus} /></Box>
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

                {/* Role Management Section */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon sx={{ fontSize: '1.2em' }} /> Manage Roles
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add or remove election roles. Changes apply immediately.
                  </Typography>

                  {/* Existing Roles */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {availableRoles.map((role) => (
                      <motion.div
                        key={role}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                      >
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 100,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          {role}
                          <Box
                            component="button"
                            onClick={() => handleRemoveRole(role)}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: 'none',
                              bgcolor: 'rgba(255,255,255,0.3)',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              lineHeight: 1,
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                            }}
                            aria-label={`Remove ${role} role`}
                          >
                            ×
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>

                  {/* Add New Role */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      label="New Role Name"
                      value={newRoleInput}
                      onChange={(e) => setNewRoleInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRole(); } }}
                      placeholder="e.g., Treasurer"
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddRole}
                      disabled={!newRoleInput.trim()}
                      startIcon={<AddCircleOutlineIcon />}
                    >
                      Add Role
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ my: 2.5 }} />

                {/* Candidate Form */}
                <form onSubmit={handleAddCandidateSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal" required variant="outlined">
                        <InputLabel id="role-select-label">Role</InputLabel>
                        <Select labelId="role-select-label" name="role" value={candidateFormData.role} onChange={handleCandidateFormChange} label="Role">
                          {availableRoles.map((role) => (
                            <MenuItem key={role} value={role}>{role}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
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
              <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, minHeight: 200 }}>
                {resultsLoading && <ResultsSkeleton />}
                {resultsError && <Alert severity="error" sx={{ mt: 2 }}><AlertTitle>Error Loading Results</AlertTitle>{resultsError}</Alert>}
                
                {votingResults && !resultsLoading && !resultsError && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                      <Tooltip title="Export results as a PDF document">
                        <span>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleExportPdf}
                            startIcon={<PictureAsPdfIcon />}
                            disabled={!votingResults || Object.keys(votingResults).length === 0}
                          >
                            Export to PDF
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>

                    <AnimatedResults results={votingResults} />
                  </Box>
                )}
                {!votingResults && !resultsLoading && !resultsError && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <BarChartIcon sx={{ fontSize: '4rem', color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>No Results Yet</Typography>
                    <Typography variant="body2" color="text.disabled">Results will appear here once the election is stopped and declared.</Typography>
                  </Box>
                )}
              </Paper>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              {/* Manage Election Section Content */}
              <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ my: 2, p: { xs: 2, sm: 2.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="body1" component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <span style={{ fontSize: '0.95rem' }}>
                      Current Status:{' '}
                      {statusLoading ? (
                        <CircularProgress size={20} sx={{ ml: 1 }} aria-label="Loading election status" />
                      ) : (
                        <LiveStatusIndicator status={electionStatus} />
                      )}
                    </span>
                    <Tooltip title="Refresh Status">
                      <Button onClick={fetchElectionStatus} disabled={statusLoading || actionLoading} startIcon={<RefreshIcon />}>Refresh</Button>
                    </Tooltip>
                  </Typography>
                  {statusError && <Alert severity="warning" sx={{ mt: 1, textAlign: 'left' }}>{statusError}</Alert>}
                </Box>
                <Grid container spacing={2} justifyContent="center" alignItems="center">
                  <Grid item xs={12} sm={6} md={3}> <Tooltip title="Allow users to start voting"> <Button fullWidth variant="contained" color="success" onClick={handleStartElection} disabled={actionLoading || statusLoading || electionStatus === 'RUNNING' || electionStatus === 'RESULTS_DECLARED'} startIcon={<PlayArrowIcon />}> Start </Button> </Tooltip> </Grid>
                  <Grid item xs={12} sm={6} md={3}> <Tooltip title="Stop accepting new votes"> <Button fullWidth variant="outlined" color="error" onClick={handleStopElection} disabled={actionLoading || statusLoading || electionStatus !== 'RUNNING'} startIcon={<StopIcon />}> Stop </Button> </Tooltip> </Grid>
                  <Grid item xs={12} sm={6} md={3}> <Tooltip title="Make voting results public (after stopping)"> <Button fullWidth variant="outlined" color="info" onClick={handleDeclareResults} disabled={actionLoading || statusLoading || electionStatus !== 'STOPPED'} startIcon={<GavelIcon />}> Declare </Button> </Tooltip> </Grid>
                  <Grid item xs={12} sm={6} md={3}> <Tooltip title="Reset all votes and election status to NOT_STARTED"> <Button fullWidth variant="text" color="warning" onClick={handleInitiateResetElection} disabled={actionLoading || statusLoading || electionStatus === 'RUNNING'} startIcon={<RestartAltIcon />}> Reset Cycle </Button> </Tooltip> </Grid>
                </Grid>
                <AnimatePresence>
                  {(actionError || actionMessage) && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                      <Box sx={{ mt: 2.5 }}> {actionError && <Alert severity="error" sx={{ textAlign: 'left' }}>{actionError}</Alert>} {actionMessage && <Alert severity="success" sx={{ textAlign: 'left' }}>{actionMessage}</Alert>} </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
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