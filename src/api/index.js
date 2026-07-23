// src/api/index.js
// Switches between mock (local dev) and HTTP client (Docker/production)

import { mockApi } from '../mocks/mockApi';
import { httpClient } from './httpClient';

// Use HTTP client when REACT_APP_API_URL is set (Docker build)
// Use mocks when running locally without the env var
const USE_HTTP = !!process.env.REACT_APP_API_URL;

export const api = USE_HTTP ? {
  get: async (apiName, path, options = {}) => {
    const { queryStringParameters = {} } = options;
    return httpClient.get(path, queryStringParameters);
  },
  post: async (apiName, path, options = {}) => {
    const { body = {} } = options;
    return httpClient.post(path, body);
  },
} : mockApi;

export const isUsingHttp = () => USE_HTTP;

export default api;