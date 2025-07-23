// Use dynamic import for node-fetch as it's an ES Module
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Simulate a simple test request to our chat API
async function testChatAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
      })
    });
    
    const data = await response.json();
    console.log('API response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testChatAPI();
