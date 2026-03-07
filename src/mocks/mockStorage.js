// src/mocks/mockStorage.js
// Mock Storage Service for RCERT Voting System
// This simulates AWS S3 storage for demo purposes

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const uploadedFiles = [];

export const mockStorage = {
  put: async (key, file, options) => {
    await delay(500 + Math.random() * 500);
    
    console.log(`[MOCK STORAGE] Uploading file: ${key}`);
    console.log(`[MOCK STORAGE] File name: ${file.name}`);
    console.log(`[MOCK STORAGE] File size: ${file.size} bytes`);
    
    const fileInfo = {
      key,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    };
    
    uploadedFiles.push(fileInfo);
    
    console.log(`[MOCK STORAGE] File uploaded successfully: ${key}`);
    
    return { key, ...options };
  },
  
  get: async (key) => {
    await delay(200);
    return uploadedFiles.find(f => f.key === key) || null;
  },
  
  list: async () => {
    await delay(200);
    return uploadedFiles;
  }
};

export default mockStorage;
