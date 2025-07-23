const axios = require('axios');

// Simulate a simple test request to our chat API
async function testChatAPI() {
  try {
    const response = await axios.post('http://localhost:3000/api/chat', {
      prompt: 'What is Charles favorite color?',
      tools: [
        {
          name: 'global-memory-access',
          description: 'Access global memory',
          active: true
        },
        {
          name: 'search',
          description: 'Search for information',
          active: false
        },
        {
          name: 'calculator',
          description: 'Perform calculations',
          active: false
        },
        {
          name: 'crypto-price',
          description: 'Get cryptocurrency prices',
          active: false
        },
        {
          name: 'iog-personas',
          description: 'Access IOG personas',
          active: false
        },
        {
          name: 'iog-products',
          description: 'Access IOG products',
          active: false
        },
        {
          name: 'iog-executives',
          description: 'Access IOG executives',
          active: false
        }
      ],
      useGlobalMemory: true
    });
    
    console.log('API response received');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testChatAPI();
