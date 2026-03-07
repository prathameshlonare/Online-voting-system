// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Auth, Hub } from "./mocks"; // Using mock AWS services
import { Container, CircularProgress, Box, Typography } from "@mui/material";

import AuthForm from "./components/AuthForm";
import VoteForm from "./components/VoteForm";
import EnterOtp from "./components/EnterOtp";
import AdminDashboard from "./components/AdminDashboard";
import WelcomePage from "./components/WelcomePage"; // ✅ Import WelcomePage

const VOTE_API_NAME = "voteApi";

const AUTH_STATES = {
  LOADING: "LOADING",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  NEEDS_CONFIRMATION: "NEEDS_CONFIRMATION",
};

function App() {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmingUserEmail, setConfirmingUserEmail] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [token, setToken] = useState(null);

  const checkAdminStatus = async () => {
    try {
      const session = await Auth.currentSession();
      const idTokenPayload = session.getIdToken().payload;
      const userGroups = idTokenPayload["cognito:groups"] || [];
      return userGroups.includes("admin");
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkAuthState = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser({ bypassCache: true });
        const session = await Auth.currentSession();
        const idToken = session.getIdToken();
        const attributes = user.attributes;

        const userIsAdmin = await checkAdminStatus();

        if (isMounted) {
          setStudentId(attributes["custom:student_id"]);
          setToken(idToken.getJwtToken());
          setIsAdmin(userIsAdmin);
          setAuthState(AUTH_STATES.AUTHENTICATED);
          setConfirmingUserEmail(null);
        }
      } catch (err) {
        if (isMounted) {
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          setIsAdmin(false);
          setStudentId(null);
          setToken(null);
          setConfirmingUserEmail(null);
        }
      }
    };

    checkAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const listener = async (data) => {
      const { payload } = data;

      switch (payload.event) {
        case "signIn":
        case "autoSignIn":
          try {
            const user = payload.data;
            const session = await Auth.currentSession();
            const idToken = session.getIdToken();
            const attributes = await Auth.userAttributes(user);

            const attributeMap = {};
            attributes.forEach(attr => {
              attributeMap[attr.Name] = attr.Value;
            });

            const userIsAdmin = await checkAdminStatus();

            setStudentId(attributeMap["custom:student_id"]);
            setToken(idToken.getJwtToken());
            setIsAdmin(userIsAdmin);
            setAuthState(AUTH_STATES.AUTHENTICATED);
            setConfirmingUserEmail(null);
          } catch (error) {
            setAuthState(AUTH_STATES.UNAUTHENTICATED);
            setIsAdmin(false);
            setStudentId(null);
            setToken(null);
            setConfirmingUserEmail(null);
          }
          break;

        case "signOut":
        case "autoSignIn_failure":
        case "signIn_failure":
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          setIsAdmin(false);
          setStudentId(null);
          setToken(null);
          setConfirmingUserEmail(null);
          break;

        case "signUp":
          setConfirmingUserEmail(payload.data.user.username);
          setAuthState(AUTH_STATES.NEEDS_CONFIRMATION);
          setIsAdmin(false);
          setStudentId(null);
          setToken(null);
          break;

        case "confirmSignUp":
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          setConfirmingUserEmail(null);
          setIsAdmin(false);
          setStudentId(null);
          setToken(null);
          break;

        default:
          break;
      }
    };

    const unsubscribe = Hub.listen("auth", listener);
    return () => unsubscribe();
  }, []);

  if (authState === AUTH_STATES.LOADING) {
    return (
      <Container maxWidth="sm" style={{ marginTop: "50px" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", height: "80vh", justifyContent: "center" }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Initializing Application...</Typography>
        </Box>
      </Container>
    );
  }

  const getRedirectPath = () => {
    if (authState === AUTH_STATES.AUTHENTICATED) {
      return isAdmin ? "/admin-dashboard" : "/vote";
    } else if (authState === AUTH_STATES.NEEDS_CONFIRMATION) {
      return "/confirm";
    } else {
      return "/auth";
    }
  };

  const defaultRedirectPath = getRedirectPath();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />

        <Route
          path="/auth"
          element={
            authState === AUTH_STATES.UNAUTHENTICATED || authState === AUTH_STATES.NEEDS_CONFIRMATION ? (
              <AuthForm />
            ) : (
              <Navigate to={defaultRedirectPath} replace />
            )
          }
        />
        <Route
          path="/confirm"
          element={
            authState === AUTH_STATES.NEEDS_CONFIRMATION && confirmingUserEmail ? (
              <EnterOtp email={confirmingUserEmail} />
            ) : (
              <Navigate to={defaultRedirectPath} replace />
            )
          }
        />
        <Route
          path="/vote"
          element={
            authState === AUTH_STATES.AUTHENTICATED && !isAdmin ? (
              studentId && token ? (
                <VoteForm studentId={studentId} apiName={VOTE_API_NAME} />
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Loading vote form...</Typography>
                </Box>
              )
            ) : (
              <Navigate to={defaultRedirectPath} replace />
            )
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            authState === AUTH_STATES.AUTHENTICATED && isAdmin ? (
              <AdminDashboard apiName={VOTE_API_NAME} />
            ) : authState === AUTH_STATES.AUTHENTICATED ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading admin dashboard...</Typography>
              </Box>
            ) : (
              <Navigate to={defaultRedirectPath} replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
