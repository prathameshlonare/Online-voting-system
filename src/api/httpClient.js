// src/api/httpClient.js
// Real HTTP client for backend API calls (used in Docker/production)

const getBaseUrl = () => {
  // In Docker: REACT_APP_API_URL is baked at build time
  // In dev: fallback to localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:4000';
};

async function request(path, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.response = { status: response.status, data };
    throw error;
  }
  
  return data;
}

export const httpClient = {
  get: (path, queryParams = {}) => {
    const searchParams = new URLSearchParams(queryParams).toString();
    const url = searchParams ? `${path}?${searchParams}` : path;
    return request(url, { method: 'GET' });
  },

  post: (path, body) => {
    return request(path, { method: 'POST', body });
  },
};

export default httpClient;