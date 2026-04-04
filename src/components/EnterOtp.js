// src/components/EnterOtp.js
import React, { useState } from "react";
import { Auth } from '../mocks';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useNavigate, useLocation } from "react-router-dom";

const EnterOtp = ({ email: propEmail }) => {
    const location = useLocation();
    const email = propEmail || location.state?.email;
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true); setMessage(""); setError("");
        if (!code) { setError("Please enter the verification code."); setLoading(false); return; }
        try {
            await Auth.confirmSignUp(email, code);
            setMessage("Email verified successfully! Please login.");
            setTimeout(() => { navigate("/auth"); }, 2000);
        } catch (err) {
            console.error("Confirmation error:", err);
            if (err.code === 'CodeMismatchException') { setError("Invalid verification code. Please try again."); setCode(""); }
            else if (err.code === 'ExpiredCodeException') { setError("Verification code has expired. Please sign up again or contact support."); }
            else if (err.code === 'NotAuthorizedException') { setMessage("Account is already confirmed. Redirecting to login..."); setTimeout(() => navigate("/auth"), 2000); }
            else if (err.code === 'LimitExceededException') { setError("Attempt limit exceeded. Please try again later."); }
            else { setError(err.message || "Error confirming email. Please try again."); }
        } finally { setLoading(false); }
    };

    return (
        <Container component="main" id="main-content" maxWidth="sm" sx={{ mt: { xs: 2, sm: 5 }, px: 2 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <VpnKeyIcon sx={{ fontSize: '3rem', color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" component="h1" gutterBottom>
                        Confirm Your Email
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Enter the verification code sent to <strong>{email}</strong>.
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Form */}
                <form onSubmit={handleVerify}>
                    <TextField
                        label="Verification Code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        disabled={loading || !!message}
                        inputProps={{ maxLength: 6, pattern: '[0-9]*', inputMode: 'numeric' }}
                        helperText="Enter the 6-digit code from your email"
                    />
                    {error && <Alert severity="error" role="alert" sx={{ mt: 2 }}>{error}</Alert>}
                    {message && <Alert severity="success" role="status" sx={{ mt: 2 }}>{message}</Alert>}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={loading || !!message}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Code"}
                    </Button>
                </form>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Link component="button" onClick={() => navigate('/auth')} underline="hover">
                        Back to Login/Signup
                    </Link>
                </Box>
            </Paper>
        </Container>
    );
};

export default EnterOtp;
