// Global state variables for tool and data source toggles
let useGlobalMemory = false; // Default to OFF
const toolStates = {
    'calculator': true,
    'search': true,
    'crypto-price': true
};
const dataSourceStates = {
    'iog-personas': true,
    'iog-products': true,
    'iog-executives': true
};

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all tool toggles
    const toolToggles = document.querySelectorAll('.tool-toggle');
    toolToggles.forEach(toggle => {
        const toolId = toggle.id.replace('-toggle', '');
        const toolElement = toggle.closest('.tool');
        const statusElement = toolElement.querySelector('.tool-status');
        
        // Set initial state (checked)
        toggle.checked = toolStates[toolId] || false;
        updateToolStatus(toggle.checked, statusElement);
        
        // Add event listener for toggle changes
        toggle.addEventListener('change', function() {
            toolStates[toolId] = this.checked;
            console.log(`Tool ${toolId} toggled: ${this.checked ? 'ON' : 'OFF'}`);
            updateToolStatus(this.checked, statusElement);
        });
    });
    
    // Initialize all data source toggles
    const sourceToggles = document.querySelectorAll('.source-toggle');
    sourceToggles.forEach(toggle => {
        const sourceId = toggle.id.replace('-toggle', '');
        const sourceElement = toggle.closest('.data-source');
        const statusElement = sourceElement.querySelector('.source-status');
        
        // Set initial state (checked)
        toggle.checked = dataSourceStates[sourceId] || false;
        updateToolStatus(toggle.checked, statusElement);
        
        // Add event listener for toggle changes
        toggle.addEventListener('change', function() {
            dataSourceStates[sourceId] = this.checked;
            console.log(`Data source ${sourceId} toggled: ${this.checked ? 'ON' : 'OFF'}`);
            updateToolStatus(this.checked, statusElement);
        });
    });
    
    // Initialize memory toggle
    const memoryToggle = document.getElementById('memory-toggle');
    if (memoryToggle) {
        // Get initial state from the UI element
        useGlobalMemory = memoryToggle.checked;
        
        // Set initial state of memory items
        const memoryItems = document.querySelectorAll('.memory-item');
        memoryItems.forEach(item => {
            item.setAttribute('data-memory', useGlobalMemory ? 'active' : 'inactive');
        });
        
        // Update the memory status display
        const memoryContainer = document.getElementById('global-memory-container');
        const memoryStatus = memoryContainer.querySelector('.memory-status') || 
            createStatusElement(memoryContainer);
        updateToolStatus(useGlobalMemory, memoryStatus);
        
        // Add event listener for toggle changes
        memoryToggle.addEventListener('change', function() {
            useGlobalMemory = this.checked;
            console.log('Global memory toggled:', useGlobalMemory ? 'ON' : 'OFF');
            
            // Update visual state of memory items
            memoryItems.forEach(item => {
                item.setAttribute('data-memory', useGlobalMemory ? 'active' : 'inactive');
            });
            
            // Update status message
            updateToolStatus(useGlobalMemory, memoryStatus);
        });
    }
    
    // Function to update the status display of a toggle
    function updateToolStatus(isEnabled, statusElement) {
        if (!statusElement) return;
        
        // Hide the status element text - we'll use colored toggle switches instead
        statusElement.textContent = '';
        statusElement.style.display = 'none';
    }
    
    // Function to create a status element if it doesn't exist
    function createStatusElement(container) {
        const statusElement = document.createElement('div');
        statusElement.className = 'memory-status';
        container.appendChild(statusElement);
        return statusElement;
    }
    // API Key elements
    const openaiKeyInput = document.getElementById('openai-key');
    const saveApiKeyBtn = document.getElementById('save-api-key');

    // Interactive demo elements
    const sendPromptButton = document.getElementById('send-prompt');
    const refreshPromptButton = document.getElementById('refresh-prompt');
    const promptTextarea = document.querySelector('#model-prompt textarea');
    const modelThinking = document.getElementById('model-thinking');
    const toolOutput = document.getElementById('tool-output');
    const tools = document.querySelectorAll('.tool');
    const dataSources = document.querySelectorAll('.data-source');
    const modelTitle = document.getElementById('model-title');
    const demoSectionTitle = document.getElementById('demo-section-title');
    
    // Accordion elements
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    // API Key save handler
    saveApiKeyBtn.addEventListener('click', async function() {
        const apiKey = openaiKeyInput.value.trim();
        
        if (apiKey) {
            // Save API key to localStorage
            localStorage.setItem('openai-api-key', apiKey);
            console.log('OpenAI API key saved');
            
            // Send API key to server
            try {
                const response = await fetch('http://localhost:3000/api/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        provider: 'openai',
                        openaiKey: apiKey
                    }),
                });
                
                if (response.ok) {
                    // Show success message on the page instead of alert
                    const headerContainer = document.querySelector('.api-key-container');
                    
                    // Remove any existing status messages
                    const existingStatus = headerContainer.querySelector('.api-key-status');
                    if (existingStatus) {
                        existingStatus.remove();
                    }
                    
                    // Create and add persistent success message
                    const statusMsg = document.createElement('span');
                    statusMsg.className = 'api-key-status success persistent';
                    statusMsg.textContent = 'API key saved';
                    headerContainer.appendChild(statusMsg);
                    
                    // Remove the missing API key class if present
                    headerContainer.classList.remove('api-key-missing');
                } else {
                    // Show error on the page
                    const headerContainer = document.querySelector('.api-key-container');
                    
                    // Remove any existing status messages
                    const existingStatus = headerContainer.querySelector('.api-key-status');
                    if (existingStatus) {
                        existingStatus.remove();
                    }
                    
                    // Create and add error message that's persistent
                    const statusMsg = document.createElement('span');
                    statusMsg.className = 'api-key-status error persistent';
                    statusMsg.textContent = 'Failed to save API key';
                    headerContainer.appendChild(statusMsg);
                    
                    // Add the missing API key class
                    headerContainer.classList.add('api-key-missing');
                }
            } catch (error) {
                console.error('Error saving API key:', error);
                alert('Error saving API key: ' + error.message);
            }
        } else {
            alert('Please enter a valid OpenAI API key');
        }
    });
    
    // Load saved API key if available
    const savedApiKey = localStorage.getItem('openai-api-key');
    if (savedApiKey) {
        openaiKeyInput.value = savedApiKey;
    }

    // Check API key status on page load
    async function checkApiKeyStatus() {
        try {
            const response = await fetch('http://localhost:3000/api/settings/status');
            const { hasOpenaiKey } = await response.json();
            
            const headerContainer = document.querySelector('.api-key-container');
            const existingStatus = headerContainer.querySelector('.api-key-status');
            
            // Update visual feedback based on API key status
            if (hasOpenaiKey) {
                console.log('OpenAI API key is set on the server');
                
                // If key is valid and no status message exists, create one
                if (!existingStatus) {
                    const statusMsg = document.createElement('span');
                    statusMsg.className = 'api-key-status success persistent';
                    statusMsg.textContent = 'API key saved';
                    headerContainer.appendChild(statusMsg);
                }
                
                // Remove the missing API key class if present
                headerContainer.classList.remove('api-key-missing');
            } else {
                // If no valid key exists, show warning
                if (existingStatus && existingStatus.classList.contains('success')) {
                    // Remove previous success message
                    existingStatus.remove();
                }
                
                // Add warning message if none exists
                if (!headerContainer.querySelector('.api-key-status.error')) {
                    const statusMsg = document.createElement('span');
                    statusMsg.className = 'api-key-status error persistent';
                    statusMsg.textContent = 'Valid API key required';
                    headerContainer.appendChild(statusMsg);
                }
                
                // Add visual indicator class
                headerContainer.classList.add('api-key-missing');
            }
        } catch (error) {
            console.error('Error checking API key status:', error);
            
            // Show connection error if server is unreachable
            const headerContainer = document.querySelector('.api-key-container');
            const existingStatus = headerContainer.querySelector('.api-key-status');
            
            if (!existingStatus || !existingStatus.classList.contains('error')) {
                if (existingStatus) existingStatus.remove();
                
                const statusMsg = document.createElement('span');
                statusMsg.className = 'api-key-status error persistent';
                statusMsg.textContent = 'Server connection error';
                headerContainer.appendChild(statusMsg);
            }
        }
    }
    checkApiKeyStatus();

    // Add example steps to the step tracker
    function addExampleSteps() {
        const stepTrackerContainer = document.getElementById('step-tracker-container');
        
        // First step example
        const step1 = document.createElement('div');
        step1.className = 'step-item';
        step1.style.borderLeft = '4px solid #4a69bd';
        step1.innerHTML = `
            <h4>Step 1: Search Tool</h4>
            <p>Search results for: IOG products information</p>
        `;
        stepTrackerContainer.appendChild(step1);
        
        // Arrow between steps
        const arrow = document.createElement('div');
        arrow.className = 'step-arrow';
        arrow.innerHTML = '↓';
        stepTrackerContainer.appendChild(arrow);
        
        // Second step example
        const step2 = document.createElement('div');
        step2.className = 'step-item';
        step2.style.borderLeft = '4px solid #4a69bd';
        step2.innerHTML = `
            <h4>Step 2: Iog-Products Tool</h4>
            <p>IOG Product Portfolio:</p>
            <p><strong>REALFI:</strong> RealFi is Input Output Global's initiative to bridge the gap between traditional finance and blockchain technology, focusing on real-world financial applications.</p>
        `;
        stepTrackerContainer.appendChild(step2);
    }
    
    // Example steps disabled - step tracker starts empty
    // addExampleSteps();

    // Tool highlighting - toggle each independently
    tools.forEach(tool => {
        tool.addEventListener('click', () => {
            // Toggle active state instead of removing from all
            if (tool.classList.contains('active')) {
                tool.classList.remove('active');
                tool.style.borderColor = 'transparent';
            } else {
                tool.classList.add('active');
                tool.style.borderColor = '#47bd4a';
            }
        });
    });
    
    // Data source highlighting - toggle each independently
    dataSources.forEach(dataSource => {
        dataSource.addEventListener('click', () => {
            // Toggle active state instead of removing from all
            if (dataSource.classList.contains('active')) {
                dataSource.classList.remove('active');
                dataSource.style.borderColor = 'transparent';
            } else {
                dataSource.classList.add('active');
                dataSource.style.borderColor = '#9c6ade';
            }
        });
    });

    // Tools and data sources interaction logic
    
    // Step tracker functionality
    function addStepToTracker(stepNumber, toolName, query) {
        const stepTrackerContainer = document.getElementById('step-tracker-container');
        
        // Create step item
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item';
        
        // Add blue vertical line on the left
        stepItem.style.borderLeft = '4px solid #4a69bd';
        
        // Format the tool name for display
        const formattedToolName = toolName.replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        // Set the content
        stepItem.innerHTML = `
            <h4>Step ${stepNumber}: ${formattedToolName} Tool</h4>
            <p>${query ? `${query.substring(0, 80)}${query.length > 80 ? '...' : ''}` : 'Processing...'}</p>
        `;
        
        // Add arrow if not the first step
        if (stepTrackerContainer.children.length > 0) {
            const arrow = document.createElement('div');
            arrow.className = 'step-arrow';
            arrow.innerHTML = '↓';
            stepTrackerContainer.appendChild(arrow);
        }
        
        // Add the step to the container
        stepTrackerContainer.appendChild(stepItem);
        
        // Scroll to the bottom if there are many steps
        stepTrackerContainer.scrollTop = stepTrackerContainer.scrollHeight;
    }
    
    // Function to clear step tracker when starting a new query
    function clearStepTracker() {
        const stepTrackerContainer = document.getElementById('step-tracker-container');
        stepTrackerContainer.innerHTML = '';
    }
    
    // Refresh button click handler
    refreshPromptButton.addEventListener('click', function() {
        // Clear the prompt textarea
        promptTextarea.value = '';
        
        // Clear the model thinking area
        modelThinking.innerHTML = '';
        
        // Clear the step tracker
        clearStepTracker();
        
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
            const availableTools = Array.from(tools).map(tool => {
                const toolId = tool.getAttribute('data-tool');
                const toggle = tool.querySelector('.tool-toggle');
                return {
                    name: toolId,
                    description: tool.querySelector('p').textContent,
                    active: toggle ? toggle.checked : false
                };
            });
            
            const availableDataSources = Array.from(dataSources).map(ds => {
                const sourceId = ds.getAttribute('data-source');
                const toggle = ds.querySelector('.source-toggle');
                return {
                    name: sourceId,
                    description: ds.querySelector('p').textContent,
                    active: toggle ? toggle.checked : false
                };
            });
            
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
                    tools: allTools,
                    useGlobalMemory: useGlobalMemory
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get response from OpenAI');
            }

            const data = await response.json();
            console.log('Server response:', data);
            
            // Handle OpenAI response structure
            // The server response might have the assistant message in different places
            let assistantMessage;
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                // Format from the OpenAI API
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
                
                // Do NOT reset tool highlights here - preserve the user's selected tools
                // Instead, we'll highlight the tools that are being used during processing
                
                // Always create a fresh container for tool results
                toolOutput.innerHTML = '<div id="tool-results-container"></div>';
                
                // Log how many tools are being used
                console.log(`Processing ${assistantMessage.tool_calls.length} tool calls in sequence`);
                
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
            
            // Add step to the step tracker container
            addStepToTracker(i+1, toolName, query);
            
            // Temporarily highlight the current tool being used (without clearing other tool states)
            // This provides visual feedback about which tool is currently executing
            
            // Find the tool or data source element
            const selectedTool = document.querySelector(`[data-tool="${toolName}"]`);
            const selectedDataSource = document.querySelector(`[data-source="${toolName}"]`);
            
            // Create a function to flash the tool briefly to show it's being used
            const flashElement = (element, color) => {
                if (!element) return;
                
                // Save original border color to restore after
                const originalBorderColor = element.style.borderColor;
                const originalBoxShadow = element.style.boxShadow;
                
                // Add a glow effect to show the tool is being used
                element.style.borderColor = color;
                element.style.boxShadow = `0 0 10px 3px ${color}80`; // 80 adds 50% opacity
                
                // Scroll to make it visible
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Return to normal after a short delay (don't remove active state)
                setTimeout(() => {
                    element.style.boxShadow = originalBoxShadow;
                }, 2000);
            };
            
            // Flash the appropriate element
            if (selectedTool) {
                flashElement(selectedTool, '#47bd4a');
            } else if (selectedDataSource) {
                flashElement(selectedDataSource, '#9c6ade');
            }
            
            // Process the tool call
            const queryToUse = (toolName === 'crypto-price') ? promptTextarea.value.trim() : query;
            const result = await processToolCall(toolName, queryToUse, allResults);
            allResults.push({ toolName, result });
            
            // Add the result to the container - ALL tool results go to step tracker
            const stepTrackerContainer = document.getElementById('step-tracker-container');
            const stepItem = document.createElement('div');
            stepItem.className = 'step-item';
            stepItem.style.borderLeft = '4px solid #4a69bd';
            
            // Format title based on tool name
            const formattedToolName = toolName.charAt(0).toUpperCase() + toolName.slice(1).replace(/-/g, ' ');
            
            // For crypto-price tool, add special formatting
            if (toolName === 'crypto-price') {
                stepItem.innerHTML = `
                    <h4>Step ${i+1}: ${formattedToolName} Tool</h4>
                    <div class="crypto-result">${result}</div>
                `;
            } else {
                stepItem.innerHTML = `
                    <h4>Step ${i+1}: ${formattedToolName} Tool</h4>
                    ${result}
                `;
            }
            
            // If we already have steps, add an arrow
            if (stepTrackerContainer.children.length > 0) {
                const arrow = document.createElement('div');
                arrow.className = 'step-arrow';
                arrow.innerHTML = '↓';
                stepTrackerContainer.appendChild(arrow);
            }
            
            // Add the step to the step tracker - no need for redundant placeholders in column 2
            stepTrackerContainer.appendChild(stepItem);
            
            // Add a small delay to visualize the sequence
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Final conclusion after all tools have been used
        modelThinking.innerHTML += `<p class="success">All tools executed successfully!</p>`;
        
        // Generate a final answer based on collected tool results
        const finalAnswer = await generateFinalAnswer(promptTextarea.value.trim(), allResults);
        
        // Move the final answer to the third column
        const finalAnswerContainer = document.getElementById('final-answer-container');
        
        // Clear previous final answer if any
        finalAnswerContainer.innerHTML = '';
        
        // Create a new final answer element
        const finalAnswerElement = document.createElement('div');
        finalAnswerElement.className = 'final-answer';
        finalAnswerElement.innerHTML = `
            <h4>Final Answer</h4>
            <div class="answer-content">${finalAnswer}</div>
        `;
        finalAnswerContainer.appendChild(finalAnswerElement);
        
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

    // Generate a final answer based on all tool results
    async function generateFinalAnswer(originalQuery, toolResults) {
        try {
            // Send the original query and all tool results to the server for synthesis
            const response = await fetch('http://localhost:3000/api/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: originalQuery,
                    toolResults: toolResults,
                    useGlobalMemory: useGlobalMemory
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate final answer');
            }
            
            const data = await response.json();
            return data.answer || 'No clear answer could be synthesized from the tool results.';
        } catch (error) {
            console.error('Error generating final answer:', error);
            return `<p class="error">Error generating final answer: ${error.message}</p>`;
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
                    
                case 'iog-executives':
                    console.log('Fetching IOG executives for query:', query);
                    try {
                        const response = await fetch('http://localhost:3000/api/executives');
                        if (!response.ok) throw new Error('Failed to fetch executives');
                        
                        const executives = await response.json();
                        console.log('Received executives data:', executives);
                        
                        const lowerQuery = query ? query.toLowerCase() : '';
                        
                        // Check if looking for a specific executive
                        let specificExecutive = null;
                        for (const executiveId in executives) {
                            const executive = executives[executiveId];
                            if (lowerQuery.includes(executive.name.toLowerCase()) || 
                                lowerQuery.includes(executiveId.replace('_', ' ')) ||
                                lowerQuery.includes(executive.position.toLowerCase())) {
                                specificExecutive = executiveId;
                                break;
                            }
                        }
                        
                        if (specificExecutive) {
                            // Get the specific executive details
                            const executive = executives[specificExecutive];
                            result = `<h3>${executive.name} - ${executive.position}</h3>
                                <div class="executive-bio">${executive.bio}</div>`;
                        } 
                        // Check if query is asking for a count of executives
                        else if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('number of')) {
                            const executiveCount = Object.keys(executives).length;
                            result = `<h3>IOG Executives Count</h3>
                                <p>IOG has <strong>${executiveCount}</strong> key executives in its leadership team:</p>
                                <ul>
                                    ${Object.values(executives).map(exec => `<li><strong>${exec.name}</strong> - ${exec.position}</li>`).join('')}
                                </ul>`;
                        }
                        // If no specific executive or count query, show all executives
                        else {
                            result = '<h3>IOG Leadership Team:</h3>' +
                                `<div class="executives-list">
                                    ${Object.values(executives).map(exec => 
                                    `<div class="executive-item">
                                        <h4>${exec.name}</h4>
                                        <p><strong>${exec.position}</strong></p>
                                        <p>${exec.bio}</p>
                                    </div>`).join('')}
                                </div>`;
                        }
                        
                        // Highlight the Executives data source
                        const executivesDataSource = document.querySelector('[data-source="iog-executives"]');
                        if (executivesDataSource) {
                            executivesDataSource.classList.add('active');
                            executivesDataSource.style.borderColor = '#9c6ade';
                        }
                    } catch (error) {
                        console.error('Error fetching executives:', error);
                        result = 'Error: Unable to fetch executive information. Please ensure the server is running.';
                    }
                    break;
                    
                case 'global-memory-access':
                    console.log('Processing global memory access:', query);
                    try {
                        // Parse arguments if they are provided as a JSON string
                        const args = typeof query === 'string' ? JSON.parse(query) : {};
                        
                        if (args.action === 'highlight') {
                            // Visual indication that memory is being accessed
                            const memoryItem = document.querySelector('.memory-item[data-memory="active"]');
                            if (memoryItem) {
                                memoryItem.style.boxShadow = '0 0 8px 2px rgba(74, 105, 189, 0.6)';
                                setTimeout(() => {
                                    memoryItem.style.boxShadow = '';
                                }, 3000); // Reset after 3 seconds
                            }
                            
                            result = '<p class="subtle-note">Global memory context included in query processing.</p>';
                        } else {
                            // Fetch global memory data
                            const response = await fetch('http://localhost:3000/api/global-memory');
                            if (!response.ok) throw new Error('Failed to fetch global memory');
                            
                            const memoryData = await response.json();
                            
                            result = '<h3>Global Memory Content:</h3>' +
                                `<div class="memory-list">
                                    ${Object.values(memoryData).map(item => 
                                    `<div class="memory-data-item">
                                        <h4>${item.name}</h4>
                                        <p><strong>${item.position}</strong></p>
                                        <p>${item.bio}</p>
                                    </div>`).join('')}
                                </div>`;
                        }
                    } catch (error) {
                        console.error('Error processing global memory access:', error);
                        result = 'Error: Unable to access global memory.';
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
        "Who are the executives at IOG?",
        "Tell me about Charles Hoskinson",
        "How many executives are in IOG's leadership team?",
        "What is the current price of ADA?",
        "If I stake 1000 ADA for 5 years at 5% APY, how much will I have?"
    ];

    // Set an initial example prompt
    promptTextarea.placeholder = "Try: " + examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
});
