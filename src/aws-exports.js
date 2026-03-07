// src/aws-exports.js
const awsExports = {
  Auth: { 
    region: 'us-east-1',
    userPoolId: 'us-east-1_QuRolN5vk',
    userPoolWebClientId: '5gkacauclcljgr4b4svcti7cti',
    identityPoolId: 'us-east-1:59c17b21-612a-47aa-a8bf-a825189602b3'
  },
  API: {
    endpoints: [
      {
        name: "voteApi",
        endpoint: "https://a93fdh3qb5.execute-api.us-east-1.amazonaws.com/prod",
        region: "us-east-1",
        authorizationType: "NONE" 
        
      }
    ]
  },
  Storage: { 
      AWSS3: {
          bucket: 'voting-attendance-data',
          region: 'us-east-1'
      }
  }
};
export default awsExports;