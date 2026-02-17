const axios = require('axios');

// Test the parsing endpoint
const testParsingEndpoint = async () => {
  try {
    console.log('Testing parsing endpoint...');
    
    // Use a dummy token for testing - this should fail with 401
    const response = await axios.get('http://localhost:5000/api/syllabi-upload/6987462e651d328f6d86a612/parse', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
};

testParsingEndpoint();