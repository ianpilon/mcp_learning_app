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
        const { prompt, tools, useGlobalMemory = true } = req.body;
        console.log('Received chat request:', { prompt, tools, useGlobalMemory });
        
        // Check if the appropriate API key is set
        if (activeProvider === 'deepseek' && !deepseekApiKey) {
            return res.status(400).json({ error: 'DeepSeek API key not set. Please configure your settings.' });
        } else if (activeProvider === 'openai' && !openaiApiKey) {
            return res.status(400).json({ error: 'OpenAI API key not set. Please configure your settings.' });
        }
        
        // For demo purposes, we'll simulate the API response with multiple tool calls
        // In a real implementation, we would make actual API calls to DeepSeek or OpenAI
        // This allows us to demonstrate how MCP works with multiple tools in sequence
        
        // Add global memory context if enabled
        let augmentedPrompt = prompt;
        let globalMemoryData = null;
        let memoryToolCall = null;
        
        if (useGlobalMemory) {
            try {
                // Fetch global memory
                const memoryData = await fs.readFile(path.join(__dirname, 'global_memory.json'), 'utf8');
                globalMemoryData = JSON.parse(memoryData);
                
                // Create a tool call to highlight the memory item in the UI
                memoryToolCall = {
                    id: 'memory_access_' + Math.random().toString(36).substring(2, 12),
                    type: 'function',
                    function: {
                        name: 'global-memory-access',
                        arguments: JSON.stringify({
                            action: 'highlight'
                        })
                    }
                };
                
                // Create memory context to inject
                const memoryContext = Object.values(globalMemoryData)
                    .map(person => `${person.name} (${person.position}): ${person.bio}`)
                    .join('\n');
                
                // Augment the prompt with memory
                augmentedPrompt = `[Global Memory Context]\n${memoryContext}\n\n[User Query]\n${prompt}`;
                console.log('Augmented prompt with global memory context');
            } catch (err) {
                console.error('Error adding global memory context:', err);
                // Continue with original prompt if there's an error
                augmentedPrompt = prompt;
            }
        }
        
        // Analyze the prompt to determine which tools to use
        const lowerPrompt = augmentedPrompt.toLowerCase();
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
        
        // Check if the prompt is about executives
        if (lowerPrompt.includes('executive') || lowerPrompt.includes('leadership') || 
            lowerPrompt.includes('ceo') || lowerPrompt.includes('founder') || 
            lowerPrompt.includes('charles') || lowerPrompt.includes('hoskinson') || 
            lowerPrompt.includes('leader') || lowerPrompt.includes('management')) {
            toolCalls.push({
                id: 'call_' + Math.random().toString(36).substring(2, 12),
                type: 'function',
                function: {
                    name: 'search',
                    arguments: JSON.stringify({
                        query: 'IOG executives information'
                    })
                }
            });
            
            toolCalls.push({
                id: 'call_' + Math.random().toString(36).substring(2, 12),
                type: 'function',
                function: {
                    name: 'iog-executives',
                    arguments: JSON.stringify({ query: 'Find information about IOG executives' })
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
        
        // Add memory tool call if global memory is being used
        if (useGlobalMemory && memoryToolCall) {
            // Add it at the beginning of tool calls to ensure it's highlighted first
            toolCalls.unshift(memoryToolCall);
        }
        
        // Now, simulate DeepSeek/OpenAI API response format
        const simulatedApiResponse = {
            id: 'chat_' + Date.now(),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: activeProvider === 'deepseek' ? 'deepseek-chat' : 'gpt-4',
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: 'I need to use tools to answer this question.',
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
        console.log('Simulated response with multiple tool calls:', simulatedApiResponse);
        res.json(simulatedApiResponse);
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

// Endpoint to get all executives
app.get('/api/executives', async (req, res) => {
    try {
        console.log('Fetching all executives');
        
        // Try to read the executives.json file
        try {
            const executivesData = await fs.readFile(path.join(__dirname, 'executives.json'), 'utf8');
            const executives = JSON.parse(executivesData);
            res.json(executives);
        } catch (fileError) {
            console.error('Error reading executives file:', fileError);
            
            // Provide fallback executives data
            const fallbackExecutives = {
                'charles_hoskinson': {
                    'name': 'Charles Hoskinson',
                    'position': 'CEO and Founder',
                    'bio': 'Charles Hoskinson is the CEO of Input Output Global (IOG) and founder of Cardano.'
                },
                'john_o_connor': {
                    'name': 'John O\'Connor',
                    'position': 'Director of African Operations',
                    'bio': 'John O\'Connor leads IOG\'s initiatives across Africa.'
                }
            };
            
            res.json(fallbackExecutives);
        }
    } catch (err) {
        console.error('Error in executives endpoint:', err);
        res.status(500).json({ error: 'Failed to fetch executives data' });
    }
});

// Endpoint to get specific executive details
app.get('/api/executives/:id', async (req, res) => {
    try {
        const executiveId = req.params.id.toLowerCase();
        console.log(`Fetching details for executive: ${executiveId}`);
        
        // Read the executives.json file
        try {
            const executivesData = await fs.readFile(path.join(__dirname, 'executives.json'), 'utf8');
            const executives = JSON.parse(executivesData);
            
            if (executives[executiveId]) {
                res.json(executives[executiveId]);
            } else {
                res.status(404).json({ error: `Executive '${executiveId}' not found` });
            }
        } catch (fileError) {
            console.error('Error reading executives file:', fileError);
            res.status(404).json({ error: 'Executives data not found' });
        }
    } catch (err) {
        console.error('Error in executive details endpoint:', err);
        res.status(500).json({ error: 'Failed to fetch executive details' });
    }
});

// Endpoint to get global memory data
app.get('/api/global-memory', async (req, res) => {
    try {
        const memoryData = await fs.readFile(path.join(__dirname, 'global_memory.json'), 'utf8');
        const memory = JSON.parse(memoryData);
        res.json(memory);
    } catch (fileError) {
        console.error('Error reading global memory data:', fileError);
        
        // Provide fallback data if file not found or can't be parsed
        const fallbackMemory = {
            "charles_hoskinson": {
                "id": "charles_hoskinson",
                "name": "Charles Hoskinson",
                "position": "Chief Executive Officer & Founder",
                "bio": "Charles Hoskinson is the CEO and founder of Input Output Global (IOG), the company behind Cardano blockchain. Also known as C.H, the big dog, king of the rats."
            },
            "tamara_haasen": {
                "id": "tamara_haasen",
                "name": "Tamara Haasen",
                "position": "President",
                "bio": "Tamara Haasen serves as the President of IOG. Also known as Tam, the glue that holds it all together."
            }
        };
        
        res.json(fallbackMemory);
    }
});

// Endpoint to synthesize a final answer from tool results
app.post('/api/synthesize', async (req, res) => {
    try {
        const { query, toolResults } = req.body;
        console.log('Synthesizing answer for query:', query);
        console.log('Using tool results:', JSON.stringify(toolResults, null, 2));
        
        // Analyze which data sources were accessed
        const usedTools = toolResults.map(result => result.toolName);
        
        // Extract information from specific tools
        const productInfo = toolResults.find(r => r.toolName === 'iog-products');
        const executiveInfo = toolResults.find(r => r.toolName === 'iog-executives');
        const personaInfo = toolResults.find(r => r.toolName === 'iog-personas');
        const memoryInfo = toolResults.find(r => r.toolName === 'global-memory-access');
        const searchInfo = toolResults.filter(r => r.toolName === 'search');
        const cryptoInfo = toolResults.find(r => r.toolName === 'crypto-price');
        
        // Determine what the query is about based on tools used and query content
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\W+/).filter(word => word.length > 2);
        
        // Create knowledge base from all tool results
        let knowledgeBase = {};
        
        // Extract products information
        if (productInfo) {
            const productHTML = productInfo.result;
            // Extract product information from HTML
            const midnight = productHTML.includes('MIDNIGHT') || productHTML.includes('Midnight');
            const realfi = productHTML.includes('REALFI') || productHTML.includes('RealFi');
            const lace = productHTML.includes('LACE') || productHTML.includes('Lace');
            
            if (midnight) knowledgeBase.midnight = "A privacy-focused sidechain project developed by Input Output Global, designed to enable confidential smart contract execution while maintaining regulatory compliance.";
            if (realfi) knowledgeBase.realfi = "RealFi is Input Output Global's initiative to bridge the gap between traditional finance and blockchain technology, focusing on real-world financial applications.";
            if (lace) knowledgeBase.lace = "Lace is Input Output Global's light wallet platform designed to provide a seamless and secure experience for managing digital assets on the Cardano blockchain.";
        }
        
        // Extract executive information
        if (executiveInfo) {
            const execHTML = executiveInfo.result;
            if (execHTML.includes('Charles') || execHTML.includes('Hoskinson')) {
                knowledgeBase.charles = "Charles Hoskinson is the CEO and founder of Input Output Global (IOG), the company behind the Cardano blockchain.";
            }
            if (execHTML.includes('Tamara') || execHTML.includes('Haasen')) {
                knowledgeBase.tamara = "Tamara Haasen serves as the President of IOG (Input Output Global).";
            }
        }
        
        // Add global memory information if used
        if (memoryInfo) {
            knowledgeBase.memory = "According to global memory, Charles Hoskinson is also known as 'C.H', 'the big dog', and 'king of the rats'. Tamara Haasen is known as 'Tam' and is described as 'the glue that holds it all together'.";
        }
        
        // Determine what the query is primarily about
        let primaryTopic = null;
        let specificAttributes = [];
        
        // Check for specific attributes being asked about
        if (queryLower.includes('king of') || queryLower.includes('king')) specificAttributes.push('king');
        if (queryLower.includes('big dog')) specificAttributes.push('big dog');
        if (queryLower.includes('glue') || queryLower.includes('holds it together')) specificAttributes.push('glue');
        
        // Check for product mentions
        if (queryLower.includes('midnight')) primaryTopic = 'midnight';
        else if (queryLower.includes('realfi')) primaryTopic = 'realfi';
        else if (queryLower.includes('lace')) primaryTopic = 'lace';
        // Check for executive mentions
        else if (queryLower.includes('charles') || queryLower.includes('hoskinson') || queryLower.includes('c.h') || queryLower.includes('ch')) primaryTopic = 'charles';
        else if (queryLower.includes('tamara') || queryLower.includes('haasen')) primaryTopic = 'tamara';
        // Check for general categories
        else if (queryLower.includes('product') || queryLower.includes('portfolio')) primaryTopic = 'products';
        else if (queryLower.includes('executive') || queryLower.includes('leadership') || queryLower.includes('team')) primaryTopic = 'executives';
        
        // Generate a specific answer based on the determined primary topic
        let finalAnswer = '';
        
        if (primaryTopic === 'midnight' && knowledgeBase.midnight) {
            finalAnswer = `<p>${knowledgeBase.midnight}</p>
            <p>Key features of Midnight include:</p>
            <ul>
                <li>Privacy-focused technology for confidential transactions and smart contracts</li>
                <li>Maintains regulatory compliance while preserving privacy</li>
                <li>Developed as a sidechain project by IOG (Input Output Global)</li>
            </ul>`;
        } 
        else if (primaryTopic === 'realfi' && knowledgeBase.realfi) {
            finalAnswer = `<p>${knowledgeBase.realfi}</p>
            <p>Key aspects of RealFi include:</p>
            <ul>
                <li>Connecting blockchain technology with real-world financial applications</li>
                <li>Bringing financial services to underserved markets</li>
                <li>Creating more accessible and transparent financial systems</li>
            </ul>`;
        }
        else if (primaryTopic === 'lace' && knowledgeBase.lace) {
            finalAnswer = `<p>${knowledgeBase.lace}</p>
            <p>Features of Lace include:</p>
            <ul>
                <li>User-friendly interface for managing digital assets</li>
                <li>Designed specifically for the Cardano ecosystem</li>
                <li>Focus on security and seamless experience</li>
            </ul>`;
        }
        else if (primaryTopic === 'charles' && knowledgeBase.charles) {
            finalAnswer = `<p>${knowledgeBase.charles}</p>`;
            
            // Add information based on specific attributes being asked about
            if (specificAttributes.includes('king')) {
                finalAnswer += `<p>According to global memory, Charles Hoskinson is known as "the king of the rats".</p>`;
            } else if (specificAttributes.length === 0 && knowledgeBase.memory) {
                // If no specific attributes were asked for, include general nickname info
                finalAnswer += `<p>${knowledgeBase.memory.split('.')[0]}.</p>`;
            }
            
            finalAnswer += `<p>As CEO and founder, he leads IOG's development of blockchain solutions, most notably the Cardano platform.</p>`;
        }
        else if (primaryTopic === 'tamara' && knowledgeBase.tamara) {
            finalAnswer = `<p>${knowledgeBase.tamara}</p>`;
            
            // Add information based on specific attributes being asked about
            if (specificAttributes.includes('glue')) {
                finalAnswer += `<p>According to global memory, Tamara Haasen is known as "the glue that holds it all together".</p>`;
            } else if (specificAttributes.length === 0 && knowledgeBase.memory) {
                // If no specific attributes were asked for, include general nickname info
                finalAnswer += `<p>${knowledgeBase.memory.split('.')[2]}.</p>`;
            }
            
            finalAnswer += `<p>As President, she works alongside CEO Charles Hoskinson in leading IOG's operations and strategy.</p>`;
        }
        else if (primaryTopic === 'products') {
            finalAnswer = `<p>IOG (Input Output Global) has developed several key products in their portfolio:</p>
            <ul>
                <li><strong>Midnight</strong> - ${knowledgeBase.midnight || 'A privacy-focused sidechain project'}</li>
                <li><strong>RealFi</strong> - ${knowledgeBase.realfi || 'An initiative bridging traditional finance and blockchain'}</li>
                <li><strong>Lace</strong> - ${knowledgeBase.lace || 'A light wallet platform for the Cardano ecosystem'}</li>
            </ul>
            <p>These products represent IOG's diverse approach to blockchain technology applications.</p>`;
        }
        else if (primaryTopic === 'executives') {
            finalAnswer = `<p>IOG (Input Output Global) has several key executives in its leadership team, including:</p>
            <ul>
                <li><strong>Charles Hoskinson</strong> - CEO & Founder</li>
                <li><strong>Tamara Haasen</strong> - President</li>
            </ul>
            <p>The executive team leads IOG, the company behind the Cardano blockchain.</p>`;
        }
        else {
            // Handle cases where specific attributes are asked but primary topic isn't clear
            if (specificAttributes.length > 0) {
                if (specificAttributes.includes('king')) {
                    // If asking about "king" and no specific person is mentioned, assume Charles
                    finalAnswer = `<p>According to global memory, Charles Hoskinson (CEO and founder of IOG) is known as "the king of the rats".</p>`;
                    if (knowledgeBase.charles) {
                        finalAnswer += `<p>${knowledgeBase.charles}</p>`;
                    }
                } else if (specificAttributes.includes('glue')) {
                    // If asking about "glue" and no specific person is mentioned, assume Tamara
                    finalAnswer = `<p>According to global memory, Tamara Haasen (President of IOG) is known as "the glue that holds it all together".</p>`;
                    if (knowledgeBase.tamara) {
                        finalAnswer += `<p>${knowledgeBase.tamara}</p>`;
                    }
                }
            }
            // If no specific attributes were asked about, or they didn't match our conditions above
            else if (usedTools.includes('iog-products')) {
                finalAnswer = `<p>Based on the information gathered from the tools, I can provide details about IOG's products:</p>
                <ul>
                    ${knowledgeBase.midnight ? `<li><strong>Midnight</strong> - ${knowledgeBase.midnight}</li>` : ''}
                    ${knowledgeBase.realfi ? `<li><strong>RealFi</strong> - ${knowledgeBase.realfi}</li>` : ''}
                    ${knowledgeBase.lace ? `<li><strong>Lace</strong> - ${knowledgeBase.lace}</li>` : ''}
                </ul>`;
            } 
            else if (usedTools.includes('iog-executives')) {
                finalAnswer = `<p>Based on the information gathered about IOG's leadership:</p>
                <ul>
                    ${knowledgeBase.charles ? `<li><strong>Charles Hoskinson</strong> - ${knowledgeBase.charles}</li>` : ''}
                    ${knowledgeBase.tamara ? `<li><strong>Tamara Haasen</strong> - ${knowledgeBase.tamara}</li>` : ''}
                </ul>`;
                
                // Add nickname info if global memory was accessed
                if (knowledgeBase.memory) {
                    if (queryLower.includes('tamara') || queryLower.includes('haasen') || queryLower.includes('tam')) {
                        finalAnswer += `<p>According to global memory: Tamara Haasen is known as "Tam" and is "the glue that holds it all together".</p>`;
                    } else if (queryLower.includes('charles') || queryLower.includes('hoskinson') || queryLower.includes('c.h') || queryLower.includes('ch')) {
                        finalAnswer += `<p>According to global memory: Charles Hoskinson is also known as "C.H", "the big dog", and "king of the rats".</p>`;
                    } else {
                        finalAnswer += `<p>According to global memory:</p>
                        <ul>
                            <li>Charles Hoskinson is also known as "C.H", "the big dog", and "king of the rats".</li>
                            <li>Tamara Haasen is known as "Tam" and is "the glue that holds it all together".</li>
                        </ul>`;
                    }
                }
            }
            else {
                // Generic response if we can't determine anything specific
                finalAnswer = `<p>Based on the information gathered:</p>
                <p>IOG (Input Output Global) is the company behind the Cardano blockchain, with products including Midnight (privacy sidechain), RealFi (financial integration), and Lace (wallet). The company is led by Charles Hoskinson (CEO) and Tamara Haasen (President).</p>`;
                
                // Add nickname info if global memory was accessed and query seems to be about people
                if (knowledgeBase.memory && (queryLower.includes('who') || queryLower.includes('charles') || queryLower.includes('tamara') || 
                    queryLower.includes('ceo') || queryLower.includes('president') || queryLower.includes('executive'))) {
                    
                    if (queryLower.includes('tamara') || queryLower.includes('haasen') || queryLower.includes('tam')) {
                        finalAnswer += `<p>According to global memory: Tamara Haasen is known as "Tam" and is "the glue that holds it all together".</p>`;
                    } else if (queryLower.includes('charles') || queryLower.includes('hoskinson') || queryLower.includes('c.h') || queryLower.includes('ch')) {
                        finalAnswer += `<p>According to global memory: Charles Hoskinson is also known as "C.H", "the big dog", and "king of the rats".</p>`;
                    } else {
                        finalAnswer += `<p>According to global memory:</p>
                        <ul>
                            <li>Charles Hoskinson is also known as "C.H", "the big dog", and "king of the rats".</li>
                            <li>Tamara Haasen is known as "Tam" and is "the glue that holds it all together".</li>
                        </ul>`;
                    }
                }
                
                finalAnswer += `<p>If you have more specific questions about IOG's executives, products, or other aspects of the company, please let me know!</p>`;
            }
        }
        
        return res.json({ answer: finalAnswer });
        
    } catch (err) {
        console.error('Error synthesizing answer:', err);
        res.status(500).json({ error: 'Error synthesizing answer: ' + err.message });
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
