// src/components/AuthForm.js
import React, { useState, useEffect } from "react";
import { Auth } from "../mocks"; // Using mock AWS services
import { useNavigate } from "react-router-dom";

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Container from '@mui/material/Container';
import Fade from '@mui/material/Fade';
import { useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import VpnKeyIcon from '@mui/icons-material/VpnKey';


const AuthForm = () => {
  const navigate = useNavigate();
  // --- State Variables ---
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    studentId: "",
    mobileNumber: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [userNeedingNewPassword, setUserNeedingNewPassword] = useState(null);
  const [forceChangeNewPassword, setForceChangeNewPassword] = useState("");
  const [forceChangeConfirmNewPassword, setForceChangeConfirmNewPassword] = useState("");
  const [showFcNewPass, setShowFcNewPass] = useState(false);
  const [showFcConfirmNewPass, setShowFcConfirmNewPass] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState("sendCode");
  const [forgotPasswordCode, setForgotPasswordCode] = useState("");
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState("");
  const [forgotPasswordConfirmNewPassword, setForgotPasswordConfirmNewPassword] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [showFpNewPass, setShowFpNewPass] = useState(false);
  const [showFpConfirmPass, setShowFpConfirmPass] = useState(false);

  const [showMainPassword, setShowMainPassword] = useState(false);
  const [showMainConfirmPassword, setShowMainConfirmPassword] = useState(false);

  const [startAnimation, setStartAnimation] = useState(false);
  const theme = useTheme(); // Theme hook

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAnimation(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Generic change handler for main form
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
  };



  const handleForceChangeNewPasswordChange = (e) => {
    if (e.target.name === "forceChangeNewPassword") {
      setForceChangeNewPassword(e.target.value);
    } else if (e.target.name === "forceChangeConfirmNewPassword") {
      setForceChangeConfirmNewPassword(e.target.value);
    }
    setError("");
  };


  const handleForgotPasswordChange = (e) => {
    const { name, value } = e.target;
    if (name === "forgotPasswordEmail") {
      setFormData({ ...formData, email: value });
    } else if (name === "forgotPasswordCode") {
      setForgotPasswordCode(value);
    } else if (name === "forgotPasswordNewPassword") {
      setForgotPasswordNewPassword(value);
    } else if (name === "forgotPasswordConfirmNewPassword") {
      setForgotPasswordConfirmNewPassword(value);
    }
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    setError("");
    setSuccess("");
  };

  const resetFlows = () => {
    setNeedsNewPassword(false);
    setUserNeedingNewPassword(null);
    setForceChangeNewPassword("");
    setForceChangeConfirmNewPassword("");
    setShowFcNewPass(false);
    setShowFcConfirmNewPass(false);

    setShowForgotPassword(false);
    setForgotPasswordStep("sendCode");
    setForgotPasswordCode("");
    setForgotPasswordNewPassword("");
    setForgotPasswordConfirmNewPassword("");
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    setShowFpNewPass(false);
    setShowFpConfirmPass(false);

    setShowMainPassword(false);
    setShowMainConfirmPassword(false);

    setError("");
    setSuccess("");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetFlows();

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError("Please enter email and password.");
        setLoading(false);
        return;
      }
      try {
        const user = await Auth.signIn(formData.email, formData.password);
        if (user.challengeName === "NEW_PASSWORD_REQUIRED") {
          setNeedsNewPassword(true);
          setUserNeedingNewPassword(user);
          setError("Please set a new password to continue.");
          return;
        }
        setSuccess("Login successful. Redirecting...");
      } catch (err) {
        console.error("Login error:", err);
        if (err.code === "UserNotConfirmedException") {
          setError("Account not confirmed.");
          setSuccess("Redirecting to confirmation page...");
          try {
            await Auth.resendSignUpCode(formData.email);
          } catch (resendErr) {
            console.error("Error resending code during login:", resendErr);
            setError("Account not confirmed. Failed to resend code automatically.");
          }
        } else if (err.code === "PasswordResetRequiredException") {
          setNeedsNewPassword(true);
          setUserNeedingNewPassword({ username: formData.email });
          setError("Password reset required. Please set a new password.");
        } else if (err.code === "NotAuthorizedException") {
          setError("Invalid email or password.");
        } else if (err.code === "UserNotFoundException") {
          setError("User with this email does not exist.");
        } else {
          setError(err.message || "Error logging in");
        }
        setLoading(false);
      }

    } else {
      const { email, password, confirmPassword, name, studentId, mobileNumber } = formData;
      if (!email || !password || !confirmPassword || !name || !studentId || !mobileNumber) {
        setError("Please fill in all fields for signup.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        setLoading(false);
        return;
      }

      try {
        await Auth.signUp({
          username: email,
          password,
          attributes: {
            email,
            name,
            "custom:student_id": studentId,
            "custom:mobile_number": mobileNumber,
          },
        });
        setSuccess("Signup successful! Redirecting to email confirmation...");
        setTimeout(() => {
          navigate("/confirm", { state: { email } });
        }, 1500);
      } catch (err) {
        console.error("Signup error:", err);
        if (err.code === 'UsernameExistsException') {
          setError("An account with this email already exists.");
        } else if (err.code === 'InvalidPasswordException') {
          setError("Password does not meet requirements. " + err.message);
        } else if (err.code === 'InvalidParameterException') {
          setError("Invalid input: " + err.message);
        } else {
          setError(err.message || "Error signing up");
        }
        setLoading(false);
      }
    }
  };

  const handleSetForceChangeNewPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!userNeedingNewPassword || !forceChangeNewPassword || !forceChangeConfirmNewPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }
    if (forceChangeNewPassword !== forceChangeConfirmNewPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }
    if (forceChangeNewPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }
    try {
      await Auth.completeNewPassword(userNeedingNewPassword, forceChangeNewPassword, {});
      setSuccess("Password successfully changed! Please login with your new password.");
      resetFlows();
      setFormData({ ...formData, password: "" });
      setIsLogin(true);
    } catch (err) {
      console.error("Error setting new password (force change):", err);
      if (err.code === 'InvalidPasswordException') {
        setError("New password does not meet requirements. " + err.message);
      } else if (err.code === "NotAuthorizedException") {
        setError("Session expired or invalid. Please try logging in again.");
        resetFlows();
        setIsLogin(true);
      }
      else {
        setError(err.message || "Failed to set new password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowForgotPassword = (e) => {
    e.preventDefault();
    resetFlows();
    setShowForgotPassword(true);
    setForgotPasswordStep("sendCode");
    setFormData({ ...formData, email: "", password: "" });
    setIsLogin(true);
  };

  const handleCancelForgotPassword = () => {
    resetFlows();
    setFormData({ ...formData, password: "" });
    setIsLogin(true);
  };

  const handleForgotPasswordSendCode = async (e) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    setForgotPasswordLoading(true);
    const emailForForgotPassword = formData.email;
    if (!emailForForgotPassword) {
      setForgotPasswordError("Please enter your email address.");
      setForgotPasswordLoading(false);
      return;
    }
    try {
      await Auth.forgotPassword(emailForForgotPassword);
      setForgotPasswordSuccess("Verification code sent to your email.");
      setForgotPasswordStep("setNewPassword");
    } catch (err) {
      console.error("Forgot password (send code) error:", err);
      if (err.code === "UserNotFoundException") {
        setForgotPasswordError("User with this email does not exist.");
      } else if (err.code === "LimitExceededException") {
        setForgotPasswordError("Attempt limit exceeded. Please try again later.");
      } else {
        setForgotPasswordError(err.message || "Failed to send verification code.");
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    setForgotPasswordLoading(true);
    const emailForSubmit = formData.email;
    if (!emailForSubmit || !forgotPasswordCode || !forgotPasswordNewPassword || !forgotPasswordConfirmNewPassword) {
      setForgotPasswordError("Please fill in code and new password fields.");
      setForgotPasswordLoading(false);
      return;
    }
    if (forgotPasswordNewPassword !== forgotPasswordConfirmNewPassword) {
      setForgotPasswordError("New passwords do not match.");
      setForgotPasswordLoading(false);
      return;
    }
    if (forgotPasswordNewPassword.length < 8) {
      setForgotPasswordError("Password must be at least 8 characters long.");
      setForgotPasswordLoading(false);
      return;
    }
    try {
      await Auth.forgotPasswordSubmit(
        emailForSubmit,
        forgotPasswordCode,
        forgotPasswordNewPassword
      );
      setForgotPasswordSuccess("");
      setSuccess("Password reset successfully! You can now log in.");
      resetFlows();
      setFormData({ ...formData, password: "" });
      setIsLogin(true);
    } catch (err) {
      console.error("Forgot password (submit) error:", err);
      if (err.code === 'CodeMismatchException') {
        setForgotPasswordError("Invalid verification code.");
        setForgotPasswordCode("");
      } else if (err.code === 'ExpiredCodeException') {
        setForgotPasswordError("Verification code has expired. Please request a new one.");
        setForgotPasswordStep('sendCode');
        setForgotPasswordCode("");
        setForgotPasswordNewPassword("");
        setForgotPasswordConfirmNewPassword("");
      } else if (err.code === 'InvalidPasswordException') {
        setForgotPasswordError("New password does not meet requirements. " + err.message);
      } else if (err.code === 'LimitExceededException') {
        setForgotPasswordError("Attempt limit exceeded. Please try again later.");
      } else {
        setForgotPasswordError(err.message || "Failed to reset password.");
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetFlows();
    setFormData({
      email: "", password: "", confirmPassword: "", name: "", studentId: "", mobileNumber: "",
    });
  };

  return (
    <Box // Page container for background and centering
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100', // Keep plain background for simplicity
        py: { xs: 2, sm: 3, md: 4 },
        px: 2,
        overflow: 'hidden', // Hide overflow during potential animations
      }}
    >
      {/* Main form card container with animation */}
      <Fade in={startAnimation} timeout={700}>
        <Container component="main" id="main-content" maxWidth="sm" disableGutters sx={{ boxSizing: 'border-box' }}>
          <Paper // Form card itself
            elevation={6}
            role="form"
            aria-label="Authentication form"
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'background.paper',
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: '16px',
              boxShadow: '0px 12px 30px rgba(0,0,0,0.15)',
              boxSizing: 'border-box',
            }}
          >
            {/* --- Render Force Change Password Form --- */}
            {needsNewPassword ? (
              <form onSubmit={handleSetForceChangeNewPassword} style={{ width: '100%', boxSizing: 'border-box' }}>
                <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 2.5, fontWeight: 'bold', color: theme.palette.text.primary }}>
                  Set New Password
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom align="center" sx={{ mb: 2.5 }}>
                  Your account requires a password change. Please set a new password.
                </Typography>
                <TextField
                  label="New Password"
                  type={showFcNewPass ? "text" : "password"}
                  name="forceChangeNewPassword"
                  value={forceChangeNewPassword}
                  onChange={handleForceChangeNewPasswordChange}
                  fullWidth margin="normal" required variant="outlined"
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowFcNewPass(!showFcNewPass)} edge="end" aria-label="toggle password visibility">
                          {showFcNewPass ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirm New Password"
                  type={showFcConfirmNewPass ? "text" : "password"}
                  name="forceChangeConfirmNewPassword"
                  value={forceChangeConfirmNewPassword}
                  onChange={handleForceChangeNewPasswordChange}
                  fullWidth margin="normal" required variant="outlined"
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>),
                    endAdornment: (<InputAdornment position="end"> <IconButton onClick={() => setShowFcConfirmNewPass(!showFcConfirmNewPass)} edge="end" aria-label="toggle password visibility"> {showFcConfirmNewPass ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment>),
                  }}
                />
                {error && <Alert severity="error" role="alert" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                {success && <Alert severity="success" role="status" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}
                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, py: 1.5, textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }} disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Set New Password"}
                </Button>
                <Typography variant="body2" align="center" sx={{ mt: 2.5 }}>
                  <Link component="button" onClick={() => { resetFlows(); setIsLogin(true); }} underline="hover" color="text.secondary">
                    Cancel
                  </Link>
                </Typography>
              </form>
            ) :

              /* --- Render Forgot Password Forms --- */
              showForgotPassword ? (
                <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
                  <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 2.5, fontWeight: 'bold', color: theme.palette.text.primary }}>
                    Forgot Password
                  </Typography>
                  {forgotPasswordStep === "sendCode" ? (
                    <form onSubmit={handleForgotPasswordSendCode} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom align="center" sx={{ mb: 2.5 }}>
                        Enter your email to receive a verification code.
                      </Typography>
                      <TextField label="Email" type="email" name="forgotPasswordEmail"
                        value={formData.email} onChange={handleForgotPasswordChange}
                        fullWidth margin="normal" required variant="outlined"
                        InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>), }}
                      />
                      {forgotPasswordError && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{forgotPasswordError}</Alert>}
                      {forgotPasswordSuccess && <Alert severity="info" sx={{ mt: 2, width: '100%' }}>{forgotPasswordSuccess}</Alert>}
                      <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, py: 1.5, textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }} disabled={forgotPasswordLoading}>
                        {forgotPasswordLoading ? <CircularProgress size={24} color="inherit" /> : "Send Code"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPasswordSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom align="center" sx={{ mb: 2.5 }}>
                        Enter the code sent to <strong>{formData.email}</strong> and set a new password.
                      </Typography>
                      <TextField label="Verification Code" type="text" name="forgotPasswordCode"
                        value={forgotPasswordCode} onChange={handleForgotPasswordChange}
                        fullWidth margin="normal" required variant="outlined"
                        InputProps={{ startAdornment: (<InputAdornment position="start"><VpnKeyIcon color="action" /></InputAdornment>), }}
                      />
                      <TextField label="New Password" type={showFpNewPass ? "text" : "password"} name="forgotPasswordNewPassword"
                        value={forgotPasswordNewPassword} onChange={handleForgotPasswordChange}
                        fullWidth margin="normal" required variant="outlined"
                        InputProps={{
                          startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>),
                          endAdornment: (<InputAdornment position="end"> <IconButton onClick={() => setShowFpNewPass(!showFpNewPass)} edge="end" aria-label="toggle password visibility"> {showFpNewPass ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment>),
                        }}
                      />
                      <TextField label="Confirm New Password" type={showFpConfirmPass ? "text" : "password"} name="forgotPasswordConfirmNewPassword"
                        value={forgotPasswordConfirmNewPassword} onChange={handleForgotPasswordChange}
                        fullWidth margin="normal" required variant="outlined"
                        InputProps={{
                          startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>),
                          endAdornment: (<InputAdornment position="end"> <IconButton onClick={() => setShowFpConfirmPass(!showFpConfirmPass)} edge="end" aria-label="toggle password visibility"> {showFpConfirmPass ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment>),
                        }}
                      />
                      {forgotPasswordError && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{forgotPasswordError}</Alert>}
                      {/* Success message handled by main success state after completion */}
                      <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, py: 1.5, textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }} disabled={forgotPasswordLoading}>
                        {forgotPasswordLoading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
                      </Button>
                    </form>
                  )}
                  <Typography variant="body2" align="center" sx={{ mt: 2.5 }}>
                    <Link component="button" onClick={handleCancelForgotPassword} underline="hover" color="text.secondary">
                      Back to Login
                    </Link>
                  </Typography>
                </Box>
              ) :

                /* --- Render Main Login/Signup Form --- */
                (
                  <form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
                    <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.text.primary }}>
                      {isLogin ? "Welcome Back!" : "Create Account"}
                    </Typography>

                    {!isLogin && (
                      <>
                        <TextField label="Name" type="text" name="name" value={formData.name} onChange={handleChange} fullWidth margin="normal" required variant="outlined" InputProps={{ startAdornment: (<InputAdornment position="start"><PersonOutlineIcon color="action" /></InputAdornment>), }} />
                        <TextField label="Student ID" type="text" name="studentId" value={formData.studentId} onChange={handleChange} fullWidth margin="normal" required variant="outlined" helperText="Enter your official Student ID" InputProps={{ startAdornment: (<InputAdornment position="start"><BadgeOutlinedIcon color="action" /></InputAdornment>), }} />
                        <TextField label="Mobile Number" type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} fullWidth margin="normal" required variant="outlined" helperText="Include country code if applicable" InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneOutlinedIcon color="action" /></InputAdornment>), }} />
                      </>
                    )}

                    <TextField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} fullWidth margin="normal" required variant="outlined" InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>), }} />
                    <TextField label="Password" type={showMainPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} fullWidth margin="normal" required variant="outlined" InputProps={{ startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>), endAdornment: (<InputAdornment position="end"> <IconButton onClick={() => setShowMainPassword(!showMainPassword)} edge="end" aria-label="toggle password visibility"> {showMainPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment>), }} />

                    {!isLogin && (
                      <TextField label="Confirm Password" type={showMainConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} fullWidth margin="normal" required variant="outlined" InputProps={{ startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>), endAdornment: (<InputAdornment position="end"> <IconButton onClick={() => setShowMainConfirmPassword(!showMainConfirmPassword)} edge="end" aria-label="toggle password visibility"> {showMainConfirmPassword ? <VisibilityOff /> : <Visibility />} </IconButton> </InputAdornment>), }}/>
                    )}

                    {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}

                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, py: 1.5, textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }} disabled={loading}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? "Login" : "Signup")}
                    </Button>

                    <Typography variant="body2" align="center" sx={{ mt: 2.5 }}>
                      {isLogin ? "Don't have an account?" : "Already have an account?"}
                      <Link component="button" onClick={toggleMode} sx={{ ml: 0.5, fontWeight: 'medium' }} underline="hover">
                        {isLogin ? "Signup" : "Login"}
                      </Link>
                    </Typography>

                    {isLogin && (
                      <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                        <Link component="button" onClick={handleShowForgotPassword} underline="hover" color="text.secondary">
                          Forgot Password?
                        </Link>
                      </Typography>
                    )}
                  </form>
                )}
          </Paper>
        </Container>
      </Fade>
    </Box >
  );
};

export default AuthForm;