// src/mocks/mockApi.js
// Mock API Service for RCERT Voting System
// This simulates API Gateway responses for demo purposes

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let electionStatus = 'NOT_STARTED';
let hasVoted = {};
let candidates = [
  { candidate_id: 'pres_001', name: 'Rahul Sharma', party: 'Vision Party', role: 'President' },
  { candidate_id: 'pres_002', name: 'Priya Patel', party: 'Progress Party', role: 'President' },
  { candidate_id: 'pres_003', name: 'Amit Kumar', party: 'Unity Party', role: 'President' },
  { candidate_id: 'sec_001', name: 'Sneha Gupta', party: 'Vision Party', role: 'Secretary' },
  { candidate_id: 'sec_002', name: 'Raj Malhotra', party: 'Progress Party', role: 'Secretary' },
  { candidate_id: 'sec_003', name: 'Anjali Singh', party: 'Unity Party', role: 'Secretary' }
];

const mockVotes = {
  President: [
    { candidate_id: 'pres_001', name: 'Rahul Sharma', party: 'Vision Party', vote_count: 145 },
    { candidate_id: 'pres_002', name: 'Priya Patel', party: 'Progress Party', vote_count: 132 },
    { candidate_id: 'pres_003', name: 'Amit Kumar', party: 'Unity Party', vote_count: 98 }
  ],
  Secretary: [
    { candidate_id: 'sec_001', name: 'Sneha Gupta', party: 'Vision Party', vote_count: 156 },
    { candidate_id: 'sec_002', name: 'Raj Malhotra', party: 'Progress Party', vote_count: 124 },
    { candidate_id: 'sec_003', name: 'Anjali Singh', party: 'Unity Party', vote_count: 87 }
  ]
};

const eligibleStudents = ['STU001', 'STU002', 'STU003', 'STU004', 'STU005'];

export const mockApi = {
  get: async (apiName, path, options) => {
    await delay(300 + Math.random() * 200);
    
    console.log(`[MOCK API] GET ${path}`, options);
    
    if (path === '/election/status') {
      return { status: electionStatus };
    }
    
    if (path === '/results') {
      if (electionStatus !== 'RESULTS_DECLARED' && electionStatus !== 'STOPPED') {
        const error = new Error('Results not available');
        error.response = { status: 403, data: { error: 'Results not available yet' } };
        throw error;
      }
      return mockVotes;
    }
    
    if (path === '/candidates') {
      return candidates;
    }
    
    if (path === '/eligibility') {
      const studentId = options?.queryStringParameters?.student_id;
      if (!studentId) {
        return { isEligible: false, reason: 'Student ID is required' };
      }
      if (hasVoted[studentId]) {
        return { isEligible: false, reason: 'You have already voted in this election' };
      }
      const isEligible = eligibleStudents.includes(studentId) || studentId.startsWith('STU');
      return {
        isEligible,
        reason: isEligible ? 'Eligible to vote' : 'You are not eligible to vote in this election'
      };
    }
    
    const error = new Error('Endpoint not found');
    error.response = { status: 404, data: { error: 'Not found' } };
    throw error;
  },

  post: async (apiName, path, options) => {
    await delay(300 + Math.random() * 200);
    
    console.log(`[MOCK API] POST ${path}`, options);
    
    if (path === '/vote') {
      const { student_id, president_candidate_id, secretary_candidate_id } = options.body;
      
      if (!student_id || !president_candidate_id || !secretary_candidate_id) {
        const error = new Error('Missing required fields');
        error.response = { status: 400, data: { error: 'Please select candidates for both positions' } };
        throw error;
      }
      
      if (hasVoted[student_id]) {
        const error = new Error('Already voted');
        error.response = { status: 409, data: { error: 'You have already voted in this election' } };
        throw error;
      }
      
      hasVoted[student_id] = true;
      
      if (president_candidate_id) {
        const presCand = mockVotes.President.find(c => c.candidate_id === president_candidate_id);
        if (presCand) presCand.vote_count++;
      }
      if (secretary_candidate_id) {
        const secCand = mockVotes.Secretary.find(c => c.candidate_id === secretary_candidate_id);
        if (secCand) secCand.vote_count++;
      }
      
      return { success: true, message: 'Vote submitted successfully!' };
    }
    
    if (path === '/candidates') {
      const { role, candidate_id, name, party } = options.body;
      
      if (!role || !candidate_id || !name || !party) {
        const error = new Error('Missing required fields');
        error.response = { status: 400, data: { error: 'Please fill all candidate details' } };
        throw error;
      }
      
      const newCandidate = { candidate_id, name, party, role };
      candidates.push(newCandidate);
      
      return { success: true, message: 'Candidate added successfully!' };
    }
    
    if (path === '/election/start') {
      electionStatus = 'RUNNING';
      return { success: true, message: 'Election started successfully!', newStatus: 'RUNNING' };
    }
    
    if (path === '/election/stop') {
      electionStatus = 'STOPPED';
      return { success: true, message: 'Election stopped successfully!', newStatus: 'STOPPED' };
    }
    
    if (path === '/election/declare') {
      electionStatus = 'RESULTS_DECLARED';
      return { success: true, message: 'Results declared successfully!', newStatus: 'RESULTS_DECLARED' };
    }
    
    if (path === '/election/reset') {
      electionStatus = 'NOT_STARTED';
      hasVoted = {};
      mockVotes.President.forEach(c => c.vote_count = 0);
      mockVotes.Secretary.forEach(c => c.vote_count = 0);
      candidates = [
        { candidate_id: 'pres_001', name: 'Rahul Sharma', party: 'Vision Party', role: 'President' },
        { candidate_id: 'pres_002', name: 'Priya Patel', party: 'Progress Party', role: 'President' },
        { candidate_id: 'pres_003', name: 'Amit Kumar', party: 'Unity Party', role: 'President' },
        { candidate_id: 'sec_001', name: 'Sneha Gupta', party: 'Vision Party', role: 'Secretary' },
        { candidate_id: 'sec_002', name: 'Raj Malhotra', party: 'Progress Party', role: 'Secretary' },
        { candidate_id: 'sec_003', name: 'Anjali Singh', party: 'Unity Party', role: 'Secretary' }
      ];
      return { success: true, message: 'Election reset successfully!', newStatus: 'NOT_STARTED' };
    }
    
    const error = new Error('Endpoint not found');
    error.response = { status: 404, data: { error: 'Not found' } };
    throw error;
  }
};

export default mockApi;
