# IOG Model Context Protocol (MCP) Learning App

This is an educational web application designed to teach users about IOG's implementation of the Model Context Protocol (MCP) - a standardized approach for Large Language Models (LLMs) to interact with external tools and data sources.

## Features

- **Concept Explanations**: Clear explanations of key MCP concepts including context windows, tools, and protocols
- **Interactive Demo**: Visual demonstration of how models use MCP to interact with tools and data sources
- **Clear Tool/Data Separation**: Distinct visual representation of tools vs. data sources
- **IOG Product & Persona Data**: Includes information about IOG's products and user personas
- **Responsive Design**: Works well on both desktop and mobile devices

## How to Use

1. Open `index.html` in your web browser
2. Explore the different MCP concepts by clicking "Learn More" buttons
3. Try the interactive demo to see how models use tools through MCP

## Development

This is a simple HTML/CSS/JavaScript application with no build steps required. To modify:

- Edit `index.html` for page structure
- Modify `src/styles.css` for styling changes
- Update `src/app.js` for interactive functionality

## Project Structure

```
mcp_learning_app/
├── index.html                # Main HTML file
├── server.js                # Express server with MCP implementation
├── iog_mcp_server.js       # Standalone IOG MCP server implementation
├── windsurf_integration.js # Example code for Windsurf integration
├── personas.json           # IOG persona data
├── products.json           # IOG product data
├── IOG Products/           # Detailed product information
│   ├── RealFi.md           # RealFi product details
│   ├── Lace.md             # Lace product details
│   └── Midnight.md         # Midnight product details
├── src/
│   ├── styles.css          # CSS styles
│   └── app.js              # JavaScript functionality
└── README.md               # This documentation file
```

## IOG MCP Server Implementation

The project includes a standalone implementation of an IOG MCP server (`iog_mcp_server.js`) that can be used to integrate with other systems like Windsurf. This server provides:

- Tool registry with calculator and search functionality
- Data retrieval tools for accessing personas and products
- Standard MCP endpoints for tool discovery and execution
- JSON schema definitions for all tools and parameters

## Windsurf Integration

The `windsurf_integration.js` file demonstrates how to integrate the IOG MCP server with Windsurf:

1. Initialize the integration by discovering available MCP tools
2. Execute tools through the MCP server
3. Register the tools with Windsurf's API
4. Create a Windsurf-compatible handler for MCP tool calls

## Future Enhancements

- Add more interactive examples
- Expand the tool registry with additional capabilities
- Create a tutorial showing how to build custom MCP-compatible tools
- Implement authentication and security features for the MCP server