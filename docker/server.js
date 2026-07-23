// docker/server.js
// HTTP wrapper for mockApi — runs inside backend container

const http = require('http');
const { mockApi } = require('./src/mocks/mockApi');

const PORT = process.env.PORT || 4000;

// ---- CORS HEADERS ----
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// ---- HELPER: Parse request body ----
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// ---- HELPER: Parse query string ----
function parseQuery(url) {
    const params = {};
    const queryStart = url.indexOf('?');
    if (queryStart === -1) return params;

    const queryString = url.slice(queryStart + 1);
    for (const pair of queryString.split('&')) {
        const [key, value] = pair.split('=');
        if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    return params;
}

// ---- ROUTE HANDLER ----
async function handleRequest(req, res) {
    const method = req.method;
    const url = req.url;
    const path = url.split('?')[0]; // strip query string
    const queryParams = parseQuery(url);

    // Handle preflight OPTIONS
    if (method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        return res.end();
    }

    try {
        const body = await parseBody(req);

        // Build options object matching mockApi expectation
        const options = {
            queryStringParameters: queryParams,
            body: body
        };

        let result;

        // ---- ROUTE MAPPING ----
        if (method === 'GET') {
            if (path === '/election/status') {
                result = await mockApi.get('voting', '/election/status', options);
            } else if (path === '/candidates') {
                result = await mockApi.get('voting', '/candidates', options);
            } else if (path === '/results') {
                result = await mockApi.get('voting', '/results', options);
            } else if (path === '/eligibility') {
                result = await mockApi.get('voting', '/eligibility', options);
            } else {
                throw { status: 404, error: 'Not found' };
            }
        }
        else if (method === 'POST') {
            if (path === '/vote') {
                result = await mockApi.post('voting', '/vote', options);
            } else if (path === '/candidates') {
                result = await mockApi.post('voting', '/candidates', options);
            } else if (path === '/election/start') {
                result = await mockApi.post('voting', '/election/start', options);
            } else if (path === '/election/stop') {
                result = await mockApi.post('voting', '/election/stop', options);
            } else if (path === '/election/declare') {
                result = await mockApi.post('voting', '/election/declare', options);
            } else if (path === '/election/reset') {
                result = await mockApi.post('voting', '/election/reset', options);
            } else if (path === '/eligibility/check') {
                result = await mockApi.post('voting', '/eligibility/check', options);
            } else {
                throw { status: 404, error: 'Not found' };
            }
        }
        else {
            throw { status: 405, error: 'Method not allowed' };
        }

        // Success response
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify(result));

    } catch (err) {
        // Error handling - mockApi throws objects with .response.status
        const status = err?.response?.status || err?.status || 500;
        const message = err?.response?.data?.error || err?.error || err?.message || 'Internal server error';

        console.error(`[ERROR] ${method} ${path} → ${status}: ${message}`);

        res.writeHead(status, corsHeaders);
        res.end(JSON.stringify({ error: message }));
    }
}

// ---- START SERVER ----
const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mock backend running on http://0.0.0.0:${PORT}`);
    console.log('Endpoints:');
    console.log('  GET  /election/status');
    console.log('  GET  /candidates');
    console.log('  GET  /results');
    console.log('  GET  /eligibility?student_id=STU001');
    console.log('  POST /vote');
    console.log('  POST /candidates');
    console.log('  POST /election/start');
    console.log('  POST /election/stop');
    console.log('  POST /election/declare');
    console.log('  POST /election/reset');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    server.close(() => process.exit(0));
});