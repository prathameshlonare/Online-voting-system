// src/mocks/index.js
// Mock AWS Services Export
// This module provides mock implementations of AWS Amplify services

import { mockAuth, mockHub } from './mockAuth';
import { mockApi } from './mockApi';
import { mockStorage } from './mockStorage';

export const Auth = mockAuth;
export const API = mockApi;
export const Storage = mockStorage;
export const Hub = mockHub;

const mockServices = {
  Auth,
  API,
  Storage,
  Hub
};

export default mockServices;
