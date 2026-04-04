// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import App from './App';

console.log('%c RCERT Voting System ', 'background: #1565C0; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
console.log('%c Running in DEMO MODE with Mock AWS Services ', 'background: #2E7D32; color: white; padding: 5px;');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </React.StrictMode>
);
