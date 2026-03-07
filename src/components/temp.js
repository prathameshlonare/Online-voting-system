//current code

// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Auth, Hub } from "aws-amplify";
import { Container, CircularProgress, Box, Typography } from "@mui/material";

import AuthForm from "./components/AuthForm";
import VoteForm from "./components/VoteForm";
import EnterOtp from "./components/EnterOtp"; // Keep this for the /confirm route
import AdminDashboard from "./components/AdminDashboard";

// Define API Name (must match your Amplify configuration)
const VOTE_API_NAME = "voteApi"; // <-- *** REPLACE 'voteApi' WITH YOUR ACTUAL API NAME ***

const AUTH_STATES = {
  LOADING: "LOADING",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  NEEDS_CONFIRMATION: "NEEDS_CONFIRMATION",
};

function App() {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING); // Start as LOADING
  const [isAdmin, setIsAdmin] = useState(false);
  // No need for separate isLoading state, use AUTH_STATES.LOADING
  const [confirmingUserEmail, setConfirmingUserEmail] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [token, setToken] = useState(null);

  const checkAdminStatus = async () => {
    try {
      const session = await Auth.currentSession();
      const idTokenPayload = session.getIdToken().payload;
      const userGroups = idTokenPayload["cognito:groups"] || [];
      console.log("User groups:", userGroups);
      return userGroups.includes("admin"); // Ensure 'admin' group exists in Cognito
    } catch (error) {
      // This can happen if session expires between checks
      console.error("Error checking admin status (session likely invalid):", error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    console.log("Initial effect running: Checking auth state...");

    const checkAuthState = async () => {
      try {
        const session = await Auth.currentSession();
        const idToken = session.getIdToken();
        const jwtToken = idToken.getJwtToken();
        console.log("App.js Check - Session OK:", !!session);
        console.log("App.js Check - ID Token OK:", !!idToken);
        console.log("App.js Check - JWT Token exists:", !!jwtToken); // Must be true
        if (jwtToken) {
          console.log("App.js Check - JWT Snippet:", jwtToken.substring(0, 15) + "...");
          setToken(jwtToken); // Ensure this is called
        } else {
          console.error("!!! App.js Check - JWT Token is NULL or EMPTY after getting session !!!");
          setToken(null);
        }
        // ... rest ...
      } catch (sessionError) {
        console.error("App.js Check - Error getting session or token:", sessionError);
        setToken(null);
        // Set auth state to unauthenticated if session fails
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
        setIsAdmin(false);
        setStudentId(null);
      }
      try {
        const user = await Auth.currentAuthenticatedUser({ bypassCache: true }); // bypassCache helps get fresh data
        const session = await Auth.currentSession();
        const idToken = session.getIdToken();
        const attributes = user.attributes;

        if (isMounted) {
          console.log("User is authenticated:", user.username);
          const userIsAdmin = await checkAdminStatus();
          console.log("Is Admin:", userIsAdmin);

          setStudentId(attributes["custom:student_id"]);
          setToken(idToken.getJwtToken());
          setIsAdmin(userIsAdmin);
          setAuthState(AUTH_STATES.AUTHENTICATED); // Set final state AFTER other updates
          setConfirmingUserEmail(null); // Clear confirmation email if authenticated
        }
      } catch (err) {
        // This catch block means the user is NOT authenticated
        if (isMounted) {
          console.log("User is not authenticated:", err);
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          setIsAdmin(false);
          setStudentId(null);
          setToken(null);
          setConfirmingUserEmail(null); // Clear confirmation email
        }
      }
      // No finally block needed here, state is set in try/catch
    };

    checkAuthState();

    return () => {
      console.log("Initial effect cleanup.");
      isMounted = false;
    };
  }, []); // Empty dependency array - run once on mount

  useEffect(() => {
    const listener = async (data) => {
      const { payload } = data;
      console.log("Auth event:", payload.event, payload.data);

      switch (payload.event) {
        case "signIn":
        case "autoSignIn": {
          // This can be autoSignIn or regular signIn
          // Need to re-check admin status and get attributes
          try {
            const user = payload.data; // User object might be directly in payload
            const session = await Auth.currentSession();
            const idToken = session.getIdToken();
            const attributes = await Auth.userAttributes(user); // Fetch attributes

            // Convert attributes array to object map if needed
            const attributeMap = {};
            attributes.forEach(attr => {
              attributeMap[attr.Name] = attr.Value;
            });

            const userIsAdmin = await checkAdminStatus();
            console.log("Hub Sign In - Is Admin:", userIsAdmin);
            console.log("Hub Sign In - Attributes:", attributeMap);

            setStudentId(attributeMap["custom:student_id"]);
            setToken(idToken.getJwtToken());
            setIsAdmin(userIsAdmin);
            setAuthState(AUTH_STATES.AUTHENTICATED);
            setConfirmingUserEmail(null);
          } catch (error) {
            console.error("Error processing signIn/autoSignIn event:", error);
            // Fallback to unauthenticated if processing fails
            setAuthState(AUTH_STATES.UNAUTHENTICATED);
            setIsAdmin(false);
            setStudentId(null);
            setToken(null);
            setConfirmingUserEmail(null);
          }
          break;
        }
        case "signOut":
        case "autoSignIn_failure":
        case "signIn_failure": // Handle sign-in failures explicitly
          console.log("Hub Sign Out / Sign In Failure");
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          setIsAdmin(false);
          setStudentId(null);
          setToken(null);
          setConfirmingUserEmail(null);
          break;
        case "signUp":
          // User signed up, needs confirmation
          console.log("Hub Sign Up - Needs Confirmation:", payload.data.user.username);
          // Store the email of the user needing confirmation
          setConfirmingUserEmail(payload.data.user.username);
          setAuthState(AUTH_STATES.NEEDS_CONFIRMATION);
          setIsAdmin(false);
          setStudentId(null);
          setToken(null);
          break;
        case "confirmSignUp":
          // User confirmed, should go back to login
          console.log("Hub Confirm Sign Up - Go to Login");
          setAuthState(AUTH_STATES.UNAUTHENTICATED); // Set to unauthenticated to show login
          setConfirmingUserEmail(null); // Clear confirmation email
          setIsAdmin(false);
          setStudentId(null);
          setToken(null);
          // Navigation to /auth will happen automatically due to state change
          break;
        // Handle configuration separately if needed
        // case 'configured':
        //   console.log('Amplify configured');
        //   // You might re-trigger checkAuthState here if needed
        //   break;
        default:
          break;
      }
    };

    const authListener = Hub.listen("auth", listener);
    console.log("Hub listener attached.");

    // Clean up the listener when the component unmounts
    return () => {
      console.log("Removing Hub listener.");
      authListener(); // Hub.remove is deprecated, call the unsubscribe function directly
    };
  }, []); // Empty dependency array, listener setup once

  // --- Loading State ---
  if (authState === AUTH_STATES.LOADING) {
    return (
      <Container maxWidth="sm" style={{ marginTop: "50px" }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Initializing Application...</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            (Checking authentication status)
          </Typography>
        </Box>
      </Container>
    );
  }

  // --- Routing Logic ---
  const getRedirectPath = (currentAuthState, userIsAdmin) => {
    if (currentAuthState === AUTH_STATES.AUTHENTICATED) {
      return userIsAdmin ? "/admin-dashboard" : "/vote";
    } else if (currentAuthState === AUTH_STATES.NEEDS_CONFIRMATION) {
      // If confirmation is needed, always redirect to /confirm
      return "/confirm";
    } else {
      // Unauthenticated goes to login
      return "/auth";
    }
  };

  const defaultRedirectPath = getRedirectPath(authState, isAdmin);
  // Log current state and redirect path for debugging
  console.log(`Current State: ${authState}, IsAdmin: ${isAdmin}, Default Redirect: ${defaultRedirectPath}`);

  return (
    <Router>
      <Container maxWidth="sm" style={{ marginTop: "50px" }}>
        <Routes>
          <Route
            path="/auth"
            element={
              // Show AuthForm ONLY if unauthenticated
              authState === AUTH_STATES.UNAUTHENTICATED ? (
                <AuthForm />
              ) : (
                // Otherwise, navigate away based on current state
                <Navigate to={defaultRedirectPath} replace />
              )
            }
          />
          <Route
            path="/confirm"
            element={
              // Show OTP form ONLY if confirmation is needed AND we have the email
              authState === AUTH_STATES.NEEDS_CONFIRMATION && confirmingUserEmail ? (
                <EnterOtp email={confirmingUserEmail} />
              ) : (
                // Otherwise, navigate away
                <Navigate to={defaultRedirectPath} replace />
              )
            }
          />
          <Route
            path="/vote"
            element={
              // Show VoteForm ONLY if authenticated AND not admin
              authState === AUTH_STATES.AUTHENTICATED && !isAdmin && studentId && token ? (
                <VoteForm studentId={studentId} token={token} apiName={VOTE_API_NAME} /> // Pass API Name
              ) : (
                // Otherwise, navigate away
                <Navigate to={defaultRedirectPath} replace />
              )
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              // Show AdminDashboard ONLY if authenticated AND admin
              authState === AUTH_STATES.AUTHENTICATED && isAdmin ? (
                <AdminDashboard apiName={VOTE_API_NAME} /> // Pass API Name if needed
              ) : (
                // Otherwise, navigate away
                <Navigate to={defaultRedirectPath} replace />
              )
            }
          />
          {/* Default route: Navigate based on current state */}
          <Route
            path="/"
            element={<Navigate to={defaultRedirectPath} replace />}
          />
          {/* Catch-all route: Navigate based on current state */}
          <Route
            path="*"
            element={<Navigate to={defaultRedirectPath} replace />}
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;