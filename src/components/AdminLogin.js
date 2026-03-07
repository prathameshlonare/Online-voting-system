// src/components/AdminLogin.js
import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import { TextField, Button, Container, Typography } from '@mui/material';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Send login request to Cognito to initiate MFA
      await Auth.signIn(email, password);
      setIsCodeSent(true);
      setMessage('OTP sent to your email.');
    } catch (error) {
      setLoading(false);
      setMessage(error.message);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Verify the OTP (code sent to email)
      await Auth.confirmSignIn(email, code, 'SMS_MFA');
      setMessage('Login successful!');
      // Redirect to admin dashboard or home page after successful login
    } catch (error) {
      setLoading(false);
      setMessage(error.message);
    }
  };

  return (
    <Container maxWidth="xs">
      <Typography variant="h5" gutterBottom>Admin Login</Typography>
      {!isCodeSent ? (
        <form onSubmit={handleEmailPasswordSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Login'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <TextField
            label="OTP"
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Verifying OTP...' : 'Verify OTP'}
          </Button>
        </form>
      )}
      {message && <Typography color="error">{message}</Typography>}
    </Container>
  );
};

export default AdminLogin;
