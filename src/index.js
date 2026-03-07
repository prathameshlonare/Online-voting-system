// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('%c RCERT Voting System ', 'background: #1976d2; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
console.log('%c Running in DEMO MODE with Mock AWS Services ', 'background: #4caf50; color: white; padding: 5px;');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
