document.addEventListener('DOMContentLoaded', function() {
    // Settings modal elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const saveSettingsBtn = document.getElementById('save-settings');
    const apiKeyInput = document.getElementById('deepseek-key');

    // Interactive demo elements
    const sendPromptButton = document.getElementById('send-prompt');
    const refreshPromptButton = document.getElementById('refresh-prompt');
    const promptTextarea = document.querySelector('#model-prompt textarea');
    const modelThinking = document.getElementById('model-thinking');
    const toolOutput = document.getElementById('tool-output');
    const tools = document.querySelectorAll('.tool');
    const dataSources = document.querySelectorAll('.data-source');
    
    // Accordion elements
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    // Settings button click handler
    settingsBtn.addEventListener('click', function() {
        console.log('Settings button clicked');
        settingsModal.style.display = 'block';
    });

    // Close button handler
    closeModalBtn.addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });

    // Click outside to close
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Save settings handler
    saveSettingsBtn.addEventListener('click', async function() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Please enter your DeepSeek API key');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ apiKey }),
            });

            if (response.ok) {
                settingsModal.style.display = 'none';
                alert('API key saved successfully!');
            } else {
                const data = await response.json();
                alert(`Error: ${data.error || 'Failed to save API key'}`);
            }
        } catch (error) {
            console.error('Error saving API key:', error);
            alert('Failed to save API key. Please try again.');
        }
    });

    // Check API key status on load
    async function checkApiKeyStatus() {
        try {
            const response = await fetch('http://localhost:3000/api/settings/status');
            const { hasApiKey } = await response.json();
            if (!hasApiKey) {
                settingsModal.style.display = 'block';
            }
        } catch (error) {
            console.error('Error checking API key status:', error);
        }
    }
    checkApiKeyStatus();

    // Tool highlighting
    tools.forEach(tool => {
        tool.addEventListener('click', () => {
            tools.forEach(t => {
                t.classList.remove('active');
                t.style.borderColor = 'transparent';
            });
            tool.classList.add('active');
            tool.style.borderColor = '#47bd4a';
        });
    });
    
    // Data source highlighting
    dataSources.forEach(dataSource => {
        dataSource.addEventListener('click', () => {
            dataSources.forEach(ds => {
                ds.classList.remove('active');
                ds.style.borderColor = 'transparent';
            });
            dataSource.classList.add('active');
            dataSource.style.borderColor = '#9c6ade';
        });
    });

    // Refresh button click handler
    refreshPromptButton.addEventListener('click', function() {
        // Clear the prompt textarea
        promptTextarea.value = '';
        
        // Clear the model thinking area
        modelThinking.innerHTML = '';
        
        // Clear the tool output area
        toolOutput.innerHTML = '';
        
        // Reset all tool and data source highlights
        tools.forEach(t => {
            t.classList.remove('active');
            t.style.borderColor = 'transparent';
        });
        
        dataSources.forEach(ds => {
            ds.classList.remove('active');
            ds.style.borderColor = 'transparent';
        });
        
        // Focus on the textarea for a new query
        promptTextarea.focus();
        
        console.log('Application state reset for a new query');
    });

    // Send prompt button handler
    sendPromptButton.addEventListener('click', async function() {
        const prompt = promptTextarea.value.trim();
        if (!prompt) {
            alert('Please enter a prompt');
            return;
        }

        // Show thinking state
        modelThinking.innerHTML = '<p>Analyzing prompt...</p>';
        toolOutput.innerHTML = '';

        try {
            // Get available tools and data sources
            const availableTools = Array.from(tools).map(tool => ({
                name: tool.getAttribute('data-tool'),
                description: tool.querySelector('p').textContent,
                active: tool.classList.contains('active')
            }));
            
            const availableDataSources = Array.from(dataSources).map(ds => ({
                name: ds.getAttribute('data-source'),
                description: ds.querySelector('p').textContent,
                active: ds.classList.contains('active')
            }));
            
            // Combine tools and data sources
            const allTools = [
                ...availableTools,
                ...availableDataSources.map(ds => ({
                    name: ds.name,
                    description: ds.description,
                    active: ds.active
                }))
            ];
            
            // Create a container for tool results
            toolOutput.innerHTML = '<div id="tool-results-container"></div>';
            const resultsContainer = document.getElementById('tool-results-container');
            
            // Send prompt to server
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    tools: allTools
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get response from DeepSeek');
            }

            const data = await response.json();
            console.log('Server response:', data);
            
            // Handle different response structures
            // The server response might have the assistant message in different places
            let assistantMessage;
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                // Format from the DeepSeek API simulation
                assistantMessage = data.choices[0].message;
                console.log('Found assistant message in choices[0].message:', assistantMessage);
            } else if (data.response) {
                // Direct response format
                assistantMessage = data.response;
                console.log('Found assistant message in response:', assistantMessage);
            } else {
                // Fallback
                assistantMessage = data;
                console.log('Using data as assistant message:', assistantMessage);
            }
            
            // Update thinking display
            modelThinking.innerHTML = `
                <p><strong>Analysis:</strong></p>
                <p>${assistantMessage.content || 'Processing your request...'}</p>
            `;

            // Process tool calls if any
            console.log('Checking for tool calls in:', assistantMessage);
            if (assistantMessage && assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                console.log('Tool calls:', assistantMessage.tool_calls);
                
                // Reset all tool and data source highlights
                tools.forEach(t => {
                    t.classList.remove('active');
                    t.style.borderColor = 'transparent';
                });
                
                dataSources.forEach(ds => {
                    ds.classList.remove('active');
                    ds.style.borderColor = 'transparent';
                });
                
                // Always create a fresh container for tool results
                toolOutput.innerHTML = '<div id="tool-results-container"></div>';
                
                // Process each tool call in sequence
                processToolCallsSequentially(assistantMessage.tool_calls);
            }

        } catch (error) {
            console.error('Error:', error);
            modelThinking.innerHTML += `<p class="error">Error: ${error.message}</p>`;
        }
    });

    // Process tool calls sequentially
    async function processToolCallsSequentially(toolCalls) {
        const resultsContainer = document.getElementById('tool-results-container');
        const allResults = [];
        
        for (let i = 0; i < toolCalls.length; i++) {
            const toolCall = toolCalls[i];
            const toolName = toolCall.function.name;
            const toolParams = JSON.parse(toolCall.function.arguments);
            const query = toolParams.query;
            
            // Show which tool is being used
            modelThinking.innerHTML += `<p class="tool-step">Step ${i+1}: Using ${toolName} tool...</p>`;
            
            // Highlight the current tool or data source
            tools.forEach(t => {
                t.classList.remove('active');
                t.style.borderColor = 'transparent';
            });
            
            dataSources.forEach(ds => {
                ds.classList.remove('active');
                ds.style.borderColor = 'transparent';
            });
            
            // Check if it's a tool
            const selectedTool = document.querySelector(`[data-tool="${toolName}"]`);
            if (selectedTool) {
                selectedTool.classList.add('active');
                selectedTool.style.borderColor = '#47bd4a';
                
                // Scroll to the tool to make it visible
                selectedTool.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Check if it's a data source
                const selectedDataSource = document.querySelector(`[data-source="${toolName}"]`);
                if (selectedDataSource) {
                    selectedDataSource.classList.add('active');
                    selectedDataSource.style.borderColor = '#9c6ade';
                    
                    // Scroll to the data source to make it visible
                    selectedDataSource.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            // Process the tool call
            const queryToUse = (toolName === 'crypto-price') ? promptTextarea.value.trim() : query;
            const result = await processToolCall(toolName, queryToUse, allResults);
            allResults.push({ toolName, result });
            
            // Add the result to the container
            const resultElement = document.createElement('div');
            resultElement.className = 'tool-result-item';
            resultElement.innerHTML = `
                <h4>Step ${i+1}: ${toolName.charAt(0).toUpperCase() + toolName.slice(1)} Tool</h4>
                <div class="tool-result">${result}</div>
                ${i < toolCalls.length - 1 ? '<div class="flow-arrow">↓</div>' : ''}
            `;
            resultsContainer.appendChild(resultElement);
            
            // Add a small delay to visualize the sequence
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Final conclusion after all tools have been used
        modelThinking.innerHTML += `<p class="success">All tools executed successfully!</p>`;
        
        // Add a final summary if multiple tools were used
        if (toolCalls.length > 1) {
            const summaryElement = document.createElement('div');
            summaryElement.className = 'tool-summary';
            summaryElement.innerHTML = `
                <h4>Summary</h4>
                <p>Used ${toolCalls.length} tools to process your query:</p>
                <ul>
                    ${toolCalls.map(tc => `<li>${tc.function.name}</li>`).join('')}
                </ul>
            `;
            resultsContainer.appendChild(summaryElement);
        }
    }

    // Process a single tool call
    async function processToolCall(toolName, query, previousResults) {
        let result = '';
        
        try {
            switch (toolName) {
                case 'calculator':
                    try {
                        if (query.includes('Calculate the requested values') || query === 'count' || query.toLowerCase().includes('how many')) {
                            // Analyze the query to determine what to count
                            const lowerQuery = query.toLowerCase();
                            console.log('Analyzing calculator query:', lowerQuery);
                            
                            // Check for persona-related keywords
                            const shouldCountPersonas = lowerQuery.includes('persona') || lowerQuery.includes('user') || lowerQuery.includes('people');
                            
                            // Check for product-related keywords - expanded to catch more variations
                            const shouldCountProducts = lowerQuery.includes('product') || lowerQuery.includes('portfolio') || 
                                                      lowerQuery.match(/how many products?/) || lowerQuery.match(/products? does/) || 
                                                      (lowerQuery.includes('iog') && lowerQuery.includes('product'));
                            
                            // If query doesn't specify what to count but asks for a count, count both
                            const countBoth = !shouldCountPersonas && !shouldCountProducts && 
                                              (lowerQuery.includes('how many') || lowerQuery.includes('count'));
                            
                            let personaCount = 0;
                            let productCount = 0;
                            let countText = [];
                            let title = '';
                            
                            // Get persona count if needed
                            if (shouldCountPersonas || countBoth) {
                                try {
                                    const personaData = await fetch('http://localhost:3000/api/personas');
                                    const personas = await personaData.json();
                                    personaCount = Object.keys(personas).length;
                                    countText.push(`<p>IOG has <strong>${personaCount}</strong> different personas.</p>`);
                                    
                                    // Highlight the Personas data source
                                    const personasDataSource = document.querySelector('[data-source="iog-personas"]');
                                    if (personasDataSource) {
                                        personasDataSource.classList.add('active');
                                        personasDataSource.style.borderColor = '#9c6ade';
                                    }
                                } catch (e) {
                                    console.error('Error fetching personas:', e);
                                }
                            }
                            
                            // Get product count if needed
                            if (shouldCountProducts || countBoth) {
                                console.log('Fetching product data because shouldCountProducts =', shouldCountProducts, 'or countBoth =', countBoth);
                                try {
                                    const productData = await fetch('http://localhost:3000/api/products');
                                    const products = await productData.json();
                                    productCount = Object.keys(products).length;
                                    console.log('Found', productCount, 'products');
                                    countText.push(`<p>IOG has <strong>${productCount}</strong> products in its portfolio.</p>`);
                                    
                                    // Highlight the Products data source
                                    const productsDataSource = document.querySelector('[data-source="iog-products"]');
                                    if (productsDataSource) {
                                        console.log('Highlighting Products data source');
                                        productsDataSource.classList.add('active');
                                        productsDataSource.style.borderColor = '#9c6ade';
                                    } else {
                                        console.error('Could not find Products data source element');
                                    }
                                } catch (e) {
                                    console.error('Error fetching products:', e);
                                }
                            }
                            
                            // Determine appropriate title based on what was counted
                            if (shouldCountPersonas && shouldCountProducts) {
                                title = 'IOG Products and Personas Count';
                            } else if (shouldCountPersonas) {
                                title = 'IOG Personas Count';
                            } else if (shouldCountProducts) {
                                title = 'IOG Products Count';
                            } else {
                                title = 'IOG Products and Personas Count';
                            }
                            
                            // Combine results
                            if (countText.length > 0) {
                                result = `<h3>${title}</h3>${countText.join('')}`;
                                
                                // Add total only if both were counted
                                if (personaCount > 0 && productCount > 0 && (shouldCountPersonas && shouldCountProducts || countBoth)) {
                                    result += `<p>In total, IOG has <strong>${personaCount + productCount}</strong> products and personas combined.</p>`;
                                }
                            } else {
                                result = "No data found to count.";
                            }
                        } else {
                            // Handle regular calculations
                            try {
                                const calcResult = Function('"use strict";return (' + query + ')')();
                                result = `${query} = ${calcResult}`;
                            } catch (e) {
                                result = `<p>Unable to calculate: ${query}</p><p>Please provide a valid mathematical expression.</p>`;
                            }
                        }
                    } catch (error) {
                        result = `Error: ${error.message}`;
                    }
                    break;
                    
                case 'search':
                    const searchResults = {
                        "MCP": "Model Context Protocol - A standard for LLM interactions with tools",
                        "context window": "The amount of text a language model can process at once",
                        "LLM tools": "External functions that language models can use to extend capabilities",
                        "": "Search results for: Model Context Protocol and its applications"
                    };
                    result = searchResults[query] || `Search results for: ${query || 'Model Context Protocol'}`;
                    break;
                    
                case 'crypto-price':
                    // CRITICAL FIX: For crypto-price, we need to use the original user input
                    // This ensures we get the exact amount the user specified
                    const originalUserInput = promptTextarea.value.trim();
                    console.log('Processing cryptocurrency pricing query using ORIGINAL USER INPUT:', originalUserInput);
                    
                    try {
                        // Extract parameters from the ORIGINAL query
                        const params = window.extractCryptoParams ? window.extractCryptoParams(originalUserInput) : {
                            action: 'getPrice',
                            coinId: 'cardano',
                            currency: 'usd'
                        };
                        
                        // Call the appropriate API endpoint based on the action
                        if (params.action === 'calculateStaking') {
                            console.log('Sending staking calculation request with params:', {
                                amount: params.amount,
                                years: params.years,
                                apy: params.apy,
                                coinId: params.coinId || 'cardano'
                            });
                            
                            const response = await fetch('http://localhost:3000/api/crypto-price', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    action: 'calculateStaking',
                                    amount: params.amount,
                                    years: params.years,
                                    apy: params.apy,
                                    coinId: params.coinId || 'cardano'
                                })
                            });
                            
                            if (!response.ok) throw new Error('Failed to calculate staking returns');
                            const data = await response.json();
                            const stakingResults = data.stakingResults;
                            
                            // Format the result
                            result = `
                                <h3>Staking Calculation Results</h3>
                                <div class="staking-results">
                                    <p><strong>Initial Investment:</strong> ${window.formatCurrency ? window.formatCurrency(stakingResults.initialAmount, 'usd') : stakingResults.initialAmount} (${stakingResults.amount} ${stakingResults.coinId})</p>
                                    <p><strong>Staking Period:</strong> ${stakingResults.years} year${stakingResults.years !== 1 ? 's' : ''}</p>
                                    <p><strong>Annual Percentage Yield:</strong> ${stakingResults.apy}%</p>
                                    <p><strong>Final Balance:</strong> ${window.formatCurrency ? window.formatCurrency(stakingResults.finalAmountFiat, 'usd') : stakingResults.finalAmountFiat} (${stakingResults.finalAmount.toFixed(2)} ${stakingResults.coinId})</p>
                                    <p><strong>Total Earnings:</strong> ${window.formatCurrency ? window.formatCurrency(stakingResults.earningsFiat, 'usd') : stakingResults.earningsFiat} (${(stakingResults.finalAmount - stakingResults.amount).toFixed(2)} ${stakingResults.coinId})</p>
                                </div>
                            `;
                        } 
                        else if (params.action === 'search') {
                            const response = await fetch('http://localhost:3000/api/crypto-price', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    action: 'search',
                                    query: params.query
                                })
                            });
                            if (!response.ok) throw new Error('Failed to search for cryptocurrencies');
                            const data = await response.json();
                            const coins = data.coins;
                            
                            // Format the search results
                            if (coins.length === 0) {
                                result = `<p>No cryptocurrencies found matching "${params.query}"</p>`;
                            } else {
                                result = `
                                    <h3>Cryptocurrency Search Results</h3>
                                    <div class="crypto-search-results">
                                        <ul>
                                            ${coins.map(coin => `
                                                <li>
                                                    <strong>${coin.name}</strong> (${coin.symbol.toUpperCase()})
                                                    ${coin.market_cap_rank ? `<span class="rank">Rank: #${coin.market_cap_rank}</span>` : ''}
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                `;
                            }
                        }
                        else { // Default to getPrice
                            const response = await fetch('http://localhost:3000/api/crypto-price', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    action: 'getPrice',
                                    coinId: params.coinId,
                                    currency: params.currency
                                })
                            });
                            if (!response.ok) throw new Error('Failed to fetch cryptocurrency price');
                            const data = await response.json();
                            const priceData = data.priceData;
                            
                            // Format the price result
                            const formattedPrice = window.formatCurrency ? window.formatCurrency(priceData.price, params.currency) : priceData.price;
                            result = `
                                <h3>Cryptocurrency Price</h3>
                                <div class="crypto-price">
                                    <p><strong>${priceData.name}</strong> (${priceData.symbol.toUpperCase()})</p>
                                    <p class="price">Current Price: ${formattedPrice}</p>
                                    <p class="timestamp">Last Updated: ${new Date().toLocaleString()}</p>
                                    ${priceData.market_cap ? `<p><strong>Market Cap:</strong> ${window.formatCurrency ? window.formatCurrency(priceData.market_cap, params.currency) : priceData.market_cap}</p>` : ''}
                                    ${priceData.price_change_24h ? `<p><strong>24h Change:</strong> <span class="${priceData.price_change_24h >= 0 ? 'positive' : 'negative'}">${priceData.price_change_24h >= 0 ? '+' : ''}${priceData.price_change_24h.toFixed(2)}%</span></p>` : ''}
                                </div>
                            `;
                        }
                    } catch (error) {
                        console.error('Error processing crypto price request:', error);
                        result = `<p class="error">Error: ${error.message}</p><p>Please ensure the server is running and the cryptocurrency API is accessible.</p>`;
                    }
                    break;
                    
                case 'iog-personas':
                    console.log('Fetching IOG personas for query:', query);
                    try {
                        const response = await fetch('http://localhost:3000/api/personas');
                        if (!response.ok) throw new Error('Failed to fetch personas');
                        
                        const personas = await response.json();
                        console.log('Received personas data:', personas);
                        const personaCount = Object.keys(personas).length;
                        
                        const lowerQuery = query ? query.toLowerCase() : '';
                        
                        // Check if query is asking for a count of personas
                        if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('number of')) {
                            result = `<h3>IOG Personas Count</h3>
                                <p>IOG has <strong>${personaCount}</strong> different personas:</p>
                                <ul>
                                    ${Object.keys(personas).map(name => `<li><strong>${name.toUpperCase()}</strong></li>`).join('')}
                                </ul>`;
                        }
                        // Try to find an exact match for a specific persona
                        else {
                            for (const [persona, description] of Object.entries(personas)) {
                                if (lowerQuery.includes(persona) || lowerQuery.includes(persona.replace(' ', ''))) {
                                    result = `<strong>${persona.toUpperCase()}</strong><br>${description}`;
                                    break;
                                }
                            }
                            
                            // If no match, show all personas
                            if (!result) {
                                result = '<h3>Available IOG Personas:</h3>' + 
                                    Object.entries(personas)
                                        .map(([name, desc]) => `<strong>${name.toUpperCase()}</strong>: ${desc}`)
                                        .join('<br><br>');
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching personas:', error);
                        result = 'Error: Unable to fetch persona information. Please ensure the server is running.';
                    }
                    break;
                    
                case 'iog-products':
                    console.log('Fetching IOG products for query:', query);
                    try {
                        const response = await fetch('http://localhost:3000/api/products');
                        if (!response.ok) throw new Error('Failed to fetch products');
                        
                        const products = await response.json();
                        console.log('Received products data:', products);
                        
                        const lowerQuery = query ? query.toLowerCase() : '';
                        
                        // Check if query is asking for a specific product
                        let specificProduct = null;
                        for (const [product, description] of Object.entries(products)) {
                            if (lowerQuery.includes(product)) {
                                specificProduct = product;
                                break;
                            }
                        }
                        
                        if (specificProduct) {
                            // Fetch detailed information about the specific product
                            const detailResponse = await fetch(`http://localhost:3000/api/products/${specificProduct}`);
                            if (!detailResponse.ok) throw new Error(`Failed to fetch details for ${specificProduct}`);
                            
                            const details = await detailResponse.json();
                            result = `<h3>${specificProduct.toUpperCase()}</h3><div class="markdown-content">${details.content}</div>`;
                        } 
                        // Check if query is asking for a count of products
                        else if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('number of')) {
                            const productCount = Object.keys(products).length;
                            result = `<h3>IOG Products Count</h3>
                                <p>IOG has <strong>${productCount}</strong> main products in its portfolio:</p>
                                <ul>
                                    ${Object.keys(products).map(name => `<li><strong>${name.toUpperCase()}</strong></li>`).join('')}
                                </ul>`;
                        }
                        // If no specific product or count query, show all products
                        else {
                            result = '<h3>IOG Product Portfolio:</h3>' + 
                                Object.entries(products)
                                    .map(([name, desc]) => `<strong>${name.toUpperCase()}</strong>: ${desc}`)
                                    .join('<br><br>');
                        }
                    } catch (error) {
                        console.error('Error fetching products:', error);
                        result = 'Error: Unable to fetch product information. Please ensure the server is running.';
                    }
                    break;
                    
                default:
                    result = `Unknown tool: ${toolName}`;
            }
            
            // Return the result instead of updating the DOM directly
            return result;
            
        } catch (error) {
            console.error(`Error processing tool ${toolName}:`, error);
            return `<p class="error">Error: ${error.message}</p>`;
        }
    }

    // Accordion functionality
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;
            const isActive = accordionItem.classList.contains('active');
            
            // Close all accordion items first
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle the clicked item
            if (!isActive) {
                accordionItem.classList.add('active');
            }
        });
    });
    
    // Initialize the first accordion item as open
    document.querySelector('.accordion-item').classList.add('active');
    
    // Example prompts
    const examplePrompts = [
        "Calculate 125 * 36",
        "Tell me about context windows in MCP",
        "What IOG personas are available?",
        "How many personas does IOG have?",
        "Tell me about crypto savvy personas",
        "What products does IOG offer?",
        "Tell me about RealFi",
        "What is Midnight?",
        "What is the current price of ADA?",
        "If I stake 1000 ADA for 5 years at 5% APY, how much will I have?"
    ];

    // Set an initial example prompt
    promptTextarea.placeholder = "Try: " + examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
});
