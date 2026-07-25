// src/mocks/mockAuth.js
// Mock Authentication Service for RCERT Voting System
// This simulates AWS Cognito authentication for demo purposes

const mockUsers = {
  student: {
    username: 'student@rcert.edu',
    password: 'password123',
    attributes: {
      email: 'student@rcert.edu',
      name: 'Demo Student',
      'custom:student_id': 'STU001',
      'custom:mobile_number': '+911234567890'
    },
    isAdmin: false
  },
  admin: {
    username: 'admin@rcert.edu',
    password: 'admin123',
    attributes: {
      email: 'admin@rcert.edu',
      name: 'Admin User',
      'custom:student_id': 'ADM001',
      'custom:mobile_number': '+919999999999'
    },
    isAdmin: true
  }
};

let currentUser = null;
const listeners = [];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuth = {
  signIn: async (email, password) => {
    await delay(500);
    
    const userKey = Object.keys(mockUsers).find(key => 
      mockUsers[key].username === email
    );
    
    if (!userKey || mockUsers[userKey].password !== password) {
      const error = new Error('Invalid email or password');
      error.code = 'NotAuthorizedException';
      throw error;
    }
    
    currentUser = {
      ...mockUsers[userKey],
      challengeName: null
    };
    
    notifyListeners('signIn', currentUser);
    
    return currentUser;
  },

  signUp: async ({ username, password, attributes }) => {
    await delay(500);
    
    if (mockUsers[username]) {
      const error = new Error('User already exists');
      error.code = 'UsernameExistsException';
      throw error;
    }
    
    mockUsers[username] = {
      username,
      password,
      attributes,
      isAdmin: false
    };
    
    notifyListeners('signUp', { user: { username } });
    
    return { user: { username } };
  },

  confirmSignUp: async (email, code) => {
    await delay(300);
    return { success: true };
  },

  resendSignUpCode: async (email) => {
    await delay(300);
    return { CodeDeliveryDetails: { Destination: email } };
  },

  signOut: async () => {
    await delay(200);
    currentUser = null;
    notifyListeners('signOut', {});
  },

  currentAuthenticatedUser: async () => {
    await delay(200);
    if (!currentUser) {
      const error = new Error('No current user');
      error.code = 'UserNotAuthenticatedException';
      throw error;
    }
    return currentUser;
  },

  currentSession: async () => {
    await delay(200);
    if (!currentUser) {
      const error = new Error('No current session');
      error.code = 'NoCurrentSessionException';
      throw error;
    }
    
    return {
      getIdToken: () => ({
        getJwtToken: () => 'mock-jwt-token-' + Date.now(),
        payload: {
          'cognito:groups': currentUser.isAdmin ? ['admin'] : [],
          'custom:student_id': currentUser.attributes['custom:student_id'],
          email: currentUser.attributes.email
        }
      }),
      getAccessToken: () => ({
        getJwtToken: () => 'mock-access-token-' + Date.now()
      })
    };
  },

  userAttributes: async (user) => {
    await delay(100);
    return Object.entries(user.attributes).map(([Name, Value]) => ({ Name, Value }));
  },

  forgotPassword: async (email) => {
    await delay(300);
    return { CodeDeliveryDetails: { Destination: email } };
  },

  forgotPasswordSubmit: async (email, code, password) => {
    await delay(300);
    return { success: true };
  },

  completeNewPassword: async (user, password) => {
    await delay(300);
    return { ...user };
  },

  confirmSignIn: async (user, code, mfaType) => {
    await delay(300);
    return { ...user };
  }
};

const notifyListeners = (event, data) => {
  listeners.forEach(listener => {
    if (listener.callback) {
      listener.callback({ payload: { event, data } });
    }
  });
};

export const mockHub = {
  listen: (channel, callback) => {
    if (channel === 'auth') {
      listeners.push({ callback });
    }
    return () => {
      const index = listeners.findIndex(l => l.callback === callback);
      if (index > -1) listeners.splice(index, 1);
    };
  }
};

export default mockAuth;
