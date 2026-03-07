// src/components/EnterOtp.js
import React, { useState } from "react";
import { Auth } from '../mocks'; // Using mock AWS services
import { TextField, Button, Typography, Container, Box, CircularProgress, Alert, Link } from "@mui/material";
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
        <Container maxWidth="sm" style={{ marginTop: "40px" }}>
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3, textAlign: 'center' }}>
                <Typography variant="h5" component="h2" gutterBottom>Confirm Your Email</Typography>
                <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>Enter the verification code sent to <strong>{email}</strong>.</Typography>
                <form onSubmit={handleVerify}>
                    <TextField label="Verification Code (OTP)" value={code} onChange={(e) => setCode(e.target.value)} fullWidth margin="normal" required disabled={loading || !!message} />
                    {error && <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{error}</Alert>}
                    {message && <Alert severity="success" sx={{ mt: 2, textAlign: 'left' }}>{message}</Alert>}
                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading || !!message} sx={{ mt: 3, mb: 2 }} >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Code"}
                    </Button>
                </form>
                <Typography variant="body2" sx={{ mt: 3 }}>
                    <Link component="button" onClick={() => navigate('/auth')} underline="hover">Back to Login/Signup</Link>
                </Typography>
            </Box>
        </Container>
    );
};

export default EnterOtp;
