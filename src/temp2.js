//current code


// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Amplify, API, Auth } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure(awsExports);


const apiConfigWithCustomHeader = {
    API: {
        endpoints: [
            {
                name: "voteApi",
                endpoint: awsExports.API.endpoints[0].endpoint, 
                region: awsExports.API.endpoints[0].region,  

                custom_header: async () => {
                    console.log("index.js: Attempting to add custom Authorization header..."); 
                    try {
                        const session = await Auth.currentSession(); 
                        const idToken = session.getIdToken().getJwtToken();
                        if (idToken) {
                            console.log("index.js: Custom Header - ID Token found, adding header.");
                            return { Authorization: `Bearer ${idToken}` }; 
                            console.warn("index.js: Custom Header - ID Token is null/empty after getting session.");
                            return {}; 
                        }
                    } catch (e) {
                        console.log("index.js: Custom Header - No active session or error getting token.", e);
                        return {}; 
                    }
                }
            }
        ]
    }
};
Amplify.configure(apiConfigWithCustomHeader); 


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);