const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const cryptoPricing = require('./crypto_pricing');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory store for API keys (in production, use a proper secure storage)
let deepseekApiKey = '';
let openaiApiKey = '';
let activeProvider = 'deepseek'; // Default provider

// Endpoint to save the API key and provider settings
app.post('/api/settings', (req, res) => {
    const { provider, deepseekKey, openaiKey } = req.body;
    
    if (provider !== 'deepseek' && provider !== 'openai') {
        return res.status(400).json({ error: 'Invalid provider' });
    }
    
    if (provider === 'deepseek' && !deepseekKey) {
        return res.status(400).json({ error: 'DeepSeek API key is required' });
    }
    
    if (provider === 'openai' && !openaiKey) {
        return res.status(400).json({ error: 'OpenAI API key is required' });
    }
    
    // Update the stored values
    activeProvider = provider;
    
    if (deepseekKey) {
        deepseekApiKey = deepseekKey;
    }
    
    if (openaiKey) {
        openaiApiKey = openaiKey;
    }
    
    res.json({ message: 'Settings saved successfully' });
});

// Endpoint to check settings status
app.get('/api/settings/status', (req, res) => {
    res.json({ 
        provider: activeProvider,
        hasDeepseekKey: Boolean(deepseekApiKey),
        hasOpenaiKey: Boolean(openaiApiKey)
    });
});

// Endpoint to handle chat completions
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, tools } = req.body;
        console.log('Received chat request:', { prompt, tools });
        
        // Check if the appropriate API key is set
        if (activeProvider === 'deepseek' && !deepseekApiKey) {
            return res.status(400).json({ error: 'DeepSeek API key not set. Please configure your settings.' });
        } else if (activeProvider === 'openai' && !openaiApiKey) {
            return res.status(400).json({ error: 'OpenAI API key not set. Please configure your settings.' });
        }
        
        // For demo purposes, we'll simulate the API response with multiple tool calls
        // In a real implementation, we would make actual API calls to DeepSeek or OpenAI
        // This allows us to demonstrate how MCP works with multiple tools in sequence
        
        // Analyze the prompt to determine which tools to use
        const lowerPrompt = prompt.toLowerCase();
        const toolCalls = [];
        
        // Handle multi-part questions by checking for multiple conditions
        // Check if the prompt is about personas
        if (lowerPrompt.includes('persona') || lowerPrompt.includes('user')) {
            toolCalls.push({
                id: 'call_' + Math.random().toString(36).substring(2, 12),
                type: 'function',
                function: {
                    name: 'search',
                    arguments: JSON.stringify({
                        query: 'IOG personas information'
                    })
                }
            });
            
            toolCalls.push({
                id: 'call_' + Math.random().toString(36).substring(2, 12),
                type: 'function',
                function: {
                    name: 'iog-personas',
                    arguments: JSON.stringify({ query: 'Find information about IOG personas' })
                }
            });
        }
        
        // Check if the prompt is about products
        if (lowerPrompt.includes('product') || lowerPrompt.includes('realfi') || lowerPrompt.includes('lace') || lowerPrompt.includes('midnight')) {
            toolCalls.push({
                id: 'call_' + Math.random().toString(36).substring(2, 12),
                type: 'function',
                function: {
                    name: 'search',
                    arguments: JSON.stringify({
                        query: 'IOG products information'
                    })
                }
            });
            
            toolCalls.push({
                id: 'call_' + Math.random().toString(36).substring(2, 12),
                type: 'function',
                function: {
                    name: 'iog-products',
                    arguments: JSON.stringify({ query: 'Find information about IOG products' })
                }
            });
        }
        
        // Check if the prompt is a calculation or counting
        if (lowerPrompt.includes('calculate') || lowerPrompt.includes('sum') || 
            lowerPrompt.includes('add') || lowerPrompt.includes('multiply') || 
            lowerPrompt.includes('divide') || lowerPrompt.includes('subtract') || 
            lowerPrompt.includes('how many') || lowerPrompt.includes('count') || 
            /[0-9][\s]*[\+\-\*\/][\s]*[0-9]/.test(lowerPrompt)) {
            toolCalls.push({
                id: 'call_' + Math.random().toString(36).substring(2, 12),
                type: 'function',
                function: {
                    name: 'calculator',
                    arguments: JSON.stringify({ query: prompt })
                }
            });
        }
        
        // Check if the prompt is about cryptocurrency pricing or staking
        if (lowerPrompt.includes('crypto') || lowerPrompt.includes('price') || 
            lowerPrompt.includes('staking') || lowerPrompt.includes('ada') || 
            lowerPrompt.includes('cardano') || lowerPrompt.includes('bitcoin') || 
            lowerPrompt.includes('ethereum') || lowerPrompt.includes('token') || 
            lowerPrompt.includes('coin') || lowerPrompt.includes('apy') || 
            (lowerPrompt.includes('stake') && /[0-9]/.test(lowerPrompt))) {
            toolCalls.push({
                id: 'call_' + Math.random().toString(36).substring(2, 12),
                type: 'function',
                function: {
                    name: 'crypto-price',
                    arguments: JSON.stringify({
                        query: prompt // Pass the original prompt to extract the correct amount
                    })
                }
            });
        }
        
        // If we need general information, add search tool
        if (toolCalls.length === 0 || lowerPrompt.includes('what') || lowerPrompt.includes('find') || lowerPrompt.includes('search')) {
            toolCalls.push({
                id: 'call_' + Math.random().toString(36).substring(2, 12),
                type: 'function',
                function: {
                    name: 'search',
                    arguments: JSON.stringify({ query: 'Search for general information' })
                }
            });
        }
        
        // Create a simulated response that mimics the DeepSeek API format
        const simulatedResponse = {
            id: 'chatcmpl-' + Date.now(),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'deepseek-chat',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: 'I\'ll help you with that. Let me use the appropriate tools to find the information you need.',
                    tool_calls: toolCalls
                },
                finish_reason: 'tool_calls'
            }],
            usage: {
                prompt_tokens: prompt.length,
                completion_tokens: 100,
                total_tokens: prompt.length + 100
            }
        };
        
        // Log the detailed tool calls for debugging
        console.log('Detailed tool calls:', JSON.stringify(toolCalls, null, 2));
        
        // In a real implementation, you would call the DeepSeek API here
        // const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${apiKey}`
        //     },
        //     body: JSON.stringify({
        //         model: 'deepseek-chat',
        //         messages: [
        //             { role: 'system', content: 'You are a helpful AI assistant that can use tools to answer questions.' },
        //             { role: 'user', content: prompt }
        //         ],
        //         tools: [
        //             {
        //                 type: 'function',
        //                 function: {
        //                     name: 'weather',
        //                     description: 'Get current weather for a location',
        //                     parameters: {
        //                         type: 'object',
        //                         properties: {
        //                             query: {
        //                                 type: 'string',
        //                                 description: 'The location to get weather for'
        //                             }
        //                         }
        //                     }
        //                 }
        //             },
        //             {
        //                 type: 'function',
        //                 function: {
        //                     name: 'calculator',
        //                     description: 'Perform mathematical calculations',
        //                     parameters: {
        //                         type: 'object',
        //                         properties: {
        //                             query: {
        //                                 type: 'string',
        //                                 description: 'The calculation to perform'
        //                             }
        //                         }
        //                     }
        //                 }
        //             },
        //             {
        //                 type: 'function',
        //                 function: {
        //                     name: 'search',
        //                     description: 'Search for information',
        //                     parameters: {
        //                         type: 'object',
        //                         properties: {
        //                             query: {
        //                                 type: 'string',
        //                                 description: 'The search query'
        //                             }
        //                         }
        //                     }
        //                 }
        //             },
        //             {
        //                 type: 'function',
        //                 function: {
        //                     name: 'iog-personas',
        //                     description: 'Get information about IOG personas',
        //                     parameters: {
        //                         type: 'object',
        //                         properties: {
        //                             query: {
        //                                 type: 'string',
        //                                 description: 'The persona to get information about'
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         ],
        //         tool_choice: 'auto'
        //     })
        // });
        
        // if (!response.ok) {
        //     const error = await response.json();
        //     console.error('DeepSeek API error:', error);
        //     return res.status(response.status).json({ error: error.error || 'Failed to get response from DeepSeek API' });
        // }
        
        // const data = await response.json();
        // console.log('DeepSeek API response:', data);
        
        // For the demo, we'll use our simulated response
        console.log('Simulated response with multiple tool calls:', simulatedResponse);
        res.json(simulatedResponse);
    } catch (err) {
        console.error('Error in chat endpoint:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// Endpoint to get all personas
app.get('/api/personas', async (req, res) => {
    try {
        console.log('Fetching personas from JSON file...');
        const personasPath = path.join(__dirname, 'personas.json');
        
        // Read from the JSON file
        const personasData = await fs.readFile(personasPath, 'utf-8');
        const personas = JSON.parse(personasData);
        console.log('Loaded personas:', Object.keys(personas));
        
        res.json(personas);
    } catch (err) {
        console.error('Error reading personas JSON file:', err);
        
        // Fallback data in case the file can't be read
        const fallbackPersonas = {
            'crypto zero': 'A person with no knowledge or experience with cryptocurrency.',
            'crypto novice': 'Someone who has heard of cryptocurrency but has minimal understanding.',
            'crypto savvy': 'An individual with good understanding of cryptocurrency concepts and some experience.',
            'crypto literate': 'A person who understands cryptocurrency well and actively uses it.',
            'crypto traders': 'People who actively trade cryptocurrencies as a significant activity.',
            'builder': 'A developer or creator building applications on blockchain technology.',
            'dapp developers': 'Developers specialized in creating decentralized applications.',
            'stakepool operators': 'Individuals who run stake pools for proof-of-stake blockchains.'
        };
        
        res.json(fallbackPersonas);
    }
});

// Endpoint to get all IOG products
app.get('/api/products', async (req, res) => {
    try {
        console.log('Fetching IOG products from JSON file...');
        const productsPath = path.join(__dirname, 'products.json');
        
        // Read from the JSON file
        const productsData = await fs.readFile(productsPath, 'utf-8');
        const products = JSON.parse(productsData);
        console.log('Loaded products:', Object.keys(products));
        
        res.json(products);
    } catch (err) {
        console.error('Error reading products JSON file:', err);
        
        // Fallback data in case the file can't be read
        const fallbackProducts = {
            'realfi': 'RealFi is Input Output Global\'s initiative to bridge the gap between traditional finance and blockchain technology.',
            'lace': 'Lace is Input Output Global\'s light wallet platform for managing digital assets on the Cardano blockchain.',
            'midnight': 'Midnight is a privacy-focused sidechain project developed by Input Output Global.'
        };
        
        res.json(fallbackProducts);
    }
});

// Endpoint to get specific product details
app.get('/api/products/:name', async (req, res) => {
    try {
        const productName = req.params.name.toLowerCase();
        console.log(`Fetching details for product: ${productName}`);
        
        const productPath = path.join(__dirname, 'IOG Products', `${productName.charAt(0).toUpperCase() + productName.slice(1)}.md`);
        
        // Check if the file exists
        try {
            await fs.access(productPath);
        } catch (error) {
            return res.status(404).json({ error: `Product '${productName}' not found` });
        }
        
        // Read the Markdown file
        const content = await fs.readFile(productPath, 'utf-8');
        
        res.json({ name: productName, content });
    } catch (err) {
        console.error(`Error reading product details:`, err);
        res.status(500).json({ error: 'Failed to read product details' });
    }
});

// Endpoint to handle cryptocurrency pricing requests
app.post('/api/crypto-price', async (req, res) => {
    try {
        const { action, coinId, amount, years, apy, currency, query } = req.body;
        console.log('Crypto pricing request:', req.body);
        
        switch (action) {
            case 'getPrice':
                const priceResponse = await cryptoPricing.getCoinPrice(coinId || 'cardano', currency ? [currency] : ['usd']);
                const coinIdValue = coinId || 'cardano';
                const currencyValue = currency || 'usd';
                
                // Format the response in a more usable structure
                const priceData = {
                    name: coinIdValue.charAt(0).toUpperCase() + coinIdValue.slice(1),
                    symbol: coinIdValue.substring(0, 3),
                    price: priceResponse[coinIdValue][currencyValue],
                    price_change_24h: priceResponse[coinIdValue][`${currencyValue}_24h_change`],
                    market_cap: null // CoinGecko simple API doesn't provide market cap
                };
                
                return res.json({ success: true, priceData });
                
            case 'search':
                const searchResults = await cryptoPricing.searchCoins(query);
                return res.json({ success: true, coins: searchResults });
                
            case 'calculateStaking':
                const stakingCalc = await cryptoPricing.calculateStakingReturns(
                    parseFloat(amount),
                    parseFloat(years),
                    parseFloat(apy),
                    coinId || 'cardano',
                    currency || 'usd'
                );
                
                // Format the response to match what the frontend expects
                const stakingResults = {
                    amount: parseFloat(amount),
                    years: parseFloat(years),
                    apy: parseFloat(apy),
                    coinId: coinId || 'cardano',
                    initialAmount: stakingCalc.initialValue,
                    finalAmount: stakingCalc.futureTokens,
                    finalAmountFiat: stakingCalc.futureValue,
                    earningsFiat: stakingCalc.valueEarned
                };
                
                return res.json({ success: true, stakingResults });
                
            default:
                return res.status(400).json({ success: false, error: `Unknown action: ${action}` });
        }
    } catch (error) {
        console.error('Crypto pricing error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
